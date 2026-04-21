// KidsHub — Aria AI chat serverless function
// Proxies chat messages to OpenRouter and sends captured leads via Resend.
//
// Required env vars (set in Vercel):
//   OPENROUTER_API_KEY  → OpenRouter API key (used for Claude via their passthrough)
//   RESEND_API_KEY      → Resend API key (optional, lead emails skipped if missing)
//   LEAD_EMAIL          → destination for lead notifications (defaults to contact@nuvaro.ca)
//
// Defense layers (abuse mitigation — this endpoint is public):
//   1. Origin/Referer allowlist check (rejects curl/bots without spoofed headers).
//   2. Request shape + size caps (prevents "send a 100K-token prompt" attacks).
//   3. OpenRouter per-key spend cap — the real safety net, set on the dashboard.
//   4. (not yet) Per-IP rate limiting via Upstash Redis.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Paid model — pinned server-side. Claude 3 Haiku is cheap enough for a
// lead-capture widget (~$0.0025 per full conversation, i.e. ~$2.50 per
// 1000 conversations) and gives us stable uptime vs free-tier 429s.
// Requires OpenRouter account to have credit balance.
const DEFAULT_MODEL = 'anthropic/claude-3-haiku';
const DEFAULT_LEAD_EMAIL = 'contact@nuvaro.ca';

const ALLOWED_ORIGINS = [
  'https://getkidshub.com',
  'https://www.getkidshub.com',
];

// Size caps. Tuned generously for real Aria traffic (system prompt is ~430
// tokens / ~1700 chars; user messages are short) while making large-payload
// abuse uneconomical for attackers.
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_SYSTEM_CHARS = 4000;
const MAX_TOKENS_CEILING = 500;
const MAX_LEAD_FIELD_CHARS = 500;

// ── Origin / allowlist helpers ──────────────────────────────────────────────

function matchesAllowlist(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) return true;
    if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app')) return true;
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
  } catch (_) {
    // Malformed URL — reject.
  }
  return false;
}

// Whether the inbound request looks like it came from an allowed browser
// origin. Same-origin browsers always send at least one of Origin/Referer on
// POSTs with Content-Type: application/json (ours is CORS-preflighted). A
// motivated attacker can spoof these headers, which is why this is only
// layer 1 — rate limiting + spend cap are the real safety nets.
function isAllowedSource(req) {
  return matchesAllowlist(req.headers.origin) || matchesAllowlist(req.headers.referer);
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = matchesAllowlist(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Request validation ──────────────────────────────────────────────────────

function validateChatBody(body) {
  const { system, messages, max_tokens } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array' };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: `too many messages (max ${MAX_MESSAGES})` };
  }
  for (const m of messages) {
    if (!m || typeof m !== 'object') {
      return { ok: false, error: 'invalid message' };
    }
    if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'system') {
      return { ok: false, error: 'invalid message role' };
    }
    if (typeof m.content !== 'string') {
      return { ok: false, error: 'message content must be a string' };
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `message too long (max ${MAX_MESSAGE_CHARS} chars)` };
    }
  }
  if (system != null) {
    if (typeof system !== 'string') {
      return { ok: false, error: 'system must be a string' };
    }
    if (system.length > MAX_SYSTEM_CHARS) {
      return { ok: false, error: `system prompt too long (max ${MAX_SYSTEM_CHARS} chars)` };
    }
  }
  if (max_tokens != null && (typeof max_tokens !== 'number' || max_tokens < 1)) {
    return { ok: false, error: 'max_tokens must be a positive number' };
  }
  return { ok: true };
}

function validateLeadBody(body) {
  const fields = ['name', 'email', 'phone', 'centre', 'message', 'source'];
  for (const f of fields) {
    const v = body[f];
    if (v == null) continue;
    if (typeof v !== 'string') return { ok: false, error: `${f} must be a string` };
    if (v.length > MAX_LEAD_FIELD_CHARS) {
      return { ok: false, error: `${f} too long (max ${MAX_LEAD_FIELD_CHARS} chars)` };
    }
  }
  return { ok: true };
}

// ── Handler ─────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Layer 1: reject anything not coming from an allowed browser origin.
  if (!isAllowedSource(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body || {};

  // Lead capture route — Aria widget POSTs { __lead: true, name, email, ... }
  // when it detects LEAD_CAPTURE:: pattern in its own reply.
  if (body.__lead === true) {
    const v = validateLeadBody(body);
    if (!v.ok) return res.status(400).json({ error: v.error });
    await sendLeadEmail({ ...body, source: body.source || 'aria-chat' });
    return res.status(200).json({ ok: true });
  }

  // Layer 2: validate + cap the chat payload before spending any OpenRouter credit.
  const v = validateChatBody(body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { system, messages } = body;
  const cappedMaxTokens = Math.min(body.max_tokens || 1024, MAX_TOKENS_CEILING);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Model is pinned server-side (ignores client `model` field — clients
    // historically sent Anthropic-direct IDs like "claude-haiku-4-5-20251001"
    // which are invalid on OpenRouter).
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://getkidshub.com',
        'X-Title': 'Aria - KidsHub Assistant',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: cappedMaxTokens,
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

// ── Resend lead email ───────────────────────────────────────────────────────

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
