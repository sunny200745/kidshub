// POST /api/contact-sales
//
// Collects a "talk to sales" inquiry from either:
//   - the landing pricing page (/pricing tier card → contact modal)
//   - the dashboard /plans page (ContactSalesCard in Plans.jsx)
//
// Does two things atomically-ish:
//   1. Writes a `leads/{id}` Firestore document (see firestore.rules — the
//      leads collection is `allow create: if true` with field validation,
//      and `read/update/delete` are denied to clients so only our service
//      account can view the pipeline).
//   2. Emails our internal sales inbox via Resend so we don't miss a lead
//      while we're still manually closing customers.
//
// Deliberately NOT calling Firebase Admin SDK — the Firestore REST write
// keeps this function zero-dependency and fast-cold-starting. If either
// step fails independently we 502 the client but log the partial state;
// lead duplication is preferable to losing one.
//
// Request body:
//   { name, email, source, tier?, message?, feature?, centerName?, ownerUid? }
//
// Response: { ok: true, id: '<leadDocId>' }

const {
  applyCors,
  isAllowedSource,
  createFirestoreDoc,
  sendEmail,
} = require('./_shared');
const { salesNotificationEmail } = require('./_templates');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Caps mirror firestore.rules /leads field constraints so truncation here
// never produces a payload the rules will reject.
const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_STR = 200;
const MAX_MSG = 2000;
const VALID_TIERS = new Set(['starter', 'pro', 'premium']);

const SALES_INBOX =
  process.env.SALES_NOTIFICATION_TO || 'support@nuvaro.ca';

function str(val, max = MAX_STR) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, max);
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedSource(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body || {};
  const name = str(body.name, MAX_NAME);
  const email = str(body.email, MAX_EMAIL).toLowerCase();
  const source = str(body.source) || 'unknown';
  const tierRaw = str(body.tier).toLowerCase();
  const tier = VALID_TIERS.has(tierRaw) ? tierRaw : '';
  const message = str(body.message, MAX_MSG);
  const feature = str(body.feature);
  const centerName = str(body.centerName);
  const ownerUid = str(body.ownerUid, 128);

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'valid email is required' });
  }

  // Build the lead doc. Schema is pinned so `firestore.rules` field
  // validation (all required fields present, types correct) will accept
  // the create.
  const leadFields = {
    name,
    email,
    source,
    createdAt: new Date(),
  };
  if (tier) leadFields.tier = tier;
  if (message) leadFields.message = message;
  if (feature) leadFields.feature = feature;
  if (centerName) leadFields.centerName = centerName;
  if (ownerUid) leadFields.ownerUid = ownerUid;

  let leadId = null;
  try {
    const result = await createFirestoreDoc('leads', leadFields);
    leadId = result.id;
  } catch (err) {
    console.error('[contact-sales] Firestore write failed:', err);
    return res.status(502).json({
      error: 'Could not save your request. Please try again.',
      detail: err && err.message ? String(err.message) : 'unknown',
    });
  }

  // Email the internal inbox. Failure here shouldn't break the client
  // contract (we already saved the lead) — but we still log + surface
  // so we know we need to chase the Firestore pipeline.
  try {
    const { subject, html, text } = salesNotificationEmail({
      name,
      email,
      tier,
      message,
      source,
      feature,
      centerName,
      ownerUid,
    });
    await sendEmail({
      to: SALES_INBOX,
      subject,
      html,
      text,
      replyTo: email, // one-click reply to the lead
    });
  } catch (err) {
    console.error(
      '[contact-sales] Email notify failed (lead saved as',
      leadId,
      '):',
      err
    );
    // Don't 502 — the lead is in Firestore and we'll pick it up from there.
  }

  return res.status(200).json({ ok: true, id: leadId });
};
