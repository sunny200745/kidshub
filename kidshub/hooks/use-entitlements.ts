/**
 * useEntitlements — kidshub (teacher/parent) side.
 *
 * Reads the DAYCARE owner's center doc (via profile.daycareId) so the
 * teacher or parent can see the same plan / demoMode the dashboard owner
 * sees. Firestore rule `centers/{ownerId}.read` was widened in Sprint 1 to
 * allow tenant-member reads — see firestore.rules.
 *
 * Parity with kidshub-dashboard/src/hooks/useEntitlements.js — the return
 * shape is intentionally identical so <FeatureGate>/<UpgradeCTA> logic is
 * portable between the two apps.
 *
 * Parents with no daycareId yet (self-signup pre-invite-accept) see
 * `loading:false, tier:'starter'` — i.e. locked-by-default until a daycare
 * owner links them. This is the correct behavior: they shouldn't see any
 * paid features while unlinked.
 *
 * 60-day Starter / paywall:
 *   The `/paywall` hard-lock is owner-only — parents and teachers should
 *   never be blocked because the owner forgot to pay. Whatever `plan`
 *   they see is what feature gates check against; a legacy `plan: 'trial'`
 *   is treated as `'starter'` until the owner opens the dashboard and the
 *   lazy migration flips the field.
 */
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts';
import {
  DEFAULT_NEW_OWNER_TIER,
  TIERS_ARRAY,
  type Tier,
} from '@/constants/product';
import { centersApi, type Center } from '@/firebase/api';

export type EntitlementsState = {
  loading: boolean;
  error: Error | null;
  tier: Tier;
  effectiveTier: Tier;
  demoMode: boolean;
  center: Center | null;
};

function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS_ARRAY as readonly string[]).includes(value);
}

export function useEntitlements(): EntitlementsState {
  const { profile } = useAuth();
  // `daycareId` field lives on users/{uid}.daycareId. Teacher + parent both
  // have it (set at invite-accept / child-link time). Unlinked parents have
  // no daycareId and therefore no plan to read.
  const daycareId = (profile?.daycareId as string | undefined) ?? null;

  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!daycareId) {
      setCenter(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = centersApi.subscribeByDaycare(
      daycareId,
      (data) => {
        setCenter(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, [daycareId]);

  return useMemo(() => {
    // Treat legacy `'trial'` as `'starter'` from the teacher/parent POV.
    // The real migration is owner-side (runs in the dashboard); until
    // the owner next signs in, we just show the same feature set they
    // will have after migration.
    const rawPlan = center?.plan;
    const rawTier: Tier = rawPlan === 'trial'
      ? 'starter'
      : isTier(rawPlan)
        ? (rawPlan as Tier)
        : DEFAULT_NEW_OWNER_TIER;

    const demoMode = !!center?.demoMode;

    // demoMode unlocks everything (for sales demos). Otherwise the raw
    // (normalized) tier flows straight through — no trial-expiry
    // downgrade logic lives here anymore, and the /paywall lock is
    // owner-only.
    const effectiveTier: Tier = demoMode ? 'premium' : rawTier;

    return {
      loading,
      error,
      tier: rawTier,
      effectiveTier,
      demoMode,
      center,
    };
  }, [center, loading, error]);
}
