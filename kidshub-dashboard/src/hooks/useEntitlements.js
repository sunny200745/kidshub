/**
 * useEntitlements — single source of truth for the current tenant's plan
 * and demo-mode status, consumed by useFeature() / <FeatureGate> / <UpgradeCTA>
 * everywhere downstream.
 *
 * Returns:
 *   {
 *     loading,             // true until the center doc has been read at least once
 *     error,               // unexpected read failure
 *     tier,                // 'starter' | 'pro' | 'premium' (legacy 'trial' auto-migrated)
 *     effectiveTier,       // what gates actually check — equals `tier`, OR 'premium'
 *                          //   when demoMode is on (so every gate unlocks for demos)
 *     starterPromoEndsAt,  // Date | null — when the 60-day free window closes
 *     starterDaysLeft,     // integer or null — days left in the Starter free window
 *     starterPromoExpired, // boolean — paywall redirect fires when true
 *     demoMode,            // boolean
 *     center,              // raw center doc (for pages that need name, settings, etc.)
 *   }
 *
 * Lazy migrations (run in priority order on every snapshot):
 *   1. `ensurePlanStamped` — pre-Sprint-1 docs missing a `plan` field get
 *      the current defaults (Starter + starterStartedAt=now).
 *   2. `migrateLegacyTrialToStarter` — docs still on `plan: 'trial'` from
 *      the old 14-day-Premium-trial flow get flipped to Starter with a
 *      fresh 60-day clock. One-shot per legacy owner.
 *   3. `ensureStarterStarted` — Starter docs without `starterStartedAt`
 *      get it stamped "now" so the 60-day countdown has a reference point.
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
  ensurePlanStamped,
  ensureStarterStarted,
  migrateLegacyTrialToStarter,
} from '../firebase/api/centers';
import {
  DEFAULT_NEW_OWNER_TIER,
  TIERS_ARRAY,
  starterPromoDaysLeft,
  starterPromoEndsAtMs,
  starterPromoExpired as computeStarterPromoExpired,
} from '../config/product';

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
        // Lazy migration 1 — pre-Sprint-1 docs missing `plan`. Stamp
        // defaults; the snapshot will re-fire with the fully-populated
        // doc and we'll hydrate on that pass. Returning here avoids
        // racing setCenter against the upcoming snapshot.
        if (data && !TIERS_ARRAY.includes(data.plan)) {
          try {
            await ensurePlanStamped(data);
          } catch (err) {
            console.warn(
              '[useEntitlements] ensurePlanStamped failed, falling back to defaults:',
              err
            );
          }
          return;
        }

        // Lazy migration 2 — legacy `plan: 'trial'` docs. The old 14-day
        // Premium trial is gone; everyone gets Starter directly now. We
        // flip them here so they don't linger on a tier key the app no
        // longer treats as a first-class state.
        if (data && data.plan === 'trial') {
          const maybe = await migrateLegacyTrialToStarter(data);
          if (maybe) return; // snapshot will re-deliver with plan='starter'
        }

        // Lazy migration 3 — Starter docs missing `starterStartedAt`.
        // Without the stamp we can't compute the 60-day countdown, so
        // the paywall would never fire. We stamp "now" rather than any
        // retroactive date so legacy Starter customers get a fresh
        // window rather than being locked out immediately.
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

    // Starter 60-day free-use state derived from `starterStartedAt`.
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
    //   2. otherwise → the raw plan
    //
    // Note: we intentionally do NOT downgrade effectiveTier to something
    // like 'locked' when starterPromoExpired is true. The paywall is a
    // navigation-layer lock (ProtectedRoute redirects the user to
    // /paywall) — downstream feature gates keep computing normally so
    // /paywall and /plans themselves work correctly for expired owners.
    const effectiveTier = demoMode ? 'premium' : rawTier;

    return {
      loading,
      error,
      tier: rawTier,
      effectiveTier,
      starterPromoEndsAt,
      starterDaysLeft,
      starterPromoExpired,
      demoMode,
      center,
    };
  }, [center, loading, error]);
}
