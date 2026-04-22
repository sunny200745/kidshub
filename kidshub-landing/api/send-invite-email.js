// POST /api/send-invite-email
//
// Sends an activation email for a freshly-created invite.
//
// Request body:
//   { token: string, appBaseUrl?: string }
//
// Flow:
//   1. Origin check (same allowlist as /api/chat).
//   2. Look up invites/{token} via Firestore REST (public read, no auth).
//      This is the security anchor: the caller can't inject a recipient
//      email or invite content; everything comes from Firestore.
//   3. Render the invite email template based on invite.role.
//   4. Send via Resend.
//
// Rate limit: Vercel serverless has per-function concurrency limits; we
// rely on the invite-doc-must-exist check to prevent "spam arbitrary
// emails" abuse. Creating an invite doc requires owner auth + writing
// through Firestore rules, which is already gated.
//
// Env vars required:
//   RESEND_API_KEY         — Resend API key (already set for Aria leads)
//   FIREBASE_PROJECT_ID    — Firebase project ID (e.g. kidhub-7a207)
//   EMAIL_FROM             — override default "KidsHub <support@nuvaro.ca>"
//   EMAIL_REPLY_TO         — override default "support@nuvaro.ca"
//   KIDSHUB_APP_URL        — fallback app URL if request omits appBaseUrl
//                            (e.g. https://app.getkidshub.com)

const { applyCors, isAllowedSource, fetchInviteDoc, sendEmail } = require('./_shared');
const { inviteEmail } = require('./_templates');

const DEFAULT_APP_URL = 'https://kidshub-app.vercel.app';
const MAX_APP_URL_CHARS = 200;
const MAX_TOKEN_CHARS = 200;

function pickAppBaseUrl(bodyAppBaseUrl) {
  // Prefer the caller's app URL (so local dev can send emails pointing at
  // localhost:5180). Fall back to env, then the prod vercel URL.
  if (typeof bodyAppBaseUrl === 'string'
    && bodyAppBaseUrl.length > 0
    && bodyAppBaseUrl.length <= MAX_APP_URL_CHARS) {
    try {
      const parsed = new URL(bodyAppBaseUrl);
      // Only accept http (localhost) or https (prod/preview).
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.origin;
      }
    } catch (_) {
      // Fall through to env fallback.
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
  const { token } = body;

  if (!token || typeof token !== 'string' || token.length > MAX_TOKEN_CHARS) {
    return res.status(400).json({ error: 'token is required' });
  }

  let invite;
  try {
    invite = await fetchInviteDoc(token);
  } catch (err) {
    console.error('[send-invite-email] fetchInviteDoc failed:', err);
    return res.status(500).json({ error: 'Could not verify invite' });
  }

  if (!invite) {
    // 404 rather than 400 so the dashboard can distinguish "bad request"
    // from "token genuinely doesn't exist yet" (possible if called before
    // Firestore replication finishes — very rare but handle gracefully).
    return res.status(404).json({ error: 'Invite not found' });
  }

  if (!invite.email || typeof invite.email !== 'string') {
    return res.status(422).json({ error: 'Invite is missing a recipient email' });
  }

  const role = invite.role === 'parent' ? 'parent' : 'teacher';
  const appBaseUrl = pickAppBaseUrl(body.appBaseUrl);
  const inviteUrl = `${appBaseUrl}/invite/${encodeURIComponent(token)}`;

  const { subject, html, text } = inviteEmail({
    role,
    inviteUrl,
    inviterName: invite.invitedByName || '',
    daycareName: invite.daycareName || '',
    classroomName: invite.classroomName || '',
    childName: invite.childName || '',
    recipientEmail: invite.email,
  });

  try {
    await sendEmail({
      to: invite.email,
      subject,
      html,
      text,
    });
    return res.status(200).json({ ok: true, to: invite.email });
  } catch (err) {
    // Surface the underlying Resend/config message in the response so the
    // dashboard modal can show something actionable ("domain not verified",
    // "API key missing", etc.) instead of a generic 502. Safe because the
    // endpoint is origin-locked and the error text comes from our own
    // sendEmail helper (no raw user input echoed back).
    const detail = err && err.message ? String(err.message) : 'unknown error';
    console.error('[send-invite-email] Resend failed:', err);
    return res.status(502).json({ error: 'Email delivery failed', detail });
  }
};
