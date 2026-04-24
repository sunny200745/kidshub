/**
 * useEntitlements — single source of truth for the current tenant's plan
 * and demo-mode status, consumed by useFeature() / <FeatureGate> / <UpgradeCTA>
 * everywhere downstream.
 *
 * Returns:
 *   {
 *     loading,      // true until the center doc has been read at least once
 *     error,        // unexpected read failure
 *     tier,         // 'trial' | 'starter' | 'pro' | 'premium'
 *     effectiveTier,// what gates actually check — equals `tier`, OR 'premium'
 *                   //   when demoMode is on (so every gate unlocks for demos),
 *                   //   OR 'starter' when a trial has expired but the cron
 *                   //   hasn't flipped plan yet (defensive — A9 is Sprint 3)
 *     trialEndsAt,  // Date | null
 *     trialDaysLeft,// integer, or null when not on trial
 *     trialExpired, // boolean (trial plan + trialEndsAt in the past)
 *     demoMode,     // boolean
 *     center,       // raw center doc (for pages that need name, settings, etc.)
 *   }
 *
 * Lazy migration:
 *   - If the center doc exists but lacks a `plan` field (pre-Sprint-1 owners),
 *     `ensurePlanStamped()` writes the defaults. The subsequent snapshot fires
 *     and we hydrate naturally. No manual backfill step needed.
 *
 * Read scope:
 *   - Only the current owner's own center doc. The kidshub app has its own
 *     useEntitlements() for the teacher/parent side that reads the DAYCARE
 *     owner's center doc (via profile.daycareId).
 */
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts';
import {
  centersApi,
  downgradeExpiredTrial,
  ensurePlanStamped,
  ensureStarterStarted,
} from '../firebase/api/centers';
import {
  DEFAULT_NEW_OWNER_TIER,
  TIERS_ARRAY,
  starterPromoDaysLeft,
  starterPromoEndsAtMs,
  starterPromoExpired as computeStarterPromoExpired,
} from '../config/product';

function parseTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  return null;
}

export function useEntitlements() {
  const { user, isOwner } = useAuth();
  const uid = user?.uid ?? null;

  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !isOwner) {
      setCenter(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = centersApi.subscribeToSelfCenter(
      async (data) => {
        // Lazy migration: pre-Sprint-1 centers lack the plan field. Stamp
        // defaults once, then the snapshot listener will fire again with
        // the fully-populated doc. We swallow the write error here; the
        // UI will still show "free" defaults while the write retries.
        if (data && !TIERS_ARRAY.includes(data.plan)) {
          try {
            await ensurePlanStamped(data);
          } catch (err) {
            console.warn(
              '[useEntitlements] ensurePlanStamped failed, falling back to defaults:',
              err
            );
          }
          // Don't setCenter here — the onSnapshot listener already has us
          // subscribed and will deliver the updated doc once the write
          // commits. Setting here would race the snapshot.
          return;
        }

        // A9 — Trial-expiry cron (client-side). If the owner's plan is
        // still 'trial' but trialEndsAt is in the past, flip plan →
        // 'starter' so the persisted state matches what the app already
        // shows via effectiveTier. Idempotent + fire-and-forget: the
        // snapshot will re-fire with the updated plan shortly.
        if (data && data.plan === 'trial') {
          const maybe = await downgradeExpiredTrial(data);
          if (maybe) return; // snapshot will re-deliver with plan='starter'
        }

        // Stop 7 — lazy-stamp starterStartedAt on legacy Starter docs.
        // Without a stamp, the 2-month grace helpers can't compute days
        // left, and the banner / blocker would never fire. We stamp
        // "now", not some retroactive date, so legacy customers get a
        // fresh promo window rather than being cut off immediately.
        if (data && data.plan === 'starter') {
          const wrote = await ensureStarterStarted(data);
          if (wrote) return; // snapshot will re-deliver with starterStartedAt
        }

        setCenter(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, isOwner]);

  return useMemo(() => {
    const rawTier = TIERS_ARRAY.includes(center?.plan)
      ? center.plan
      : DEFAULT_NEW_OWNER_TIER;

    const trialEndsAt = parseTimestamp(center?.trialEndsAt);
    const now = Date.now();
    const trialExpired = rawTier === 'trial'
      && trialEndsAt !== null
      && trialEndsAt.getTime() < now;

    const trialDaysLeft = rawTier === 'trial' && trialEndsAt
      ? Math.max(
          0,
          Math.ceil((trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
        )
      : null;

    // Stop 7 — Starter grace state derived from `starterStartedAt`.
    // `starterPromoDaysLeft` returns null when the field is missing,
    // which is what we want — downstream UI only lights up when we
    // have a valid clock. `starterPromoEndsAt` is exposed as a Date
    // so components can render "ends on Jan 3" if they want to.
    const starterPromoEndsMs = starterPromoEndsAtMs(center?.starterStartedAt);
    const starterPromoEndsAt = starterPromoEndsMs > 0 ? new Date(starterPromoEndsMs) : null;
    const starterDaysLeft = rawTier === 'starter'
      ? starterPromoDaysLeft(center?.starterStartedAt)
      : null;
    const starterPromoExpired = rawTier === 'starter'
      && computeStarterPromoExpired(center?.starterStartedAt);

    const demoMode = !!center?.demoMode;

    // effectiveTier is what downstream gates actually compare against.
    // Priority:
    //   1. demoMode on → premium (unlocks everything for sales demos)
    //   2. trial + expired → starter (graceful degrade until the cron
    //      runs; A9 in Sprint 3 will handle this server-side)
    //   3. otherwise → the raw plan
    let effectiveTier;
    if (demoMode) {
      effectiveTier = 'premium';
    } else if (trialExpired) {
      effectiveTier = 'starter';
    } else {
      effectiveTier = rawTier;
    }

    return {
      loading,
      error,
      tier: rawTier,
      effectiveTier,
      trialEndsAt,
      trialDaysLeft,
      trialExpired,
      // Stop 7 — Starter 2-month grace surface. Consumed by
      // PlanStateBanner (countdown) and PlanGateInterstitial (blocker
      // when expired + unacknowledged).
      starterPromoEndsAt,
      starterDaysLeft,
      starterPromoExpired,
      demoMode,
      center,
    };
  }, [center, loading, error]);
}
