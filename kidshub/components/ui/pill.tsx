/**
 * Pill — small inline badge-ish primitive used for statuses, quick
 * actions, and count chips. Distinct from <Badge> because a pill
 * supports:
 *   - a leading icon (Lucide) sized to the pill
 *   - tap-press behaviour (optional `onPress`) with active:opacity
 *   - three visual tones (solid, soft, outline) with 6 semantic colors
 *
 * Height is fixed at 28pt (sm) / 32pt (md) to guarantee consistent line
 * flow when used inline with text. The solid variant always puts white
 * text on the colored bg; soft/outline use the colored text directly.
 *
 * Why not just re-style <Badge>? Badge is content-only (no press),
 * supports variant strings already used in 20+ sites, and doesn't need
 * the leading-icon alignment math that pills do. Keeping them separate
 * avoids a breaking refactor.
 */
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type PillTone = 'teal' | 'pink' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type PillVariant = 'solid' | 'soft' | 'outline';
export type PillSize = 'sm' | 'md';

export type PillProps = {
  children?: ReactNode;
  label?: string;
  icon?: LucideIcon;
  tone?: PillTone;
  variant?: PillVariant;
  size?: PillSize;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
};

type ToneTokens = {
  solidBg: string;
  solidText: string;
  softBg: string;
  softText: string;
  outlineBorder: string;
  outlineText: string;
  /** Hex value for the Lucide icon stroke on soft/outline variants. */
  hex: string;
};

/**
 * Tone palette. Hex values match the NativeWind `*-600` shade for a
 * high-contrast read against soft backgrounds; solid variants use
 * NativeWind `*-500` for the bg + white text.
 */
const TONES: Record<PillTone, ToneTokens> = {
  teal: {
    solidBg: 'bg-teacher-500',
    solidText: 'text-white',
    softBg: 'bg-teacher-50 dark:bg-teacher-900/30',
    softText: 'text-teacher-700 dark:text-teacher-300',
    outlineBorder: 'border-teacher-300 dark:border-teacher-700',
    outlineText: 'text-teacher-700 dark:text-teacher-300',
    hex: '#0D9488',
  },
  pink: {
    solidBg: 'bg-brand-500',
    solidText: 'text-white',
    softBg: 'bg-brand-50 dark:bg-brand-900/30',
    softText: 'text-brand-700 dark:text-brand-300',
    outlineBorder: 'border-brand-300 dark:border-brand-700',
    outlineText: 'text-brand-700 dark:text-brand-300',
    hex: '#F0106B',
  },
  neutral: {
    solidBg: 'bg-surface-800',
    solidText: 'text-white',
    softBg: 'bg-surface-100 dark:bg-surface-800',
    softText: 'text-surface-700 dark:text-surface-200',
    outlineBorder: 'border-surface-200 dark:border-surface-700',
    outlineText: 'text-surface-700 dark:text-surface-200',
    hex: '#475569',
  },
  success: {
    solidBg: 'bg-success-500',
    solidText: 'text-white',
    softBg: 'bg-success-50 dark:bg-success-900/30',
    softText: 'text-success-700 dark:text-success-300',
    outlineBorder: 'border-success-300 dark:border-success-700',
    outlineText: 'text-success-700 dark:text-success-300',
    hex: '#16A34A',
  },
  warning: {
    solidBg: 'bg-warning-500',
    solidText: 'text-white',
    softBg: 'bg-warning-50 dark:bg-warning-900/30',
    softText: 'text-warning-700 dark:text-warning-300',
    outlineBorder: 'border-warning-300 dark:border-warning-700',
    outlineText: 'text-warning-700 dark:text-warning-300',
    hex: '#D97706',
  },
  danger: {
    solidBg: 'bg-danger-500',
    solidText: 'text-white',
    softBg: 'bg-danger-50 dark:bg-danger-900/30',
    softText: 'text-danger-700 dark:text-danger-300',
    outlineBorder: 'border-danger-300 dark:border-danger-700',
    outlineText: 'text-danger-700 dark:text-danger-300',
    hex: '#DC2626',
  },
  info: {
    solidBg: 'bg-info-500',
    solidText: 'text-white',
    softBg: 'bg-info-50 dark:bg-info-900/30',
    softText: 'text-info-700 dark:text-info-300',
    outlineBorder: 'border-info-300 dark:border-info-700',
    outlineText: 'text-info-700 dark:text-info-300',
    hex: '#2563EB',
  },
};

const SIZE_CLASS: Record<PillSize, string> = {
  sm: 'px-2.5 py-1 gap-1',
  md: 'px-3 py-1.5 gap-1.5',
};

const TEXT_SIZE: Record<PillSize, string> = {
  sm: 'text-[11px] font-semibold',
  md: 'text-sm font-semibold',
};

const ICON_PX: Record<PillSize, number> = { sm: 12, md: 14 };

export function Pill({
  children,
  label,
  icon: Icon,
  tone = 'neutral',
  variant = 'soft',
  size = 'sm',
  onPress,
  disabled = false,
  className = '',
}: PillProps) {
  const tokens = TONES[tone];

  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let iconHex = tokens.hex;

  if (variant === 'solid') {
    bgClass = tokens.solidBg;
    textClass = tokens.solidText;
    iconHex = '#FFFFFF';
  } else if (variant === 'soft') {
    bgClass = tokens.softBg;
    textClass = tokens.softText;
  } else {
    bgClass = 'bg-transparent';
    borderClass = `border ${tokens.outlineBorder}`;
    textClass = tokens.outlineText;
  }

  const content = (
    <View
      className={`flex-row items-center rounded-full ${bgClass} ${borderClass} ${SIZE_CLASS[size]} ${disabled ? 'opacity-50' : ''} ${className}`}>
      {Icon ? <Icon size={ICON_PX[size]} color={iconHex} /> : null}
      {label ? (
        <Text className={`${TEXT_SIZE[size]} ${textClass}`}>{label}</Text>
      ) : null}
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Small hit-slop so 28pt pills still clear the 44pt-tappable bar.
      hitSlop={8}
      className={disabled ? '' : 'active:opacity-70'}>
      {content}
    </Pressable>
  );
}
