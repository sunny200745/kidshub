import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Palette,
  Building,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Mail,
  Smartphone,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Avatar, Badge, Button, TierBadge } from '../components/ui';
import { useAuth } from '../contexts';
import { useEntitlements, useFeature } from '../hooks';
import { centersApi } from '../firebase/api/centers';
import { ADMIN_UIDS, STARTER_FREE_DAYS, TIERS, TIERS_ARRAY } from '../config/product';
import { UpgradeCTA } from '../components/UpgradeCTA';

function SettingsSection({ icon: Icon, title, description, tierFeature, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-surface-900">{title}</h3>
              {tierFeature && <TierBadge feature={tierFeature} />}
            </div>
            {description && (
              <p className="text-sm text-surface-500">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

function SettingsItem({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
      <div>
        <p className="font-medium text-surface-900">{label}</p>
        {description && (
          <p className="text-sm text-surface-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-500' : 'bg-surface-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    activityUpdates: true,
    messages: true,
    announcements: true,
  });

  const [darkMode, setDarkMode] = useState(false);

  return (
    <Layout title="Settings" subtitle="Manage your preferences">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <Avatar name="David Kim" size="xl" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-surface-900">
                  David Kim
                </h2>
                <p className="text-surface-500">Director</p>
                <p className="text-sm text-surface-400">david.kim@example.com</p>
              </div>
              <Button variant="secondary">Edit Profile</Button>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Manage how you receive notifications"
        >
          <SettingsItem
            label="Email Notifications"
            description="Receive notifications via email"
          >
            <Toggle
              checked={notifications.email}
              onChange={(v) =>
                setNotifications({ ...notifications, email: v })
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Push Notifications"
            description="Receive push notifications on your device"
          >
            <Toggle
              checked={notifications.push}
              onChange={(v) =>
                setNotifications({ ...notifications, push: v })
              }
            />
          </SettingsItem>
          <SettingsItem
            label="SMS Notifications"
            description="Receive important alerts via SMS"
          >
            <Toggle
              checked={notifications.sms}
              onChange={(v) =>
                setNotifications({ ...notifications, sms: v })
              }
            />
          </SettingsItem>

          <div className="pt-4 border-t border-surface-100">
            <p className="text-sm font-medium text-surface-700 mb-4">
              Notification Types
            </p>
            <SettingsItem label="Activity Updates">
              <Toggle
                checked={notifications.activityUpdates}
                onChange={(v) =>
                  setNotifications({ ...notifications, activityUpdates: v })
                }
              />
            </SettingsItem>
            <SettingsItem label="Parent Messages">
              <Toggle
                checked={notifications.messages}
                onChange={(v) =>
                  setNotifications({ ...notifications, messages: v })
                }
              />
            </SettingsItem>
            <SettingsItem label="Announcements">
              <Toggle
                checked={notifications.announcements}
                onChange={(v) =>
                  setNotifications({ ...notifications, announcements: v })
                }
              />
            </SettingsItem>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize how KidsHub looks"
        >
          <SettingsItem
            label="Dark Mode"
            description="Use dark theme"
          >
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </SettingsItem>
          <SettingsItem
            label="Language"
            description="Select your preferred language"
          >
            <div className="flex items-center gap-2 text-surface-600">
              <Globe className="w-4 h-4" />
              <span className="text-sm">English (US)</span>
              <ChevronRight className="w-4 h-4 text-surface-400" />
            </div>
          </SettingsItem>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Manage your security settings"
        >
          <SettingsItem
            label="Password"
            description="Last changed 30 days ago"
          >
            <Button variant="secondary" size="sm">
              Change
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
          >
            <Badge variant="success">Enabled</Badge>
          </SettingsItem>
          <SettingsItem
            label="Active Sessions"
            description="Manage your active sessions"
          >
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
        </SettingsSection>

        {/* Center Settings */}
        <SettingsSection
          icon={Building}
          title="Center Settings"
          description="Manage daycare center information"
        >
          <SettingsItem
            label="Center Information"
            description="Name, address, contact details"
          >
            <Button variant="ghost" size="sm">
              Edit
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Operating Hours"
            description="Set your center's hours of operation"
          >
            <Button variant="ghost" size="sm">
              Configure
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Classroom Setup"
            description="Manage classrooms and capacity"
          >
            <Button variant="ghost" size="sm">
              Manage
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
        </SettingsSection>

        {/* Branding (D11 — Sprint 6). Pro+ only; Starter sees an upgrade CTA. */}
        <BrandingSection />

        {/* Billing — live tier info from centers/{ownerId}. Sprint 3 (E3)
            wires this up to a real /plans page + Stripe self-serve. */}
        <BillingSection />

        {/* Admin — demo-mode toggle. Only visible to UIDs in ADMIN_UIDS (see
            config/product.ts). Lets a KidsHub operator flip `demoMode` on
            their own center doc to bypass all feature gates for a sales demo.
            Security boundary is the Firestore rule (owners only on write),
            not this client guard — it's a UX refinement. */}
        <AdminSection />

        {/* Help */}
        <SettingsSection
          icon={HelpCircle}
          title="Help & Support"
          description="Get help with KidsHub"
        >
          <SettingsItem label="Help Center">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="Contact Support">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="What's New">
            <Badge variant="brand">3 updates</Badge>
          </SettingsItem>
          <SettingsItem label="Privacy Policy">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="Terms of Service">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
        </SettingsSection>

        {/* App Version */}
        <div className="text-center py-4 text-sm text-surface-400">
          <p>KidsHub v1.0.0</p>
          <p className="mt-1">Made with ❤️ for childcare providers</p>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Live billing/plan section — reads the current owner's plan, Starter
 * free-window days left, and demoMode state from useEntitlements().
 *
 * Upgrade button routes to the in-dashboard `/plans` page, which hosts the
 * 3-tier comparison and the contact-sales form that writes to the `leads/`
 * collection. Stripe self-serve lands in Track F.
 */
function BillingSection() {
  const navigate = useNavigate();
  const {
    loading,
    tier,
    effectiveTier,
    starterDaysLeft,
    starterPromoExpired,
    demoMode,
  } = useEntitlements();

  if (loading) {
    return (
      <SettingsSection
        icon={CreditCard}
        title="Plan & billing"
        description="Manage subscription and billing"
      >
        <div className="py-6 flex items-center gap-3 text-surface-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your plan…
        </div>
      </SettingsSection>
    );
  }

  const tierInfo = TIERS[tier] ?? TIERS.starter;
  const price =
    tierInfo.monthlyPriceUsd === null
      ? '—'
      : tierInfo.monthlyPriceUsd === 0
      ? `Free for ${STARTER_FREE_DAYS} days`
      : `$${tierInfo.monthlyPriceUsd}/month`;

  return (
    <SettingsSection
      icon={CreditCard}
      title="Plan & billing"
      description="Manage subscription and billing"
    >
      <div className="p-4 bg-brand-50 rounded-xl mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand">{tierInfo.name} plan</Badge>
              {demoMode && <Badge variant="warning">Demo mode</Badge>}
              {tier === 'starter' && starterDaysLeft !== null && (
                <Badge variant={starterPromoExpired || starterDaysLeft <= 3 ? 'danger' : 'info'}>
                  {starterPromoExpired
                    ? 'Free window ended'
                    : `${starterDaysLeft} free day${starterDaysLeft === 1 ? '' : 's'} left`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-surface-600 mt-1">{price}</p>
            {demoMode && (
              <p className="text-xs text-surface-500 mt-1">
                Every paid feature is currently unlocked for your demo. Switch
                off demo mode below to preview what real customers see.
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/plans')}
          >
            {tier === 'premium' ? 'Contact sales' : 'See plans'}
          </Button>
        </div>
      </div>
      <SettingsItem
        label="Current effective plan"
        description={
          demoMode
            ? 'Premium (via demo mode)'
            : starterPromoExpired
            ? 'Starter (free window ended — paywall active)'
            : tierInfo.name
        }
      >
        <Badge variant={effectiveTier === 'premium' ? 'accent' : 'brand'}>
          {TIERS[effectiveTier]?.name ?? effectiveTier}
        </Badge>
      </SettingsItem>
    </SettingsSection>
  );
}

/**
 * Admin-only section. Appears only for KidsHub staff UIDs listed in
 * ADMIN_UIDS (config/product.ts). The Firestore rule on centers/{ownerId}
 * is the actual security boundary — this is a UX filter so random
 * production owners don't see an "enable demo mode" toggle.
 *
 * Houses two tools:
 *   1. Demo mode — one-click "unlock everything" for sales demos.
 *   2. Plan override (QA) — one-click switch between Starter / Pro /
 *      Premium to verify that FeatureGate + UpgradeCTA banners render
 *      correctly on every paid surface. The legacy `trial` key is also
 *      listed so QA can reproduce the one-shot legacy-trial migration
 *      path (migrateLegacyTrialToStarter flips it back to Starter on
 *      the next snapshot — the button round-trips through that flow).
 */
function AdminSection() {
  const { user } = useAuth();
  const { loading, demoMode, tier, effectiveTier } = useEntitlements();
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState(null);

  const [planPending, setPlanPending] = useState(null);
  const [planJustSaved, setPlanJustSaved] = useState(null);
  const [planError, setPlanError] = useState(null);

  const isAdmin = !!user && ADMIN_UIDS.includes(user.uid);
  if (!isAdmin) return null;

  const handleToggle = async (nextValue) => {
    setPending(true);
    setError(null);
    try {
      await centersApi.setDemoMode(nextValue);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('[AdminSection] setDemoMode failed:', err);
      setError(err?.message ?? 'Failed to toggle demo mode.');
    } finally {
      setPending(false);
    }
  };

  const handleSetPlan = async (nextPlan) => {
    if (planPending) return;
    setPlanPending(nextPlan);
    setPlanError(null);
    try {
      await centersApi.setPlan(nextPlan);
      setPlanJustSaved(nextPlan);
      setTimeout(() => setPlanJustSaved(null), 2500);
    } catch (err) {
      console.error('[AdminSection] setPlan failed:', err);
      setPlanError(err?.message ?? `Failed to switch to ${nextPlan}.`);
    } finally {
      setPlanPending(null);
    }
  };

  return (
    <SettingsSection
      icon={Sparkles}
      title="Admin tools"
      description="Visible only to KidsHub staff"
    >
      <SettingsItem
        label="Demo mode"
        description="Unlocks every paid feature on this center for sales demos. Switch off before handing the account back to a real customer."
      >
        <div className="flex items-center gap-3">
          {pending && <Loader2 className="w-4 h-4 animate-spin text-surface-400" />}
          {justSaved && <CheckCircle2 className="w-4 h-4 text-success-500" />}
          <Toggle
            checked={demoMode && !loading}
            onChange={handleToggle}
          />
        </div>
      </SettingsItem>
      {error && (
        <p className="text-sm text-danger-600 mt-2">{error}</p>
      )}

      <SettingsItem
        label="Plan override (QA)"
        description="One-click switch for verifying gates and the /paywall redirect. To test paywall, switch to Starter then manually edit starterStartedAt to 61+ days ago in Firestore."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {TIERS_ARRAY.filter((k) => k !== 'trial').map((planKey) => {
            const isCurrent = tier === planKey;
            const isPending = planPending === planKey;
            const wasJustSaved = planJustSaved === planKey;
            const disabled = !!planPending || isCurrent;
            return (
              <button
                key={planKey}
                type="button"
                onClick={() => handleSetPlan(planKey)}
                disabled={disabled}
                title={isCurrent ? 'Current plan' : `Switch to ${TIERS[planKey].name}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-surface-200 text-surface-700 hover:border-brand-300 hover:text-brand-700'
                } ${planPending && !isPending ? 'opacity-50' : ''} ${disabled && !isCurrent ? 'cursor-not-allowed' : ''}`}
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {wasJustSaved && <CheckCircle2 className="w-3 h-3 text-success-500" />}
                {TIERS[planKey].name}
              </button>
            );
          })}
        </div>
      </SettingsItem>
      <div className="text-xs text-surface-500 -mt-2">
        Current plan:{' '}
        <code className="bg-surface-100 px-1.5 py-0.5 rounded text-surface-700">
          {tier}
        </code>
        {effectiveTier !== tier && (
          <>
            {' · effective: '}
            <code className="bg-surface-100 px-1.5 py-0.5 rounded text-surface-700">
              {effectiveTier}
            </code>
          </>
        )}
      </div>
      {planError && (
        <p className="text-sm text-danger-600 mt-2">{planError}</p>
      )}

      <div className="mt-2 text-xs text-surface-500">
        Your admin UID:{' '}
        <code className="bg-surface-100 px-1.5 py-0.5 rounded text-surface-700">
          {user.uid}
        </code>
      </div>
    </SettingsSection>
  );
}

/**
 * BrandingSection (D11 — Sprint 6).
 *
 * Owner-facing custom branding:
 *   - Logo URL (optional, stored as centers/{ownerId}.logoUrl)
 *   - Accent color (hex, stored as centers/{ownerId}.accentColor)
 *
 * Feature-gated by `customBranding` (Pro+). Starter tenants see an
 * UpgradeCTA card instead of the inputs.
 *
 * MVP shortcut: we take a logo URL rather than a native file upload.
 * A follow-up PR wires Firebase Storage + image crop; for pilot
 * customers this is enough (most daycares already host a logo on
 * their existing site).
 */
function BrandingSection() {
  const feature = useFeature('customBranding');
  const [center, setCenter] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [logoUrl, setLogoUrl] = React.useState('');
  const [accent, setAccent] = React.useState('#FF2D8A');
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const unsub = centersApi.subscribeToSelfCenter(
      (c) => {
        setCenter(c);
        if (c?.logoUrl && !logoUrl) setLogoUrl(c.logoUrl);
        if (c?.accentColor && accent === '#FF2D8A') setAccent(c.accentColor);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!feature.enabled) {
    return (
      <SettingsSection
        icon={Palette}
        title="Branding"
        description="Custom logo + accent color on parent and teacher apps"
        tierFeature="customBranding"
      >
        <UpgradeCTA
          feature="customBranding"
          upgradeTo={feature.upgradeTo}
          variant="card"
        />
      </SettingsSection>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await centersApi.updateBranding({
        logoUrl: logoUrl.trim(),
        accentColor: accent.trim(),
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('[BrandingSection] updateBranding failed:', err);
      setError(err?.message ?? 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      icon={Palette}
      title="Branding"
      description="Shown in the teacher and parent apps"
      tierFeature="customBranding"
    >
      {loading ? (
        <div className="py-4 flex items-center gap-2 text-surface-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading branding…
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yourdaycare.com/logo.png"
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="mt-2 h-12 rounded-lg border border-surface-100 bg-white p-1 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Accent color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-surface-200"
                aria-label="Accent color picker"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="flex-1 rounded-xl border border-surface-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <p className="text-xs text-surface-500 mt-1.5">
              Used for buttons and accents in the teacher app. Parents see a
              hint of it in their navigation.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            >
              Save branding
            </Button>
            {justSaved && (
              <span className="text-sm text-success-600 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            {error && (
              <span className="text-sm text-danger-600">{error}</span>
            )}
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
