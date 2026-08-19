module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

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

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !notificationEmail || !fromEmail) {
    return res.status(500).json({
      ok: false,
      message: 'Email service is not configured. Please contact site admin.'
    });
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

  try {
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

    return res.status(200).json({
      ok: true,
      message: 'Thanks. Your request was submitted successfully.'
    });
  } catch (error) {
    console.error('Vercel email notification failed:', error.message);
    return res.status(502).json({
      ok: false,
      message: 'Your request was received, but email delivery failed. Please call us directly.'
    });
  }
};
