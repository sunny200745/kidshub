/**
 * Badge — small colored pill. Ported from kidshub-legacy/src/components/ui/Badge.jsx.
 *
 * Legacy used semantic classes (badge-brand, badge-success, …) defined in
 * index.css. We re-express them as concrete bg/text pairs here so no CSS
 * dependency leaks over. The visual language is kept identical.
 *
 * Children are rendered inside a <View> so callers can mix icons + text
 * without wrestling with RN's "all text must be inside <Text>" rule — this
 * component wraps string children in <Text> automatically.
 */
import { Children, type ReactNode } from 'react';
import { Text, View } from 'react-native';

export type BadgeVariant = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300',
  info: 'bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300',
  neutral: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300',
};

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'brand', className = '' }: BadgeProps) {
  const variantClass = VARIANT_CLASSES[variant];
  // Extract foreground text color so we can apply it to string children too.
  const textColorClass = variantClass.split(' ').find((c) => c.startsWith('text-')) ?? '';

  return (
    <View
      className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full self-start ${variantClass} ${className}`}>
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Text className={`text-xs font-medium ${textColorClass}`}>{child}</Text>
        ) : (
          child
        )
      )}
    </View>
  );
}
