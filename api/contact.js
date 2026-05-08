const nodemailer = require('nodemailer');

const MAX_BODY_BYTES = 50_000;
const MIN_FILL_TIME_MS = 2000;
const FIELD_LIMITS = { name: 200, email: 320, phone: 30, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function silentSuccess(res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true }));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Method Not Allowed');
    return;
  }

  let body = '';
  let aborted = false;
  await new Promise(resolve => {
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        aborted = true;
        req.destroy();
        resolve();
      }
    });
    req.on('end', resolve);
    req.on('error', resolve);
  });

  if (aborted) {
    res.statusCode = 413;
    res.end('Payload Too Large');
    return;
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (err) {
    try {
      data = Object.fromEntries(new URLSearchParams(body));
    } catch (e) {
      res.statusCode = 400;
      res.end('Invalid body');
      return;
    }
  }
  data = data || {};

  // Honeypot — bots fill the hidden field; silently accept and drop the message.
  if (data.website && String(data.website).trim() !== '') {
    silentSuccess(res);
    return;
  }

  // Submission timing — bots auto-submit faster than a human can fill the form.
  const submittedAt = Number(data.t);
  if (!Number.isFinite(submittedAt) || (Date.now() - submittedAt) < MIN_FILL_TIME_MS) {
    silentSuccess(res);
    return;
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const message = String(data.message || '').trim();

  if (!name || !email || !message) {
    res.statusCode = 400;
    res.end('Missing fields');
    return;
  }
  if (
    name.length > FIELD_LIMITS.name ||
    email.length > FIELD_LIMITS.email ||
    phone.length > FIELD_LIMITS.phone ||
    message.length > FIELD_LIMITS.message
  ) {
    res.statusCode = 400;
    res.end('Field too long');
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.statusCode = 400;
    res.end('Invalid email');
    return;
  }

  // Strip newlines from short fields so they render cleanly in email clients.
  const safeName = name.replace(/[\r\n]+/g, ' ');
  const safeEmail = email.replace(/[\r\n]+/g, '');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: 'michael@michaelkuell.com',
      replyTo: safeEmail,
      subject: 'New Contact Form Submission',
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nPhone: ${phone}\n\n${message}`
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('Contact API email error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false }));
  }
};
