import { upload } from './blob-upload.js';

// ---- Settings ----
// Shop phone number, shown when a customer picks Emergency. Leave empty to hide it.
// Example: const SHOP_PHONE = '1-905-555-0123';
const SHOP_PHONE = '825-777-2483';
const SHOP_EMAIL = 'hotshotgears@gmail.com';

const DRAFT_KEY = 'hotshot-quote-draft-v2';
const MAX_FILES = 10;
const MAX_EACH = 25 * 1024 * 1024;
const MAX_TOTAL = 50 * 1024 * 1024;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf', 'dwg', 'dxf', 'step', 'stp'];

// Screens: 0 choose a path, 10 quick contact, 1-6 detailed steps (6 = review),
// 7 success, 8 sending, 9 email hand-off if the server can't be reached.
const START = 0, QUICK = 10, REVIEW = 6, DONE = 7, SENDING = 8, HANDOFF = 9;
const DETAILED_STEPS = 6;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const form = $('#quote');
let step = START;
let mode = null; // 'quick' | 'detailed'
let files = [];
let lastPayload = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const ext = (name) => (name.split('.').pop() || '').toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

$$('.yr').forEach((e) => (e.textContent = new Date().getFullYear()));

// ---- Shop phone ----
if (SHOP_PHONE) {
  $$('[data-phone]').forEach((e) => (e.textContent = SHOP_PHONE));
  $$('[data-phone-link]').forEach((a) => (a.href = 'tel:' + SHOP_PHONE.replace(/[^\d+]/g, '')));
  $$('[data-has-phone]').forEach((e) => (e.hidden = false));
  $$('[data-no-phone]').forEach((e) => (e.hidden = true));
}

// ---- Local draft (survives a refresh; files can't be stored) ----
const storage = {
  get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* private mode etc. */ } },
  clear() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } },
};

function namedFields() {
  return $$('input[name], textarea[name]', form).filter((el) => el.name !== 'website' && el.type !== 'file');
}

function saveDraft() {
  if (!mode) return;
  const values = {};
  for (const el of namedFields()) {
    if (el.type === 'radio') { if (el.checked) values[el.name] = el.value; }
    else if (el.type === 'checkbox') { (values[el.name] ||= []); if (el.checked) values[el.name].push(el.value); }
    else values[el.name] = el.value;
  }
  const idk = $$('[data-idk]:checked').map((c) => c.dataset.idk);
  const resumeStep = step >= 1 && step <= REVIEW ? step : step === QUICK ? QUICK : null;
  storage.set({ mode, values, idk, step: resumeStep, fileCount: files.length, savedAt: Date.now() });
}

function restoreDraft() {
  const d = storage.get();
  if (!d || !d.values || !d.mode) return null;
  for (const el of namedFields()) {
    const v = d.values[el.name];
    if (v === undefined) continue;
    if (el.type === 'radio') el.checked = el.value === v;
    else if (el.type === 'checkbox') el.checked = Array.isArray(v) && v.includes(el.value);
    else el.value = v;
  }
  (d.idk || []).forEach((name) => { const c = $(`[data-idk="${name}"]`); if (c) { c.checked = true; applyIdk(c); } });
  if (d.fileCount > 0) $('#readdPhotos').hidden = false;
  $('#restored').hidden = false;
  $('#startOver').hidden = false;
  mode = d.mode;
  if (mode === 'quick') return QUICK;
  // Photos can't be restored, so never resume past the photo step.
  return Math.max(1, Math.min(d.step || 1, 5));
}

$('#startOver').addEventListener('click', () => {
  if (!confirm('Clear everything you have entered and start over?')) return;
  storage.clear();
  location.href = location.pathname;
});

// ---- Field behaviour ----
function applyIdk(box) {
  const input = $('#' + box.dataset.idk);
  input.disabled = box.checked;
  if (box.checked) input.value = '';
}
$$('[data-idk]').forEach((box) => box.addEventListener('change', () => { applyIdk(box); saveDraft(); }));

function applyUnits() {
  const u = $('input[name=units]:checked')?.value === 'mm' ? 'mm' : 'in';
  $$('[data-unit]').forEach((s) => (s.textContent = u));
}

function applyUrgency() {
  $('#emergencyBox').hidden = $('input[name=urgency]:checked')?.value !== 'emergency';
}

form.addEventListener('change', (e) => {
  if (e.target.name === 'units') applyUnits();
  if (e.target.name === 'urgency') applyUrgency();
});
for (const ev of ['input', 'change']) {
  form.addEventListener(ev, (e) => {
    // Typing in either contact field clears the "phone or email" hint on both.
    if (/^(q?phone|q?email|qPhone|qEmail)$/i.test(e.target.id)) {
      const p = e.target.id.startsWith('q') ? 'q' : '';
      [`#${p}${p ? 'Phone' : 'phone'}`, `#${p}${p ? 'Email' : 'email'}`].forEach((s) => $(s)?.closest('.field').classList.remove('invalid'));
    }
    e.target.closest('.field')?.classList.remove('invalid');
    if (e.target.type === 'file') return;
    saveDraft();
    $('#startOver').hidden = false;
  });
}

$$('[data-qty]').forEach((b) => b.addEventListener('click', () => {
  const q = $('#quantity');
  q.value = Math.max(1, (parseInt(q.value, 10) || 0) + Number(b.dataset.qty));
  q.dispatchEvent(new Event('input', { bubbles: true }));
}));

// ---- Photos & files (shared by both paths) ----
function renderFiles() {
  const html = files.map((f, i) => {
    const preview = f.preview ? `<img src="${f.preview}" alt="">` : `<span class="ext">${esc(ext(f.file.name) || 'file')}</span>`;
    return `<div class="thumb">${preview}<span class="nm">${esc(f.file.name)}</span><button type="button" data-rm="${i}" aria-label="Remove ${esc(f.file.name)}">&times;</button></div>`;
  }).join('');
  $('#thumbs').innerHTML = html;
  $('#qThumbs').innerHTML = html;
  $('#fileCount').textContent = `${files.length} of ${MAX_FILES} files. JPG, PNG, HEIC, PDF, DWG, DXF or STEP, up to 25 MB each.`;
  if (files.length) $('#readdPhotos').hidden = true;
  saveDraft();
}

function addFiles(list) {
  // Files that don't fit the limits are skipped quietly; they never block the request.
  let total = files.reduce((s, f) => s + f.file.size, 0);
  for (const file of list) {
    if (files.length >= MAX_FILES) break;
    if (!ALLOWED_EXT.includes(ext(file.name)) && !/^image\//.test(file.type)) continue;
    if (file.size > MAX_EACH || total + file.size > MAX_TOTAL) continue;
    // Browsers can't preview HEIC, so those get a label instead of a thumbnail.
    const preview = /^image\/(jpeg|png|webp|gif)$/.test(file.type) ? URL.createObjectURL(file) : null;
    files.push({ file, preview });
    total += file.size;
  }
  renderFiles();
}

for (const id of ['#fileInput', '#cameraInput', '#qFileInput', '#qCameraInput']) {
  const input = $(id);
  input.addEventListener('change', () => { addFiles([...input.files]); input.value = ''; });
}
for (const id of ['#thumbs', '#qThumbs']) {
  $(id).addEventListener('click', (e) => {
    const i = e.target.closest('[data-rm]')?.dataset.rm;
    if (i === undefined) return;
    const [removed] = files.splice(Number(i), 1);
    if (removed.preview) URL.revokeObjectURL(removed.preview);
    renderFiles();
  });
}
const drop = $('#drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

// ---- Validation: only a name and one way to reach them ----
function mark(el, ok) { el.closest('.field').classList.toggle('invalid', !ok); return ok; }

function validateContact(ids) {
  const name = $(ids.name), phone = $(ids.phone), email = $(ids.email);
  let ok = mark(name, name.value.trim() !== '');
  const hasPhone = phone.value.trim() !== '';
  const emailVal = email.value.trim();
  // An email with a typo only matters when it's the only way to reach them.
  const reachable = hasPhone || EMAIL_RE.test(emailVal);
  mark(phone, reachable);
  mark(email, reachable);
  ok = ok && reachable;
  if (!ok) {
    const bad = $('.field.invalid', $(`[data-step="${step}"]`));
    bad?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('input', bad)?.focus({ preventScroll: true });
  }
  return ok;
}
const DETAILED_IDS = { name: '#name', phone: '#phone', email: '#email' };
const QUICK_IDS = { name: '#qName', phone: '#qPhone', email: '#qEmail' };

// ---- Screens ----
function go(n, { scroll = true } = {}) {
  step = n;
  $$('[data-step]', form).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  const inDetailed = n >= 1 && n <= REVIEW;
  const finished = n === DONE || n === SENDING || n === HANDOFF;

  $('#progress').hidden = !inDetailed;
  $('#nav').hidden = n === START || finished;
  $('.qf-tools').hidden = finished;

  if (inDetailed) {
    $('#stepName').textContent = $(`[data-step="${n}"]`).dataset.name;
    $('#stepCount').textContent = `Step ${n} of ${DETAILED_STEPS}`;
    $('#stepBar').style.width = ((n / DETAILED_STEPS) * 100).toFixed(1) + '%';
  }
  $('#backBtn').hidden = n === START;
  // "Send now" stays available on every detailed step, so nobody has to finish the whole form.
  $('#sendNowBtn').hidden = !(inDetailed && n < REVIEW);
  const next = $('#nextBtn');
  next.textContent = n === QUICK || n === REVIEW ? 'Send request' : n === REVIEW - 1 ? 'Review' : 'Next';
  next.classList.toggle('arrow', inDetailed && n < REVIEW);

  if (n === REVIEW) renderReview();
  saveDraft();
  if (scroll) window.scrollTo({ top: $('main').getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' });
}

$$('[data-path]').forEach((b) => b.addEventListener('click', () => {
  mode = b.dataset.path;
  go(mode === 'quick' ? QUICK : 1);
  $(mode === 'quick' ? '#qName' : '#name').focus({ preventScroll: true });
}));

$('#nextBtn').addEventListener('click', () => {
  if (step === QUICK) { if (validateContact(QUICK_IDS)) submit(); return; }
  if (step === REVIEW) { submit(); return; }
  if (step === 1 && !validateContact(DETAILED_IDS)) return;
  if (step === 4 && !(parseInt($('#quantity').value, 10) >= 1)) $('#quantity').value = 1;
  go(step + 1);
});
$('#sendNowBtn').addEventListener('click', () => {
  if (!validateContact(DETAILED_IDS)) { if (step !== 1) { go(1); validateContact(DETAILED_IDS); } return; }
  submit();
});
$('#backBtn').addEventListener('click', () => {
  if (step === QUICK || step === 1) { go(START); return; }
  go(step - 1);
});
form.addEventListener('submit', (e) => e.preventDefault()); // Enter key shouldn't jump steps
form.addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) go(Number(edit.dataset.edit));
});

// ---- Collect ----
const radio = (name) => $(`input[name="${name}"]:checked`)?.value || '';
const val = (id) => {
  if ($(`[data-idk="${id}"]`)?.checked) return 'unknown';
  return $('#' + id).value.trim();
};

function collect() {
  if (mode === 'quick') {
    return {
      mode: 'quick',
      website: form.website.value,
      contact: { name: val('qName'), company: val('qCompany'), phone: val('qPhone'), email: val('qEmail'), site: '' },
      urgency: radio('qurgency'),
      message: val('qMessage'),
      files: [],
    };
  }
  return {
    mode: 'detailed',
    website: form.website.value,
    contact: { name: val('name'), company: val('company'), phone: val('phone'), email: val('email'), site: val('site') },
    urgency: radio('urgency'),
    gear: { units: radio('units') || 'in', type: radio('type'), teeth: val('teeth'), od: val('od'), bore: val('bore'), face: val('face'), keyway: val('keyway'), hub: radio('hub'), finish: radio('finish'), grade: val('grade') },
    application: { machine: val('machine'), makeModel: val('makeModel'), partNumber: val('partNumber'), failure: $$('input[name=failure]:checked').map((c) => c.value), notes: val('notes') },
    logistics: { quantity: val('quantity') || '1', haveOld: radio('haveOld'), canShip: radio('canShip'), haveDrawing: radio('haveDrawing'), repeat: radio('repeat'), prevRef: val('prevRef'), docs: $$('input[name=docs]:checked').map((c) => c.value), neededBy: val('neededBy') },
    files: [],
  };
}

// ---- Review ----
const URGENCY_LABEL = { emergency: 'Emergency (equipment down)', urgent: 'Urgent (failing soon)', planned: 'Planned' };

function renderReview() {
  const q = collect();
  const u = q.gear.units;
  const shown = (v) => (v === 'unknown' ? "Don't know" : v);
  const m = (v) => (!v ? '' : v === 'unknown' ? "Don't know" : `${v} ${u}`);
  const section = (title, n, rows) => {
    const r = rows.filter(([, v]) => v);
    return `<h3>${title} <button type="button" class="linkish" data-edit="${n}">Edit</button></h3>
      <dl>${r.length ? r.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('') : '<dt>&nbsp;</dt><dd class="none">Nothing entered</dd>'}</dl>`;
  };
  $('#review').innerHTML =
    section('Contact', 1, [['Name', q.contact.name], ['Company', q.contact.company], ['Phone', q.contact.phone], ['Email', q.contact.email], ['City / site', q.contact.site], ['Urgency', URGENCY_LABEL[q.urgency]]]) +
    section('The gear', 2, [['Type', shown(q.gear.type)], ['Teeth', shown(q.gear.teeth)], ['Outside diameter', m(q.gear.od)], ['Bore', m(q.gear.bore)], ['Face width', m(q.gear.face)], ['Keyway', m(q.gear.keyway)], ['Hub', shown(q.gear.hub)], ['Heat treat & finish', shown(q.gear.finish)], ['Accuracy grade', shown(q.gear.grade)]]) +
    section('Application', 3, [['Machine', shown(q.application.machine)], ['Make / model', shown(q.application.makeModel)], ['Part number', shown(q.application.partNumber)], ['What failed', q.application.failure.join(', ')], ['Notes', q.application.notes]]) +
    section('Logistics', 4, [['Quantity', q.logistics.quantity], ['Have old gear', q.logistics.haveOld], ['Can ship it', q.logistics.canShip], ['Have drawing', q.logistics.haveDrawing], ['Repeat order', q.logistics.repeat], ['Previous PO / ref', q.logistics.prevRef], ['Documents needed', q.logistics.docs.join(', ')], ['Needed by', q.logistics.neededBy]]) +
    section('Photos &amp; files', 5, [['Files', files.map((f) => `${f.file.name} (${fmtSize(f.file.size)})`).join(', ')]]);
}

// ---- Submit: never show the customer an error ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, controller) {
  return Promise.race([
    promise,
    sleep(ms).then(() => { controller?.abort(); throw new Error('timeout'); }),
  ]);
}

function setProgress(pct, text) {
  $('#uploadProgress .track i').style.width = pct + '%';
  $('#uploadProgress p').textContent = text;
}

// Upload what we can. A file that fails or stalls is skipped and reported to the shop instead.
async function uploadFiles() {
  const jobs = files.map((f) => ({ file: f.file, loaded: 0 }));
  const totalBytes = jobs.reduce((s, j) => s + j.file.size, 0) || 1;
  const folder = `quotes/${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  const uploaded = [];
  const failed = [];
  const update = () => {
    const pct = Math.round((jobs.reduce((s, j) => s + j.loaded, 0) / totalBytes) * 90);
    setProgress(pct, `Uploading ${jobs.length} file${jobs.length === 1 ? '' : 's'}...`);
  };
  update();

  const queue = [...jobs];
  const worker = async () => {
    while (queue.length) {
      const j = queue.shift();
      const safe = j.file.name.replace(/[^\w.\-]+/g, '_').slice(-100) || 'file';
      const controller = new AbortController();
      // Generous on slow site Wi-Fi: 45s plus about 4s per MB.
      const limit = 45000 + (j.file.size / 1048576) * 4000;
      try {
        const blob = await withTimeout(upload(`${folder}/${safe}`, j.file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          multipart: j.file.size > 8 * 1024 * 1024,
          abortSignal: controller.signal,
          onUploadProgress: (ev) => { j.loaded = ev.loaded; update(); },
        }), limit, controller);
        uploaded.push({ name: j.file.name, url: blob.url, size: j.file.size });
      } catch (err) {
        console.warn('upload skipped', j.file.name, err);
        failed.push(j.file.name);
      }
      j.loaded = j.file.size;
      update();
    }
  };
  await Promise.all([worker(), worker()]);
  return { uploaded, failed };
}

async function sendPayload(payload) {
  setProgress(95, 'Sending your request...');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const res = await withTimeout(fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }), 25000, controller);
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) return out;
    } catch (err) {
      console.warn('send attempt failed', err);
    }
    await sleep(1200 * (attempt + 1));
  }
  return null;
}

function showDone(payload, out) {
  storage.clear();
  const c = payload.contact;
  $('#refNo').textContent = out.ref;
  $('#doneEmail').textContent = c.email;
  $('#doneEmailLine').hidden = !EMAIL_RE.test(c.email);
  $('#donePhoneLine').hidden = EMAIL_RE.test(c.email);
  $('#doneEmergency').hidden = payload.urgency !== 'emergency';
  $('#doneFilesNote').hidden = !(payload.failedFiles && payload.failedFiles.length);
  go(DONE);
}

function showHandoff(payload) {
  const c = payload.contact;
  const lines = [
    `Name: ${c.name}`, c.company && `Company: ${c.company}`, c.phone && `Phone: ${c.phone}`, c.email && `Email: ${c.email}`,
    payload.urgency && `Urgency: ${URGENCY_LABEL[payload.urgency] || payload.urgency}`,
    payload.message && `\n${payload.message}`,
  ];
  if (payload.mode === 'detailed') {
    const g = payload.gear, l = payload.logistics, a = payload.application;
    lines.push('', g.type && `Gear type: ${g.type}`, g.teeth && `Teeth: ${g.teeth}`, g.od && `OD: ${g.od} ${g.units}`, g.bore && `Bore: ${g.bore} ${g.units}`,
      a.machine && `Machine: ${a.machine}`, a.notes && `Notes: ${a.notes}`, `Quantity: ${l.quantity}`, l.neededBy && `Needed by: ${l.neededBy}`);
  }
  if (files.length) lines.push('', `(I have ${files.length} photo${files.length === 1 ? '' : 's'} to attach to this email.)`);
  const body = lines.filter((x) => x !== undefined && x !== false && x !== '').join('\n').replace(/\n{3,}/g, '\n\n').slice(0, 1800);
  const subject = `Gear quote request: ${c.company || c.name}`;
  $('#mailtoBtn').href = `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  go(HANDOFF);
}

async function submit() {
  const payload = collect();
  lastPayload = payload;
  go(SENDING);
  setProgress(5, 'One moment...');

  const { uploaded, failed } = files.length ? await uploadFiles() : { uploaded: [], failed: [] };
  payload.files = uploaded;
  payload.failedFiles = failed;

  const out = await sendPayload(payload);
  if (out) showDone(payload, out);
  else showHandoff(payload);
}

$('#retryBtn').addEventListener('click', async () => {
  if (!lastPayload) return;
  go(SENDING);
  const out = await sendPayload(lastPayload);
  if (out) showDone(lastPayload, out);
  else showHandoff(lastPayload);
});

// ---- Print ----
$('#printBlank').addEventListener('click', () => window.print());

// ---- Start ----
const params = new URLSearchParams(location.search);
const resume = restoreDraft();
const urgencyParam = params.get('urgency') || (params.get('speed') === 'emergency' ? 'emergency' : '');
if (urgencyParam) {
  for (const name of ['urgency', 'qurgency']) {
    if (!radio(name)) { const r = $(`input[name=${name}][value="${urgencyParam}"]`); if (r) r.checked = true; }
  }
}
applyUnits();
applyUrgency();
go(resume ?? START, { scroll: false });
