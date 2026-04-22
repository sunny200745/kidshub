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

import { useAuthRedirect } from '@/hooks';

export default function AuthLayout() {
  useAuthRedirect({ require: 'anonymous', redirectTo: '/' });

  return <Stack screenOptions={{ headerShown: false }} />;
}
