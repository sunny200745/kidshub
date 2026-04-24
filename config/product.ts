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
 *
 * NOTE — `trial` is a **legacy-only** key. New owners signing up never
 * get it; they land on Starter directly (see DEFAULT_NEW_OWNER_TIER below).
 * We keep `trial` in the array so that owners whose centers were created
 * under the old 14-day-trial flow don't crash the app before
 * `migrateLegacyTrialToStarter` flips them on their next login.
 */
export const TIERS_ARRAY = ['trial', 'starter', 'pro', 'premium'] as const;
export type Tier = (typeof TIERS_ARRAY)[number];

/**
 * Ordered by ascending capability. Used to answer "does tier X satisfy
 * requirement Y" via `tierIndex(x) >= tierIndex(y)`. Legacy `trial` docs
 * keep premium-equivalent ranking so they don't lose access before the
 * migration helper flips them — they get the intended Starter scope after
 * the next login.
 */
export const TIER_ORDER: Record<Tier, number> = {
  starter: 0,
  pro: 1,
  premium: 2,
  trial: 2, // legacy — see migrateLegacyTrialToStarter
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
    // Legacy — retained so pre-existing `plan: 'trial'` docs don't
    // collide with TIERS[plan] lookups. migrateLegacyTrialToStarter
    // flips these to Starter on next login. No new signups land here.
    name: 'Starter',
    tagline: 'Legacy account — migrating to Starter',
    monthlyPriceUsd: 0,
    accentColor: '#64748B',
  },
  starter: {
    key: 'starter',
    // Starter is the new signup default. Owners get full Starter-tier
    // access free for STARTER_FREE_DAYS days (see below). When the
    // window expires every dashboard route redirects to `/paywall`
    // until they upgrade — the "lock the entry" behavior. Teachers and
    // parents already onboarded keep their mobile access unchanged.
    name: 'Starter',
    tagline: 'Free for your first 60 days',
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

// ─── Starter free-use window ──────────────────────────────────────────

/**
 * New owners get Starter-tier access free for `STARTER_FREE_DAYS` days.
 * After the window closes the dashboard redirects them to `/paywall` on
 * every route except `/plans`, where they can either contact sales or
 * log out. This constant is the SINGLE source of truth for that window —
 * pricing page, Settings → Plan & billing, in-app CTAs all render from
 * here so tweaks are a one-file edit.
 *
 * How the clock works end-to-end:
 *   1. Register.jsx stamps `centers/{ownerId}.starterStartedAt` on
 *      signup via `defaultPlanFields()`.
 *   2. `ensureStarterStarted()` lazy-stamps the field on pre-existing
 *      Starter docs that were created before this system existed, so
 *      they get a fresh 60-day window rather than being locked out.
 *   3. `starterPromoDaysLeft` / `starterPromoExpired` derive state
 *      from that timestamp. PlanStateBanner shows the countdown;
 *      ProtectedRoute redirects to /paywall once expired.
 *   4. TODO(billing): Stripe activation (Track F) will stamp
 *      `centers/{ownerId}.billingActivatedAt` and ProtectedRoute will
 *      grant access based on that instead. Until then Starter expiry
 *      is enforced purely client-side by the paywall redirect.
 */
export const STARTER_FREE_DAYS = 60;

/**
 * Amber warning window inside the Starter free-use period. When there
 * are fewer than this many days left, PlanStateBanner flips from the
 * green countdown to an amber urgent state that can't be dismissed.
 */
export const STARTER_PROMO_WARNING_DAYS = 14;

// Avoid `Date | number | string` soup at call sites — callers pass
// Firestore Timestamps OR Dates OR millis; this normalizes.
function toMillis(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

/**
 * Milliseconds-since-epoch for the end of the Starter free-use window.
 * Returns 0 when `starterStartedAt` is missing — callers should treat
 * 0 as "no clock yet, not expired".
 *
 * We add exact days (not calendar months) so "60 days" means 60 days
 * regardless of what month the owner signed up in. This matches the
 * copy on the pricing page and removes the "wait, was I supposed to
 * have 59 or 62 days?" question customers asked during our Feb demo.
 */
export function starterPromoEndsAtMs(starterStartedAt: unknown): number {
  const startedMs = toMillis(starterStartedAt);
  if (startedMs <= 0) return 0;
  return startedMs + STARTER_FREE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Days (rounded up) between now and the end of the Starter grace
 * window. Returns null when there's no `starterStartedAt` yet (legacy
 * doc pre-stamp, or not on starter at all). Floor-clamped at 0.
 */
export function starterPromoDaysLeft(starterStartedAt: unknown): number | null {
  const endsMs = starterPromoEndsAtMs(starterStartedAt);
  if (endsMs <= 0) return null;
  const msLeft = endsMs - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

/**
 * True when the Starter grace window has elapsed. Returns false when
 * `starterStartedAt` is missing (defensive — we never want to blanket-
 * block owners whose docs are mid-migration).
 */
export function starterPromoExpired(starterStartedAt: unknown): boolean {
  const endsMs = starterPromoEndsAtMs(starterStartedAt);
  if (endsMs <= 0) return false;
  return Date.now() >= endsMs;
}

// ─── Quotas (per-tier numeric limits) ─────────────────────────────────

/**
 * Hard limits enforced on the dashboard's create APIs AND in Firestore
 * rules (via `planAllows()` helper). `Infinity` encoded as `-1` because
 * Firestore rules don't support `Infinity`.
 *
 * Starter classroom cap = 2 (bumped from 1). The original "1 classroom"
 * cap killed multi-classroom centers immediately — even tiny daycares
 * usually run an infants room + a toddlers room, so 1 made the free
 * window feel broken before they'd seen any value. Two classrooms is
 * still tight enough to push 3+ room centers to Pro, but generous enough
 * that two-room mom-and-pop centers can actually evaluate the product
 * end-to-end during the 60-day window.
 *
 * TODO(limits): confirm Starter/Pro limits aren't too tight / too loose.
 */
export type QuotaKey = 'classrooms' | 'children' | 'staff';

export const QUOTAS: Record<QuotaKey, Record<Tier, number>> = {
  classrooms: { trial: -1, starter: 2, pro: 5, premium: -1 },
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
  | 'dedicatedSupport'
  | 'videoSurveillance';

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
  videoSurveillance: 'premium',
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
  videoSurveillance: 'Live video surveillance',
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
 *   - `videoSurveillance` — live camera feeds require a third-party
 *     camera partner + streaming infra we haven't built yet. Shipped as
 *     a visible-but-locked tab so owners can see it on the roadmap and
 *     we can measure demand via `/plans` contact-sales traffic. Flip to
 *     a real integration (or drop from this set + raise FEATURES tier)
 *     once a partner is signed.
 *
 * TODO(infra): remove `photoJournal` from this set the MOMENT Firebase
 * Storage is enabled (Blaze plan) AND `storage.rules` is published. That
 * one-line change restores the normal tier gate
 * (FEATURES.photoJournal = 'pro'). No other code needs to change.
 * TODO(infra): remove `videoSurveillance` once the camera partner
 * integration ships; the tier gate (FEATURES.videoSurveillance = 'premium')
 * then takes over and Premium owners see the real feature.
 */
export const INFRA_LOCKED_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  'photoJournal',
  'videoSurveillance',
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

/**
 * Default tier for a brand-new signup.
 *
 * New owners land directly on Starter with `starterStartedAt` stamped
 * to now. They get STARTER_FREE_DAYS days of free access before the
 * paywall kicks in (no upfront credit card, no 14-day Premium trial —
 * see commit history for rationale).
 */
export const DEFAULT_NEW_OWNER_TIER: Tier = 'starter';
