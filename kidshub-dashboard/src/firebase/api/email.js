/**
 * emailApi — thin client for KidsHub's transactional email endpoints hosted
 * on kidshub-landing (Vercel serverless, /api/send-invite-email etc.).
 *
 * Rationale for putting email in kidshub-landing:
 *   - Server secrets (RESEND_API_KEY) already live there for Aria lead emails.
 *   - Keeps the dashboard/kidshub bundles free of server-side concerns.
 *   - Origin-allowlisted endpoints accept requests from dashboard + kidshub.
 *
 * Endpoint base URL resolution:
 *   1. VITE_EMAIL_API_URL env var (set per-env in Vercel)
 *   2. https://www.getkidshub.com — prod default (canonical host)
 *
 * All methods are fire-and-forget from the caller's perspective: they
 * resolve on HTTP 2xx, throw on anything else. Callers are encouraged
 * to wrap in try/catch and log-but-continue so email delivery failure
 * never blocks core invite/register flows.
 *
 * Why the www default: getkidshub.com 307-redirects to www.getkidshub.com
 * (Vercel domain canonicalization). Browser fetch() can't follow those
 * redirects cross-origin on POST preflights, so hitting the apex host
 * surfaces as a confusing "Failed to fetch" in the console. Pointing at
 * the canonical host directly sidesteps the redirect entirely.
 */

const DEFAULT_BASE_URL = 'https://www.getkidshub.com';

function baseUrl() {
  return (import.meta.env.VITE_EMAIL_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

// App URL used as the prefix for /invite/[token] links inside emails. Lives
// here (not in the serverless function) so local dev with localhost:5180
// produces clickable local links instead of prod URLs.
function kidshubAppBaseUrl() {
  return (import.meta.env.VITE_KIDSHUB_APP_URL || 'https://app.getkidshub.com').replace(/\/$/, '');
}

async function post(path, body) {
  const url = `${baseUrl()}${path}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) {
    // Pull both the short error code ("Email delivery failed") AND the
    // underlying detail ("Resend error 403: domain not verified") so the
    // UI can show an actionable message without round-tripping through
    // Vercel function logs.
    let short = text;
    let detail = '';
    try {
      const parsed = JSON.parse(text);
      short = parsed.error || parsed.message || text;
      detail = parsed.detail || '';
    } catch (_) {
      // leave as raw text
    }
    const message = detail
      ? `${path} failed: ${resp.status} ${short} — ${detail}`
      : `${path} failed: ${resp.status} ${short}`;
    const err = new Error(message);
    err.status = resp.status;
    err.detail = detail;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

export const emailApi = {
  /**
   * Send the "Activate your account" email for a freshly-created invite.
   * Non-fatal wrapper: caller should typically call with try/catch and
   * only log on failure so UX doesn't break when Resend has a hiccup.
   */
  async sendInvite(token) {
    if (!token) throw new Error('emailApi.sendInvite: token is required');
    return post('/api/send-invite-email', {
      token,
      appBaseUrl: kidshubAppBaseUrl(),
    });
  },
};
