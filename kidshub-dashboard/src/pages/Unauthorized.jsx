import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts';
import { ROLES, ROLE_LABELS, DASHBOARD_ALLOWED_ROLES } from '../constants/roles';

/**
 * Friendly bounce page for authenticated users who can't access the dashboard.
 *
 * Three cases worth handling distinctly:
 *   1. no-profile   — user has Firebase Auth session but no `users/{uid}` doc.
 *                     Usually means a half-finished registration or a manual
 *                     account created outside the register flow.
 *   2. wrong-role   — user is a teacher/parent who landed on the owner
 *                     dashboard. Point them at the right app (kidshub).
 *   3. unknown      — defensive fallback for a bad role value.
 */
export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, loading } = useAuth();
  const reason = location.state?.reason ?? 'unknown';
  const [signingOut, setSigningOut] = React.useState(false);

  // Self-heal: if the profile snapshot eventually arrives with an allowed
  // role (can happen when a registration write races the auth listener),
  // bounce the user back into the app instead of leaving them stranded here.
  React.useEffect(() => {
    if (loading) return;
    if (role && DASHBOARD_ALLOWED_ROLES.includes(role)) {
      navigate('/', { replace: true });
    }
  }, [loading, role, navigate]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await logout();
    } catch (err) {
      console.error('Sign out failed:', err);
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const title =
    reason === 'no-profile'
      ? 'Account not set up'
      : reason === 'wrong-role'
      ? 'This dashboard is for daycare owners'
      : 'Access denied';

  const body =
    reason === 'no-profile' ? (
      <>
        You're signed in, but we couldn't find a profile for your account. If you
        just registered, try signing out and back in. Otherwise please contact
        support so we can finish setting you up.
      </>
    ) : reason === 'wrong-role' ? (
      <>
        Your account is registered as a{' '}
        <span className="font-semibold text-surface-900">
          {ROLE_LABELS[role] ?? role ?? 'user'}
        </span>
        , so you can't access the owner dashboard. {role === ROLES.PARENT || role === ROLES.TEACHER ? (
          <>The KidsHub app for parents and teachers is coming soon — we'll email you when it's ready.</>
        ) : (
          <>Contact your daycare owner if you think this is a mistake.</>
        )}
      </>
    ) : (
      <>This area is restricted. If you think you should have access, contact support.</>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl p-8 sm:p-10 border border-surface-100 text-center">
        <div className="w-16 h-16 rounded-2xl bg-warning-50 text-warning-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-surface-900 mb-3">{title}</h1>
        <p className="text-surface-600 mb-2 leading-relaxed">{body}</p>

        {user?.email && (
          <p className="text-sm text-surface-400 mb-6">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-primary w-full justify-center py-3"
          >
            {signingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </>
            )}
          </button>

          <a
            href="https://getkidshub.com"
            className="btn-secondary w-full justify-center py-3"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to KidsHub.com
          </a>

          <Link
            to="/login"
            className="text-sm text-surface-500 hover:text-surface-700 mt-2"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
