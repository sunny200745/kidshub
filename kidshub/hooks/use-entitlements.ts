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
  trialEndsAt: Date | null;
  trialDaysLeft: number | null;
  trialExpired: boolean;
  demoMode: boolean;
  center: Center | null;
};

function parseTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  return null;
}

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
    const rawTier: Tier = isTier(center?.plan)
      ? (center!.plan as Tier)
      : DEFAULT_NEW_OWNER_TIER;

    const trialEndsAt = parseTimestamp(center?.trialEndsAt);
    const now = Date.now();
    const trialExpired =
      rawTier === 'trial' && trialEndsAt !== null && trialEndsAt.getTime() < now;

    const trialDaysLeft =
      rawTier === 'trial' && trialEndsAt
        ? Math.max(
            0,
            Math.ceil((trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000)),
          )
        : null;

    const demoMode = !!center?.demoMode;

    let effectiveTier: Tier;
    if (demoMode) {
      effectiveTier = 'premium';
    } else if (trialExpired) {
      effectiveTier = 'starter';
    } else {
      effectiveTier = rawTier;
    }

    return {
      loading,
      error,
      tier: rawTier,
      effectiveTier,
      trialEndsAt,
      trialDaysLeft,
      trialExpired,
      demoMode,
      center,
    };
  }, [center, loading, error]);
}
