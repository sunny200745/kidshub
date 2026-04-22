/**
 * (auth) group layout — signed-out screens (login, register, forgot password).
 *
 * Guard: anyone ALREADY signed in is kicked back to `/`, which re-runs the
 * role router. This prevents signed-in users from accidentally landing on
 * /login and getting stuck in a loop.
 *
 * Presentation: plain Stack, no header (each screen renders its own hero).
 */
import { Stack } from 'expo-router';

import { RouteSplash } from '@/components/route-splash';
import { useAuthRedirect } from '@/hooks';

export default function AuthLayout() {
  const { status } = useAuthRedirect({ require: 'anonymous', redirectTo: '/' });

  // While AuthContext is settling, OR while we're bouncing an already-signed-in
  // visitor back to /, show a neutral splash so they don't briefly see /login.
  if (status !== 'allowed') return <RouteSplash />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
