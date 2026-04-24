/**
 * ScreenContainer — the RN analogue of legacy `<Layout title subtitle>`.
 *
 * Why this exists instead of a straight Layout port:
 *   - Legacy Layout wrapped pages with a desktop <Sidebar>, a mobile <Header>,
 *     and a mobile <BottomNav>. In Expo Router, the bottom nav is owned by
 *     the (parent)/_layout.tsx `<Tabs>` component, and a sidebar doesn't
 *     really make sense on a native tabbed app. So we collapse Layout into
 *     just the per-screen title/subtitle chrome + scroll container.
 *   - Safe areas matter on iOS (notch) and Android (status bar). Wrapping the
 *     scroll view in SafeAreaView keeps content off the system chrome.
 *   - ScrollView with contentContainerStyle padding keeps each screen
 *     consistent (16px horizontal, 16/24px vertical) without every page
 *     re-declaring it.
 *
 * Two presentational props, matching legacy:
 *   - `title`    — bold h1, shown on all breakpoints.
 *   - `subtitle` — muted subhead, optional.
 *
 * Scrollable by default. Pages that need fixed chrome (e.g. Messages with a
 * bottom-pinned composer) can set `scrollable={false}` and lay out their own
 * flex:1 column.
 */
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { ScrollView, Text, View, type ViewStyle } from 'react-native';

import { RoleBadge } from '@/components/ui/role-badge';

export type ScreenContainerProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** When true (default) content is wrapped in a ScrollView. */
  scrollable?: boolean;
  /** Disable the title/subtitle header block (useful when the child renders its own hero). */
  hideHeader?: boolean;
  /** When true (default) renders the Parent/Teacher role pill next to the title. */
  showRoleBadge?: boolean;
  /**
   * Optional pill rendered inline with the title (e.g. `<TierBadge feature="photoJournal" />`).
   * Sits to the right of the title text, before the role badge. Keeps the
   * tier signal visible even when the feature is unlocked — a subtle
   * reminder that the screen advertises a paid capability.
   */
  headerBadge?: ReactNode;
  /** Extra classes on the outermost safe-area wrapper. */
  className?: string;
  /** Extra style on the ScrollView content (only when `scrollable`). */
  contentContainerStyle?: ViewStyle;
};

export function ScreenContainer({
  title,
  subtitle,
  children,
  scrollable = true,
  hideHeader = false,
  showRoleBadge = true,
  headerBadge,
  className = '',
  contentContainerStyle,
}: ScreenContainerProps) {
  const Header = !hideHeader && (title || subtitle) ? (
    <View className="px-4 pt-4 pb-2">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          {title ? (
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {title}
              </Text>
              {headerBadge}
            </View>
          ) : null}
          {subtitle ? (
            <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {showRoleBadge ? <RoleBadge className="mt-1" /> : null}
      </View>
    </View>
  ) : null;

  if (!scrollable) {
    return (
      <SafeAreaView
        edges={['top']}
        className={`flex-1 bg-surface-50 dark:bg-surface-900 ${className}`}>
        {Header}
        <View className="flex-1">{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      className={`flex-1 bg-surface-50 dark:bg-surface-900 ${className}`}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, ...contentContainerStyle }}
        keyboardShouldPersistTaps="handled">
        {Header}
        <View className="px-4 pt-2">{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
