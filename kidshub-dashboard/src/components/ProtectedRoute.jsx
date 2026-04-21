import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts';
import { DASHBOARD_ALLOWED_ROLES } from '../constants/roles';

/**
 * Gate a route on (1) authenticated session and (2) allowed role.
 *
 * Non-authenticated users → /login (with return-to state).
 * Authenticated users with no profile doc or disallowed role → /unauthorized.
 *
 * `allowedRoles` defaults to the dashboard's allowlist (owner-only). Pass an
 * explicit array for finer-grained per-route gating (e.g., future settings
 * pages that might allow a co-owner role).
 *
 * Security posture: this is client-side defense-in-depth. The real gate is
 * Firestore security rules (Phase 3 p3-15) that verify `request.auth.uid`'s
 * role before allowing reads/writes. Don't treat this as the only safeguard.
 */
export function ProtectedRoute({ children, allowedRoles = DASHBOARD_ALLOWED_ROLES }) {
  const { isAuthenticated, loading, role, profile } = useAuth();
  const location = useLocation();

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

  return children;
}
