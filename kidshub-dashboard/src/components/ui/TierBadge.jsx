/**
 * TierBadge — a small "Unlock" pill used to advertise locked paid
 * features. Drop it next to any link, menu row, or card header that
 * points at a paid feature so users see which screens they'd gain by
 * upgrading.
 *
 * Visual: purple → pink gradient with a white Crown icon and bold
 * uppercase "Unlock" text. The gradient maps to `from-accent-500
 * to-brand-500` so it matches the mobile `LinearGradient` and reads as
 * one product.
 *
 * Only renders when the feature is actually locked for the current
 * tenant. Unlocked, starter/trial-tier, unknown-key, and loading cases
 * all return `null` — callers can drop one in unconditionally without
 * gating the render themselves.
 *
 * Usage:
 *   <TierBadge feature="photoJournal" />
 *   <TierBadge feature="customBranding" />
 *   <TierBadge feature="ariaAiInApp" />
 *   <TierBadge feature="core.messaging" />      // never renders (free)
 */
import React from 'react';
import { Crown } from 'lucide-react';

import { FEATURES } from '../../config/product';
import { useFeature } from '../../hooks';

/**
 * @param {object} props
 * @param {string} props.feature - A FeatureKey from config/product.
 * @param {string} [props.className='']
 */
export function TierBadge({ feature, className = '' }) {
  const requiredTier = FEATURES[feature];
  const state = useFeature(feature);

  if (!requiredTier || requiredTier === 'starter' || requiredTier === 'trial') {
    return null;
  }

  // Only advertise locked features. Users with access don't need a pill
  // telling them the feature is paid — they're already enjoying it.
  if (state.loading) return null;
  if (state.enabled) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-br from-accent-500 to-brand-500 ${className}`}
    >
      <Crown size={11} />
      Unlock
    </span>
  );
}
