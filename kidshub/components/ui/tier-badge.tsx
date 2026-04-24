/**
 * TierBadge — a tiny pill that advertises which paid plan unlocks a given
 * feature. Pair it with any surface that displays a paid feature (menu
 * rows, page headers, card titles) so users can see at a glance what is
 * Pro / Premium — and, when they don't have access, what they'd unlock
 * by upgrading.
 *
 * Two visual states, automatically derived from `useFeature()`:
 *   - Unlocked (enabled) → muted neutral pill. The label is just a
 *     reminder ("this is a paid feature") that doesn't compete with the
 *     real content.
 *   - Locked (gated) → brand / accent colored pill with a crown icon for
 *     Premium and sparkles for Pro. Draws the eye toward the upgrade
 *     affordance without duplicating the full UpgradeCTA banner.
 *
 * Usage:
 *   <TierBadge feature="photoJournal" />        // picks "Pro", auto-styles
 *   <TierBadge feature="ariaAiInApp" />         // picks "Premium"
 *   <TierBadge feature="core.messaging" />      // renders null (free tier)
 *   <TierBadge feature="photoJournal" hideWhenUnlocked />
 *
 * Returns `null` for free-tier features and for unknown keys — callers
 * can always drop one in without gating the render themselves.
 */
import { Crown, Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

import {
  FEATURES,
  TIERS,
  type FeatureKey,
  type Tier,
} from '@/constants/product';
import { useFeature } from '@/hooks';

export type TierBadgeProps = {
  feature: FeatureKey;
  /**
   * When true, the badge does NOT render if the user already has access.
   * Useful on dense surfaces where the "you're using a paid feature"
   * reminder would be noisy. Default: false (always renders).
   */
  hideWhenUnlocked?: boolean;
  /** Extra classes on the outer pill. */
  className?: string;
};

type PaidTier = Exclude<Tier, 'trial' | 'starter'>;

const TIER_STYLES: Record<
  PaidTier,
  {
    lockedBg: string;
    lockedText: string;
    lockedHex: string;
    icon: typeof Sparkles;
  }
> = {
  pro: {
    lockedBg: 'bg-brand-50 dark:bg-brand-900/40',
    lockedText: 'text-brand-700 dark:text-brand-200',
    lockedHex: '#E11D74',
    icon: Sparkles,
  },
  premium: {
    lockedBg: 'bg-accent-50 dark:bg-accent-900/40',
    lockedText: 'text-accent-700 dark:text-accent-200',
    lockedHex: '#8B5CF6',
    icon: Crown,
  },
};

export function TierBadge({
  feature,
  hideWhenUnlocked = false,
  className = '',
}: TierBadgeProps) {
  const requiredTier = FEATURES[feature];
  const state = useFeature(feature);

  if (!requiredTier || requiredTier === 'starter') return null;
  // Trial is a transient tier; we never require it to unlock anything.
  if (requiredTier === 'trial') return null;

  // Don't flash the brand/accent "locked" style while entitlements are still
  // resolving — render nothing for the loading window so the badge only
  // appears once we know the real state.
  if (state.loading) return null;

  if (state.enabled && hideWhenUnlocked) return null;

  const paidTier = requiredTier as PaidTier;
  const tokens = TIER_STYLES[paidTier];
  const Icon = tokens.icon;
  const tierName = TIERS[paidTier].name;

  const bgClass = state.enabled
    ? 'bg-surface-100 dark:bg-surface-800'
    : tokens.lockedBg;
  const textClass = state.enabled
    ? 'text-surface-600 dark:text-surface-300'
    : tokens.lockedText;
  const iconColor = state.enabled ? '#64748B' : tokens.lockedHex;

  return (
    <View
      className={`flex-row items-center gap-1 rounded-full px-1.5 py-0.5 ${bgClass} ${className}`}>
      <Icon size={10} color={iconColor} />
      <Text
        className={`text-[10px] font-bold uppercase tracking-wide ${textClass}`}>
        {tierName}
      </Text>
    </View>
  );
}
