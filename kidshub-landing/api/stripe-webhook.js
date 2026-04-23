// Sprint 7 / F2 — Stripe webhook scaffold.
//
// Receives Stripe subscription events and (eventually) updates the
// matching center doc's plan + trial fields. Not live yet — committed
// so that once we enable Stripe, we only need to:
//   1. Add webhook signing secret to env.
//   2. Set up the webhook endpoint in the Stripe dashboard.
//   3. Delete the "not configured" early-return below.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET  → whsec_…
//   FIREBASE_SERVICE_ACCOUNT (JSON string) → for updating center docs
//
// Events we care about:
//   checkout.session.completed         → stamp plan = 'pro' | 'premium'
//   customer.subscription.updated      → same
//   customer.subscription.deleted      → set plan = 'starter' + grace period
//   invoice.payment_failed             → notify owner email (F3 grace)
//   invoice.paid                       → clear any "past due" flag

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  // Short-circuit if Stripe isn't configured yet.
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(200).json({ ok: true, note: 'stripe webhook not configured' });
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // TODO F2: real webhook handling
  // ──────────────────────────────────────────────────────────────────
  // const Stripe = require('stripe');
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const sig = req.headers['stripe-signature'];
  // let event;
  // try {
  //   event = stripe.webhooks.constructEvent(
  //     req.rawBody ?? req.body, // Vercel may or may not parse JSON
  //     sig,
  //     process.env.STRIPE_WEBHOOK_SECRET,
  //   );
  // } catch (err) {
  //   return res.status(400).json({ error: 'invalid_signature' });
  // }
  //
  // switch (event.type) {
  //   case 'checkout.session.completed':
  //     await syncPlanFromCheckout(event.data.object);
  //     break;
  //   case 'customer.subscription.updated':
  //   case 'customer.subscription.deleted':
  //     await syncPlanFromSubscription(event.data.object);
  //     break;
  //   case 'invoice.payment_failed':
  //     await markPastDue(event.data.object);
  //     break;
  //   case 'invoice.paid':
  //     await clearPastDue(event.data.object);
  //     break;
  // }

  res.status(200).json({ ok: true });
};

// Vercel serverless config — DO NOT parse the body, Stripe needs the raw
// bytes to verify the webhook signature.
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
