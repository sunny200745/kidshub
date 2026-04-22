// Shared helpers for kidshub-landing serverless functions.
//
// Public API:
//   - matchesAllowlist(url) / isAllowedSource(req) / applyCors(req, res)
//   - fetchInviteDoc(token) — Firestore REST read of invites/{token}
//   - sendEmail({ to, subject, html, text, replyTo })
//   - esc(str) — minimal HTML escape
//
// Why not a package? Node.js serverless functions on Vercel don't need a
// bundler for single-file helpers, and not shipping this through the
// dashboard/kidshub bundles keeps their payload small.

// ── Allowlist + CORS ────────────────────────────────────────────────────────
//
// Centralized so adding a new allowed host (e.g. dashboard.getkidshub.com)
// is a one-line change that benefits every /api route.

const ALLOWED_ORIGINS = [
  'https://getkidshub.com',
  'https://www.getkidshub.com',
  'https://app.getkidshub.com',
  'https://dashboard.getkidshub.com',
];

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

function isAllowedSource(req) {
  return matchesAllowlist(req.headers.origin) || matchesAllowlist(req.headers.referer);
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = matchesAllowlist(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Firestore REST ──────────────────────────────────────────────────────────
//
// The kidshub invites collection is `allow read: if true;` in firestore.rules,
// so we can fetch via the public REST endpoint with no auth. This avoids
// shipping the Firebase Admin SDK (and its service-account secret) in the
// serverless bundle.
//
// Serverless envs must have FIREBASE_PROJECT_ID set. The dashboard + kidshub
// both store it in VITE_FIREBASE_PROJECT_ID / EXPO_PUBLIC_FIREBASE_PROJECT_ID
// — landing uses the same value under a neutral name.

async function fetchInviteDoc(token) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID env var is not configured');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('token is required');
  }

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/invites/${encodeURIComponent(token)}`;
  const resp = await fetch(url);
  if (resp.status === 404) return null;
  if (!resp.ok) {
    throw new Error(`Firestore REST error ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  return parseFirestoreDoc(data);
}

// Firestore REST returns { name, fields: { key: { stringValue / integerValue / ... } } }.
// Flatten to a plain object so downstream code doesn't care about the wire format.
function parseFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const out = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    out[key] = parseFirestoreValue(val);
  }
  return out;
}

function parseFirestoreValue(val) {
  if (val == null) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const out = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = parseFirestoreValue(v);
    }
    return out;
  }
  return null;
}

// ── Resend email send ───────────────────────────────────────────────────────

const DEFAULT_FROM = 'KidsHub <support@nuvaro.ca>';
const DEFAULT_REPLY_TO = 'support@nuvaro.ca';

async function sendEmail({ to, subject, html, text, replyTo }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const payload = {
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    reply_to: replyTo || process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
  };
  if (text) payload.text = text;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

// ── Minimal HTML escape ─────────────────────────────────────────────────────

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  ALLOWED_ORIGINS,
  matchesAllowlist,
  isAllowedSource,
  applyCors,
  fetchInviteDoc,
  sendEmail,
  esc,
};
