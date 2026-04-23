/**
 * UpgradeCTA — the banner shown whenever the current tenant's tier can't
 * reach a gated feature. Wrapped by <FeatureGate> for the common case
 * (render-or-upgrade). Also usable standalone when a whole page is locked.
 *
 * Sprint 3 (E3): CTAs now route to the in-dashboard `/plans` page (Plans.jsx)
 * which hosts the three-tier comparison AND the contact-sales form that
 * writes to `leads/` and notifies us via Resend (E2). The `onContactSales`
 * override is preserved so modals can intercept the click and open the form
 * inline rather than navigating away.
 *
 * Props (all optional except `feature`):
 *   - feature     — FeatureKey from config/product.ts; drives the copy
 *   - upgradeTo   — minimum tier that unlocks it; pulled from useFeature()
 *   - variant     — 'banner' (thin horizontal bar, default) | 'card'
 *                   (full-bleed placeholder for whole-page locks)
 *   - compact     — true on repeated-per-row banners to shrink padding
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';

import { FEATURE_LABELS, TIERS } from '../config/product';
import { Button } from './ui';

export function UpgradeCTA({
  feature,
  upgradeTo = 'pro',
  variant = 'banner',
  compact = false,
  onContactSales,
}) {
  const navigate = useNavigate();
  const featureLabel = feature ? FEATURE_LABELS[feature] ?? feature : 'this feature';
  const tierInfo = TIERS[upgradeTo] ?? TIERS.pro;

  const handleContactSales = () => {
    if (onContactSales) {
      onContactSales({ feature, upgradeTo });
      return;
    }
    // Deep-link into /plans with the relevant tier + feature pre-selected so
    // the contact form opens already scoped to what the user was blocked on.
    const params = new URLSearchParams();
    if (upgradeTo) params.set('tier', upgradeTo);
    if (feature) params.set('feature', feature);
    navigate(`/plans${params.toString() ? `?${params}` : ''}`);
  };

  if (variant === 'card') {
    return (
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-brand-600" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">
          {tierInfo.name} plan
        </p>
        <h3 className="text-xl font-bold text-surface-900">
          Unlock {featureLabel}
        </h3>
        <p className="mt-2 text-sm text-surface-500 max-w-md mx-auto">
          {tierInfo.tagline}. Upgrade to {tierInfo.name} to enable{' '}
          {featureLabel.toLowerCase()} and everything in your current plan.
        </p>
        <Button
          variant="primary"
          className="mt-5"
          onClick={handleContactSales}
        >
          Contact sales to upgrade
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div
        className={`rounded-lg bg-white border border-brand-100 flex items-center justify-center flex-shrink-0 ${
          compact ? 'w-8 h-8' : 'w-10 h-10'
        }`}
      >
        <Lock className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-brand-600`} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-surface-900 ${
            compact ? 'text-sm' : 'text-sm'
          }`}
        >
          Upgrade to {tierInfo.name} to unlock {featureLabel}
        </p>
        {!compact && (
          <p className="text-xs text-surface-500 mt-0.5">
            {tierInfo.tagline}.
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        size={compact ? 'sm' : 'sm'}
        onClick={handleContactSales}
      >
        Upgrade
      </Button>
    </div>
  );
}
