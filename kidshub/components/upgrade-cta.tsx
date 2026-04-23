/**
 * UpgradeCTA — kidshub (teacher/parent) side. When a feature is gated,
 * we render this in place of the real content. Parallels the dashboard
 * component but rendered in React Native + NativeWind.
 *
 * Teachers / parents can't self-upgrade (owner controls billing), so the
 * CTA is "Ask your daycare to upgrade" rather than a direct purchase flow.
 * In a future sprint, this could dispatch an in-app message to the owner.
 */
import { Lock, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { FEATURE_LABELS, TIERS, type FeatureKey, type Tier } from '@/constants/product';

export type UpgradeCTAProps = {
  feature: FeatureKey;
  upgradeTo?: Tier | null;
  /** 'banner' (small inline) or 'card' (full-bleed page placeholder). */
  variant?: 'banner' | 'card';
  /** Optional override for the descriptive text (rare). */
  description?: string;
  children?: ReactNode;
};

export function UpgradeCTA({
  feature,
  upgradeTo = 'pro',
  variant = 'banner',
  description,
  children,
}: UpgradeCTAProps) {
  const featureLabel = FEATURE_LABELS[feature] ?? feature;
  const tierInfo = TIERS[upgradeTo ?? 'pro'] ?? TIERS.pro;

  if (variant === 'card') {
    return (
      <View className="rounded-2xl border border-brand-100 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/20 p-6 items-center">
        <View className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 items-center justify-center mb-3 shadow-sm">
          <Lock size={24} color="#E11D74" />
        </View>
        <View className="flex-row items-center gap-1.5 mb-1">
          <Sparkles size={14} color="#E11D74" />
          <Text className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            {tierInfo.name} plan
          </Text>
        </View>
        <Text className="text-lg font-bold text-surface-900 dark:text-surface-50 text-center">
          {featureLabel} is locked
        </Text>
        <Text className="text-sm text-surface-600 dark:text-surface-400 text-center mt-1.5 max-w-xs">
          {description
            ?? `Ask your daycare to upgrade to ${tierInfo.name} so you can use ${featureLabel.toLowerCase()}.`}
        </Text>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-brand-100 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/20 px-3 py-2.5">
      <View className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 items-center justify-center">
        <Lock size={16} color="#E11D74" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          Upgrade to {tierInfo.name} to unlock {featureLabel}
        </Text>
        {description ? (
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
