/**
 * quotas — client-side tier-quota enforcement for dashboard writes (A6).
 *
 * Before a classroom/child/staff create fires, call `enforceQuota(key)`:
 *   await enforceQuota('classrooms');
 *   const ref = await addDoc(...);
 *
 * enforceQuota:
 *   1. Resolves the current owner's effective tier from `centers/{uid}`
 *      (honors demoMode — admins in demo mode pass every quota).
 *   2. Counts existing docs of that kind via a `daycareId` count query.
 *   3. Throws `QuotaExceededError` if `count >= limit`. `Infinity` limits
 *      (Pro/Premium unlimited) always pass through.
 *
 * The thrown error carries { code, message, feature, currentCount, limit,
 * tier, upgradeTo } so UI callers can render a tailored upgrade CTA
 * without re-deriving anything.
 *
 * Server-side mirror: `planAllows()` in firestore.rules is the rule-level
 * defense against a compromised client bypass. This module is the
 * UX-layer gate that gives the owner a friendly message BEFORE the write.
 */
import {
  collection,
  getCountFromServer,
  getDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

import {
  FEATURES,
  FEATURE_LABELS,
  TIERS_ARRAY,
  TIER_ORDER,
  quotaFor as quotaLimit,
} from '../../config/product';
import { auth, db } from '../config';

const QUOTA_KEY_TO_COLLECTION = {
  classrooms: 'classrooms',
  children: 'children',
  staff: 'staff',
};

const QUOTA_KEY_TO_FEATURE = {
  classrooms: 'core.classrooms',
  children: 'core.children',
  staff: 'core.staff',
};

/** Minimum paid tier that raises the limit above Starter. */
const QUOTA_KEY_UPGRADE_TIER = {
  classrooms: 'pro',
  children: 'pro',
  staff: 'pro',
};

/**
 * Typed error subclass so modal catch blocks can tell "you're out of
 * classrooms" apart from a network failure.
 */
export class QuotaExceededError extends Error {
  constructor({ quotaKey, tier, currentCount, limit, upgradeTo }) {
    const featureKey = QUOTA_KEY_TO_FEATURE[quotaKey] ?? quotaKey;
    const label = (FEATURE_LABELS[featureKey] ?? quotaKey).toLowerCase();
    const tierName = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Your';
    const message =
      `${tierName} plan limits you to ${limit} ${label}. ` +
      `Upgrade to ${upgradeTo === 'pro' ? 'Pro' : 'Premium'} to add more.`;
    super(message);
    this.name = 'QuotaExceededError';
    this.code = 'quota-exceeded';
    this.quotaKey = quotaKey;
    this.feature = featureKey;
    this.tier = tier;
    this.currentCount = currentCount;
    this.limit = limit;
    this.upgradeTo = upgradeTo;
  }
}

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('quotas.enforceQuota: no authenticated user');
  }
  return uid;
}

/**
 * Resolve the owner's EFFECTIVE tier the same way useEntitlements does:
 *   - demoMode on                 → 'premium'
 *   - plan='trial' + expired      → 'starter'
 *   - otherwise                   → raw plan (or 'starter' as defensive default)
 *
 * Done as a one-shot get() rather than subscribing — we only need the value
 * at write-time, not live.
 */
async function resolveEffectiveTier() {
  const uid = currentDaycareId();
  const snap = await getDoc(doc(db, 'centers', uid));
  const data = snap.exists() ? snap.data() : null;

  const rawTier = TIERS_ARRAY.includes(data?.plan) ? data.plan : 'starter';
  if (data?.demoMode) return 'premium';

  if (rawTier === 'trial') {
    const ts = data?.trialEndsAt;
    const ends =
      ts && typeof ts.toDate === 'function'
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    if (ends && ends.getTime() < Date.now()) return 'starter';
  }
  return rawTier;
}

/**
 * Throw QuotaExceededError if the owner can't add another doc of type
 * `quotaKey`. No-op when the tier's quota is unlimited.
 */
export async function enforceQuota(quotaKey) {
  if (!QUOTA_KEY_TO_COLLECTION[quotaKey]) {
    throw new Error(`enforceQuota: unknown quotaKey "${quotaKey}"`);
  }

  const tier = await resolveEffectiveTier();
  const limit = quotaLimit(quotaKey, tier);
  if (limit === Infinity) return;

  const uid = currentDaycareId();
  const colName = QUOTA_KEY_TO_COLLECTION[quotaKey];
  const q = query(collection(db, colName), where('daycareId', '==', uid));
  const countSnap = await getCountFromServer(q);
  const count = countSnap.data().count ?? 0;

  if (count >= limit) {
    const upgradeTo = pickUpgradeTier(tier, quotaKey);
    throw new QuotaExceededError({
      quotaKey,
      tier,
      currentCount: count,
      limit,
      upgradeTo,
    });
  }
}

/**
 * Pick the next-best tier to pitch the customer. If they're already on the
 * highest finite-quota tier (Pro) and still hit the limit, point them at
 * Premium. For Starter we pitch Pro by default.
 */
function pickUpgradeTier(currentTier, quotaKey) {
  const fallback = QUOTA_KEY_UPGRADE_TIER[quotaKey] ?? 'pro';
  if (TIER_ORDER[currentTier] >= TIER_ORDER[fallback]) {
    return 'premium';
  }
  return fallback;
}

export const quotasApi = {
  enforceQuota,
  QuotaExceededError,
};
