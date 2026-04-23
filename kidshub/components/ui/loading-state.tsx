/**
 * Reusable loading + empty state primitives.
 *
 * `LoadingState` is the in-screen spinner shown while a Firestore
 * subscription is hydrating for the first time. It intentionally fills
 * the available vertical space rather than rendering a top-pinned bar
 * — that gives every screen a consistent "settling" feel.
 *
 * `EmptyState` is the screen-level empty placeholder for "no data yet"
 * cases (e.g. parent has no children linked, no announcements, no
 * messages). Use the optional icon + actionLabel/onAction to nudge the
 * user toward the right next step.
 */
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export type LoadingStateProps = {
  message?: string;
  /** When true, shrinks vertical padding for embedded use inside cards. */
  compact?: boolean;
};

export function LoadingState({ message, compact = false }: LoadingStateProps) {
  return (
    <View className={`items-center justify-center ${compact ? 'py-6' : 'py-16'}`}>
      <ActivityIndicator color="#7C3AED" />
      {message ? (
        <Text className="text-sm text-surface-500 dark:text-surface-400 mt-3">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export type EmptyStateProps = {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  iconColor = '#9CA3AF',
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-12">
      {Icon ? (
        <View className="w-14 h-14 rounded-2xl items-center justify-center mb-3 bg-surface-100 dark:bg-surface-800">
          <Icon size={26} color={iconColor} />
        </View>
      ) : null}
      <Text className="text-base font-semibold text-surface-900 dark:text-surface-50 text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-surface-500 dark:text-surface-400 text-center mt-1.5 max-w-xs">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 active:opacity-80">
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
}
