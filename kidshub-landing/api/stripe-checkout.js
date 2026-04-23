// Sprint 7 / F1 — Stripe Checkout session scaffold.
//
// This endpoint is NOT live yet. It's the shape we'll ship once we have
// a first paying customer. We're committing the skeleton so that:
//   1. The dashboard's /plans page can call `/api/stripe-checkout` and
//      get a graceful "not configured" response instead of a 404.
//   2. Wiring this up in an afternoon when we're ready is a matter of
//      filling in env vars + product IDs, not architecting from scratch.
//
// Required env vars (for the live version):
//   STRIPE_SECRET_KEY          → sk_live_… or sk_test_…
//   STRIPE_PRICE_PRO_MONTHLY   → price_…
//   STRIPE_PRICE_PREMIUM_MONTHLY → price_…
//   STRIPE_SUCCESS_URL         → https://dashboard.getkidshub.com/settings?checkout=success
//   STRIPE_CANCEL_URL          → https://dashboard.getkidshub.com/plans?checkout=cancelled

const DEFAULT_ERROR = {
  error: 'billing_not_configured',
  message:
    'Billing is not configured yet. Please email contact@nuvaro.ca to upgrade — we will manually provision your plan.',
};

function isPost(req) {
  return (req.method ?? '').toUpperCase() === 'POST';
}

/**
 * Rough input validation. Full implementation will:
 *   1. Verify the Firebase ID token in Authorization header.
 *   2. Look up the owner's center doc and reuse their `stripeCustomerId`
 *      if present, else create one.
 *   3. Build a Stripe Checkout session with the right Price object
 *      based on `plan`.
 */
function validate(body) {
  if (!body || typeof body !== 'object') return 'missing body';
  if (!['pro', 'premium'].includes(body.plan)) return 'invalid plan';
  if (!body.ownerId || typeof body.ownerId !== 'string') return 'missing ownerId';
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!isPost(req)) {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const bad = validate(body);
  if (bad) {
    res.status(400).json({ error: 'bad_request', message: bad });
    return;
  }

  // If Stripe isn't configured, return a friendly "contact sales" fallback.
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(200).json(DEFAULT_ERROR);
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // TODO F1-F4: real Stripe integration
  // ──────────────────────────────────────────────────────────────────
  // 1. Import stripe only when we actually have a key set.
  // 2. Look up / create the Stripe customer on the owner's center doc.
  // 3. Create the checkout session with the right price.
  // 4. Return { url } so the client can `window.location = url`.
  //
  // const Stripe = require('stripe');
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const price = body.plan === 'premium'
  //   ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY
  //   : process.env.STRIPE_PRICE_PRO_MONTHLY;
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   line_items: [{ price, quantity: 1 }],
  //   client_reference_id: body.ownerId,
  //   success_url: process.env.STRIPE_SUCCESS_URL,
  //   cancel_url: process.env.STRIPE_CANCEL_URL,
  //   allow_promotion_codes: true,
  // });
  // res.status(200).json({ url: session.url });

  res.status(200).json(DEFAULT_ERROR);
};
