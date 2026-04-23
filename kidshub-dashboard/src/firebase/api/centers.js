/**
 * centersApi — owner-side operations on the `centers/{ownerId}` tenant doc.
 *
 * The center doc holds daycare-level metadata + the billing/tier fields
 * that drive the entitlements system (Sprint 1 of PRODUCT_PLAN):
 *
 *   plan          : 'trial' | 'starter' | 'pro' | 'premium'
 *   trialEndsAt   : Timestamp | null   (only meaningful when plan === 'trial')
 *   demoMode      : boolean            (admin-only bypass of feature gates)
 *
 * Legacy centers created before Sprint 1 lack these fields; consumers use
 * `ensurePlanStamped()` below to lazy-migrate on first read. This means we
 * don't need a separate one-off backfill script — the first time an owner
 * (or eventually, an automated Cloud Function) touches their center doc,
 * it gets the defaults.
 *
 * Firestore rule (firestore.rules):
 *   - read  : self-owner, or any teacher/parent within the same daycare
 *   - write : self-owner only
 */
import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import {
  DEFAULT_NEW_OWNER_TIER,
  TIERS_ARRAY,
  TRIAL_DURATION_DAYS,
} from '../../config/product';
import { auth, db } from '../config';

function currentOwnerId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('centersApi: no authenticated user');
  }
  return uid;
}

/**
 * JS Date → Firestore Timestamp N days from now. Exported so callers
 * (Register.jsx, admin tools) can stamp a consistent trialEndsAt.
 */
export function trialEndsFromNow(days = TRIAL_DURATION_DAYS) {
  return Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Default plan-related fields for a brand-new center. Used by Register.jsx
 * on owner signup and by `ensurePlanStamped()` below for legacy centers.
 *
 * Trial is the default (per product strategy — every new owner gets 14 days
 * of full Premium access before auto-downgrade to Starter).
 */
export function defaultPlanFields() {
  return {
    plan: DEFAULT_NEW_OWNER_TIER,
    trialEndsAt: trialEndsFromNow(),
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
 * Ensure the CURRENT OWNER's center doc carries the plan/trialEndsAt/demoMode
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
 * Downgrade an expired trial to Starter (A9 — client-side cron replacement).
 *
 * Why client-side instead of a Firebase Cloud Function?
 *   - We don't have Firebase Functions deployed (Sprint 3 scope = ship
 *     tier gating fast, not stand up billing infra).
 *   - Every owner that hits the dashboard runs this on load, which covers
 *     the realistic case (expired trial + owner logs in again).
 *   - Tradeoff: an abandoned trial account lingers on `plan: 'trial'` in
 *     Firestore until they log back in. That's fine because:
 *       (a) `useEntitlements().effectiveTier` already returns 'starter'
 *           for expired trials, so the app behaves correctly regardless.
 *       (b) Billing enforcement (Track F) will revisit this with a real
 *           scheduled job when we actually charge cards.
 *
 * Pre-conditions enforced here:
 *   - The current owner's center doc has `plan === 'trial'`.
 *   - `trialEndsAt` is in the past.
 * Violations → no-op (safer than writing on wrong state).
 *
 * Returns the updated plan when a write happens, else null.
 */
export async function downgradeExpiredTrial(existing) {
  if (!existing || existing.plan !== 'trial') return null;
  const ts = existing.trialEndsAt;
  const ends =
    ts && typeof ts.toDate === 'function'
      ? ts.toDate()
      : ts instanceof Date
      ? ts
      : null;
  if (!ends || ends.getTime() >= Date.now()) return null;

  const ownerId = currentOwnerId();
  try {
    await updateDoc(doc(db, 'centers', ownerId), {
      plan: 'starter',
      updatedAt: serverTimestamp(),
    });
    return 'starter';
  } catch (err) {
    console.warn('[centersApi] downgradeExpiredTrial failed:', err);
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

export const centersApi = {
  subscribeToSelfCenter,
  ensurePlanStamped,
  downgradeExpiredTrial,
  setDemoMode,
  getSelfCenter,
  updateBranding,
  defaultPlanFields,
  trialEndsFromNow,
};
