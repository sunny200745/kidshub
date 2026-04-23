/**
 * useFeature — kidshub (teacher/parent) side. Parity with the dashboard's
 * useFeature.js — same return shape, same semantics. Drives <FeatureGate>
 * and <UpgradeCTA> below.
 */
import { useMemo } from 'react';

import {
  FEATURES,
  type FeatureKey,
  type Tier,
  tierSatisfies,
} from '@/constants/product';
import { useEntitlements } from './use-entitlements';

export type FeatureState = {
  enabled: boolean;
  loading: boolean;
  reason: 'tier' | 'trial-expired' | 'unknown-feature' | null;
  upgradeTo: Tier | null;
  currentTier: Tier;
  demoMode: boolean;
};

export function useFeature(key: FeatureKey): FeatureState {
  const { effectiveTier, loading, demoMode, trialExpired, tier } = useEntitlements();

  return useMemo<FeatureState>(() => {
    const requiredTier = FEATURES[key];
    if (!requiredTier) {
      if (__DEV__) {
        console.warn(`[useFeature] unknown feature key: "${key}"`);
      }
      return {
        enabled: false,
        loading,
        reason: 'unknown-feature',
        upgradeTo: null,
        currentTier: effectiveTier,
        demoMode,
      };
    }

    const enabled = tierSatisfies(effectiveTier, requiredTier);

    let reason: FeatureState['reason'] = null;
    if (!enabled) {
      reason = tier === 'trial' && trialExpired ? 'trial-expired' : 'tier';
    }

    return {
      enabled,
      loading,
      reason,
      upgradeTo: enabled ? null : requiredTier,
      currentTier: effectiveTier,
      demoMode,
    };
  }, [key, effectiveTier, loading, tier, trialExpired, demoMode]);
}
