# Billing — design + operations

> **Status (Sprint 7):** not live. This doc captures the *intent* and
> integration points so that enabling Stripe once we have the first
> paying customer is an afternoon of config, not a sprint of coding.

---

## The model

- One **Stripe customer** per KidsHub owner. Saved as
  `centers/{ownerId}.stripeCustomerId`.
- One **subscription** per owner (one plan — Pro or Premium).
- Plan state lives in Firestore on `centers/{ownerId}`:
  - `plan: 'starter' | 'pro' | 'premium'` (legacy `'trial'` is auto-migrated
    to `'starter'` on next login — see `migrateLegacyTrialToStarter()`)
  - `starterStartedAt: Timestamp | null` — when the 60-day free window began
  - `billingStatus: 'active' | 'past_due' | 'canceled'` (new, stamped
    by webhook)
  - `stripeCustomerId: string | null`
  - `stripeSubscriptionId: string | null`
- The client's `useEntitlements()` hook already reads `plan` and
  `starterStartedAt` (to compute `starterPromoExpired` for the `/paywall`
  redirect); we only need to add `billingStatus` awareness for the
  grace-period banner (F3) and have the webhook clear the paywall by
  setting `plan: 'pro' | 'premium'` on successful checkout.

## Flows

### Checkout (F1)

1. Dashboard `/plans` user clicks **Upgrade to Pro**.
2. Client calls `POST /api/stripe-checkout { plan: 'pro', ownerId }`
   with Firebase ID token.
3. Serverless:
   - Verifies the ID token.
   - Looks up or creates the Stripe customer (`centers/{ownerId}.stripeCustomerId`).
   - Creates a Checkout session with the right price ID.
   - Returns `{ url }`.
4. Client `window.location = url`.

### Webhook (F2)

Single endpoint `POST /api/stripe-webhook` handles:
- `checkout.session.completed` → stamp `plan` from the subscription's
  price (`pro` | `premium`), set `billingStatus: 'active'`. This
  automatically clears the `/paywall` redirect because
  `starterPromoExpired` only fires for `plan === 'starter'`.
- `customer.subscription.updated/deleted` → same logic. On delete, drop
  back to `starter` — if `starterStartedAt` is still in the 60-day
  window the owner keeps free access; otherwise they hit `/paywall`
  next navigation.
- `invoice.payment_failed` → `billingStatus: 'past_due'`, send email.
- `invoice.paid` → back to `active`.

### Grace period (F3)

If `billingStatus === 'past_due'`:
- Show a banner in the dashboard linking to Stripe customer portal.
- `useEntitlements()` keeps the paid tier for **7 days** past the
  invoice date. After that, `plan` is dropped to `starter` — which
  will immediately redirect to `/paywall` if the owner's original
  60-day Starter window is already closed (the common case for
  existing paying customers who lapse), using the same
  `starterPromoExpired` machinery that gates brand-new signups.
- Email the owner at day 1, day 3, day 7.

### Invoicing & receipts (F4)

Stripe ships receipts by email automatically. Add a **"Manage billing"**
button to `Settings > Billing` that creates a customer-portal session
(`stripe.billingPortal.sessions.create({ customer, return_url })`) and
redirects — no custom invoice UI needed.

---

## Env vars to add (when going live)

```
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_PRO_MONTHLY=price_…
STRIPE_PRICE_PREMIUM_MONTHLY=price_…
STRIPE_SUCCESS_URL=https://dashboard.getkidshub.com/settings?checkout=success
STRIPE_CANCEL_URL=https://dashboard.getkidshub.com/plans?checkout=cancelled
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

Webhook endpoint to register in Stripe dashboard:
`https://getkidshub.com/api/stripe-webhook`

---

## Test plan (before flipping it on)

1. Pull request with test-mode keys only.
2. Run through checkout → webhook → plan update in Firestore.
3. Fake an `invoice.payment_failed` via Stripe CLI; confirm the grace
   banner appears and email fires.
4. Fake a restore (`invoice.paid`); confirm banner disappears.
5. Cancel the subscription from Stripe dashboard; confirm 7-day grace
   then downgrade to `starter` — and that a `starter` owner past their
   60-day window immediately hits `/paywall` on next navigation.
6. Flip live keys on and do a $1 test with a real card.

---

## Scaffolded files

- `kidshub-landing/api/stripe-checkout.js` — F1 checkout session. Returns
  a friendly "billing not configured" response until env is set.
- `kidshub-landing/api/stripe-webhook.js` — F2 webhook receiver.
- `centersApi.updateBranding()` — D11, unrelated, lives next to billing
  fields on the same center doc.

Not yet built but trivial to add:
- Stripe customer portal redirect from the Settings page.
- `billingStatus` field awareness in `useEntitlements()`.
- Grace-period banner component.
