import { upload } from './blob-upload.js';

// Landing page form. Short on purpose: a name and one way to reach the person is all we need.
// Same safety rules as the main quote form: a failed photo never blocks the lead, and if the
// server can't be reached the visitor gets a prefilled email instead of an error.
const SHOP_EMAIL = 'hotshotgears@gmail.com';
const MAX_FILES = 6;
const MAX_EACH = 25 * 1024 * 1024;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf', 'dwg', 'dxf', 'step', 'stp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const $ = (s, el = document) => el.querySelector(s);
const form = $('#lpForm');
if (form) init();

function init() {
  const slug = form.dataset.page || 'landing';
  let files = [];

  // Remember where the visitor came from (the Google Ads click ID and campaign tags) for this visit.
  const KEYS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const attr = (() => {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('hs-attr') || '{}'); } catch (e) { /* private mode */ }
    const q = new URLSearchParams(location.search);
    KEYS.forEach((k) => { if (q.get(k)) saved[k] = q.get(k); });
    try { sessionStorage.setItem('hs-attr', JSON.stringify(saved)); } catch (e) { /* ignore */ }
    return saved;
  })();
  const source = () => ['lp/' + slug].concat(Object.entries(attr).map(([k, v]) => k + '=' + v)).join(' | ');

  const ext = (n) => (n.split('.').pop() || '').toLowerCase();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const setStage = (name) => {
    ['fields', 'sending', 'ok', 'fallback'].forEach((s) => { const el = $('[data-stage=' + s + ']'); if (el) el.hidden = s !== name; });
    const card = $('#lpCard'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Photos
  const input = $('#lpFiles');
  const count = $('#lpCount');
  const renderCount = () => { count.textContent = files.length ? files.length + ' file' + (files.length === 1 ? '' : 's') + ' added' : ''; };
  input.addEventListener('change', () => {
    for (const f of input.files) {
      if (files.length >= MAX_FILES) break;
      if (!ALLOWED_EXT.includes(ext(f.name)) && !/^image\//.test(f.type)) continue;
      if (f.size > MAX_EACH) continue;
      files.push(f);
    }
    input.value = '';
    renderCount();
  });

  const mark = (id, ok) => { $('#' + id).closest('.f').classList.toggle('bad', !ok); return ok; };
  form.addEventListener('input', (e) => e.target.closest('.f')?.classList.remove('bad'));

  async function uploadAll() {
    const folder = 'quotes/' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 8);
    const done = [], failed = [];
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        const safe = f.name.replace(/[^\w.\-]+/g, '_').slice(-100) || 'file';
        const controller = new AbortController();
        try {
          const blob = await Promise.race([
            upload(folder + '/' + safe, f, { access: 'public', handleUploadUrl: '/api/upload', multipart: f.size > 8 * 1048576, abortSignal: controller.signal }),
            sleep(45000 + (f.size / 1048576) * 4000).then(() => { controller.abort(); throw new Error('timeout'); }),
          ]);
          done.push({ name: f.name, url: blob.url, size: f.size });
        } catch (err) { failed.push(f.name); }
      }
    };
    await Promise.all([worker(), worker()]);
    return { done, failed };
  }

  async function send(payload) {
    for (let i = 0; i < 3; i++) {
      try {
        const c = new AbortController();
        const res = await Promise.race([
          fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: c.signal }),
          sleep(25000).then(() => { c.abort(); throw new Error('timeout'); }),
        ]);
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) return out;
      } catch (err) { /* retry */ }
      await sleep(1200 * (i + 1));
    }
    return null;
  }

  function fallback(p) {
    const body = ['Name: ' + p.contact.name, p.contact.phone && 'Phone: ' + p.contact.phone, p.contact.email && 'Email: ' + p.contact.email, '', p.message]
      .filter((x) => x !== undefined && x !== false).join('\n').slice(0, 1800);
    $('#lpMail').href = 'mailto:' + SHOP_EMAIL + '?subject=' + encodeURIComponent('Gear quote request: ' + p.contact.name) + '&body=' + encodeURIComponent(body);
    setStage('fallback');
  }

  let last = null;
  async function submit() {
    const p = {
      mode: 'quick',
      website: form.website.value,
      contact: { name: $('#lpName').value.trim(), company: '', phone: $('#lpPhone').value.trim(), email: $('#lpEmail').value.trim(), site: '' },
      urgency: (form.querySelector('input[name=urgency]:checked') || {}).value || form.dataset.urgency || '',
      message: $('#lpMsg').value.trim(),
      source: source(),
      files: [],
    };
    last = p;
    setStage('sending');
    if (files.length) { const r = await uploadAll(); p.files = r.done; p.failedFiles = r.failed; }
    const out = await send(p);
    if (!out) return fallback(p);
    try { if (window.hotshotTrackQuote) window.hotshotTrackQuote(out.ref); } catch (e) { /* tracking must never break the form */ }
    $('#lpRef').textContent = out.ref;
    $('#lpOkEmail').hidden = !EMAIL_RE.test(p.contact.email);
    $('#lpOkFiles').hidden = !(p.failedFiles && p.failedFiles.length);
    setStage('ok');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = mark('lpName', $('#lpName').value.trim() !== '');
    const reach = $('#lpPhone').value.trim() !== '' || EMAIL_RE.test($('#lpEmail').value.trim());
    mark('lpPhone', reach); mark('lpEmail', reach);
    if (!name || !reach) { $('.f.bad input', form)?.focus(); return; }
    submit();
  });
  const retry = $('#lpRetry');
  if (retry) retry.addEventListener('click', async () => {
    if (!last) return;
    setStage('sending');
    const out = await send(last);
    if (!out) return fallback(last);
    try { if (window.hotshotTrackQuote) window.hotshotTrackQuote(out.ref); } catch (e) { /* tracking must never break the form */ }
    $('#lpRef').textContent = out.ref;
    setStage('ok');
  });

  // "Get a quote" buttons scroll to the form and focus the first field.
  document.querySelectorAll('[data-scroll-form]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    $('#lpCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('#lpName').focus({ preventScroll: true }), 450);
  }));
}
