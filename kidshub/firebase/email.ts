/**
 * KidsHub transactional email client (thin fetch wrapper).
 *
 * Same endpoints as the dashboard emailApi but different entry points:
 *   - sendWelcome:  POST /api/send-welcome-email — fired after a teacher or
 *                   parent finishes accepting their invite.
 *
 * All calls are best-effort; the caller should never block the happy path
 * on a welcome email failing to deliver.
 *
 * Base URL resolution:
 *   1. EXPO_PUBLIC_EMAIL_API_URL (set per-env)
 *   2. https://getkidshub.com (prod fallback)
 */

const DEFAULT_BASE_URL = 'https://getkidshub.com';

function baseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL;
  return (envUrl && envUrl.length > 0 ? envUrl : DEFAULT_BASE_URL).replace(/\/$/, '');
}

function appBaseUrl(): string | undefined {
  // Lets local-dev welcome emails deep-link back to localhost:5180 so clicking
  // "Open KidsHub" from Gmail doesn't land on the prod build during testing.
  // In production builds this is undefined and the serverless function falls
  // back to its own KIDSHUB_APP_URL env var.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return undefined;
}

type SendWelcomeInput = {
  email: string;
  firstName?: string;
  role: 'teacher' | 'parent';
  daycareName?: string;
};

export const emailApi = {
  async sendWelcome(input: SendWelcomeInput): Promise<void> {
    const url = `${baseUrl()}/api/send-welcome-email`;
    const body = { ...input, appBaseUrl: appBaseUrl() };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`send-welcome-email ${resp.status}: ${text}`);
    }
  },
};
