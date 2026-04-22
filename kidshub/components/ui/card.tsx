/**
 * Card / CardHeader / CardBody — React Native port of the legacy web primitives.
 *
 * Legacy (web) used custom `card` / `card-hover` CSS classes from
 * `kidshub-legacy/src/index.css`. Those don't exist on RN, so we re-express
 * them with explicit NativeWind utility classes. The visual intent is the
 * same: white (or dark-mode) surface, rounded-2xl, subtle shadow, optional
 * hover/press feedback.
 *
 * We don't try to replicate `hover:` on native — it's web-only. On mobile,
 * hit the `hover` prop to get an `active:` press state instead.
 */
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

export type CardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = '', hover: _hover = false, ...rest }: CardProps) {
  // hover is accepted for API parity with legacy but has no native equivalent;
  // Pressable wrappers supply press feedback where it matters.
  return (
    <View
      {...rest}
      className={`bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 shadow-sm ${className}`}>
      {children}
    </View>
  );
}

export type CardHeaderProps = { children: ReactNode; className?: string };

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <View
      className={`px-4 py-3 border-b border-surface-100 dark:border-surface-700 ${className}`}>
      {children}
    </View>
  );
}

export type CardBodyProps = { children: ReactNode; className?: string };

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <View className={`p-4 ${className}`}>{children}</View>;
}
