import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

import { Button, Modal } from './ui';
import { useEntitlements } from '../hooks/useEntitlements';
import { centersApi } from '../firebase/api';
import { STARTER_FREE_MONTHS, TRIAL_DURATION_DAYS } from '../config/product';

/**
 * <PlanGateInterstitial /> — the trial-expired blocker (stop 5 of the
 * new-owner onboarding journey).
 *
 * Shows a non-dismissible modal to owners whose `centers.trialEndedAt`
 * has been stamped but `trialExpiryAcknowledgedAt` is still absent or
 * older. This is the moment of highest conversion intent — the trial
 * just ended, Premium features just locked, and the owner needs to
 * consciously pick a path: stay on Starter for the 2-month grace, or
 * upgrade to a paid tier.
 *
 * Why persist the ack to Firestore (not sessionStorage)?
 *   - Survives device changes, cleared cookies, private-mode sessions.
 *   - We only want to blast this modal ONCE per trial transition, not
 *     once per tab.
 *
 * Why non-dismissible via backdrop / X?
 *   - If the owner can click away, they often DO click away and forget
 *     they just lost Premium. Forcing an explicit action ("Stay on
 *     Starter" vs "See plans" vs "Contact sales") is the whole point.
 *
 * Suppressed on:
 *   - /plans   — the owner is literally at pricing; no need to block.
 *   - /welcome — the onboarding wizard has its own flow.
 *   - /login / /register — the Layout doesn't mount here anyway, but
 *     we double-guard in case the interstitial ever ships outside
 *     Layout.
 */

const SUPPRESSED_PATHS = new Set(['/plans', '/welcome', '/login', '/register']);

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

export function PlanGateInterstitial() {
  const navigate = useNavigate();
  const location = useLocation();
  const { center, loading, demoMode } = useEntitlements();

  const [acknowledging, setAcknowledging] = useState(false);

  if (loading) return null;
  if (demoMode) return null;
  if (!center) return null;
  if (SUPPRESSED_PATHS.has(location.pathname)) return null;

  const trialEndedMs = toMillis(center.trialEndedAt);
  const ackedMs = toMillis(center.trialExpiryAcknowledgedAt);
  const shouldShow = trialEndedMs > 0 && ackedMs < trialEndedMs;

  if (!shouldShow) return null;

  const ack = async () => {
    setAcknowledging(true);
    try {
      await centersApi.acknowledgeTrialExpiry();
    } catch (err) {
      // If the write fails we still want the user to be able to proceed —
      // we just won't remember they saw it. They'll see it once more on
      // the next load. Not great, but not blocking either.
      console.warn('[PlanGateInterstitial] ack failed:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleStay = async () => {
    await ack();
    // No navigation — they're staying put on whatever page they were on,
    // now on Starter. The dashboard re-renders with locked paid features.
  };

  const handleSeePlans = async () => {
    await ack();
    navigate('/plans');
  };

  const handleContactSales = async () => {
    await ack();
    // Deep-link into the Contact Sales modal on /plans with tier=pro
    // prefilled (most common upgrade target). The useSearchParams flow
    // in Plans.jsx auto-opens the modal.
    navigate('/plans?tier=pro');
  };

  return (
    <Modal
      isOpen
      onClose={() => {}}
      title="Your Premium trial has ended"
      size="md"
      showClose={false}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-100">
            <AlertCircle className="h-5 w-5 text-warning-700" />
          </div>
          <div className="flex-1 text-sm text-surface-700">
            <p>
              Your {TRIAL_DURATION_DAYS}-day Premium trial has wrapped. Your
              center is still live — we've moved you to our <strong>Starter</strong>{' '}
              plan, which is free for the next {STARTER_FREE_MONTHS} months.
            </p>
            <p className="mt-2">
              Some Premium features (photo journal, reports, custom branding,
              and more) are now locked. Pick what's next:
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-surface-200 bg-surface-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">
                Upgrade to keep Premium
              </p>
              <p className="mt-0.5 text-xs text-surface-600">
                Pro ($39/mo) or Premium ($79/mo). Talk to sales to activate.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-200 text-surface-700">
              <span className="text-xs font-bold">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">
                Continue on Starter
              </p>
              <p className="mt-0.5 text-xs text-surface-600">
                Free for {STARTER_FREE_MONTHS} more months. Core features
                (attendance, messaging, classrooms) stay fully available.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-surface-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={handleStay}
          disabled={acknowledging}
        >
          {acknowledging ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Stay on Starter'}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleSeePlans}
            disabled={acknowledging}
          >
            See all plans
          </Button>
          <Button
            variant="primary"
            onClick={handleContactSales}
            disabled={acknowledging}
          >
            Upgrade to Premium
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
