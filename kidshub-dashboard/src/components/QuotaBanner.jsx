/**
 * QuotaBanner — render a tier-exceeded error from the dashboard's quota
 * enforcement layer (quotasApi.enforceQuota / QuotaExceededError) as an
 * inline upgrade card.
 *
 * Used by the Add* modals. When `create()` throws `QuotaExceededError`,
 * the modal sets the error on state and drops this banner at the top of
 * the form. The CTA routes to `/plans` (Sprint 3 / E3) instead of opening
 * a mailto — so the owner always ends up on the dashboard's pricing page
 * where Sales / Stripe self-serve will eventually live.
 *
 * Props:
 *   - error: QuotaExceededError instance (carries tier/limit/upgradeTo/etc.)
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';

import { TIERS } from '../config/product';

export function QuotaBanner({ error }) {
  if (!error) return null;
  const upgradeTo = error.upgradeTo ?? 'pro';
  const tierInfo = TIERS[upgradeTo] ?? TIERS.pro;

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white border border-brand-100 flex items-center justify-center flex-shrink-0">
        <Lock className="w-5 h-5 text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-surface-900 text-sm">
          {error.message}
        </p>
        <p className="text-xs text-surface-500 mt-0.5">
          {tierInfo.tagline}.
        </p>
      </div>
      <Link
        to="/plans"
        className="inline-flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
      >
        See plans
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
