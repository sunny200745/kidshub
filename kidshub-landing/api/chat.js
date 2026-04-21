// KidsHub — Aria AI chat serverless function
// Proxies chat messages to OpenRouter and sends captured leads via Resend.
//
// Required env vars (set in Vercel):
//   OPENROUTER_API_KEY  → OpenRouter API key (used for Claude via their passthrough)
//   RESEND_API_KEY      → Resend API key (optional, lead emails skipped if missing)
//   LEAD_EMAIL          → destination for lead notifications (defaults to contact@nuvaro.ca)

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free-tier fallback chain. OpenRouter's `route: "fallback"` feature will
// automatically try each model in order if the previous one is rate-limited
// or down — which is common on free endpoints since multiple users share
// upstream provider quotas (Venice, Chutes, etc.).
//
// Ordered by: instruction-following quality → speed → availability.
const FREE_MODEL_CHAIN = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'google/gemma-3-27b-it:free',
];
const DEFAULT_LEAD_EMAIL = 'contact@nuvaro.ca';

const ALLOWED_ORIGINS = [
  'https://getkidshub.com',
  'https://www.getkidshub.com',
];

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  let allowed = ALLOWED_ORIGINS.includes(origin);

  if (!allowed && origin) {
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol === 'https:' && hostname.endsWith('.vercel.app')) allowed = true;
      if (hostname === 'localhost' || hostname === '127.0.0.1') allowed = true;
    } catch (_) {
      // Malformed Origin header — fall through to default.
    }
  }

  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Lead capture route — Aria widget POSTs { __lead: true, name, email, ... }
  // when it detects LEAD_CAPTURE:: pattern in its own reply.
  if (body.__lead === true) {
    await sendLeadEmail({ ...body, source: body.source || 'aria-chat' });
    return res.status(200).json({ ok: true });
  }

  const { system, messages, max_tokens = 1024 } = body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Model is pinned server-side (ignores client field — clients historically
    // sent Anthropic-direct IDs that are invalid on OpenRouter). We send a
    // `models` array + `route: "fallback"` so OpenRouter auto-hops to the next
    // free model on 429/5xx from the primary upstream provider.
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://getkidshub.com',
        'X-Title': 'Aria - KidsHub Assistant',
      },
      body: JSON.stringify({
        models: FREE_MODEL_CHAIN,
        route: 'fallback',
        max_tokens,
        messages: [
          { role: 'system', content: system || 'You are a helpful assistant.' },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'API request failed',
        details: errorData,
      });
    }

    const data = await response.json();

    // Log which model in the chain actually served the reply — helpful to
    // spot when the primary is consistently being skipped.
    if (data && data.model) {
      console.log('Aria served by:', data.model);
    }

    // Auto-detect LEAD_CAPTURE pattern in assistant reply and fire off an email.
    // The widget also fires an explicit __lead POST, but this belt-and-braces
    // catches cases where the client extraction misses.
    try {
      const text =
        (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
        (data.content && data.content[0] && data.content[0].text) ||
        '';
      const leadMatch = text.match(/LEAD_CAPTURE::(\{.*?\})/s);
      if (leadMatch) {
        const leadData = JSON.parse(leadMatch[1]);
        await sendLeadEmail({ ...leadData, source: 'aria-chat-auto' });
      }
    } catch (_) {
      // Lead parse failures shouldn't break the chat reply.
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function sendLeadEmail(data) {
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_EMAIL || DEFAULT_LEAD_EMAIL;

  if (!resendKey) {
    console.warn('RESEND_API_KEY not set, skipping lead email. Payload:', data);
    return;
  }

  const html = `
    <h2 style="color:#FF2D9B">New KidsHub lead from Aria</h2>
    <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:system-ui,sans-serif">
      <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${esc(data.name)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px">${esc(data.email)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#666">Phone</td><td style="padding:8px">${esc(data.phone)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Centre</td><td style="padding:8px">${esc(data.centre)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;color:#666">Message</td><td style="padding:8px">${esc(data.message)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#666">Source</td><td style="padding:8px">${esc(data.source)}</td></tr>
    </table>
    <p style="color:#999;font-size:12px;margin-top:20px">Sent from KidsHub Aria widget · getkidshub.com</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Aria <aria@nuvaro.ca>',
        to: [toEmail],
        subject: `New KidsHub lead: ${data.name || 'Unknown'} — ${data.centre || 'unknown centre'}`,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', response.status, errText);
    }
  } catch (err) {
    console.error('Resend error:', err);
  }
}

function esc(str) {
  return String(str == null ? '—' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
