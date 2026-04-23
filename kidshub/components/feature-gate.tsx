/**
 * FeatureGate — kidshub (teacher/parent) side. Single declarative wrapper
 * around every gated feature:
 *
 *   <FeatureGate feature="photoJournal">
 *     <PhotoJournalGallery />
 *   </FeatureGate>
 *
 * Renders children when the current tenant's plan covers the feature,
 * otherwise renders an <UpgradeCTA>.
 */
import type { ReactNode } from 'react';

import { useFeature } from '@/hooks';
import type { FeatureKey } from '@/constants/product';
import { UpgradeCTA } from './upgrade-cta';

export type FeatureGateProps = {
  feature: FeatureKey;
  variant?: 'banner' | 'card';
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

export function FeatureGate({
  feature,
  variant = 'banner',
  fallback,
  loadingFallback = null,
  children,
}: FeatureGateProps) {
  const state = useFeature(feature);

  if (state.loading) {
    return <>{loadingFallback}</>;
  }

  if (state.enabled) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <UpgradeCTA
      feature={feature}
      upgradeTo={state.upgradeTo}
      variant={variant}
    />
  );
}
