/**
 * /unlock — paid-feature discovery tab.
 *
 * A single grid of every Pro and Premium capability the product offers,
 * each represented as a card with an icon, one-line pitch, and the
 * familiar "Unlock" pill. Clicking a card opens an informational modal
 * that names the exact tier required and deep-links into `/plans` with
 * the feature + tier pre-selected so the contact-sales form opens
 * already scoped to what the user was interested in.
 *
 * Why a dedicated tab?
 *   Upgrade pills scattered across the product are good reinforcement,
 *   but users rarely compare features in the middle of a workflow. This
 *   page is pure discovery — a marketing surface inside the app where
 *   owners can browse everything they'd gain by upgrading, without
 *   hunting through ten screens. Conversion surface; not part of any
 *   daily workflow.
 *
 * Source of truth:
 *   Feature keys, labels, and required tiers come from
 *   `config/product.ts` (FEATURES, FEATURE_LABELS, TIERS). The per-card
 *   copy (icon + pitch) lives in this file because it's marketing copy,
 *   not product config — changing a pitch shouldn't require touching
 *   the entitlement layer.
 *
 * Not gated:
 *   This tab is browsable by every tier, including Starter. There is
 *   no TierBadge on the sidebar nav item — the whole point is to pull
 *   lower-tier users up.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Camera,
  Clock,
  Code,
  FileText,
  Headphones,
  Lock,
  Mail,
  Palette,
  Sparkles,
  Stethoscope,
  Thermometer,
  Video,
} from 'lucide-react';

import { Layout } from '../components/layout';
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalFooter,
  TierBadge,
} from '../components/ui';
import { FEATURES, FEATURE_LABELS, TIERS } from '../config/product';

// Per-card marketing copy. Order within each tier is roughly the order
// we'd want to sell users on — most "demo-able" / most-requested first.
const FEATURE_CATALOG = [
  {
    key: 'photoJournal',
    icon: Camera,
    pitch:
      'Share classroom photos and videos with parents in a moderated daily feed.',
  },
  {
    key: 'dailyReports',
    icon: FileText,
    pitch:
      'Auto-generate a per-child end-of-day summary — meals, naps, activities, mood.',
  },
  {
    key: 'attendanceReports',
    icon: Clock,
    pitch:
      'Track staff clock-in shifts and export CSV timesheets for payroll.',
  },
  {
    key: 'healthReports',
    icon: Stethoscope,
    pitch:
      'Log symptoms, medication, incidents, and injuries with a compliance-ready audit trail.',
  },
  {
    key: 'staffClockIn',
    icon: Clock,
    pitch:
      'Teachers clock in and out from the mobile app; you get a live "who is on shift" view.',
  },
  {
    key: 'morningScreenings',
    icon: Thermometer,
    pitch:
      'Drop-off health screenings — temperature, symptoms, caregiver sign-off — stored per child.',
  },
  {
    key: 'weeklyPlanner',
    icon: Calendar,
    pitch:
      'Plan the week across classrooms and publish it to parents so drop-off is predictable.',
  },
  {
    key: 'activityPlanner',
    icon: Activity,
    pitch:
      'Build reusable activity templates (art, STEM, outdoor) and assign them to any classroom.',
  },
  {
    key: 'customBranding',
    icon: Palette,
    pitch:
      'Upload your logo, pick brand colors, and ship parent-facing emails in your identity.',
  },
  {
    key: 'emailSupport',
    icon: Mail,
    pitch:
      'Priority email support with a 1-business-day response SLA.',
  },
  {
    key: 'multiDaycare',
    icon: Building2,
    pitch:
      'Manage multiple centers from one owner account — roll up reports and share staff.',
  },
  {
    key: 'ariaAiInApp',
    icon: Bot,
    pitch:
      'In-app AI assistant that drafts reports, answers parent questions, and flags incidents.',
  },
  {
    key: 'videoSurveillance',
    icon: Video,
    pitch:
      'Live camera feeds across every classroom, with parent viewing windows and audit logs.',
  },
  {
    key: 'apiAccess',
    icon: Code,
    pitch:
      'REST API + webhooks to sync children, staff, and attendance with your billing system.',
  },
  {
    key: 'dedicatedSupport',
    icon: Headphones,
    pitch:
      'Named account manager, quarterly check-ins, and a private Slack channel.',
  },
];

// Cosmetic accents per tier. Keeps the two sections visually distinct
// without shouting — Pro in brand pink, Premium in accent violet.
const TIER_THEMES = {
  pro: {
    badge: 'bg-brand-50 text-brand-700 border border-brand-200',
    iconWrap: 'bg-brand-50 text-brand-600',
  },
  premium: {
    badge: 'bg-accent-50 text-accent-700 border border-accent-200',
    iconWrap: 'bg-accent-50 text-accent-600',
  },
};

function groupByTier() {
  const pro = [];
  const premium = [];
  for (const entry of FEATURE_CATALOG) {
    const tier = FEATURES[entry.key];
    const bundle = {
      ...entry,
      label: FEATURE_LABELS[entry.key] ?? entry.key,
      tier,
    };
    if (tier === 'pro') pro.push(bundle);
    else if (tier === 'premium') premium.push(bundle);
  }
  return { pro, premium };
}

export default function Unlock() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const { pro, premium } = React.useMemo(groupByTier, []);

  const handleViewPlans = () => {
    if (!active) return;
    const params = new URLSearchParams();
    params.set('tier', active.tier);
    params.set('feature', active.key);
    setActive(null);
    navigate(`/plans?${params.toString()}`);
  };

  return (
    <Layout
      title="Unlock features"
      subtitle="Everything you’ll gain by upgrading to Pro or Premium"
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        <IntroCard onBrowsePlans={() => navigate('/plans')} />
        <TierSection
          title="Pro features"
          tagline={TIERS.pro?.tagline ?? 'For growing centers'}
          theme={TIER_THEMES.pro}
          items={pro}
          onSelect={setActive}
        />
        <TierSection
          title="Premium features"
          tagline={TIERS.premium?.tagline ?? 'For multi-center operators'}
          theme={TIER_THEMES.premium}
          items={premium}
          onSelect={setActive}
        />
      </div>

      <UpgradeRequiredModal
        item={active}
        onClose={() => setActive(null)}
        onViewPlans={handleViewPlans}
      />
    </Layout>
  );
}

function IntroCard({ onBrowsePlans }) {
  return (
    <Card>
      <CardBody className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-brand flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-surface-900">
            Browse what’s behind the Unlock badge
          </h2>
          <p className="text-sm text-surface-500 mt-0.5">
            Tap any card to see exactly which plan unlocks it. Ready to
            commit? Jump straight to the plan comparison.
          </p>
        </div>
        <Button variant="primary" onClick={onBrowsePlans} className="flex-shrink-0">
          Compare plans <ArrowRight className="w-4 h-4" />
        </Button>
      </CardBody>
    </Card>
  );
}

function TierSection({ title, tagline, theme, items, onSelect }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3 px-1">
        <h2 className="text-base font-semibold text-surface-900">{title}</h2>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${theme.badge}`}>
          {tagline}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <FeatureCard
            key={item.key}
            item={item}
            theme={theme}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ item, theme, onSelect }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="text-left w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded-2xl"
    >
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-soft-lg">
        <CardBody className="flex flex-col h-full gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconWrap}`}>
              <Icon className="w-5 h-5" />
            </div>
            <TierBadge feature={item.key} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-surface-900">{item.label}</h3>
            <p className="text-sm text-surface-500 mt-1">{item.pitch}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 pt-1">
            Learn more <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </CardBody>
      </Card>
    </button>
  );
}

function UpgradeRequiredModal({ item, onClose, onViewPlans }) {
  if (!item) return null;
  const tierInfo = TIERS[item.tier];
  const tierName = tierInfo?.name ?? 'paid';

  return (
    <Modal isOpen={!!item} onClose={onClose} title="Membership required" size="sm">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-brand-100 text-brand-600">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-700">
            <span className="font-semibold">{item.label}</span> is part of
            the <span className="font-semibold">{tierName}</span> plan.
            Upgrade your membership to unlock it — plus everything else
            included in {tierName}.
          </p>
          {tierInfo?.tagline ? (
            <p className="text-sm text-surface-500 mt-2">
              {tierInfo.tagline}.
            </p>
          ) : null}
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Maybe later
        </Button>
        <Button variant="primary" onClick={onViewPlans}>
          View plans <ArrowRight className="w-4 h-4" />
        </Button>
      </ModalFooter>
    </Modal>
  );
}
