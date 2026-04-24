import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Sparkles, X } from 'lucide-react';

import { useEntitlements } from '../../hooks/useEntitlements';

/**
 * PlanStateBanner — the dashboard shell's tenant-wide plan nag strip.
 *
 * Renders across every authenticated dashboard page (mounted in
 * `<Layout>`). Drives three visual states off `useEntitlements()`:
 *
 *   1. GREEN  (trial + trialDaysLeft > WARNING_THRESHOLD_DAYS)
 *        Calm "Premium trial active" strip. Dismissible per-tab via
 *        sessionStorage so it doesn't nag on every page navigation.
 *
 *   2. AMBER  (trial + trialDaysLeft <= WARNING_THRESHOLD_DAYS)
 *        Urgent "trial ends in N days" strip. NOT dismissible — at
 *        this point we want the upgrade CTA persistently visible.
 *
 *   3. HIDDEN  (everything else: starter, pro, premium, expired trial
 *              on paths where the interstitial handles it, demoMode)
 *
 * Demo mode suppresses the banner entirely — internal sales demos
 * shouldn't look like a trial. Trial-expired owners see a blocker
 * interstitial (stop 5), NOT this banner, so we skip it when
 * `trialExpired` is true.
 *
 * Routes excluded from rendering:
 *   - /plans    — they're literally looking at pricing, no nag needed.
 *   - /welcome  — keep the onboarding wizard visually clean.
 *
 * Session-dismissal key is scoped to the current `trialEndsAt` epoch
 * so that a brand-new trial doesn't inherit a dismissal from a prior
 * session on the same device.
 */

const WARNING_THRESHOLD_DAYS = 3;
const STORAGE_KEY_PREFIX = 'kh:trial-banner-dismissed:';
const SUPPRESSED_PATHS = new Set(['/plans', '/welcome']);

export function PlanStateBanner() {
  const location = useLocation();
  const {
    tier,
    trialDaysLeft,
    trialExpired,
    trialEndsAt,
    demoMode,
    loading,
  } = useEntitlements();

  const dismissKey = trialEndsAt
    ? `${STORAGE_KEY_PREFIX}${trialEndsAt.getTime()}`
    : null;

  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey) return false;
    try {
      return sessionStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });

  if (loading) return null;
  if (demoMode) return null;
  if (tier !== 'trial') return null;
  if (trialExpired) return null; // handled by interstitial, stop 5
  if (trialDaysLeft === null) return null;
  if (SUPPRESSED_PATHS.has(location.pathname)) return null;

  const isUrgent = trialDaysLeft <= WARNING_THRESHOLD_DAYS;

  // Green state can be dismissed per-session. Amber cannot — if they're
  // within 3 days of expiry, the upgrade CTA earns its screen real estate.
  if (!isUrgent && dismissed) return null;

  const handleDismiss = () => {
    if (!dismissKey) return;
    try {
      sessionStorage.setItem(dismissKey, '1');
    } catch {
      // ignore — private mode or storage disabled, just hide for now
    }
    setDismissed(true);
  };

  const daysLabel =
    trialDaysLeft === 0
      ? 'Your trial ends today'
      : trialDaysLeft === 1
      ? '1 day left on your Premium trial'
      : `${trialDaysLeft} days left on your Premium trial`;

  if (isUrgent) {
    return (
      <div className="border-b border-warning-200 bg-warning-50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-warning-500/15">
            <AlertTriangle className="h-4 w-4 text-warning-700" />
          </div>
          <div className="flex-1 text-sm">
            <span className="font-semibold text-warning-900">{daysLabel}.</span>{' '}
            <span className="text-warning-800">
              Upgrade to keep Premium features, or continue on Starter (free for 2 months).
            </span>
          </div>
          <Link
            to="/plans"
            className="hidden flex-shrink-0 rounded-lg bg-warning-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-warning-700 sm:inline-flex"
          >
            See plans
          </Link>
          <Link
            to="/plans"
            className="flex-shrink-0 rounded-lg bg-warning-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-warning-700 sm:hidden"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  // Calm green state — under the threshold.
  return (
    <div className="border-b border-success-200 bg-success-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-success-500/15">
          <Sparkles className="h-4 w-4 text-success-700" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-success-900">{daysLabel}.</span>{' '}
          <span className="text-success-800">
            Enjoy full access — no card required.
          </span>
        </div>
        <Link
          to="/plans"
          className="hidden flex-shrink-0 text-xs font-semibold text-success-800 hover:text-success-900 sm:inline-flex"
        >
          See plans
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss trial banner"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-success-700 transition-colors hover:bg-success-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
