// Receives a gear quote request (photos already uploaded to Vercel Blob by the browser)
// and sends three emails: full request to the owner, technical-only summary for a
// machine shop, and a confirmation to the customer.
//
// Env vars:
//   GMAIL_USER  - Gmail address that sends the mail
//   GMAIL_PASS  - Google app password for GMAIL_USER
//   QUOTE_TO    - where quote requests go (defaults to GMAIL_USER)
//   SHOP_PHONE  - optional; mentioned in emergency auto-replies
//   BLOB_READ_WRITE_TOKEN - set automatically when a Blob store is connected
const nodemailer = require('nodemailer');
const { nextRef } = require('./_lib/ref');
const emails = require('./_lib/emails');

const ATTACH_LIMIT_BYTES = 15 * 1024 * 1024; // Gmail caps messages at 25 MB after base64 overhead
const MAX_FILES = 10;
const BLOB_HOST = /\.blob\.vercel-storage\.com$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);
const oneOf = (v, allowed) => (allowed.includes(v) ? v : '');

function isBlobUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && BLOB_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

function parse(body) {
  const c = body.contact || {};
  const g = body.gear || {};
  const a = body.application || {};
  const l = body.logistics || {};
  return {
    contact: {
      name: clean(c.name, 120),
      company: clean(c.company, 120),
      phone: clean(c.phone, 40),
      email: clean(c.email, 160),
      site: clean(c.site, 120),
    },
    urgency: oneOf(body.urgency, Object.keys(emails.URGENCY)),
    gear: {
      units: g.units === 'mm' ? 'mm' : 'in',
      type: clean(g.type, 40),
      teeth: clean(g.teeth, 20),
      od: clean(g.od, 20),
      bore: clean(g.bore, 20),
      face: clean(g.face, 20),
      keyway: clean(g.keyway, 40),
      hub: clean(g.hub, 40),
    },
    application: {
      machine: clean(a.machine),
      makeModel: clean(a.makeModel),
      partNumber: clean(a.partNumber, 80),
      failure: (Array.isArray(a.failure) ? a.failure : []).map((x) => clean(x, 60)).filter(Boolean).slice(0, 8),
      notes: clean(a.notes, 4000),
    },
    logistics: {
      quantity: String(Math.max(0, parseInt(l.quantity, 10) || 0)),
      haveOld: clean(l.haveOld, 20),
      canShip: clean(l.canShip, 20),
      haveDrawing: clean(l.haveDrawing, 20),
      neededBy: /^\d{4}-\d{2}-\d{2}$/.test(l.neededBy || '') ? l.neededBy : '',
    },
    files: (Array.isArray(body.files) ? body.files : [])
      .filter((f) => f && isBlobUrl(f.url))
      .slice(0, MAX_FILES)
      .map((f) => ({ name: clean(f.name) || 'file', url: f.url, size: Number(f.size) || 0 })),
  };
}

function validate(q) {
  const missing = [];
  if (!q.contact.name) missing.push('name');
  if (!q.contact.company) missing.push('company');
  if (!q.contact.phone) missing.push('phone');
  if (!q.contact.email) missing.push('email');
  if (!q.urgency) missing.push('urgency');
  if (missing.length) return 'Missing required fields: ' + missing.join(', ');
  if (!EMAIL_RE.test(q.contact.email)) return 'Invalid email address';
  if (Number(q.logistics.quantity) < 1) return 'Quantity must be at least 1';
  if (!q.files.length) return 'At least one photo or file is required';
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Honeypot: real people never see or fill this field.
  if (body.website) return res.status(200).json({ ok: true, ref: 'GQ-00000000-000' });

  const q = parse(body);
  const problem = validate(q);
  if (problem) return res.status(400).json({ error: problem });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('GMAIL_USER / GMAIL_PASS not set');
    return res.status(500).json({ error: 'Email is not configured' });
  }

  q.ref = await nextRef();

  const totalBytes = q.files.reduce((s, f) => s + f.size, 0);
  const attached = totalBytes <= ATTACH_LIMIT_BYTES;
  const attachments = attached ? q.files.map((f) => ({ filename: f.name, path: f.url })) : [];
  const to = process.env.QUOTE_TO || process.env.GMAIL_USER;
  const from = (name) => `"${name}" <${process.env.GMAIL_USER}>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: from('GearSwift Quotes'),
      to,
      replyTo: `"${q.contact.name}" <${q.contact.email}>`,
      priority: q.urgency === 'emergency' ? 'high' : 'normal',
      attachments,
      ...emails.owner(q, { attached }),
    });
  } catch (err) {
    console.error('send quote failed', err);
    return res.status(500).json({ error: 'Failed to send quote request' });
  }

  // The owner already has the full request, so these two must not fail the submission.
  const extras = await Promise.allSettled([
    transporter.sendMail({ from: from('GearSwift Quotes'), to, attachments, ...emails.shop(q, { attached }) }),
    transporter.sendMail({ from: from('GearSwift'), to: q.contact.email, replyTo: to, ...emails.customer(q, { shopPhone: process.env.SHOP_PHONE }) }),
  ]);
  extras.forEach((r) => r.status === 'rejected' && console.error('secondary email failed', r.reason));

  return res.status(200).json({ ok: true, ref: q.ref });
};
