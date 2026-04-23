/**
 * ActionButton — large, tappable primary/secondary/ghost button shared
 * across teacher + parent screens. Exists because:
 *
 *   1. The raw <Pressable className="bg-teacher-500 ...">  pattern was
 *      duplicated in ~15 places with tiny inconsistencies (py-3 vs py-4,
 *      different active opacity, missing disabled state…).
 *   2. Lillio's design leans on chunky 48pt buttons with soft shadows;
 *      encoding that as a primitive makes it one-line to stay consistent.
 *   3. Tap target 44pt minimum (WCAG AAA) is easier to guarantee here
 *      than by reviewing every Pressable.
 *
 * Variants:
 *   - `primary`      role-accent bg (defaults to teal) + white text
 *   - `secondary`    dark slate bg + white text (for "second option")
 *   - `ghost`        transparent bg + role-accent text (for tertiary)
 *   - `outline`      white/dark bg + border + slate text (for destructive
 *                    confirmation safety)
 *
 * `tone` lets a caller override the primary color (e.g. pink for parent
 * screens). If you don't pass tone, tone=teal which matches the teacher
 * palette — that's the most common use site.
 */
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ActionButtonTone = 'teal' | 'pink' | 'danger';
export type ActionButtonSize = 'md' | 'lg';

export type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Right-aligned caption below the label, e.g. "3 still absent". */
  caption?: string;
  variant?: ActionButtonVariant;
  tone?: ActionButtonTone;
  size?: ActionButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to fill parent width. Default true. */
  fullWidth?: boolean;
  /** Extra tailwind classes appended. */
  className?: string;
  /** Rendered after the label — handy for custom trailing icons. */
  trailing?: ReactNode;
};

type ToneHex = { solid: string; solidDark: string; text: string };

const TONE_HEX: Record<ActionButtonTone, ToneHex> = {
  teal: { solid: '#14B8A6', solidDark: '#0D9488', text: '#0F766E' },
  pink: { solid: '#FF2D8A', solidDark: '#F0106B', text: '#D10058' },
  danger: { solid: '#EF4444', solidDark: '#DC2626', text: '#B91C1C' },
};

const TONE_CLASSES: Record<ActionButtonTone, { solid: string; soft: string; text: string }> = {
  teal: {
    solid: 'bg-teacher-500',
    soft: 'bg-teacher-50 dark:bg-teacher-900/30',
    text: 'text-teacher-700 dark:text-teacher-300',
  },
  pink: {
    solid: 'bg-brand-500',
    soft: 'bg-brand-50 dark:bg-brand-900/30',
    text: 'text-brand-700 dark:text-brand-300',
  },
  danger: {
    solid: 'bg-danger-500',
    soft: 'bg-danger-50 dark:bg-danger-900/30',
    text: 'text-danger-700 dark:text-danger-300',
  },
};

const SIZE_CLASSES: Record<ActionButtonSize, { padding: string; text: string; icon: number }> = {
  md: { padding: 'py-3 px-4', text: 'text-sm', icon: 18 },
  lg: { padding: 'py-4 px-5', text: 'text-base', icon: 20 },
};

export function ActionButton({
  label,
  onPress,
  icon: Icon,
  caption,
  variant = 'primary',
  tone = 'teal',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  className = '',
  trailing,
}: ActionButtonProps) {
  const tokens = TONE_CLASSES[tone];
  const hex = TONE_HEX[tone];
  const sz = SIZE_CLASSES[size];

  let containerClass = '';
  let labelClass = '';
  let iconColor = '#FFFFFF';

  if (variant === 'primary') {
    containerClass = `${tokens.solid} shadow-sm`;
    labelClass = 'text-white';
    iconColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    containerClass = 'bg-surface-900 dark:bg-surface-800 shadow-sm';
    labelClass = 'text-white';
    iconColor = '#FFFFFF';
  } else if (variant === 'ghost') {
    containerClass = tokens.soft;
    labelClass = tokens.text;
    iconColor = hex.text;
  } else {
    // outline
    containerClass = 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700';
    labelClass = 'text-surface-800 dark:text-surface-100';
    iconColor = '#475569';
  }

  const isInactive = loading || disabled;

  return (
    <Pressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      className={`rounded-2xl ${sz.padding} ${containerClass} ${fullWidth ? 'w-full' : ''} ${isInactive ? 'opacity-60' : 'active:opacity-80'} ${className}`}>
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : Icon ? (
          <Icon size={sz.icon} color={iconColor} />
        ) : null}
        <Text className={`font-bold ${sz.text} ${labelClass}`}>{label}</Text>
        {trailing}
      </View>
      {caption ? (
        <Text
          className={`text-[11px] mt-0.5 text-center ${
            variant === 'primary' || variant === 'secondary'
              ? 'text-white/80'
              : 'text-surface-500 dark:text-surface-400'
          }`}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}
