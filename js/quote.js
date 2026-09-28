import { upload } from './blob-upload.js';

// ---- Settings ----
// Shop phone number, shown when a customer picks Emergency. Leave empty to hide it.
// Example: const SHOP_PHONE = '1-905-555-0123';
const SHOP_PHONE = '';

const DRAFT_KEY = 'gearswift-quote-draft-v1';
const MAX_FILES = 10;
const MAX_EACH = 25 * 1024 * 1024;
const MAX_TOTAL = 50 * 1024 * 1024;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf', 'dwg', 'dxf', 'step', 'stp'];
const LAST_STEP = 6; // review; step 7 is the success screen

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const form = $('#quote');
const steps = $$('[data-step]', form);
let step = 1;
let files = [];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const ext = (name) => (name.split('.').pop() || '').toLowerCase();

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
  const values = {};
  for (const el of namedFields()) {
    if (el.type === 'radio') { if (el.checked) values[el.name] = el.value; }
    else if (el.type === 'checkbox') { (values[el.name] ||= []); if (el.checked) values[el.name].push(el.value); }
    else values[el.name] = el.value;
  }
  const idk = $$('[data-idk]:checked').map((c) => c.dataset.idk);
  storage.set({ values, idk, step: Math.min(step, LAST_STEP), fileCount: files.length, savedAt: Date.now() });
}

function restoreDraft() {
  const d = storage.get();
  if (!d || !d.values) return false;
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
  return d.step || 1;
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

// ---- Photos & files ----
function renderFiles() {
  $('#thumbs').innerHTML = files.map((f, i) => {
    const preview = f.preview ? `<img src="${f.preview}" alt="">` : `<span class="ext">${esc(ext(f.file.name) || 'file')}</span>`;
    return `<div class="thumb">${preview}<span class="nm">${esc(f.file.name)}</span><button type="button" data-rm="${i}" aria-label="Remove ${esc(f.file.name)}">&times;</button></div>`;
  }).join('');
  $('#fileCount').textContent = `${files.length} of ${MAX_FILES} files. JPG, PNG, HEIC, PDF, DWG, DXF or STEP, up to 25 MB each.`;
  if (files.length) { $('#filesField').classList.remove('invalid'); $('#readdPhotos').hidden = true; }
  saveDraft();
}

function addFiles(list) {
  const problems = [];
  let total = files.reduce((s, f) => s + f.file.size, 0);
  for (const file of list) {
    if (files.length >= MAX_FILES) { problems.push(`You can send up to ${MAX_FILES} files. Reply to the confirmation email with any extras.`); break; }
    if (!ALLOWED_EXT.includes(ext(file.name)) && !/^image\/(jpeg|png|heic|heif)$/.test(file.type)) { problems.push(`${file.name}: file type not accepted.`); continue; }
    if (file.size > MAX_EACH) { problems.push(`${file.name} is over 25 MB.`); continue; }
    if (total + file.size > MAX_TOTAL) { problems.push(`${file.name} would take you over 50 MB in total.`); continue; }
    // Browsers can't preview HEIC, so those get a label instead of a thumbnail.
    const preview = /^image\/(jpeg|png)$/.test(file.type) ? URL.createObjectURL(file) : null;
    files.push({ file, preview });
    total += file.size;
  }
  renderFiles();
  if (problems.length) alert(problems.join('\n'));
}

for (const id of ['#fileInput', '#cameraInput']) {
  const input = $(id);
  input.addEventListener('change', () => { addFiles([...input.files]); input.value = ''; });
}
$('#thumbs').addEventListener('click', (e) => {
  const i = e.target.closest('[data-rm]')?.dataset.rm;
  if (i === undefined) return;
  const [removed] = files.splice(Number(i), 1);
  if (removed.preview) URL.revokeObjectURL(removed.preview);
  renderFiles();
});
const drop = $('#drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

// ---- Validation (only required fields ever block) ----
function mark(el, ok) { el.closest('.field').classList.toggle('invalid', !ok); return ok; }

function validate(n) {
  let ok = true;
  if (n === 1) {
    for (const id of ['name', 'company', 'phone']) ok = mark($('#' + id), $('#' + id).value.trim() !== '') && ok;
    ok = mark($('#email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#email').value.trim())) && ok;
    ok = mark($('#urgencyField .choices'), !!$('input[name=urgency]:checked')) && ok;
  }
  if (n === 4) ok = mark($('#quantity'), parseInt($('#quantity').value, 10) >= 1);
  if (n === 5) ok = mark($('#filesField .photo-actions'), files.length > 0);
  if (!ok) {
    const bad = $(`[data-step="${n}"] .field.invalid`);
    bad?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('input:not([type=radio]):not([type=checkbox])', bad)?.focus({ preventScroll: true });
  }
  return ok;
}

// ---- Steps ----
function go(n, { scroll = true } = {}) {
  step = n;
  steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  const done = n > LAST_STEP;
  $('#progress').hidden = done;
  $('#nav').hidden = done;
  $('.qf-tools').hidden = done;
  if (!done) {
    $('#stepName').textContent = $(`[data-step="${n}"]`).dataset.name;
    $('#stepCount').textContent = `Step ${n} of ${LAST_STEP}`;
    $('#stepBar').style.width = ((n / LAST_STEP) * 100).toFixed(1) + '%';
    $('#backBtn').hidden = n === 1;
    $('#nextBtn').textContent = n === LAST_STEP ? 'Send request' : n === LAST_STEP - 1 ? 'Review' : 'Next';
    $('#nextBtn').classList.toggle('arrow', n < LAST_STEP);
  }
  if (n === LAST_STEP) renderReview();
  if (!done) saveDraft();
  if (scroll) window.scrollTo({ top: $('main').getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' });
}

$('#nextBtn').addEventListener('click', () => {
  if (step === LAST_STEP) return submit();
  if (validate(step)) go(step + 1);
});
$('#backBtn').addEventListener('click', () => go(step - 1));
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
  return {
    website: form.website.value,
    contact: { name: val('name'), company: val('company'), phone: val('phone'), email: val('email'), site: val('site') },
    urgency: radio('urgency'),
    gear: { units: radio('units') || 'in', type: radio('type'), teeth: val('teeth'), od: val('od'), bore: val('bore'), face: val('face'), keyway: val('keyway'), hub: radio('hub') },
    application: { machine: val('machine'), makeModel: val('makeModel'), partNumber: val('partNumber'), failure: $$('input[name=failure]:checked').map((c) => c.value), notes: val('notes') },
    logistics: { quantity: val('quantity'), haveOld: radio('haveOld'), canShip: radio('canShip'), haveDrawing: radio('haveDrawing'), neededBy: val('neededBy') },
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
    section('The gear', 2, [['Type', shown(q.gear.type)], ['Teeth', shown(q.gear.teeth)], ['Outside diameter', m(q.gear.od)], ['Bore', m(q.gear.bore)], ['Face width', m(q.gear.face)], ['Keyway', m(q.gear.keyway)], ['Hub', shown(q.gear.hub)]]) +
    section('Application', 3, [['Machine', shown(q.application.machine)], ['Make / model', shown(q.application.makeModel)], ['Part number', shown(q.application.partNumber)], ['What failed', q.application.failure.join(', ')], ['Notes', q.application.notes]]) +
    section('Logistics', 4, [['Quantity', q.logistics.quantity], ['Have old gear', q.logistics.haveOld], ['Can ship it', q.logistics.canShip], ['Have drawing', q.logistics.haveDrawing], ['Needed by', q.logistics.neededBy]]) +
    section('Photos &amp; files', 5, [['Files', files.map((f) => `${f.file.name} (${fmtSize(f.file.size)})`).join(', ')]]);
}

// ---- Submit ----
async function submit() {
  const btn = $('#nextBtn');
  const err = $('#formError');
  const prog = $('#uploadProgress');
  if (!files.length) { go(5); validate(5); return; }
  err.hidden = true;
  btn.disabled = true;
  $('#backBtn').disabled = true;

  const q = collect();
  const jobs = files.map((f) => ({ file: f.file, loaded: 0, result: null }));
  const totalBytes = jobs.reduce((s, j) => s + j.file.size, 0);
  const folder = `quotes/${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    prog.hidden = false;
    const setProgress = () => {
      const pct = Math.round((jobs.reduce((s, j) => s + j.loaded, 0) / totalBytes) * 100);
      $('.track i', prog).style.width = pct + '%';
      $('p', prog).textContent = `Uploading ${jobs.length} file${jobs.length === 1 ? '' : 's'}... ${pct}%`;
    };
    setProgress();
    // Two uploads at a time: quick on good connections, doesn't choke on weak site Wi-Fi.
    const queue = [...jobs];
    const worker = async () => {
      while (queue.length) {
        const j = queue.shift();
        const safe = j.file.name.replace(/[^\w.\-]+/g, '_').slice(-100);
        const blob = await upload(`${folder}/${safe}`, j.file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          multipart: j.file.size > 8 * 1024 * 1024,
          onUploadProgress: (ev) => { j.loaded = ev.loaded; setProgress(); },
        });
        j.loaded = j.file.size;
        j.result = { name: j.file.name, url: blob.url, size: j.file.size };
        setProgress();
      }
    };
    await Promise.all([worker(), worker()]);
    q.files = jobs.map((j) => j.result);
    $('p', prog).textContent = 'Photos uploaded. Sending your request...';

    const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || 'Something went wrong sending your request.');

    storage.clear();
    $('#refNo').textContent = out.ref;
    $('#doneEmail').textContent = q.contact.email;
    $('#doneEmergency').hidden = q.urgency !== 'emergency';
    go(LAST_STEP + 1);
  } catch (ex) {
    console.error(ex);
    const msg = /blob|upload|token/i.test(ex.message) ? 'One of your photos could not be uploaded.' : ex.message;
    err.innerHTML = `<strong>Your request didn't go through.</strong> ${esc(msg)} Your answers are saved. Please try again, or email your photos to <a href="mailto:quotes@gearswift.ca">quotes@gearswift.ca</a>.`;
    err.hidden = false;
    prog.hidden = true;
  } finally {
    btn.disabled = false;
    $('#backBtn').disabled = false;
  }
}

// ---- Print ----
$('#printBlank').addEventListener('click', () => window.print());

// ---- Start ----
const params = new URLSearchParams(location.search);
const restoredStep = restoreDraft();
const urgencyParam = params.get('urgency') || (params.get('speed') === 'emergency' ? 'emergency' : '');
if (urgencyParam && !radio('urgency')) {
  const r = $(`input[name=urgency][value="${urgencyParam}"]`);
  if (r) r.checked = true;
}
applyUnits();
applyUrgency();
// Photos can't be restored, so never resume past the photo step.
go(restoredStep ? Math.min(restoredStep, 5) : 1, { scroll: false });
