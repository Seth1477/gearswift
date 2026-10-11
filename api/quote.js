// Receives a quote request or quick contact (photos already uploaded to Vercel Blob by
// the browser). Every lead is saved to Blob storage first, so it's never lost, then
// emailed: full request to the owner, a technical-only summary for a machine shop
// (detailed requests), and a confirmation to the customer when they gave an email.
//
// A lead is only rejected when there's no way to contact the person. Missing details,
// failed uploads and email problems never turn into an error for the customer.
//
// Env vars:
//   GMAIL_USER  - Gmail address that sends the mail
//   GMAIL_PASS  - Google app password for GMAIL_USER
//   QUOTE_TO    - where quote requests go (defaults to GMAIL_USER)
//   SHOP_PHONE  - optional; mentioned in emergency auto-replies
//   BLOB_READ_WRITE_TOKEN - set automatically when a Blob store is connected
const nodemailer = require('nodemailer');
const { put } = require('@vercel/blob');
const { nextRef } = require('./_lib/ref');
const emails = require('./_lib/emails');

const ATTACH_LIMIT_BYTES = 15 * 1024 * 1024; // Gmail caps messages at 25 MB after base64 overhead
const MAX_FILES = 10;
const BLOB_HOST = /\.blob\.vercel-storage\.com$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);
const oneOf = (v, allowed) => (allowed.includes(v) ? v : '');
const list = (v, max = 8, len = 60) => (Array.isArray(v) ? v : []).map((x) => clean(x, len)).filter(Boolean).slice(0, max);

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
    mode: body.mode === 'quick' ? 'quick' : 'detailed',
    contact: {
      name: clean(c.name, 120),
      company: clean(c.company, 120),
      phone: clean(c.phone, 40),
      email: clean(c.email, 160),
      site: clean(c.site, 120),
    },
    urgency: oneOf(body.urgency, Object.keys(emails.URGENCY)),
    message: clean(body.message, 4000),
    gear: {
      units: g.units === 'mm' ? 'mm' : 'in',
      type: clean(g.type, 40),
      teeth: clean(g.teeth, 20),
      od: clean(g.od, 20),
      bore: clean(g.bore, 20),
      face: clean(g.face, 20),
      keyway: clean(g.keyway, 40),
      hub: clean(g.hub, 40),
      finish: clean(g.finish, 40),
      grade: clean(g.grade, 60),
    },
    application: {
      machine: clean(a.machine),
      makeModel: clean(a.makeModel),
      partNumber: clean(a.partNumber, 80),
      failure: list(a.failure),
      notes: clean(a.notes, 4000),
    },
    logistics: {
      quantity: String(Math.max(1, parseInt(l.quantity, 10) || 1)),
      haveOld: clean(l.haveOld, 20),
      canShip: clean(l.canShip, 20),
      haveDrawing: clean(l.haveDrawing, 20),
      repeat: clean(l.repeat, 20),
      prevRef: clean(l.prevRef, 80),
      docs: list(l.docs),
      neededBy: /^\d{4}-\d{2}-\d{2}$/.test(l.neededBy || '') ? l.neededBy : '',
    },
    files: (Array.isArray(body.files) ? body.files : [])
      .filter((f) => f && isBlobUrl(f.url))
      .slice(0, MAX_FILES)
      .map((f) => ({ name: clean(f.name) || 'file', url: f.url, size: Number(f.size) || 0 })),
    failedFiles: list(body.failedFiles, MAX_FILES, 200),
  };
}

// Save the lead before anything else, so an email problem can never lose it.
async function saveLead(q) {
  try {
    await put(`leads/${q.ref}.json`, JSON.stringify({ ...q, receivedAt: new Date().toISOString() }, null, 2), {
      access: 'public',
      addRandomSuffix: true, // unguessable URL, since the file holds contact details
      contentType: 'application/json',
    });
    return true;
  } catch (err) {
    console.error('save lead failed', err);
    return false;
  }
}

async function sendEmails(q) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('GMAIL_USER / GMAIL_PASS not set; lead saved to Blob only', q.ref);
    return false;
  }
  const totalBytes = q.files.reduce((s, f) => s + f.size, 0);
  const attached = totalBytes <= ATTACH_LIMIT_BYTES;
  const attachments = attached ? q.files.map((f) => ({ filename: f.name, path: f.url })) : [];
  const to = process.env.QUOTE_TO || process.env.GMAIL_USER;
  const from = (name) => `"${name}" <${process.env.GMAIL_USER}>`;
  const validEmail = EMAIL_RE.test(q.contact.email);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  const send = (msg) => transporter.sendMail(msg).catch(async (err) => {
    // Attachments are the most likely thing to break a send; retry once without them.
    if (msg.attachments && msg.attachments.length) {
      console.error('send with attachments failed, retrying without', err);
      return transporter.sendMail({ ...msg, attachments: [] });
    }
    throw err;
  });

  let ownerSent = false;
  try {
    await send({
      from: from('Hotshot Gears Quotes'),
      to,
      ...(validEmail ? { replyTo: `"${q.contact.name}" <${q.contact.email}>` } : {}),
      priority: q.urgency === 'emergency' ? 'high' : 'normal',
      attachments,
      ...emails.owner(q, { attached }),
    });
    ownerSent = true;
  } catch (err) {
    console.error('owner email failed', q.ref, err);
  }

  const extras = [];
  if (q.mode === 'detailed') extras.push(send({ from: from('Hotshot Gears Quotes'), to, attachments, ...emails.shop(q, { attached }) }));
  if (validEmail) extras.push(transporter.sendMail({ from: from('Hotshot Gears'), to: q.contact.email, replyTo: to, ...emails.customer(q, { shopPhone: process.env.SHOP_PHONE }) }));
  const results = await Promise.allSettled(extras);
  results.forEach((r) => r.status === 'rejected' && console.error('secondary email failed', q.ref, r.reason));
  return ownerSent;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    body = {};
  }

  // Honeypot: real people never see or fill this field.
  if (body.website) return res.status(200).json({ ok: true, ref: 'GQ-00000000-000' });

  const q = parse(body);
  // The only hard requirement: some way to get back to them.
  if (!q.contact.phone && !q.contact.email) {
    return res.status(400).json({ error: 'Please add a phone number or email so we can reach you.' });
  }
  if (!q.contact.name) q.contact.name = 'Not given';

  q.ref = await nextRef();
  const [saved, emailed] = await Promise.all([saveLead(q), sendEmails(q)]);

  if (!saved && !emailed) {
    // Nothing recorded it anywhere. The browser falls back to an email hand-off.
    console.error('LEAD NOT RECORDED', JSON.stringify(q));
    return res.status(503).json({ error: 'Temporarily unavailable' });
  }
  return res.status(200).json({ ok: true, ref: q.ref });
};
