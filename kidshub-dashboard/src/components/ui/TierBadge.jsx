/**
 * TierBadge — a tiny pill that advertises which paid plan unlocks a given
 * feature. Drop it next to a link, menu row, or card header that points
 * at a paid feature so users see "Pro" / "Premium" at a glance.
 *
 * Two visual states, automatically derived from `useFeature()`:
 *   - Unlocked (`state.enabled === true`) → muted neutral pill. Acts as a
 *     reminder ("this is a paid feature") without competing with the real
 *     content the user is about to interact with.
 *   - Locked (gated) → brand / accent colored pill with a Crown icon for
 *     Premium and Sparkles for Pro. Gives an at-a-glance read of what the
 *     user would unlock by upgrading, paired with the full UpgradeCTA
 *     banner on the destination page.
 *
 * Usage:
 *   <TierBadge feature="photoJournal" />               // picks "Pro"
 *   <TierBadge feature="customBranding" />             // picks "Pro"
 *   <TierBadge feature="ariaAiInApp" />                // picks "Premium"
 *   <TierBadge feature="core.messaging" />             // renders null
 *   <TierBadge feature="photoJournal" hideWhenUnlocked />
 *
 * Returns `null` for free-tier features and unknown keys — callers can
 * drop one in unconditionally without gating the render themselves. The
 * `size` prop defaults to "sm" (nav rows, card chips); use "md" when the
 * badge sits next to a page title.
 */
import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

import { FEATURES, TIERS } from '../../config/product';
import { useFeature } from '../../hooks';

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1',
};

const ICON_PX = { sm: 10, md: 12 };

/**
 * @param {object} props
 * @param {string} props.feature - A FeatureKey from config/product.
 * @param {boolean} [props.hideWhenUnlocked=false]
 * @param {'sm'|'md'} [props.size='sm']
 * @param {string} [props.className='']
 */
export function TierBadge({
  feature,
  hideWhenUnlocked = false,
  size = 'sm',
  className = '',
}) {
  const requiredTier = FEATURES[feature];
  const state = useFeature(feature);

  if (!requiredTier || requiredTier === 'starter' || requiredTier === 'trial') {
    return null;
  }

  // Don't flash the brand/accent "locked" style while entitlements are still
  // resolving — render nothing until we know the real state.
  if (state.loading) return null;

  if (state.enabled && hideWhenUnlocked) return null;

  const tierInfo = TIERS[requiredTier];
  if (!tierInfo) return null;
  const tierName = tierInfo.name;

  const Icon = requiredTier === 'premium' ? Crown : Sparkles;

  let pillClasses;
  let iconColor;
  if (state.enabled) {
    pillClasses = 'bg-surface-100 text-surface-600 border border-surface-200';
    iconColor = '#64748B';
  } else if (requiredTier === 'premium') {
    pillClasses = 'bg-violet-50 text-violet-700 border border-violet-200';
    iconColor = '#8B5CF6';
  } else {
    pillClasses = 'bg-brand-50 text-brand-700 border border-brand-200';
    iconColor = '#E11D74';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${SIZE_CLASSES[size]} ${pillClasses} ${className}`}
    >
      <Icon size={ICON_PX[size]} color={iconColor} />
      {tierName}
    </span>
  );
}
