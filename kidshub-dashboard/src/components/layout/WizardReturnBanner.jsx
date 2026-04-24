/**
 * WizardReturnBanner — contextual "← Back to setup" strip shown on
 * destination pages when the user landed there from the /welcome
 * onboarding wizard (Welcome.jsx appends `?from=welcome` to deep-links).
 *
 * Without this banner, new owners have no obvious way to return to the
 * wizard once they navigate away — the wizard exists at /welcome but
 * nothing else in the chrome surfaces it mid-flow. The Sidebar's
 * "Continue setup" item handles the case where the owner browses away
 * organically; this banner handles the immediate "I just clicked a
 * wizard card and want to go back" case.
 *
 * Renders nothing when:
 *   - the URL has no `?from=welcome` query
 *   - the user is currently ON /welcome (no point self-referring)
 *   - the user is on /paywall (entitlement-locked surface; wizard
 *     navigation isn't relevant there)
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const SUPPRESSED_PATHS = new Set(['/welcome', '/paywall', '/login', '/register']);

export function WizardReturnBanner() {
  const location = useLocation();

  if (SUPPRESSED_PATHS.has(location.pathname)) return null;

  const params = new URLSearchParams(location.search);
  if (params.get('from') !== 'welcome') return null;

  return (
    <div className="border-b border-success-100 bg-gradient-to-r from-success-50 via-white to-brand-50">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm text-surface-700 truncate">
            <span className="font-semibold text-surface-900">Setup in progress.</span>{' '}
            <span className="text-surface-600">
              Finish this step, then return to your setup checklist.
            </span>
          </p>
        </div>
        <Link
          to="/welcome"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white border border-success-200 px-3 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to setup
        </Link>
      </div>
    </div>
  );
}
