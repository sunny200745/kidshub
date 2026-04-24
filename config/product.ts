/**
 * KidsHub product configuration — single source of truth.
 *
 * ANY time you change tier boundaries, pricing, quotas, feature mappings,
 * or admin allowlist — edit this file. Both `kidshub-dashboard` and
 * `kidshub` import from here, so one edit flows everywhere.
 *
 * This is a pure-TypeScript module (no runtime deps). Safe to import from
 * Vite (dashboard), Metro (kidshub Expo), and Node (serverless APIs).
 *
 * Placeholder values below are from PRODUCT_PLAN.md's strawman. They are
 * flagged `TODO(pricing)` / `TODO(limits)` / etc. — search for `TODO(` to
 * see every decision that's still open. Ship-as-is is fine; revise before
 * first-customer close.
 */

// ─── Tier identities ──────────────────────────────────────────────────

/**
 * Canonical tier keys. Stored on `centers/{ownerId}.plan` in Firestore.
 * Adding a tier? Append here AND update `TIER_ORDER` AND `TIERS`.
 */
export const TIERS_ARRAY = ['trial', 'starter', 'pro', 'premium'] as const;
export type Tier = (typeof TIERS_ARRAY)[number];

/**
 * Ordered by ascending capability. Used to answer "does tier X satisfy
 * requirement Y" via `tierIndex(x) >= tierIndex(y)`. Trial ranks equal to
 * premium because during trial the customer gets full access.
 */
export const TIER_ORDER: Record<Tier, number> = {
  starter: 0,
  pro: 1,
  premium: 2,
  trial: 2, // intentional — trial == premium while active
};

export function tierSatisfies(current: Tier, required: Tier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

// ─── Tier display metadata ────────────────────────────────────────────

/**
 * Human-readable tier info. Used by the pricing page, upgrade CTAs, and
 * the dashboard plan indicator.
 *
 * TODO(pricing): swap the $39 / $99 placeholders before first-customer.
 * TODO(names): confirm generic names vs branded (Sprout/Bloom/Canopy).
 */
export const TIERS: Record<Tier, {
  key: Tier;
  /** Display name shown on pricing pages + upgrade CTAs. */
  name: string;
  /** One-line positioning for the pricing page. */
  tagline: string;
  /** USD/month. `null` = not a purchasable plan (trial, enterprise). */
  monthlyPriceUsd: number | null;
  /** Purely cosmetic — used as accent color for plan badges. */
  accentColor: string;
}> = {
  trial: {
    key: 'trial',
    name: 'Trial',
    tagline: '14 days of full Premium access, free',
    monthlyPriceUsd: null,
    accentColor: '#8B5CF6', // purple
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    tagline: 'Free forever for tiny daycares',
    monthlyPriceUsd: 0,
    accentColor: '#64748B', // slate
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'For growing daycares that need the operational tooling',
    monthlyPriceUsd: 39, // TODO(pricing): confirm
    accentColor: '#14B8A6', // teal
  },
  premium: {
    key: 'premium',
    name: 'Premium',
    tagline: 'Multi-location operators, AI, and unlimited everything',
    monthlyPriceUsd: 99, // TODO(pricing): confirm
    accentColor: '#E11D74', // brand pink
  },
};

// ─── Trial configuration ──────────────────────────────────────────────

/** TODO(trial): confirm 14 days vs 30 before GA. */
export const TRIAL_DURATION_DAYS = 14;

// ─── Quotas (per-tier numeric limits) ─────────────────────────────────

/**
 * Hard limits enforced on the dashboard's create APIs AND in Firestore
 * rules (via `planAllows()` helper). `Infinity` encoded as `-1` because
 * Firestore rules don't support `Infinity`.
 *
 * TODO(limits): confirm Starter/Pro limits aren't too tight / too loose.
 */
export type QuotaKey = 'classrooms' | 'children' | 'staff';

export const QUOTAS: Record<QuotaKey, Record<Tier, number>> = {
  classrooms: { trial: -1, starter: 1, pro: 5, premium: -1 },
  children: { trial: -1, starter: 15, pro: 75, premium: -1 },
  staff: { trial: -1, starter: 2, pro: 15, premium: -1 },
};

/** Returns `Infinity` for -1 (unlimited sentinel). */
export function quotaFor(key: QuotaKey, tier: Tier): number {
  const raw = QUOTAS[key][tier];
  return raw === -1 ? Infinity : raw;
}

// ─── Feature flags (per-tier boolean capability map) ──────────────────

/**
 * Feature keys are the vocabulary `useFeature()` and `<FeatureGate>`
 * accept. Keep them short and stable — they appear in rules + analytics.
 *
 * When adding a new feature: add the key here, map it to the minimum
 * tier that unlocks it, then reference it from UI with
 * `useFeature('photoJournal')` or `<FeatureGate feature="photoJournal">`.
 */
export type FeatureKey =
  // Core (free on every tier, listed for completeness)
  | 'core.classrooms'
  | 'core.children'
  | 'core.staff'
  | 'core.messaging'
  | 'core.announcements'
  | 'core.activityLog'
  | 'core.checkIn'
  | 'core.parentInvites'
  | 'core.teacherInvites'
  // Pro
  | 'photoJournal'
  | 'dailyReports'
  | 'attendanceReports'
  | 'healthReports'
  | 'staffClockIn'
  | 'morningScreenings'
  | 'weeklyPlanner'
  | 'activityPlanner'
  | 'customBranding'
  | 'emailSupport'
  // Premium
  | 'multiDaycare'
  | 'ariaAiInApp'
  | 'apiAccess'
  | 'dedicatedSupport';

/**
 * Minimum tier required to unlock each feature. `useFeature(key)` checks
 * `tierSatisfies(currentTier, FEATURES[key])`.
 */
export const FEATURES: Record<FeatureKey, Tier> = {
  'core.classrooms': 'starter',
  'core.children': 'starter',
  'core.staff': 'starter',
  'core.messaging': 'starter',
  'core.announcements': 'starter',
  'core.activityLog': 'starter',
  'core.checkIn': 'starter',
  'core.parentInvites': 'starter',
  'core.teacherInvites': 'starter',

  photoJournal: 'pro',
  dailyReports: 'pro',
  attendanceReports: 'pro',
  healthReports: 'pro',
  staffClockIn: 'pro',
  morningScreenings: 'pro',
  weeklyPlanner: 'pro',
  activityPlanner: 'pro',
  customBranding: 'pro',
  emailSupport: 'pro',

  multiDaycare: 'premium',
  ariaAiInApp: 'premium',
  apiAccess: 'premium',
  dedicatedSupport: 'premium',
};

/**
 * Human-readable label for a feature. Used in `<UpgradeCTA>` copy.
 * Keep short — fits on a banner ("Upgrade to Pro to unlock <label>").
 */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  'core.classrooms': 'Classrooms',
  'core.children': 'Children',
  'core.staff': 'Staff',
  'core.messaging': 'Parent-teacher messaging',
  'core.announcements': 'Announcements',
  'core.activityLog': 'Activity logging',
  'core.checkIn': 'Check-in / check-out',
  'core.parentInvites': 'Parent invites',
  'core.teacherInvites': 'Teacher invites',

  photoJournal: 'Photo journal',
  dailyReports: 'Daily reports',
  attendanceReports: 'Attendance reports',
  healthReports: 'Health reports',
  staffClockIn: 'Staff clock-in',
  morningScreenings: 'Morning health screenings',
  weeklyPlanner: 'Weekly planner',
  activityPlanner: 'Activity planner',
  customBranding: 'Custom branding',
  emailSupport: 'Email support',

  multiDaycare: 'Multi-daycare',
  ariaAiInApp: 'Aria AI assistant',
  apiAccess: 'API access',
  dedicatedSupport: 'Dedicated support',
};

// ─── Infrastructure holds (temporary cross-tier locks) ───────────────

/**
 * Features that are TEMPORARILY locked for every tier because the
 * underlying infrastructure isn't provisioned yet. `useFeature()` checks
 * this set FIRST — if the key is present, it returns `enabled: false`
 * with `reason: 'infra-locked'` regardless of the current tier. The
 * existing `<FeatureGate>` / `<UpgradeCTA>` plumbing then renders the
 * standard upgrade banner, so to the user it simply reads as "this is a
 * paid feature" — no broken upload attempts, no cryptic Storage errors.
 *
 * Currently holding:
 *   - `photoJournal` — photo/video uploads require Firebase Storage,
 *     which in turn requires the Blaze plan. We defer that billing
 *     decision until first paid customer; until then every tier sees the
 *     upgrade CTA instead of an uploader that would fail at the network
 *     layer.
 *
 * TODO(infra): remove `photoJournal` from this set the MOMENT Firebase
 * Storage is enabled (Blaze plan) AND `storage.rules` is published. That
 * one-line change restores the normal tier gate
 * (FEATURES.photoJournal = 'pro'). No other code needs to change.
 */
export const INFRA_LOCKED_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  'photoJournal',
]);

export function isFeatureInfraLocked(key: FeatureKey): boolean {
  return INFRA_LOCKED_FEATURES.has(key);
}

// ─── Admin allowlist ──────────────────────────────────────────────────

/**
 * Firebase Auth UIDs that can flip `centers/{ownerId}.demoMode` to bypass
 * all feature gates during a sales demo.
 *
 * How to find yours: see `config/README.md` → "How to find your admin UID".
 *
 * TODO(admins): paste your owner uid here before first demo. Leave empty
 * during development — demoMode is a nice-to-have for Sprint 1.
 */
export const ADMIN_UIDS: readonly string[] = [
  'Q2WtGGneZtcuBY2I2jJGdUQTDKq1',
];

// ─── Web platform toggle ──────────────────────────────────────────────

/**
 * Whether the kidshub Expo app renders the full app on web. When false,
 * visiting the web URL shows a "Download on App Store / Play Store"
 * splash instead of the parent/teacher app.
 *
 * Dashboard (owner) + landing (marketing) are always web. This flag only
 * controls the kidshub app.
 *
 * Override via `EXPO_PUBLIC_ENABLE_WEB_APP=true` in `kidshub/.env`.
 *
 * TODO(web): flip this to true when we want to do a web launch. Until
 * then, mobile-first positioning.
 */
export const ENABLE_WEB_APP_DEFAULT = false;

// ─── Convenience helpers ──────────────────────────────────────────────

/** All purchasable tiers (excludes Trial). Use for pricing tables. */
export const PURCHASABLE_TIERS: readonly Tier[] = ['starter', 'pro', 'premium'];

/** Default tier for a brand-new signup before they start the trial. */
export const DEFAULT_NEW_OWNER_TIER: Tier = 'trial';
