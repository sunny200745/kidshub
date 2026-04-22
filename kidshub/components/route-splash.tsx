/**
 * RouteSplash — neutral full-bleed loading state shown while a route guard
 * (useAuthRedirect / useRequireRole) is resolving or redirecting.
 *
 * Goals:
 *   - Cover the screen so wrong-role users never glimpse protected UI between
 *     the first render and router.replace() landing.
 *   - Match the brand vibe (background tint, brand-colored spinner) without
 *     pulling in the full hero — these flashes should feel like a smooth
 *     transition, not a separate page.
 */
import { ActivityIndicator, View } from 'react-native';

export function RouteSplash() {
  return (
    <View
      className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading">
      <ActivityIndicator size="large" color="#E91E63" />
    </View>
  );
}
