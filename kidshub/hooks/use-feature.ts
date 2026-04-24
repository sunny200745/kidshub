/**
 * useFeature — kidshub (teacher/parent) side. Parity with the dashboard's
 * useFeature.js — same return shape, same semantics. Drives <FeatureGate>
 * and <UpgradeCTA> below.
 */
import { useMemo } from 'react';

import {
  FEATURES,
  INFRA_LOCKED_FEATURES,
  type FeatureKey,
  type Tier,
  tierSatisfies,
} from '@/constants/product';
import { useEntitlements } from './use-entitlements';

export type FeatureState = {
  enabled: boolean;
  loading: boolean;
  reason: 'tier' | 'infra-locked' | 'unknown-feature' | null;
  upgradeTo: Tier | null;
  currentTier: Tier;
  demoMode: boolean;
};

export function useFeature(key: FeatureKey): FeatureState {
  const { effectiveTier, loading, demoMode } = useEntitlements();

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

    // Infra holds take precedence over the tier check. If the feature
    // is temporarily locked because backing infrastructure isn't ready,
    // every tier sees the upgrade CTA — even premium. See
    // config/product.ts → INFRA_LOCKED_FEATURES.
    const infraLocked = INFRA_LOCKED_FEATURES.has(key);
    const enabled = !infraLocked && tierSatisfies(effectiveTier, requiredTier);

    let reason: FeatureState['reason'] = null;
    if (!enabled) {
      reason = infraLocked ? 'infra-locked' : 'tier';
    }

    return {
      enabled,
      loading,
      reason,
      upgradeTo: enabled ? null : requiredTier,
      currentTier: effectiveTier,
      demoMode,
    };
  }, [key, effectiveTier, loading, demoMode]);
}
