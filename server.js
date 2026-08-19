const express = require('express');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const submissionsFile = path.join(__dirname, 'data', 'submissions.jsonl');
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));
// Serve the repository assets directory at /assets so images and PDFs load reliably
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// Keep optional mounts for Bills and Business Card folders if present
app.use('/Bills', express.static(path.join(__dirname, 'Bills')));
app.use(['/Business Card', '/Business%20Card'], express.static(path.join(__dirname, 'Business Card')));

async function sendEmailNotification(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !notificationEmail || !fromEmail) {
    return { sent: false, reason: 'missing_config' };
  }

  const emailBody = [
    'New website inquiry',
    '',
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email || 'Not provided'}`,
    `Company: ${payload.company || 'Not provided'}`,
    `Product / service: ${payload.product || 'Not provided'}`,
    '',
    'Project details:',
    payload.message
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notificationEmail],
      subject: `New website inquiry from ${payload.name}`,
      text: emailBody
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason = result?.message || `Resend returned HTTP ${response.status}`;
    throw new Error(reason);
  }

  return { sent: true, id: result?.id || 'unknown' };
}

app.post('/api/quote', async (req, res) => {
  const payload = {
    name: String(req.body?.name || '').trim(),
    email: String(req.body?.email || '').trim(),
    phone: String(req.body?.phone || '').trim(),
    company: String(req.body?.company || '').trim(),
    product: String(req.body?.product || '').trim(),
    message: String(req.body?.message || '').trim()
  };

  if (!payload.name || !payload.phone || !payload.message) {
    return res.status(400).json({
      ok: false,
      message: 'Please share your name, phone number, and a short project note.'
    });
  }

  const entry = {
    ...payload,
    createdAt: new Date().toISOString(),
    userAgent: req.get('user-agent') || 'unknown'
  };

  await fs.mkdir(path.dirname(submissionsFile), { recursive: true });
  await fs.appendFile(submissionsFile, `${JSON.stringify(entry)}\n`, 'utf8');

  try {
    const notify = await sendEmailNotification(payload);
    if (notify.sent) {
      console.log(`Email notification sent to ${process.env.NOTIFICATION_EMAIL} (id: ${notify.id})`);
    } else if (notify.reason === 'missing_config') {
      console.warn('Email notification skipped: missing RESEND_API_KEY, NOTIFICATION_EMAIL, or FROM_EMAIL');
    }
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }

  return res.json({
    ok: true,
    message: 'Thanks. Your request was submitted successfully.'
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Website running at http://localhost:${port}`);
});