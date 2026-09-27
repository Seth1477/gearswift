// Receives a quote request (files already uploaded to Vercel Blob by the browser)
// and emails it to the shop, plus a confirmation to the customer.
//
// Env vars:
//   GMAIL_USER  - Gmail address that sends the mail
//   GMAIL_PASS  - Google app password for GMAIL_USER
//   QUOTE_TO    - where quote requests go (defaults to GMAIL_USER)
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const ATTACH_LIMIT_BYTES = 15 * 1024 * 1024; // Gmail caps messages at 25 MB after base64 overhead
const MAX_FILES = 10;
const BLOB_HOST = /\.blob\.vercel-storage\.com$/;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, max = 500) => String(s ?? '').trim().slice(0, max);
const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

function isBlobUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && BLOB_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

function makeRef() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  return `GS-${ymd}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  // Honeypot: real people never see or fill this field.
  if (body.website) return res.status(200).json({ ok: true, ref: makeRef() });

  const c = body.customer || {};
  const customer = {
    firstName: clean(c.firstName, 80),
    lastName: clean(c.lastName, 80),
    company: clean(c.company, 120),
    email: clean(c.email, 160),
    phone: clean(c.phone, 40),
    street: clean(c.street, 160),
    city: clean(c.city, 80),
    region: clean(c.region, 40),
    postal: clean(c.postal, 20),
    country: clean(c.country, 40),
    contactBy: Array.isArray(c.contactBy) ? c.contactBy.map((x) => clean(x, 20)).slice(0, 3) : [],
  };

  const required = ['firstName', 'lastName', 'email', 'phone', 'city', 'region', 'country'];
  const missing = required.filter((k) => !customer[k]);
  if (missing.length) return res.status(400).json({ error: 'Missing required fields: ' + missing.join(', ') });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return res.status(400).json({ error: 'Invalid email address' });

  const parts = (Array.isArray(body.parts) ? body.parts : []).slice(0, 20).map((p) => ({
    description: clean(p.description, 200),
    gearType: clean(p.gearType, 60),
    material: clean(p.material, 120),
    quantity: clean(p.quantity, 20),
    notes: clean(p.notes, 2000),
    files: (Array.isArray(p.files) ? p.files : [])
      .filter((f) => f && isBlobUrl(f.url))
      .map((f) => ({ name: clean(f.name, 200) || 'file', url: f.url, size: Number(f.size) || 0 })),
  }));
  if (!parts.length) return res.status(400).json({ error: 'Add at least one part' });
  for (const [i, p] of parts.entries()) {
    if (!p.material || !p.quantity) return res.status(400).json({ error: `Part ${i + 1}: material and quantity are required` });
  }

  const files = parts.flatMap((p) => p.files);
  if (files.length > MAX_FILES) return res.status(400).json({ error: `Maximum ${MAX_FILES} files` });

  const turnaround = clean(body.turnaround, 60) || 'Standard';
  const notes = clean(body.notes, 4000);
  const ref = makeRef();
  const name = `${customer.firstName} ${customer.lastName}`;
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const attachFiles = totalBytes <= ATTACH_LIMIT_BYTES;

  // Plain-text block, same field-per-line style as the other sites so an email parser can read it.
  const text = [
    `Quote request ${ref}`,
    '',
    `Name: ${name}`,
    `Company: ${customer.company}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `Address: ${[customer.street, customer.city, customer.region, customer.postal, customer.country].filter(Boolean).join(', ')}`,
    `Contact by: ${customer.contactBy.join(', ') || 'Email'}`,
    `Turnaround: ${turnaround}`,
    '',
    ...parts.flatMap((p, i) => [
      `--- Part ${i + 1}${p.description ? ': ' + p.description : ''} ---`,
      `Type: ${p.gearType}`,
      `Material: ${p.material}`,
      `Quantity: ${p.quantity}`,
      p.notes ? `Notes: ${p.notes}` : null,
      ...p.files.map((f) => `File: ${f.name} (${fmtSize(f.size)}) ${f.url}`),
      '',
    ]).filter((l) => l !== null),
    notes ? `Additional notes:\n${notes}` : '',
  ].join('\n');

  const row = (k, v) => (v ? `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>` : '');
  const html = `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:640px">
  <h2 style="margin:0 0 4px">Quote request ${ref}</h2>
  <p style="margin:0 0 16px;color:${turnaround.startsWith('Emergency') ? '#c8102e;font-weight:bold' : '#666'}">Turnaround: ${esc(turnaround)}</p>
  <table style="border-collapse:collapse;margin-bottom:20px">
    ${row('Name', name)}${row('Company', customer.company)}${row('Email', customer.email)}${row('Phone', customer.phone)}
    ${row('Address', [customer.street, customer.city, customer.region, customer.postal, customer.country].filter(Boolean).join(', '))}
    ${row('Contact by', customer.contactBy.join(', ') || 'Email')}
  </table>
  ${parts.map((p, i) => `
  <div style="border:1px solid #ddd;padding:12px 14px;margin-bottom:10px">
    <strong>Part ${i + 1}${p.description ? ': ' + esc(p.description) : ''}</strong>
    <table style="border-collapse:collapse;margin-top:6px">${row('Type', p.gearType)}${row('Material', p.material)}${row('Quantity', p.quantity)}${row('Notes', p.notes)}</table>
    ${p.files.length ? '<p style="margin:8px 0 0">' + p.files.map((f) => `<a href="${esc(f.url)}">${esc(f.name)}</a> <span style="color:#888">(${fmtSize(f.size)})</span>`).join('<br>') + '</p>' : ''}
  </div>`).join('')}
  ${notes ? `<p><strong>Additional notes</strong><br>${esc(notes).replace(/\n/g, '<br>')}</p>` : ''}
  ${files.length && !attachFiles ? '<p style="color:#888">Files were too large to attach. Use the links above.</p>' : ''}
</div>`;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('GMAIL_USER / GMAIL_PASS not set');
    return res.status(500).json({ error: 'Email is not configured' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"GearSwift Quotes" <${process.env.GMAIL_USER}>`,
      to: process.env.QUOTE_TO || process.env.GMAIL_USER,
      replyTo: `"${name}" <${customer.email}>`,
      subject: `${turnaround.startsWith('Emergency') ? '[EMERGENCY] ' : ''}Quote ${ref}: ${name}${customer.company ? ', ' + customer.company : ''}`,
      text,
      html,
      attachments: attachFiles ? files.map((f) => ({ filename: f.name, path: f.url })) : [],
    });
  } catch (err) {
    console.error('send quote failed', err);
    return res.status(500).json({ error: 'Failed to send quote request' });
  }

  // Confirmation to the customer. A failure here shouldn't fail the request.
  try {
    await transporter.sendMail({
      from: `"GearSwift" <${process.env.GMAIL_USER}>`,
      to: customer.email,
      replyTo: process.env.QUOTE_TO || process.env.GMAIL_USER,
      subject: `We received your quote request (${ref})`,
      text: `Hi ${customer.firstName},\n\nThanks for your request. Your reference number is ${ref}.\n\nWe'll review your drawings and specs and get back to you with pricing and a ship date, usually within one business hour. If anything is missing, just reply to this email.\n\nGearSwift\nCustom gears, made in Canada`,
    });
  } catch (err) {
    console.error('confirmation email failed', err);
  }

  return res.status(200).json({ ok: true, ref });
};
