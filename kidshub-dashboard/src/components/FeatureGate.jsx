/**
 * FeatureGate — the single declarative wrapper for every paid feature.
 *
 *   <FeatureGate feature="photoJournal">
 *     <PhotoJournalPage />
 *   </FeatureGate>
 *
 * Children render as-is when the current tenant's plan (or demoMode)
 * covers the feature. Otherwise an <UpgradeCTA> is rendered in place.
 *
 * Props:
 *   - feature     — required. FeatureKey defined in config/product.ts.
 *   - fallback    — optional. Custom component to render when gated
 *                   (overrides the default UpgradeCTA).
 *   - variant     — 'banner' (default) | 'card' — forwarded to UpgradeCTA.
 *   - loadingFallback — optional node shown while entitlements are loading.
 *                       Default null (children hidden + CTA hidden) so the
 *                       page doesn't flash locked state for an instant.
 *   - renderLocked — optional function(entitlementState) => ReactNode. Power
 *                    users can render the children anyway with a ribbon, etc.
 */
import React from 'react';

import { useFeature } from '../hooks';
import { UpgradeCTA } from './UpgradeCTA';

export function FeatureGate({
  feature,
  fallback,
  variant = 'banner',
  loadingFallback = null,
  renderLocked,
  children,
}) {
  const state = useFeature(feature);

  if (state.loading) {
    return loadingFallback;
  }

  if (state.enabled) {
    return <>{children}</>;
  }

  if (renderLocked) {
    return renderLocked(state);
  }

  if (fallback) {
    return fallback;
  }

  return (
    <UpgradeCTA
      feature={feature}
      upgradeTo={state.upgradeTo}
      variant={variant}
    />
  );
}
