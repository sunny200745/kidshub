/**
 * useRequireRole — bounce users whose role isn't in the allow-list.
 *
 * Layered on top of useAuthRedirect: that hook only cares about
 * signed-in-ness, this one additionally checks the user's Firestore role.
 *
 * Behavior:
 *   - Waits for AuthContext.loading to settle (no flicker-bounce).
 *   - If the user isn't signed in at all, redirects to `unauthedRedirectTo`
 *     (default '/login').
 *   - If the user IS signed in but their role isn't one of `allowedRoles`,
 *     redirects to `unauthorizedRedirectTo` (default '/unauthorized').
 *
 * Used in p3-13 to hang (parent) and (teacher) group layouts off role-scoped
 * guards, e.g. inside app/(parent)/_layout.tsx:
 *
 *     useRequireRole({ allowedRoles: [ROLES.PARENT] });
 *
 * Firestore security rules (p3-15) do the real gatekeeping server-side; this
 * is defense-in-depth + UX (bouncing to an explanatory screen beats a silent
 * "permission denied" error on the first query).
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts';
import type { Role } from '@/constants/roles';

export type UseRequireRoleOptions = {
  allowedRoles: readonly Role[];
  unauthedRedirectTo?: string;
  unauthorizedRedirectTo?: string;
};

export function useRequireRole({
  allowedRoles,
  unauthedRedirectTo = '/login',
  unauthorizedRedirectTo = '/unauthorized',
}: UseRequireRoleOptions) {
  const router = useRouter();
  const { isAuthenticated, loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(unauthedRedirectTo);
      return;
    }
    if (!role || !allowedRoles.includes(role)) {
      router.replace(unauthorizedRedirectTo);
    }
  }, [
    loading,
    isAuthenticated,
    role,
    allowedRoles,
    unauthedRedirectTo,
    unauthorizedRedirectTo,
    router,
  ]);

  return { loading, isAuthenticated, role };
}
