/**
 * /unauthorized — where users land when:
 *   - they're signed in but have no `role` on their users/{uid} doc yet
 *   - their role is 'owner' (owners belong on dashboard.getkidshub.com)
 *   - they tried to access a (parent) route with a teacher account (or vice versa)
 *
 * Action: show a plain-English explanation + sign-out button. On web we also
 * link to the dashboard for owners.
 *
 * Self-heal redirect: if the user's role becomes a valid kidshub role while
 * they're sitting on this screen, send them back through the role router.
 * This matters because of a race during parent self-registration:
 *   1. createUserWithEmailAndPassword fires onAuthStateChanged immediately.
 *   2. AuthContext resolves with isAuthenticated=true, role=null (because
 *      the setDoc(users/{uid}) hasn't completed yet).
 *   3. The role router sees role=null and dispatches to /unauthorized.
 *   4. ~50ms later setDoc completes, the snapshot listener fires again, and
 *      AuthContext now reports role='parent'.
 * Without this hook the user would stay stuck on /unauthorized even though
 * they're now in a perfectly valid state.
 */
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { KIDSHUB_ALLOWED_ROLES, ROLE_LABELS, ROLES } from '@/constants/roles';
import { useAuth } from '@/contexts';

export default function Unauthorized() {
  const router = useRouter();
  const { loading, isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (role && KIDSHUB_ALLOWED_ROLES.includes(role)) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, role, router]);

  const isOwner = role === ROLES.OWNER;
  const label = role ? (ROLE_LABELS[role] ?? role) : 'No role assigned';

  return (
    <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 px-6">
      <View className="max-w-md w-full items-center">
        <Text className="text-surface-900 dark:text-surface-50 text-2xl font-bold text-center">
          You&apos;re in the wrong place
        </Text>
        <Text className="text-surface-600 dark:text-surface-300 text-base text-center mt-3">
          {isOwner
            ? 'Owner accounts sign in on the dashboard, not on the KidsHub app.'
            : `Your account role (${label}) isn't supported on KidsHub yet. Ask your daycare owner to invite you properly, or try signing in with a different account.`}
        </Text>

        {isOwner && Platform.OS === 'web' ? (
          <Link
            href="https://dashboard.getkidshub.com"
            className="mt-6 bg-brand-500 px-6 py-3 rounded-xl"
            // @ts-expect-error — web-only anchor target, safely ignored on native
            target="_self">
            <Text className="text-white font-semibold">Go to dashboard</Text>
          </Link>
        ) : null}

        <Pressable
          onPress={logout}
          className="mt-4 border border-surface-300 dark:border-surface-600 px-6 py-3 rounded-xl">
          <Text className="text-surface-800 dark:text-surface-100 font-semibold">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
