/**
 * centersApi — owner-side operations on the `centers/{ownerId}` tenant doc.
 *
 * The center doc holds daycare-level metadata + the billing/tier fields
 * that drive the entitlements system:
 *
 *   plan               : 'starter' | 'pro' | 'premium'  (legacy: 'trial')
 *   starterStartedAt   : Timestamp   — stamped when a center first lands
 *                        on Starter. Drives the 60-day free-use countdown
 *                        and the /paywall redirect once the window closes.
 *   demoMode           : boolean     — admin-only bypass of feature gates
 *
 * New signups start on Starter with `starterStartedAt` set to now. The
 * old 14-day Premium trial is gone (see Register.jsx history).
 *
 * Legacy centers created before Sprint 1 lack these fields; consumers use
 * `ensurePlanStamped()` below to lazy-migrate on first read. Legacy trial
 * owners are migrated to Starter by `migrateLegacyTrialToStarter` on
 * their next login so nobody is stuck on a plan key we no longer support.
 *
 * Firestore rule (firestore.rules):
 *   - read  : self-owner, or any teacher/parent within the same daycare
 *   - write : self-owner only
 */
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { DEFAULT_NEW_OWNER_TIER, TIERS_ARRAY } from '../../config/product';
import { auth, db } from '../config';

function currentOwnerId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('centersApi: no authenticated user');
  }
  return uid;
}

/**
 * Default plan-related fields for a brand-new center. Used by Register.jsx
 * on owner signup and by `ensurePlanStamped()` below for legacy centers
 * missing a `plan` value.
 *
 * Starter is the default: new owners get STARTER_FREE_DAYS days of free
 * access (no card, no trial) before the /paywall gate activates. The
 * `starterStartedAt` server timestamp is what useEntitlements reads to
 * compute days-left and expired-ness.
 */
export function defaultPlanFields() {
  return {
    plan: DEFAULT_NEW_OWNER_TIER,
    starterStartedAt: serverTimestamp(),
    demoMode: false,
  };
}

/** Live subscribe to the current owner's center doc. */
export function subscribeToSelfCenter(onNext, onError) {
  const ownerId = currentOwnerId();
  const ref = doc(db, 'centers', ownerId);
  return onSnapshot(
    ref,
    (snap) => {
      onNext(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (err) => {
      console.error('[centersApi] self center snapshot failed:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Ensure the CURRENT OWNER's center doc carries the plan/starterStartedAt/demoMode
 * fields. Safe to call repeatedly — a no-op once the fields exist.
 *
 * Idempotent lazy-migration: only writes the missing fields, never overwrites
 * an existing plan value. Returns the now-populated center data (after the
 * possible write), so callers can use it directly without a follow-up read.
 *
 * This is called by useEntitlements() whenever it reads a center doc that's
 * missing `plan`. In practice it runs ONCE per pre-Sprint-1 owner on their
 * next login, then never again.
 */
export async function ensurePlanStamped(existing) {
  const ownerId = currentOwnerId();
  if (existing && TIERS_ARRAY.includes(existing.plan)) {
    return existing; // already stamped
  }

  const patch = defaultPlanFields();
  try {
    await updateDoc(doc(db, 'centers', ownerId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    // If the center doc somehow doesn't exist yet (extremely rare —
    // Register.jsx creates it in the same flow as the users doc), seed
    // a minimal one so the rest of the app isn't stuck.
    if (err?.code === 'not-found') {
      await setDoc(doc(db, 'centers', ownerId), {
        ownerId,
        name: '',
        ...patch,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      throw err;
    }
  }
  return { ...(existing ?? { id: ownerId, ownerId }), ...patch };
}

/**
 * Migrate any legacy `plan: 'trial'` center to Starter with a fresh
 * 60-day free-use window. Called by useEntitlements() the first time
 * it sees a trial doc after the model flip (commit history shows we
 * used to ship a 14-day Premium trial — that's gone; new owners land
 * on Starter directly).
 *
 * Semantics:
 *   - Unconditional flip: we don't look at `trialEndsAt`. Whether the
 *     legacy trial was "still active" or already expired, the owner
 *     gets the same Starter treatment going forward. Trying to preserve
 *     remaining trial days would mean keeping a whole code path alive
 *     for a tiny population — not worth it.
 *   - Fresh `starterStartedAt`: stamped "now", not retroactively. A
 *     legacy-trial owner logging in today deserves a full 60 days,
 *     not 60-minus-however-long-they-were-on-trial.
 *   - Fire-and-forget: the caller's onSnapshot listener will re-fire
 *     with the updated plan. Returning a truthy value tells the caller
 *     to bail out of its current snapshot handler so the next update
 *     drives the UI.
 *
 * Returns 'starter' on successful write, null otherwise.
 */
export async function migrateLegacyTrialToStarter(existing) {
  if (!existing || existing.plan !== 'trial') return null;
  const ownerId = currentOwnerId();
  try {
    await updateDoc(doc(db, 'centers', ownerId), {
      plan: 'starter',
      starterStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return 'starter';
  } catch (err) {
    console.warn('[centersApi] migrateLegacyTrialToStarter failed:', err);
    return null;
  }
}

/**
 * Toggle demoMode on the current owner's center doc. Used by the admin-only
 * toggle on Settings (A8). The client-side UI guard (ADMIN_UIDS) is a UX
 * refinement; the security boundary is the Firestore rule that restricts
 * `centers/{ownerId}` writes to the owner themselves.
 */
export async function setDemoMode(enabled) {
  const ownerId = currentOwnerId();
  await updateDoc(doc(db, 'centers', ownerId), {
    demoMode: !!enabled,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin-only plan override — writes `centers/{ownerId}.plan` to the given
 * tier so every FeatureGate in the app re-evaluates immediately. Used by
 * the "Plan override" section on Settings for QA / sales testing, where
 * one-click tier changes are much faster than editing Firestore by hand.
 *
 * Admin QA also uses this to test the /paywall flow — click Starter,
 * then reset `starterStartedAt` to something 61+ days ago via Firestore
 * console to trigger the redirect. We intentionally DON'T let setPlan
 * overwrite an existing `starterStartedAt` when an admin re-clicks
 * Starter, because doing so would let real owners game the grace
 * indefinitely via plan toggles once this is customer-facing.
 *
 * Security: this uses the same `centers/{ownerId}` self-owner write rule
 * as every other field on the center doc. Once billing (Stripe) lands in
 * Track F, plan writes should move server-side (Cloud Function + webhook)
 * and the client path should become read-only.
 */
export async function setPlan(plan) {
  if (!TIERS_ARRAY.includes(plan)) {
    throw new Error(`centersApi.setPlan: invalid plan "${plan}"`);
  }
  const ownerId = currentOwnerId();
  const ref = doc(db, 'centers', ownerId);
  const patch = {
    plan,
    updatedAt: serverTimestamp(),
  };
  if (plan === 'starter') {
    const existing = await getDoc(ref);
    const hasStamp = toMillisSafe(existing.data()?.starterStartedAt) > 0;
    if (!hasStamp) {
      patch.starterStartedAt = serverTimestamp();
    }
  }
  await updateDoc(ref, patch);
}

// Local normalizer — keeps the public helpers in config/product.ts as the
// single source of truth but avoids a cross-package import cycle here.
function toMillisSafe(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

/**
 * Lazy-stamp helper for legacy Starter centers that predate Stop 7 and
 * therefore have no `starterStartedAt`. useEntitlements() calls this the
 * first time it sees such a doc, starting a fresh 2-month grace window
 * from "now" rather than retroactively penalizing early customers.
 *
 * Idempotent — safe to call on every read; only writes when the field
 * is missing. Returns true if a write happened, false otherwise.
 */
export async function ensureStarterStarted(existing) {
  if (!existing || existing.plan !== 'starter') return false;
  if (toMillisSafe(existing.starterStartedAt) > 0) return false;
  const ownerId = currentOwnerId();
  try {
    await updateDoc(doc(db, 'centers', ownerId), {
      starterStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('[centersApi] ensureStarterStarted failed:', err);
    return false;
  }
}

/**
 * One-shot read of the current owner's center doc. Used in flows that don't
 * need a live subscription (admin tools, billing callbacks).
 */
export async function getSelfCenter() {
  const ownerId = currentOwnerId();
  const snap = await getDoc(doc(db, 'centers', ownerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update the owner's custom branding (D11 — Sprint 6).
 *
 * Branding = logoUrl (optional) + accentColor (hex, required).
 * Gated in the UI behind the `customBranding` feature flag. Firestore rules
 * enforce owner-only writes to the center doc.
 *
 * Note: we intentionally keep this shallow (no nested `branding.logoUrl`
 * path) so existing listeners that read `center.logoUrl` / `center.accentColor`
 * pick it up without any extra unwrapping.
 */
export async function updateBranding({ logoUrl, accentColor }) {
  const ownerId = currentOwnerId();
  const patch = { updatedAt: serverTimestamp() };
  if (logoUrl !== undefined) patch.logoUrl = logoUrl || null;
  if (accentColor !== undefined) patch.accentColor = accentColor || null;
  await updateDoc(doc(db, 'centers', ownerId), patch);
}

/**
 * Mark the /welcome onboarding wizard as dismissed. Writes a timestamp to
 * `centers/{ownerId}.onboarding.dismissedAt` so we can (a) skip auto-
 * redirecting returning owners to /welcome and (b) eventually report on
 * activation funnel metrics.
 *
 * Idempotent — callers are free to invoke on every "Back to dashboard"
 * click; we just re-stamp. We intentionally use a nested map under
 * `onboarding` (rather than flat top-level fields) to leave room for
 * future signals (seenAt, skippedSteps[], completedAt) without polluting
 * the root of the center doc.
 */
export async function markOnboardingDismissed() {
  const ownerId = currentOwnerId();
  await updateDoc(doc(db, 'centers', ownerId), {
    'onboarding.dismissedAt': serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const centersApi = {
  subscribeToSelfCenter,
  ensurePlanStamped,
  ensureStarterStarted,
  migrateLegacyTrialToStarter,
  setDemoMode,
  setPlan,
  getSelfCenter,
  updateBranding,
  markOnboardingDismissed,
  defaultPlanFields,
};
