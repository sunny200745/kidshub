// api/chat.js
// KidsHub — Aria AI Chat Serverless Function
// Proxies to Anthropic Claude API + handles lead capture via Resend
// Deploy on Vercel — set environment variables:
//   ANTHROPIC_API_KEY   → your Anthropic API key
//   RESEND_API_KEY      → your Resend API key
//   LEAD_EMAIL          → email to receive lead notifications (e.g. hello@getkidshub.com)
//   OPENROUTER_API_KEY  → (optional) fallback if using OpenRouter

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // ── LEAD CAPTURE ROUTE ───────────────────────────────────
    if (body.__lead === true) {
      await sendLeadEmail(body);
      return res.status(200).json({ ok: true });
    }

    // ── CHAT ROUTE ───────────────────────────────────────────
    const { model, system, messages, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               apiKey,
        'anthropic-version':       ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model:      model || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 400,
        system:     system || '',
        messages:   messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic error:', err);
      return res.status(anthropicRes.status).json({ error: 'Upstream API error' });
    }

    const data = await anthropicRes.json();

    // Check for lead capture pattern in response and send email notification
    if (data.content && data.content[0]) {
      const text = data.content[0].text || '';
      const leadMatch = text.match(/LEAD_CAPTURE::(\{.*?\})/s);
      if (leadMatch) {
        try {
          const leadData = JSON.parse(leadMatch[1]);
          await sendLeadEmail({ ...leadData, source: 'aria-chat' });
        } catch (_) {}
      }
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── SEND LEAD EMAIL VIA RESEND ─────────────────────────────────
async function sendLeadEmail(data) {
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail   = process.env.LEAD_EMAIL || 'hello@getkidshub.com';

  if (!resendKey) {
    console.warn('RESEND_API_KEY not set, skipping lead email');
    return;
  }

  const html = `
    <h2 style="color:#FF2D9B">🌸 New KidsHub Lead from Aria</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${esc(data.name || '—')}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px">${esc(data.email || '—')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#666">Phone</td><td style="padding:8px">${esc(data.phone || '—')}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Centre</td><td style="padding:8px">${esc(data.centre || '—')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#666">Message</td><td style="padding:8px">${esc(data.message || '—')}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Source</td><td style="padding:8px">${esc(data.source || 'aria-chat')}</td></tr>
    </table>
    <p style="color:#999;font-size:12px;margin-top:20px">Sent from KidsHub Aria widget · getkidshub.com</p>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from:    'Aria <aria@getkidshub.com>',
        to:      [toEmail],
        subject: `🌸 New KidsHub lead: ${data.name || 'Unknown'} — ${data.centre || 'unknown centre'}`,
        html,
      }),
    });
  } catch (e) {
    console.error('Resend error:', e);
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
