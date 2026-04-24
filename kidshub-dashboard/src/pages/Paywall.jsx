/**
 * Paywall — full-screen takeover shown to owners whose 60-day Starter
 * free window has elapsed and who haven't upgraded.
 *
 * How it's reached:
 *   - ProtectedRoute checks `useEntitlements().starterPromoExpired` on
 *     every navigation. When true for a non-admin owner it redirects
 *     any non-exempt route to `/paywall`. Exempt routes are `/paywall`
 *     itself and `/plans` (so owners can review tier details) plus
 *     the unauth routes (/login, /register, /unauthorized).
 *   - Admins (ADMIN_UIDS) bypass the redirect entirely, otherwise the
 *     admin QA tool on /settings would be unreachable the moment a
 *     test-owner's window expired.
 *
 * Why its own route rather than a modal over the dashboard:
 *   - The browser URL reflects state. Support can say "please share
 *     the URL you're on" and we get `/paywall` immediately.
 *   - The page is rendered OUTSIDE <Layout> (no sidebar, no header),
 *     which visually communicates "your workspace is paused" far
 *     more strongly than a dismissible dialog.
 *   - Deep-linking from email (e.g. "Your center is paused — click
 *     here to reactivate") is trivial: https://dashboard.../paywall.
 *
 * Contact path:
 *   - Primary CTA opens <ContactSalesModal> (shared with /plans). Lead
 *     POSTs to getkidshub.com/api/contact-sales with source
 *     "dashboard:/paywall" so ops can distinguish paywall leads from
 *     pricing-page-curious leads in the `leads/` collection.
 *   - Secondary CTA routes to /plans (tier detail view).
 *   - Tertiary CTA signs the owner out — the "I'm done" exit.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Lock,
  ArrowRight,
  LogOut,
  Mail,
  Sparkles,
} from 'lucide-react';

import { auth } from '../firebase/config';
import { Button } from '../components/ui';
import { ContactSalesModal } from '../components/ContactSalesModal';
import { useAuth } from '../contexts';
import { useEntitlements } from '../hooks';
import { STARTER_FREE_DAYS, TIERS } from '../config/product';

export default function Paywall() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { center } = useEntitlements();
  const [showContact, setShowContact] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const centerName = center?.name || profile?.daycareName || 'your center';
  const ownerName = profile?.firstName || user?.displayName || null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      // Don't block the UI — user can close the tab if this fails.
      console.error('[Paywall] signOut failed:', err);
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Minimal header — no sidebar, no nav. This is NOT the dashboard. */}
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-brand">
              <span className="text-sm font-bold text-white">KH</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900">KidsHub</p>
              <p className="text-xs text-surface-500">Owner portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-surface-900 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-brand-500 text-white shadow-lg">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-surface-900 sm:text-4xl">
              {ownerName ? `${ownerName}, your` : 'Your'} free {STARTER_FREE_DAYS} days are up.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-surface-600 sm:text-lg">
              {centerName} needs an active membership to keep running.
              Pick a plan or talk to our team — your data is safe, and
              we'll have you back online within a business day.
            </p>
          </div>

          {/* Action card */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-xl sm:p-10">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
                <Sparkles className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900">
                  Ready to keep going?
                </h2>
                <p className="mt-1 text-sm text-surface-600">
                  Talk to us and we'll walk you through the right plan
                  for your center — no pressure, no credit card needed
                  to start the conversation.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowContact(true)}
                className="flex-1 justify-center"
              >
                <Mail className="h-4 w-4" />
                Contact sales
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/plans')}
                className="flex-1 justify-center"
              >
                See plan details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Plan snapshot — low-commitment tier glance right on the paywall
               so users don't have to leave this page to see pricing. */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {['pro', 'premium'].map((key) => {
                const info = TIERS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setShowContact(true);
                    }}
                    className="group rounded-2xl border border-surface-200 bg-surface-50 p-4 text-left transition-colors hover:border-brand-300 hover:bg-white"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-surface-900">
                        {info.name}
                      </span>
                      <span className="text-sm font-bold text-surface-900">
                        ${info.monthlyPriceUsd}
                        <span className="text-xs font-medium text-surface-500">
                          /mo
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-surface-500">
                      {info.tagline}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
                      Talk to us about {info.name}
                      <ArrowRight className="h-3 w-3" />
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Support footer */}
          <div className="mt-8 text-center text-sm text-surface-500">
            Questions? Email{' '}
            <a
              href="mailto:support@nuvaro.ca"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              support@nuvaro.ca
            </a>{' '}
            or sign out and come back any time — your data is preserved.
          </div>
        </div>
      </main>

      {showContact && (
        <ContactSalesModal
          isOpen={showContact}
          onClose={() => setShowContact(false)}
          interestTier="pro"
          user={user}
          center={center}
          source="dashboard:/paywall"
          headline="Reactivate your center"
          subheadline="Tell us your go-live priority and we'll send pricing + onboarding options within one business day."
        />
      )}
    </div>
  );
}
