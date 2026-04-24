/**
 * /plans — tier comparison + upgrade entry point (Sprint 3 / E3).
 *
 * Replaces the Sprint 1 mailto placeholder on Settings → Plan & billing
 * and on every `<UpgradeCTA>` button. Shows the current plan highlighted,
 * the three purchasable tiers side-by-side, and routes upgrades through
 * a "Contact sales" flow that opens the landing `/api/contact-sales`
 * endpoint (E2) once Stripe self-serve arrives in Track F.
 *
 * Keeps copy in sync with `config/product.ts` — TIERS / QUOTAS / FEATURES
 * are the single source of truth, so tier renames or price changes here
 * are a one-file edit upstream.
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Minus, ArrowLeft, Loader2 } from 'lucide-react';

import { Layout } from '../components/layout';
import { Card, CardBody, Badge, Button } from '../components/ui';
import { ContactSalesModal } from '../components/ContactSalesModal';
import { useAuth } from '../contexts';
import { useEntitlements } from '../hooks';
import {
  FEATURES,
  FEATURE_LABELS,
  PURCHASABLE_TIERS,
  QUOTAS,
  STARTER_FREE_DAYS,
  TIERS,
  TIER_ORDER,
  tierSatisfies,
} from '../config/product';

// Feature groupings on the comparison table. Each row is rendered once per
// tier; the cell shows ✅ / — based on `tierSatisfies(tier, FEATURES[key])`
// (with QUOTAS rendered as numbers instead of checkmarks).
const FEATURE_GROUPS = [
  {
    title: 'Core (included on every plan)',
    rows: [
      {
        key: 'core.classrooms',
        label: 'Classrooms',
        kind: 'quota',
        quotaKey: 'classrooms',
      },
      { key: 'core.children', label: 'Children', kind: 'quota', quotaKey: 'children' },
      { key: 'core.staff', label: 'Staff seats', kind: 'quota', quotaKey: 'staff' },
      { key: 'core.activityLog', label: 'Activity logging', kind: 'feature' },
      { key: 'core.checkIn', label: 'Check-in / check-out', kind: 'feature' },
      { key: 'core.messaging', label: 'Parent-teacher messaging', kind: 'feature' },
      { key: 'core.announcements', label: 'Announcements', kind: 'feature' },
      { key: 'core.parentInvites', label: 'Parent invites', kind: 'feature' },
      { key: 'core.teacherInvites', label: 'Teacher invites', kind: 'feature' },
    ],
  },
  {
    title: 'Pro features',
    rows: [
      { key: 'photoJournal', kind: 'feature' },
      { key: 'dailyReports', kind: 'feature' },
      { key: 'attendanceReports', kind: 'feature' },
      { key: 'healthReports', kind: 'feature' },
      { key: 'staffClockIn', kind: 'feature' },
      { key: 'morningScreenings', kind: 'feature' },
      { key: 'weeklyPlanner', kind: 'feature' },
      { key: 'activityPlanner', kind: 'feature' },
      { key: 'customBranding', kind: 'feature' },
      { key: 'emailSupport', kind: 'feature' },
    ],
  },
  {
    title: 'Premium features',
    rows: [
      { key: 'multiDaycare', kind: 'feature' },
      { key: 'ariaAiInApp', kind: 'feature' },
      { key: 'videoSurveillance', kind: 'feature' },
      { key: 'apiAccess', kind: 'feature' },
      { key: 'dedicatedSupport', kind: 'feature' },
    ],
  },
];

function formatPrice(tier) {
  const info = TIERS[tier];
  if (info.monthlyPriceUsd == null) return '—';
  if (info.monthlyPriceUsd === 0) return `Free for ${STARTER_FREE_DAYS} days`;
  return `$${info.monthlyPriceUsd}`;
}

function renderQuota(tier, quotaKey) {
  const raw = QUOTAS[quotaKey][tier];
  if (raw === -1) return <span className="font-semibold">Unlimited</span>;
  const label = quotaKey === 'staff' ? 'seats' : quotaKey;
  return (
    <span className="font-semibold">
      {raw} {label === 'classrooms' ? 'classroom' + (raw === 1 ? '' : 's') : label}
    </span>
  );
}

function renderFeatureCell(tier, featureKey) {
  const requiredTier = FEATURES[featureKey];
  const included = tierSatisfies(tier, requiredTier);
  return included ? (
    <Check className="w-5 h-5 text-success-500 mx-auto" />
  ) : (
    <Minus className="w-5 h-5 text-surface-300 mx-auto" />
  );
}

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    loading,
    tier,
    effectiveTier,
    starterDaysLeft,
    starterPromoExpired,
    demoMode,
    center,
  } = useEntitlements();

  // Pre-fill the contact form from URL like /plans?tier=pro&feature=photoJournal
  // so `<UpgradeCTA>` and Settings deep-link into the right context.
  const initialInterestTier = useMemo(() => {
    const t = searchParams.get('tier');
    return PURCHASABLE_TIERS.includes(t) ? t : null;
  }, [searchParams]);
  const initialFeature = searchParams.get('feature') || '';

  const [showContact, setShowContact] = useState(
    initialInterestTier !== null || initialFeature !== ''
  );
  const [interestTier, setInterestTier] = useState(initialInterestTier ?? 'pro');

  const highlightedTier = effectiveTier;

  if (loading) {
    return (
      <Layout title="Plans" subtitle="Compare tiers and upgrade">
        <div className="flex items-center justify-center py-24 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading your plan…
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Plans" subtitle="Compare tiers and upgrade when you're ready">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back + current-plan banner */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand">Your plan: {TIERS[tier].name}</Badge>
            {demoMode && <Badge variant="warning">Demo mode</Badge>}
            {tier === 'starter' && starterDaysLeft !== null && (
              <Badge variant={starterPromoExpired || starterDaysLeft <= 3 ? 'danger' : 'info'}>
                {starterPromoExpired
                  ? 'Free window ended'
                  : `${starterDaysLeft} free day${starterDaysLeft === 1 ? '' : 's'} left`}
              </Badge>
            )}
          </div>
        </div>

        {/* Tier cards (Starter / Pro / Premium) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PURCHASABLE_TIERS.map((t) => {
            const info = TIERS[t];
            const isCurrent = highlightedTier === t;
            const rank = TIER_ORDER[t];
            const currentRank = TIER_ORDER[highlightedTier];
            const action =
              rank > currentRank
                ? 'upgrade'
                : rank < currentRank
                ? 'downgrade'
                : 'current';

            return (
              <Card
                key={t}
                className={
                  isCurrent
                    ? 'border-2 border-brand-500 shadow-lg relative'
                    : 'border border-surface-200 relative'
                }
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="brand">Current plan</Badge>
                  </div>
                )}
                <CardBody className="space-y-5">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-2xl font-bold text-surface-900">
                        {info.name}
                      </h3>
                      {t === 'pro' && <Badge variant="info">Most popular</Badge>}
                    </div>
                    <p className="text-sm text-surface-500 mt-1">
                      {info.tagline}
                    </p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-surface-900">
                        {formatPrice(t)}
                      </span>
                      {info.monthlyPriceUsd != null && info.monthlyPriceUsd > 0 && (
                        <span className="text-sm text-surface-500 ml-1">
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-surface-700">
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                      {QUOTAS.classrooms[t] === -1
                        ? 'Unlimited classrooms'
                        : `${QUOTAS.classrooms[t]} classroom${QUOTAS.classrooms[t] === 1 ? '' : 's'}`}
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                      {QUOTAS.children[t] === -1
                        ? 'Unlimited children'
                        : `Up to ${QUOTAS.children[t]} children`}
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                      {QUOTAS.staff[t] === -1
                        ? 'Unlimited staff seats'
                        : `${QUOTAS.staff[t]} staff seat${QUOTAS.staff[t] === 1 ? '' : 's'}`}
                    </li>
                    {t !== 'starter' && (
                      <li className="flex gap-2">
                        <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                        Everything in {t === 'pro' ? 'Starter' : 'Pro'}, plus…
                      </li>
                    )}
                    {t === 'pro' && (
                      <>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          Photo journal + daily reports
                        </li>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          Staff clock-in + timesheets
                        </li>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          Weekly + activity planner
                        </li>
                      </>
                    )}
                    {t === 'premium' && (
                      <>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          Multi-daycare per owner
                        </li>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          Aria AI in-app assistant
                        </li>
                        <li className="flex gap-2">
                          <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                          API access + dedicated support
                        </li>
                      </>
                    )}
                  </ul>

                  <Button
                    variant={action === 'current' ? 'secondary' : 'primary'}
                    className="w-full"
                    disabled={action === 'current'}
                    onClick={() => {
                      setInterestTier(t);
                      setShowContact(true);
                    }}
                  >
                    {action === 'current'
                      ? 'Your current plan'
                      : action === 'upgrade'
                      ? `Contact sales to upgrade`
                      : 'Contact sales to change plan'}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Detailed comparison table */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold text-surface-900 mb-4">
              Compare features
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-3 pr-4 font-semibold text-surface-700">
                      Feature
                    </th>
                    {PURCHASABLE_TIERS.map((t) => (
                      <th
                        key={t}
                        className={`py-3 px-4 font-semibold text-center ${
                          highlightedTier === t ? 'text-brand-600' : 'text-surface-700'
                        }`}
                      >
                        {TIERS[t].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_GROUPS.map((group) => (
                    <React.Fragment key={group.title}>
                      <tr>
                        <td
                          colSpan={1 + PURCHASABLE_TIERS.length}
                          className="pt-5 pb-1 text-xs font-bold uppercase tracking-wider text-surface-500"
                        >
                          {group.title}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-surface-100 last:border-0"
                        >
                          <td className="py-3 pr-4 text-surface-800">
                            {row.label || FEATURE_LABELS[row.key] || row.key}
                          </td>
                          {PURCHASABLE_TIERS.map((t) => (
                            <td
                              key={t}
                              className={`py-3 px-4 text-center ${
                                highlightedTier === t ? 'bg-brand-50/40' : ''
                              }`}
                            >
                              {row.kind === 'quota'
                                ? renderQuota(t, row.quotaKey)
                                : renderFeatureCell(t, row.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

      </div>

      {/* Contact sales modal — opens over the Plans content when the
         CTA buttons fire. Conditional mount resets form state on every
         reopen, which is what users expect after cancelling midway. */}
      {showContact && (
        <ContactSalesModal
          isOpen={showContact}
          onClose={() => setShowContact(false)}
          interestTier={interestTier}
          interestFeature={initialFeature}
          user={user}
          center={center}
          source="dashboard:/plans"
        />
      )}
    </Layout>
  );
}

