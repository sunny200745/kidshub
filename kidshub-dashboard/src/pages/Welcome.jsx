import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Palette,
  PartyPopper,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';

import { useAuth } from '../contexts';
import { useEntitlements } from '../hooks/useEntitlements';
import {
  centersApi,
  childrenApi,
  classroomsApi,
  staffApi,
} from '../firebase/api';
import { Button, Card, CardBody } from '../components/ui';

/**
 * Welcome / onboarding wizard (Stop 2 of the new-owner journey).
 *
 * New owners land here immediately after /register (Register.jsx navigates
 * to '/welcome' instead of '/'). Existing owners can reach it anytime via
 * the sidebar "Finish setup" affordance or by visiting /welcome directly.
 *
 * The wizard shows 4 cards — Personalize, Classroom, Child, Teacher — each
 * of which deep-links to the page that already owns that flow. We don't
 * rebuild those modals inline; we just route and let the user complete
 * the action there.
 *
 * Completion is auto-detected from live data (logoUrl/accentColor on the
 * center doc, counts on classrooms/children/staff). There's no separate
 * "mark done" state to manage — reality is the source of truth. This also
 * means if an owner revisits /welcome later, it honestly reflects what's
 * still missing (e.g. if they added a classroom but never a child).
 *
 * "Back to dashboard" stamps `centers/{ownerId}.onboarding.dismissedAt`.
 * That signal is primarily for future analytics — we don't gate anything
 * on it today, but it lets us eventually suppress the wizard on repeat
 * logins once the owner has seen it once.
 */

const CARD_DEFS = [
  {
    key: 'brand',
    icon: Palette,
    title: 'Personalize your brand',
    description:
      'Upload your daycare logo and pick an accent color. Parents and teachers see it on every screen.',
    href: '/settings',
    actionLabel: 'Set up branding',
    accent: 'from-pink-500 to-rose-500',
  },
  {
    key: 'classroom',
    icon: Building2,
    title: 'Create your first classroom',
    description:
      'Classrooms are how you group children by age, teacher, and daily schedule.',
    href: '/classrooms',
    actionLabel: 'Add a classroom',
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    key: 'child',
    icon: Users,
    title: 'Add your first child',
    description:
      'Create a child profile so parents can be invited and check-ins start flowing.',
    href: '/children',
    actionLabel: 'Add a child',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    key: 'teacher',
    icon: UserPlus,
    title: 'Invite your first teacher',
    description:
      'Send an email invite so your first teacher can download the KidsHub app and start logging activities.',
    href: '/staff',
    actionLabel: 'Invite a teacher',
    accent: 'from-emerald-500 to-teal-500',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tier, trialDaysLeft, center } = useEntitlements();

  const [classroomCount, setClassroomCount] = useState(null);
  const [childCount, setChildCount] = useState(null);
  const [staffCount, setStaffCount] = useState(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsubs = [
      classroomsApi.subscribe((rows) => setClassroomCount(rows?.length ?? 0)),
      childrenApi.subscribe((rows) => setChildCount(rows?.length ?? 0)),
      staffApi.subscribe((rows) => setStaffCount(rows?.length ?? 0)),
    ];
    return () => unsubs.forEach((u) => typeof u === 'function' && u());
  }, [user?.uid]);

  const completion = useMemo(() => {
    const hasBrand = !!(center?.logoUrl || center?.accentColor);
    const hasClassroom = (classroomCount ?? 0) > 0;
    const hasChild = (childCount ?? 0) > 0;
    const hasTeacher = (staffCount ?? 0) > 0;
    return {
      brand: hasBrand,
      classroom: hasClassroom,
      child: hasChild,
      teacher: hasTeacher,
    };
  }, [center?.logoUrl, center?.accentColor, classroomCount, childCount, staffCount]);

  const completedCount = Object.values(completion).filter(Boolean).length;
  const allDone = completedCount === CARD_DEFS.length;
  const progressPct = Math.round((completedCount / CARD_DEFS.length) * 100);

  const greeting = profile?.firstName ? `Welcome, ${profile.firstName}` : 'Welcome to KidsHub';

  const handleCardClick = (href) => {
    navigate(href);
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await centersApi.markOnboardingDismissed();
    } catch (err) {
      // Non-fatal: if the write fails we still let the user proceed.
      // The worst case is they re-see the wizard on next visit to /welcome,
      // which is harmless.
      console.warn('[Welcome] markOnboardingDismissed failed:', err);
    } finally {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50/40">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {tier === 'trial' && trialDaysLeft !== null
              ? `${trialDaysLeft}-day Premium trial active`
              : 'Getting started'}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-surface-900 sm:text-4xl">
            {greeting} — let's get your center live in a few minutes.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-surface-600">
            Four quick steps cover the essentials. You can skip any of them and
            come back later from the sidebar. Nothing here is mandatory — you
            already have full Premium access during your trial.
          </p>

          {/* Progress bar */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm font-medium text-surface-600">
              {completedCount} / {CARD_DEFS.length}
            </span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {CARD_DEFS.map((def) => {
            const done = completion[def.key];
            const Icon = def.icon;
            return (
              <Card
                key={def.key}
                hover
                className={`group cursor-pointer overflow-hidden transition-all ${
                  done ? 'border-success-200 bg-success-50/40' : ''
                }`}
                onClick={() => handleCardClick(def.href)}
              >
                <CardBody className="relative p-6">
                  {/* Status chip */}
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${def.accent} text-white shadow-soft`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700">
                        <Check className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-1 text-xs font-semibold text-surface-600">
                        Step {CARD_DEFS.indexOf(def) + 1}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-surface-900">
                    {def.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-surface-600">
                    {def.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors group-hover:text-brand-700">
                    {done ? 'Review' : def.actionLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-sm text-surface-500">
            {allDone ? (
              <span className="inline-flex items-center gap-2 font-semibold text-success-700">
                <PartyPopper className="h-4 w-4" />
                You're all set — time to head to the dashboard.
              </span>
            ) : (
              <>
                Need help? Email{' '}
                <a
                  href="mailto:support@nuvaro.ca"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  support@nuvaro.ca
                </a>
                .
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/plans"
              className="text-sm font-medium text-surface-600 hover:text-surface-900"
            >
              See plans
            </Link>
            <Button
              variant={allDone ? 'primary' : 'secondary'}
              onClick={handleDismiss}
              disabled={dismissing}
            >
              {dismissing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : allDone ? (
                <>
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "I'll finish later"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
