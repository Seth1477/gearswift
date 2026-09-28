// Builds the three emails sent for each quote request:
//   owner()    - full request to the shop owner, urgency in the subject
//   customer() - auto-reply confirming receipt
//   shop()     - technical details only (no contact info), ready to forward to a machine shop

const URGENCY = {
  emergency: { label: 'Emergency', detail: 'Equipment down', tag: '[EMERGENCY]', color: '#c8102e' },
  urgent: { label: 'Urgent', detail: 'Failing soon', tag: '[URGENT]', color: '#b45309' },
  planned: { label: 'Planned', detail: 'Planned replacement or spare', tag: '[PLANNED]', color: '#44484d' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

// "unknown" is what the form sends when the customer ticks "I don't know".
const show = (v) => (v === 'unknown' ? "Doesn't know" : v);
const measure = (v, units) => (!v ? '' : v === 'unknown' ? "Doesn't know" : `${v} ${units}`);

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// Sections as [heading, [[label, value], ...]]; empty values are dropped when rendering.
function technicalSections(q) {
  const g = q.gear;
  const a = q.application;
  const l = q.logistics;
  const u = g.units === 'mm' ? 'mm' : 'in';
  return [
    ['The gear', [
      ['Type', show(g.type)],
      ['Number of teeth', show(g.teeth)],
      ['Outside diameter', measure(g.od, u)],
      ['Bore diameter', measure(g.bore, u)],
      ['Face width', measure(g.face, u)],
      ['Keyway', measure(g.keyway, u)],
      ['Hub', show(g.hub)],
    ]],
    ['Application', [
      ['Machine', show(a.machine)],
      ['Make / model', show(a.makeModel)],
      ['Part number', show(a.partNumber)],
      ['What failed', a.failure.join(', ')],
      ['Notes', a.notes],
    ]],
    ['Logistics', [
      ['Quantity', l.quantity],
      ['Has the old gear', l.haveOld],
      ['Can ship it to us', l.canShip],
      ['Has a drawing', l.haveDrawing],
      ['Needed by', fmtDate(l.neededBy)],
    ]],
  ];
}

function renderText(sections) {
  return sections
    .map(([head, rows]) => {
      const lines = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
      return lines.length ? `--- ${head} ---\n${lines.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function renderHtml(sections) {
  return sections
    .map(([head, rows]) => {
      const r = rows.filter(([, v]) => v);
      if (!r.length) return '';
      return `<h3 style="margin:22px 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em">${esc(head)}</h3>
<table style="border-collapse:collapse">${r.map(([k, v]) => `<tr><td style="padding:3px 18px 3px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:3px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
    })
    .join('');
}

const filesText = (files) => (files.length ? '--- Files ---\n' + files.map((f) => `${f.name} (${fmtSize(f.size)}) ${f.url}`).join('\n') : '');
const filesHtml = (files, attached) =>
  !files.length ? '' : `<h3 style="margin:22px 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em">Photos &amp; files</h3>
<p style="margin:0">${files.map((f) => `<a href="${esc(f.url)}">${esc(f.name)}</a> <span style="color:#888">(${fmtSize(f.size)})</span>`).join('<br>')}</p>
${attached ? '' : '<p style="color:#888">Too large to attach. Use the links above.</p>'}`;

const wrap = (inner) => `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:640px">${inner}</div>`;
const banner = (u) => `<p style="display:inline-block;margin:0 0 12px;padding:5px 10px;background:${u.color};color:#fff;font-weight:bold;font-size:13px">${esc(u.label.toUpperCase())}: ${esc(u.detail)}</p>`;

function owner(q, { attached }) {
  const u = URGENCY[q.urgency];
  const c = q.contact;
  const tech = technicalSections(q);
  const contactRows = [['Name', c.name], ['Company', c.company], ['Phone', c.phone], ['Email', c.email], ['City / site', c.site]];
  return {
    subject: `${u.tag} ${q.ref}: ${c.company} (${c.name})`,
    text: [
      `Quote request ${q.ref}`,
      `Urgency: ${u.label} (${u.detail})`,
      '',
      renderText([['Contact', contactRows]]),
      '',
      renderText(tech),
      '',
      filesText(q.files),
    ].join('\n'),
    html: wrap(`<h2 style="margin:0 0 8px">Quote request ${esc(q.ref)}</h2>${banner(u)}
${renderHtml([['Contact', contactRows]])}${renderHtml(tech)}${filesHtml(q.files, attached)}
<p style="margin-top:24px;color:#888;font-size:12px">A copy without contact details was sent separately for forwarding to a machine shop.</p>`),
  };
}

function shop(q, { attached }) {
  const u = URGENCY[q.urgency];
  const tech = technicalSections(q);
  return {
    subject: `Shop summary ${q.ref} (no customer info): forward for pricing`,
    text: [
      `Gear quote ${q.ref}`,
      `Urgency: ${u.label} (${u.detail})`,
      '',
      renderText(tech),
      '',
      filesText(q.files),
    ].join('\n'),
    html: wrap(`<p style="margin:0 0 16px;padding:10px 12px;background:#f3f1ec;color:#44484d;font-size:13px">Customer details removed. Check the notes before forwarding, in case the customer typed contact info there.</p>
<h2 style="margin:0 0 8px">Gear quote ${esc(q.ref)}</h2>${banner(u)}${renderHtml(tech)}${filesHtml(q.files, attached)}`),
  };
}

function customer(q, { shopPhone }) {
  const u = URGENCY[q.urgency];
  const first = q.contact.name.split(/\s+/)[0];
  const lines = [
    `Hi ${first},`,
    '',
    `Thanks for your gear quote request. Your reference number is ${q.ref}.`,
    '',
    q.urgency === 'emergency'
      ? `You marked this as an emergency, so it's at the top of our list and we'll call you as soon as possible.${shopPhone ? ` If your equipment is down and you haven't called yet, reach us at ${shopPhone}.` : ''}`
      : "We'll review your photos and details and get back to you with pricing and a ship date.",
    '',
    'Have more photos, a drawing, or measurements? Just reply to this email and attach them.',
    '',
    'Hotshot Gears',
    'Custom gears, made in Canada',
  ];
  return {
    subject: `We received your gear quote request (${q.ref})`,
    text: lines.join('\n'),
    html: wrap(lines.map((l) => (l ? `<p style="margin:0 0 4px">${esc(l)}</p>` : '<br>')).join('')),
  };
}

module.exports = { URGENCY, owner, shop, customer };
