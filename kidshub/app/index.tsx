/**
 * Role router — the ONLY `/` route in the app.
 *
 * Dispatches the user to the right group based on AuthContext state:
 *
 *   loading              → splash (ActivityIndicator)
 *   anonymous            → /login            (app/(auth)/login.tsx)
 *   role === 'parent'    → /home             (app/(parent)/home.tsx)
 *   role === 'teacher'   → /classroom        (app/(teacher)/classroom.tsx)
 *   signed in, no valid  → /unauthorized     (kicks owners out, explains mismatch)
 *   allowed role
 *
 * Why this file exists:
 *   - Expo Router groups wrapped in () don't consume URL segments, so
 *     `(parent)/home.tsx` is literally `/home`. That means we can't just
 *     have two `index.tsx` files (one per role group) — they'd both
 *     resolve to `/` and collide. Instead, each group owns a *distinct*
 *     landing path (/home for parent, /classroom for teacher), and this
 *     file is the dispatcher that picks one.
 *   - Having an explicit `/` handler also means deep-linking to the root
 *     always works: cold-start the app, land here, get routed.
 */
import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { ROLES } from '@/constants/roles';
import { useAuth } from '@/contexts';

export default function RoleRouter() {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-surface-500 text-sm">Loading KidsHub…</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (role === ROLES.PARENT) {
    return <Redirect href="/home" />;
  }

  if (role === ROLES.TEACHER) {
    return <Redirect href="/classroom" />;
  }

  // Signed in but role is missing, invalid, or 'owner' (owners belong on
  // dashboard.getkidshub.com, not here).
  return <Redirect href="/unauthorized" />;
}
