// POST /api/send-welcome-email
//
// Sends a "Welcome to KidsHub" email after a teacher/parent successfully
// accepts an invite.
//
// Request body (after Option B invite-accept):
//   { email: string, firstName?: string, role: 'teacher'|'parent',
//     daycareName?: string, appBaseUrl?: string }
//
// Why minimal server-side verification:
//   The welcome email is benign ("your account is set up") with no
//   sensitive data. Worst-case abuse is someone spamming welcome emails
//   to arbitrary addresses. Origin check + rate limit (Vercel's natural
//   concurrency cap) makes this economically unattractive. If we ever
//   want stronger guarantees we can pipe a Firebase ID token through
//   and verify via the google-auth-library JWKS — deferred.

const { applyCors, isAllowedSource, sendEmail } = require('./_shared');
const { welcomeEmail } = require('./_templates');

const DEFAULT_APP_URL = 'https://kidshub-app.vercel.app';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STR = 200;

function pickAppBaseUrl(bodyAppBaseUrl) {
  if (typeof bodyAppBaseUrl === 'string'
    && bodyAppBaseUrl.length > 0
    && bodyAppBaseUrl.length <= MAX_STR) {
    try {
      const parsed = new URL(bodyAppBaseUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.origin;
      }
    } catch (_) {
      // fall through
    }
  }
  return (process.env.KIDSHUB_APP_URL || DEFAULT_APP_URL).replace(/\/$/, '');
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!isAllowedSource(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = body.role === 'parent' ? 'parent' : body.role === 'teacher' ? 'teacher' : null;
  const firstName = typeof body.firstName === 'string' ? body.firstName.slice(0, MAX_STR) : '';
  const daycareName = typeof body.daycareName === 'string' ? body.daycareName.slice(0, MAX_STR) : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  if (!role) {
    return res.status(400).json({ error: 'role must be teacher or parent' });
  }

  const appBaseUrl = pickAppBaseUrl(body.appBaseUrl);
  // Deep-link to the role's home tab so clicking "Open KidsHub" lands the
  // user exactly where they'll use the app.
  const appUrl = role === 'teacher'
    ? `${appBaseUrl}/classroom`
    : `${appBaseUrl}/home`;

  const { subject, html, text } = welcomeEmail({
    role,
    firstName,
    daycareName,
    appUrl,
  });

  try {
    await sendEmail({ to: email, subject, html, text });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Forward the underlying error detail (same rationale as
    // send-invite-email.js — origin-locked endpoint, helper-generated text).
    const detail = err && err.message ? String(err.message) : 'unknown error';
    console.error('[send-welcome-email] Resend failed:', err);
    return res.status(502).json({ error: 'Email delivery failed', detail });
  }
};
