import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts';
import { useEntitlements } from '../hooks';
import { DASHBOARD_ALLOWED_ROLES, ROLES } from '../constants/roles';
import { ADMIN_UIDS } from '../config/product';

/**
 * Routes that stay reachable even after the Starter free window expires.
 *
 *   /paywall  — the paywall itself; redirecting it would infinite-loop.
 *   /plans    — owners need to review tier details to decide what to buy.
 *   /settings — the admin QA tool lives here. Non-admins get redirected
 *               when expired (see the explicit ADMIN_UIDS check below).
 *               We DON'T blanket-exempt /settings — real expired owners
 *               should see the paywall, not their settings page.
 *
 * Intentionally excluded: every dashboard route that touches tenant
 * data (dashboard, children, staff, classrooms, messages, parents,
 * activities, announcements, schedule, check-in, reports, video-
 * surveillance, unlock, welcome). Those redirect to /paywall.
 */
const PAYWALL_EXEMPT_PATHS = new Set(['/paywall', '/plans']);

/**
 * Gate a route on (1) authenticated session, (2) allowed role, and
 * (3) an active Starter free window OR a paid plan OR admin status.
 *
 * Non-authenticated users → /login (with return-to state).
 * Authenticated users with no profile doc or disallowed role → /unauthorized.
 * Owners whose Starter free window has elapsed → /paywall, UNLESS:
 *   - Their UID is in ADMIN_UIDS (so KidsHub staff can keep demoing), OR
 *   - The route is in PAYWALL_EXEMPT_PATHS (so they can see /plans
 *     and /paywall itself without a redirect loop).
 *
 * `allowedRoles` defaults to the dashboard's allowlist (owner-only). Pass an
 * explicit array for finer-grained per-route gating (e.g., future settings
 * pages that might allow a co-owner role).
 *
 * Security posture: this is client-side defense-in-depth. The real gate is
 * Firestore security rules that verify `request.auth.uid`'s role before
 * allowing reads/writes. The /paywall redirect is a UX lock, not a data
 * boundary — if someone force-navigates, they still can't read data they
 * shouldn't. Track F (billing) will push the plan-expiry check into
 * Firestore rules for actual write-blocking on paid-tier surfaces.
 */
export function ProtectedRoute({ children, allowedRoles = DASHBOARD_ALLOWED_ROLES }) {
  const { isAuthenticated, loading, role, profile, user } = useAuth();
  const location = useLocation();
  const { starterPromoExpired, loading: entitlementsLoading } = useEntitlements();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: 'no-profile' }}
        replace
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: 'wrong-role', role }}
        replace
      />
    );
  }

  // Starter-expired paywall gate. Only applies to owners — teachers and
  // parents live in the kidshub mobile app and don't hit dashboard
  // routes in the first place. We also require entitlements to have
  // resolved at least once before redirecting; otherwise a fresh login
  // could flash /paywall on the way to normal dashboard pages while
  // the center doc is still being fetched.
  const isAdmin = !!user && ADMIN_UIDS.includes(user.uid);
  if (
    role === ROLES.OWNER &&
    !isAdmin &&
    !entitlementsLoading &&
    starterPromoExpired &&
    !PAYWALL_EXEMPT_PATHS.has(location.pathname)
  ) {
    return <Navigate to="/paywall" replace />;
  }

  return children;
}
