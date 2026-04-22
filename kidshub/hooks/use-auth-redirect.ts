/**
 * useAuthRedirect — one-liner guard for auth-sensitive screens.
 *
 * Pattern 1: "this screen needs a signed-in user"
 *   useAuthRedirect({ require: 'authenticated', redirectTo: '/login' });
 *
 * Pattern 2: "this screen is only for signed-out users (e.g. /login)"
 *   useAuthRedirect({ require: 'anonymous', redirectTo: '/' });
 *
 * Waits for the initial AuthContext load before redirecting — otherwise
 * every first render would briefly bounce to /login before Firebase resolves.
 *
 * This is the scaffolding hook p3-9 will use inside the (parent) / (teacher)
 * group layouts and the (auth) group's login screen. p3-13 layers role-aware
 * bouncing on top via useRequireRole.
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts';

export type AuthRequirement = 'authenticated' | 'anonymous';

export type UseAuthRedirectOptions = {
  require: AuthRequirement;
  redirectTo: string;
};

export function useAuthRedirect({ require, redirectTo }: UseAuthRedirectOptions) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (require === 'authenticated' && !isAuthenticated) {
      router.replace(redirectTo);
    } else if (require === 'anonymous' && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, require, redirectTo, router]);

  return { loading, isAuthenticated };
}
