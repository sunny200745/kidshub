/**
 * TierBadge — a small "Unlock" pill used to advertise locked paid
 * features. Pair it with any surface (menu rows, page headers, card
 * titles) that points at a paid capability so users see at a glance
 * which features they'd gain by upgrading.
 *
 * Visual: purple → pink gradient with a white Crown icon and bold
 * uppercase "Unlock" text. The gradient matches the dashboard
 * `gradient-brand` utility (accent-500 → brand-500) so both ecosystems
 * read as one product.
 *
 * Only renders when the feature is actually locked for the current
 * tenant. Unlocked, starter/trial-tier, unknown-key, and loading cases
 * all return `null` — callers can drop one in unconditionally without
 * gating the render themselves.
 *
 * Usage:
 *   <TierBadge feature="photoJournal" />        // shown on Starter
 *   <TierBadge feature="ariaAiInApp" />         // shown on Starter/Pro
 *   <TierBadge feature="core.messaging" />      // never shown (free)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { Text } from 'react-native';

import { FEATURES, type FeatureKey } from '@/constants/product';
import { useFeature } from '@/hooks';

export type TierBadgeProps = {
  feature: FeatureKey;
};

// Matches `.gradient-brand` in the dashboard (accent-500 → brand-500).
// Start = violet, end = magenta, direction ≈ top-left → bottom-right.
const GRADIENT_COLORS: readonly [string, string] = ['#8B5CF6', '#FF2D8A'];

export function TierBadge({ feature }: TierBadgeProps) {
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
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        gap: 4,
      }}>
      <Crown size={11} color="#FFFFFF" />
      <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
        Unlock
      </Text>
    </LinearGradient>
  );
}
