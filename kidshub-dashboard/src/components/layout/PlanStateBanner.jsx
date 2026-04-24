import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Sparkles, X } from 'lucide-react';

import { useEntitlements } from '../../hooks/useEntitlements';
import { STARTER_PROMO_WARNING_DAYS } from '../../config/product';

/**
 * PlanStateBanner — the dashboard shell's tenant-wide plan nag strip.
 *
 * Renders across every authenticated dashboard page (mounted in
 * `<Layout>`). Drives two visual states off `useEntitlements()`:
 *
 *   1. GREEN STARTER (starter + starterDaysLeft > STARTER_PROMO_WARNING_DAYS)
 *        Calm "X days left in your free Starter window" strip.
 *        Dismissible per-tab — the deadline is still far off.
 *
 *   2. AMBER STARTER (starter + starterDaysLeft <= STARTER_PROMO_WARNING_DAYS)
 *        Urgent "free window ends in N days — upgrade to stay live"
 *        strip. NOT dismissible.
 *
 *   HIDDEN: every other case — pro, premium, demoMode, loading, and the
 *   expired Starter state. Expired Starter is handled by the `/paywall`
 *   route (ProtectedRoute redirects non-admin owners there), so we
 *   intentionally render nothing here past day 60 — the banner should
 *   never appear side-by-side with the paywall content.
 *
 * Demo mode suppresses the banner entirely — internal sales demos
 * shouldn't look like a countdown.
 *
 * Routes excluded from rendering:
 *   - /plans    — they're literally looking at pricing, no nag needed.
 *   - /welcome  — keep the onboarding wizard visually clean.
 *   - /paywall  — the paywall IS the message; don't stack a banner above.
 *
 * Dismiss key is scoped to `starterPromoEndsAt` so an admin-triggered
 * re-stamp (or a future billing event that resets the window) doesn't
 * inherit a stale dismissal.
 */

const STARTER_STORAGE_PREFIX = 'kh:starter-banner-dismissed:';
const SUPPRESSED_PATHS = new Set(['/plans', '/welcome', '/paywall']);

function useDismissible(storageKey) {
  const [dismissed, setDismissed] = useState(() => {
    if (!storageKey) return false;
    try {
      return sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // private mode / storage disabled — still hide for this render
    }
    setDismissed(true);
  };

  return [dismissed, dismiss];
}

function StarterGraceBanner({ starterPromoEndsAt, starterDaysLeft }) {
  const dismissKey = starterPromoEndsAt
    ? `${STARTER_STORAGE_PREFIX}${starterPromoEndsAt.getTime()}`
    : null;
  const [dismissed, dismiss] = useDismissible(dismissKey);

  const isUrgent = starterDaysLeft <= STARTER_PROMO_WARNING_DAYS;
  if (!isUrgent && dismissed) return null;

  const daysLabel =
    starterDaysLeft === 0
      ? 'Your free Starter window ends today'
      : starterDaysLeft === 1
      ? '1 day left in your free Starter window'
      : `${starterDaysLeft} days left in your free Starter window`;

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
              Upgrade to Pro or Premium to keep your center live after that.
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

  return (
    <div className="border-b border-brand-200 bg-brand-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15">
          <Sparkles className="h-4 w-4 text-brand-700" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-brand-900">{daysLabel}.</span>{' '}
          <span className="text-brand-800">
            Still free — no card needed until the window closes.
          </span>
        </div>
        <Link
          to="/plans"
          className="hidden flex-shrink-0 text-xs font-semibold text-brand-800 hover:text-brand-900 sm:inline-flex"
        >
          See plans
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss starter banner"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PlanStateBanner() {
  const location = useLocation();
  const {
    tier,
    starterDaysLeft,
    starterPromoExpired,
    starterPromoEndsAt,
    demoMode,
    loading,
  } = useEntitlements();

  if (loading) return null;
  if (demoMode) return null;
  if (SUPPRESSED_PATHS.has(location.pathname)) return null;

  // Starter — green/amber countdown. Expired Starter is handled by the
  // /paywall route, so we render nothing once the window closes.
  if (tier === 'starter' && !starterPromoExpired && starterDaysLeft !== null) {
    return (
      <StarterGraceBanner
        starterPromoEndsAt={starterPromoEndsAt}
        starterDaysLeft={starterDaysLeft}
      />
    );
  }

  return null;
}
