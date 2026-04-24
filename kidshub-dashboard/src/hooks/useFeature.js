/**
 * useFeature — single-feature gate helper. Given a FeatureKey (see
 * config/product.ts), returns whether the current tenant has access and,
 * if not, the minimum tier that unlocks it.
 *
 * Usage:
 *   const { enabled, reason, upgradeTo, loading } = useFeature('photoJournal');
 *
 *   if (!enabled) return <UpgradeCTA feature="photoJournal" upgradeTo={upgradeTo} />;
 *
 * Most call sites prefer the higher-level <FeatureGate feature="..."> wrapper,
 * which internally calls useFeature() and renders either children or an
 * <UpgradeCTA> — so page code stays declarative.
 */
import { useMemo } from 'react';

import { FEATURES, INFRA_LOCKED_FEATURES, tierSatisfies } from '../config/product';
import { useEntitlements } from './useEntitlements';

/** @returns {{ enabled: boolean, loading: boolean, reason: string|null, upgradeTo: string|null, currentTier: string }} */
export function useFeature(key) {
  const { effectiveTier, loading, demoMode, trialExpired, tier } = useEntitlements();

  return useMemo(() => {
    const requiredTier = FEATURES[key];

    if (!requiredTier) {
      // Unknown feature key — fail closed (deny) and log so the typo shows
      // up on the dev's console. Never silently allow.
      if (typeof window !== 'undefined') {
        console.warn(`[useFeature] unknown feature key: "${key}"`);
      }
      return {
        enabled: false,
        loading,
        reason: 'unknown-feature',
        upgradeTo: null,
        currentTier: effectiveTier,
      };
    }

    // Infra holds take precedence over the tier check. Features in
    // INFRA_LOCKED_FEATURES are locked for every tier (even trial /
    // premium) because backing infrastructure isn't provisioned yet —
    // see config/product.ts for the current list and the flip rules.
    const infraLocked = INFRA_LOCKED_FEATURES.has(key);
    const enabled = !infraLocked && tierSatisfies(effectiveTier, requiredTier);

    let reason = null;
    if (!enabled) {
      if (infraLocked) {
        reason = 'infra-locked';
      } else if (tier === 'trial' && trialExpired) {
        reason = 'trial-expired';
      } else {
        reason = 'tier';
      }
    }

    return {
      enabled,
      loading,
      reason,
      // If demoMode is on, gates are open — but `upgradeTo` should still
      // reflect the real required tier so the UI can show "would require Pro"
      // badges in demo mode. Downstream consumers rarely need this; most
      // just check `enabled`.
      upgradeTo: enabled ? null : requiredTier,
      currentTier: effectiveTier,
      demoMode,
    };
  }, [key, effectiveTier, loading, tier, trialExpired, demoMode]);
}
