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
 *   - Carry the KidsHub mark so the splash reads as "the app is loading"
 *     rather than "something blank is on screen". The PNG (built from
 *     `brand/kidshub-logo.svg` via `npm run build:icons`) keeps RouteSplash
 *     a pure presentational component — no SVG runtime, no extra deps.
 */
import { ActivityIndicator, Image, View } from 'react-native';

const LOGO = require('@/assets/images/icon.png');

export function RouteSplash() {
  return (
    <View
      className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading">
      <Image
        source={LOGO}
        style={{ width: 96, height: 96, marginBottom: 24, borderRadius: 22 }}
        accessibilityIgnoresInvertColors
      />
      <ActivityIndicator size="large" color="#E91E63" />
    </View>
  );
}
