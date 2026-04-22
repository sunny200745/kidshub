// Email HTML templates for KidsHub transactional email.
//
// Plain HTML strings (not React Email) — keeps kidshub-landing a pure static
// site with zero build step. Style tokens are inlined because Gmail / Outlook
// strip <style> blocks.
//
// Palette is deliberately close to the KidsHub brand (pink accent on cream
// background) so the email feels like an extension of the product.
//
// Every template returns { subject, html, text }.

const { esc } = require('./_shared');

const BRAND_PINK = '#FF2D9B';
const BRAND_PINK_DARK = '#E11D85';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';
const BG_CREAM = '#FFF8F5';
const BORDER_LIGHT = '#F3E8EE';
const LOGO_URL = 'https://getkidshub.com/assets/logo.png';

// ── Layout primitives ───────────────────────────────────────────────────────

function layout({ previewText, contentHtml }) {
  // The <div style="display:none"> at the top is the preheader — the grey
  // preview text shown in inbox lists (next to the subject line).
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>KidsHub</title>
</head>
<body style="margin:0;padding:0;background:${BG_CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${TEXT_DARK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(previewText || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG_CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid ${BORDER_LIGHT};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid ${BORDER_LIGHT};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="https://getkidshub.com" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
                      <span style="display:inline-block;width:34px;height:34px;border-radius:10px;background:${BRAND_PINK};color:#FFFFFF;text-align:center;line-height:34px;font-weight:700;font-size:18px;font-family:-apple-system,sans-serif;">K</span>
                      <span style="font-size:20px;font-weight:700;color:${TEXT_DARK};letter-spacing:-0.01em;">KidsHub</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:${BG_CREAM};border-top:1px solid ${BORDER_LIGHT};font-size:12px;color:${TEXT_MUTED};text-align:center;line-height:1.6;">
              <div>KidsHub · Modern daycare management</div>
              <div style="margin-top:4px;">
                <a href="https://getkidshub.com" style="color:${TEXT_MUTED};text-decoration:underline;">getkidshub.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@nuvaro.ca" style="color:${TEXT_MUTED};text-decoration:underline;">support@nuvaro.ca</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton({ href, label }) {
  // Using table+td for the button so Outlook renders it correctly. Padding
  // and rounded corners are inlined.
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="border-radius:12px;background:${BRAND_PINK};">
        <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;background:${BRAND_PINK};border:1px solid ${BRAND_PINK_DARK};">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

// Suppress unused-var warning for LOGO_URL — reserved for when we host the
// logo somewhere reliable. Until then we fall back to the "K" tile.
void LOGO_URL;

// ── Templates ───────────────────────────────────────────────────────────────

/**
 * Teacher / parent activation email.
 *
 * Variants:
 *   - role='teacher' → "... invited you to join [Daycare] as a teacher ..."
 *   - role='parent'  → "... invited you to follow [Child]'s days at [Daycare] ..."
 */
function inviteEmail({
  role,                // 'teacher' | 'parent'
  inviteUrl,           // full https URL to the kidshub /invite/[token] page
  inviterName,         // e.g. "Alex Chen" — falls back to "Your daycare"
  daycareName,         // currently derived from inviter / center; optional
  classroomName,       // teacher only
  childName,           // parent only
  recipientEmail,      // for "sent to <email>" personalization
}) {
  const safeInviter = esc(inviterName || 'Your daycare');
  const safeDaycare = daycareName ? esc(daycareName) : '';
  const greeting = role === 'teacher'
    ? `${safeInviter} invited you to join${safeDaycare ? ` <strong>${safeDaycare}</strong>` : ''} on KidsHub as a teacher${classroomName ? ` in <strong>${esc(classroomName)}</strong>` : ''}.`
    : `${safeInviter} invited you to follow ${childName ? `<strong>${esc(childName)}</strong>'s` : "your child's"} days${safeDaycare ? ` at <strong>${safeDaycare}</strong>` : ''} on KidsHub.`;

  const ctaLabel = role === 'teacher' ? 'Activate my teacher account' : 'Activate my parent account';
  const previewText = role === 'teacher'
    ? `${inviterName || 'Your daycare'} invited you to KidsHub — activate your teacher account`
    : `${inviterName || 'Your daycare'} invited you to KidsHub — activate your parent account`;

  const content = `
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:${TEXT_DARK};letter-spacing:-0.01em;">
      You're invited to KidsHub
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      ${greeting}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      Click the button below to set your password and activate your account.
      You'll be signed in right after.
    </p>
    ${ctaButton({ href: inviteUrl, label: ctaLabel })}
    <div style="margin:20px 0 0 0;padding:14px 16px;background:${BG_CREAM};border-radius:12px;border:1px solid ${BORDER_LIGHT};font-size:13px;color:${TEXT_MUTED};line-height:1.5;">
      <div style="font-weight:600;color:${TEXT_DARK};margin-bottom:6px;">Or copy this link:</div>
      <a href="${esc(inviteUrl)}" style="word-break:break-all;color:${BRAND_PINK_DARK};text-decoration:none;">${esc(inviteUrl)}</a>
    </div>
    <p style="margin:20px 0 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      This link expires in <strong>7 days</strong>. It was sent${recipientEmail ? ` to <strong>${esc(recipientEmail)}</strong>` : ''} because your daycare added you on KidsHub.
      Didn't expect this email? You can safely ignore it.
    </p>
  `;

  const subject = role === 'teacher'
    ? `You're invited to KidsHub${daycareName ? ` · ${daycareName}` : ''}`
    : `You're invited to KidsHub${childName ? ` · Follow ${childName}` : ''}`;

  const text = [
    `You're invited to KidsHub.`,
    '',
    `${inviterName || 'Your daycare'} invited you to join${daycareName ? ` ${daycareName}` : ''} as a ${role}.`,
    '',
    `Activate your account: ${inviteUrl}`,
    '',
    `This link expires in 7 days. If you didn't expect this email, you can ignore it.`,
    '',
    `— KidsHub (getkidshub.com)`,
  ].join('\n');

  return {
    subject,
    html: layout({ previewText, contentHtml: content }),
    text,
  };
}

/**
 * Welcome email — sent right after a teacher/parent accepts their invite.
 * Short, celebratory, includes a link back into the app.
 */
function welcomeEmail({
  role,              // 'teacher' | 'parent'
  firstName,
  daycareName,
  appUrl,            // deep link to the role's home screen
}) {
  const safeFirst = esc(firstName || 'there');
  const safeDaycare = daycareName ? esc(daycareName) : '';
  const headline = role === 'teacher'
    ? `Welcome to KidsHub, ${safeFirst}!`
    : `Welcome to KidsHub, ${safeFirst}!`;
  const body = role === 'teacher'
    ? `Your teacher account is ready${safeDaycare ? ` at <strong>${safeDaycare}</strong>` : ''}. You can check kids in, log activities, and message families right from the app.`
    : `You're all set${safeDaycare ? ` to follow updates from <strong>${safeDaycare}</strong>` : ''}. You'll see your child's schedule, daily activities, and messages from their teachers.`;

  const content = `
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:${TEXT_DARK};letter-spacing:-0.01em;">
      ${headline}
    </h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${TEXT_DARK};">
      ${body}
    </p>
    ${ctaButton({ href: appUrl, label: 'Open KidsHub' })}
    <p style="margin:8px 0 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      Questions? Reply to this email and we'll help you out.
    </p>
  `;

  const subject = role === 'teacher'
    ? `Welcome to KidsHub — your teacher account is live`
    : `Welcome to KidsHub — your parent account is live`;

  const text = [
    `${headline.replace(/<[^>]+>/g, '')}`,
    '',
    body.replace(/<[^>]+>/g, ''),
    '',
    `Open KidsHub: ${appUrl}`,
    '',
    `— KidsHub (getkidshub.com)`,
  ].join('\n');

  return {
    subject,
    html: layout({ previewText: `Welcome to KidsHub, ${firstName || 'there'}!`, contentHtml: content }),
    text,
  };
}

module.exports = {
  inviteEmail,
  welcomeEmail,
};
