# KidsHub Product Plan — Tiered SaaS + UX Redesign

Tracking doc for the **productization** phase: introduce subscription tiers, feature-gate the product, redesign the teacher/parent apps Lillio-style, and get everything sale-ready so first-customer onboarding takes hours, not weeks.

Companion to `RESTRUCTURE_PLAN.md` (monorepo restructure — now near-done). This doc owns everything from "kidshub apps are running on live data" forward.

---

## North star

Build a demo-ready, feature-gated daycare SaaS where:
- Tiny daycares get hooked on a **Free** tier forever.
- Growing daycares graduate to **Pro** for the operational tooling they can't live without.
- Multi-location operators land on **Premium** for scale + AI + multi-daycare.
- Every paid feature already has its UI shell in the app, locked behind a tier check with a clear upgrade CTA.
- Sales demos flip a single `demoMode: true` flag on a daycare doc and everything unlocks.
- When first customer says "yes," onboarding is: (1) set their tier on their center doc, (2) invoice them, (3) done.

---

## Tier structure (strawman — confirm before we build)

Four tiers, with Trial being a time-limited full-access state rather than a separate paid tier.

| Tier | Price (strawman) | Limits | Positioning |
|---|---|---|---|
| **Trial** | Free, 14 days | Full Premium access | New signups land here, auto-downgrade to Starter when trial ends unless upgraded |
| **Starter** | Free forever | 1 classroom · 15 children · 2 staff | Small home daycares — gets them hooked, they evangelize |
| **Pro** | ~$39/mo (placeholder) | 5 classrooms · 75 children · 15 staff | Standard center — the bread-and-butter tier |
| **Premium** | ~$99/mo (placeholder) | Unlimited classrooms/children/staff · multi-daycare | Multi-location operators, franchise owners |

**Decision points for you:**
1. **Tier count**: 3 paid-facing tiers (Starter/Pro/Premium) + hidden Trial — or do you want a 4th "Enterprise" / "Custom" tier for the biggest accounts?
2. **Tier names**: `Starter` / `Pro` / `Premium` (generic, clear) vs something branded (`Sprout` / `Bloom` / `Canopy`)? I lean generic — easier for customers to map against competitors.
3. **Starter limits**: generous enough to actually be useful (so people use it) but tight enough to drive upgrades. 1 classroom / 15 kids is my recommendation — 1 classroom kills multi-classroom centers immediately.
4. **Pricing**: placeholders above. We don't need final numbers until just before first sale, but we need ranges to shape the upgrade CTA copy.

---

## Feature matrix

Legend: `✅` included · `—` locked behind upgrade CTA · `∞` unlimited.

| Feature | Starter | Pro | Premium | Notes |
|---|:---:|:---:|:---:|---|
| **Quotas** | | | | |
| Classrooms | 1 | 5 | ∞ | Quota check on classroom create |
| Children | 15 | 75 | ∞ | Quota check on child create |
| Staff | 2 | 15 | ∞ | Quota check on staff create + invite |
| **Core (free forever)** | | | | |
| Parent self-register + sign-in | ✅ | ✅ | ✅ | |
| Teacher invite flow | ✅ | ✅ | ✅ | |
| Parent invite flow | ✅ | ✅ | ✅ | |
| Classroom / child / staff CRUD | ✅ | ✅ | ✅ | Within quota |
| Activity logging | ✅ | ✅ | ✅ | |
| Check-in / check-out | ✅ | ✅ | ✅ | |
| Parent ↔ teacher messaging | ✅ | ✅ | ✅ | |
| Announcements | ✅ | ✅ | ✅ | |
| **Pro-only** | | | | |
| Photo journal + photo upload | — | ✅ | ✅ | Storage cost — hence gated |
| Daily reports (per-child summary) | — | ✅ | ✅ | |
| Attendance reports (export CSV/PDF) | — | ✅ | ✅ | |
| Health reports | — | ✅ | ✅ | |
| Staff clock-in / attendance | — | ✅ | ✅ | New Firestore collection |
| Morning screenings | — | ✅ | ✅ | Compliance-oriented |
| Weekly planner (teacher) | — | ✅ | ✅ | |
| Activity planner (curriculum) | — | ✅ | ✅ | |
| Custom logo / branding | — | ✅ | ✅ | |
| Email support | — | ✅ | ✅ | |
| **Premium-only** | | | | |
| Multi-daycare per owner | — | — | ✅ | Biggest infra change |
| Aria AI assistant (in-app) | — | — | ✅ | Already built on landing — port inward |
| API access | — | — | ✅ | For franchise integrations |
| Dedicated support | — | — | ✅ | |

---

## Tracks (parallelizable work streams)

Each track is a self-contained slice. Tracks A + B + E are pre-sale critical. D items build the actual paid features and can be paced based on customer feedback.

### Track A — Entitlements foundation (infra)

The plumbing that gates everything. Build once, reuse everywhere.

- [ ] **A1** Tier data model: extend `centers/{ownerId}` with `plan: 'starter' | 'pro' | 'premium'`, `trialEndsAt?: Timestamp`, `demoMode?: boolean`. Default new owners to `trial` until trialEndsAt passes.
- [ ] **A2** `useEntitlements()` hook reading the current owner's center doc (for dashboard) and the daycare owner's center doc (for kidshub teacher/parent, via `profile.daycareId`).
- [ ] **A3** `useFeature(key: FeatureKey)` hook — returns `{ enabled, reason, upgradeTo }`. Honors `demoMode: true` as override.
- [ ] **A4** `<FeatureGate feature="photoJournal">` component — renders children if enabled, renders `<UpgradeCTA>` if not. Single-line wrap around any feature.
- [ ] **A5** `<UpgradeCTA>` component — banner with "Upgrade to Pro" headline, required tier badge, "See plans" button → `/plans` page (dashboard) or contact-sales modal (kidshub).
- [x] **A6** Quota enforcement on writes: extend dashboard `classroomsApi.create`, `childrenApi.create`, `staffApi.create` to refuse with a friendly error when tier quota exceeded. Rules also enforce the same so client bypass fails server-side. _Shipped Sprint 3: `kidshub-dashboard/src/firebase/api/quotas.js` throws typed `QuotaExceededError`; `<QuotaBanner>` shows the upgrade CTA in each `Add*` modal; rules enforce same limits via `planAllows()` (A7)._
- [x] **A7** Firestore rule helper `planAllows(feature)` — reads `/centers/{daycareId}.plan` and checks the feature matrix. Prevents paid-feature writes even if the client is compromised. _Shipped Sprint 3 (see `firestore.rules` — `centerDoc()`, `effectiveTierRank()`, `requiredRankFor()`, `planAllows()`). Respects demoMode + expired-trial downgrade._
- [ ] **A8** Admin demo-mode toggle: dashboard owner-profile has a button visible only to owners whose uid is in a hard-coded admin list (e.g. `users/{uid}.isAdmin = true`). Flips `demoMode` on their center doc.
- [x] **A9** Trial expiry cron: Firebase scheduled function runs daily, flips `plan: 'trial' → 'starter'` once `trialEndsAt < now`. (Actual billing enforcement is Track F.) _Sprint 3: shipped as a lazy owner-side downgrade (`centersApi.downgradeExpiredTrial()` wired into `useEntitlements`) — writes `plan: 'starter'` the first time an expired-trial owner opens the dashboard. Follow-up: a real Vercel cron / Firebase scheduled function for cases where the owner never comes back, TODO in Track F._

### Track B — Teacher UX redesign (Lillio-inspired)

The app that wins demos. See `lillio screenshots/` referenced for visual target.

- [ ] **B1** Web toggle: `kidshub/constants/feature-flags.ts` with `ENABLE_WEB_APP = false`. `EXPO_PUBLIC_ENABLE_WEB_APP` env var overrides. On web + flag off, render `/coming-soon` splash with "Download on App Store / Google Play" CTAs.
- [ ] **B2** Bottom nav restructure — 5 tabs, center tab is the prominent "Add entry" CTA:
  - `Home` → today's action board (merges Classroom + Check-in)
  - `Messages` → parent conversations
  - `Add entry` → quick-log grid (CENTER, elevated teal circle)
  - `Reports` → daily reports (locked for Starter)
  - `More` → profile + settings + secondary features
- [x] **B3** Home redesign: staff section (with Pro-only clock-in pill) + children section with dot-status header, inline Check-in / Check-out pills, per-child 3-dot quick-action sheet. Replaces current `(teacher)/classroom.tsx`. `/check-in` is preserved as a dedicated attendance screen reachable via the "Take attendance" action.
- [x] **B4** Add Entry quick-log grid: 8-card 2-col grid (Check in / Activity / Observation / Health / Temperature / Food / Sleep / Toilet) + "Other entry" escape hatch. Tapping a card opens `QuickLogSheet` (child picker → notes → save). Turns 4-tap log into 2-tap log.
- [x] **B5** Visual system pass: shared `Pill` / `ActionButton` / `EntityCard` / `SheetModal` primitives in `components/ui/`, 44pt+ tap targets, soft shadows, generous whitespace. (Parent-side visual token pass tracked as **C1**.)
- [x] **B6** Messages redesign: tabs (Inbox / Sent / Archived) + search + compose button. Thread view with `Submit` / `Submit & Archive` / `Archive` reply actions. _Shipped Sprint 4 (`kidshub/app/(teacher)/messages.tsx`): `buildTeacherThreads()` groups messages by `conversationId`, tab filter drives Inbox vs Sent vs Archived, `<ComposeSheet>` starts new threads. Archive is a per-thread staff flag on the **latest** message (`archivedByStaff` + `staffArchivedAt` on `Message`), so the next parent reply naturally un-archives. API: `messagesApi.setStaffArchived()`; rules: teacher participant can `update` only `['archivedByStaff','staffArchivedAt']` on their own threads._
- [x] **B7** Reports tab: for Pro+, shows today's classroom daily report. For Starter, shows `<UpgradeCTA feature="reports" />` with a preview image. _Shipped Sprint 4 (`kidshub/app/(teacher)/reports.tsx`): Pro+ renders `<AttendanceHeadline>` + `<ActivityTally>` + `<ChildRoll>` from live `useClassroomRoster()` + `useTodaysActivitiesForClassroom()`; Starter sees a dimmed `<ReportPreview>` plus direct `<UpgradeCTA feature="dailyReports" variant="card" />`._
- [x] **B8** More menu: Profile, Classroom documents (Pro+, locked), Weekly planner (Pro+, locked), Activity planner (Pro+, locked), Notifications, Privacy, Help, Sign out. All locked items visible but gated — creates desire. _Shipped Sprint 4 (`kidshub/app/(teacher)/more.tsx`): `SectionCard`-grouped `MoreRow` list with Pro-locked rows that route to `/plans?feature=…`, placeholder Settings rows (Notifications / Privacy / Help), and a bottom `<ActionButton variant="ghost" tone="danger">` for Sign out._

### Track C — Parent UX redesign (lighter touch)

Parent app benefits from the same visual system but needs less restructuring.

- [x] **C1** Apply B5 visual tokens to parent screens. _Shipped Sprint 4: `Pill` replaces ad-hoc badges across `(parent)/schedule.tsx` (Now / Sample chips), `(parent)/activity.tsx` (filter chips), `(parent)/profile.tsx` (allergy chips), and `(parent)/messages.tsx` (day separators). Sign out on `(parent)/profile.tsx` uses `<ActionButton variant="ghost" tone="danger">`._
- [x] **C2** Parent Home polish: child status hero card, today's activities feed, announcements, quick-action grid. _Shipped Sprint 4 (`kidshub/app/(parent)/home.tsx`): check-in state surfaced via `<StatusPill>`, primary CTAs ("Message teacher" / "Daily report") now `<ActionButton>` with `router.push()` (no more nested `Link asChild`), `ActivityPreview` "View all" uses `<Pill>`, secondary quick actions use `<Card>` tiles for consistency._
- [ ] **C3** Parent Messaging polish: match teacher message design.
- [ ] **C4** Parent Photos: live photo gallery when Pro (gated via `<FeatureGate feature="photoJournal">`); empty state for Starter.
- [ ] **C5** Parent Schedule: dynamic classroom schedule (Pro+) vs templated schedule (Starter).

### Track D — Paid features (build what we're gating)

Don't build these all at once. Build the highest-leverage ones first, keep the rest as locked placeholders.

- [ ] **D1** Photo journal (Pro) — photo upload (Firebase Storage), gallery view in parent + teacher apps, caption + tag-child support. _Highest demo leverage — parents LOVE photos._
- [ ] **D2** Daily reports (Pro) — per-child summary of today's activities, meals, naps, messages. Dashboard + kidshub views. Email digest to parents (optional toggle).
- [ ] **D3** Attendance reports (Pro) — month-view attendance grid per classroom, CSV export.
- [ ] **D4** Staff clock-in (Pro) — new `attendance/{id}` Firestore collection; teacher home gets a "Clock in" pill; owner sees weekly timesheets.
- [ ] **D5** Health reports (Pro) — symptoms log, medication log, incident reports. Compliance-adjacent.
- [ ] **D6** Weekly planner (Pro) — teacher plans daily activities for the week; visible to parents read-only.
- [ ] **D7** Activity planner / curriculum library (Pro) — pre-built activity templates teacher can drag onto the weekly plan.
- [ ] **D8** Morning screenings (Pro) — health check at drop-off (temperature, symptoms questionnaire), triggered from teacher Home "Open screening" CTA.
- [ ] **D9** Aria AI in-app (Premium) — embed the landing-page Aria widget as an in-app assistant for teachers ("draft a message to Jane's parent about her nap today"). Uses existing `kidshub-landing/api/chat` endpoint with kidshub-specific system prompt.
- [ ] **D10** Multi-daycare per owner (Premium) — `daycares/{daycareId}` collection decoupled from owner uid; `users.daycareIds[]` + `activeDaycareId`; dashboard daycare-switcher UI. Biggest infra lift.
- [ ] **D11** Custom branding (Pro) — upload daycare logo, show in kidshub header + dashboard sidebar + emails. Custom accent color.

### Track E — Pre-sale readiness

What makes the product sellable, not just built.

- [x] **E1** Pricing page on `getkidshub.com/pricing` — 3-tier comparison table, "Start free trial" + "Contact sales" CTAs. Feeds `leads` collection via existing `/api/chat` pattern. _Shipped Sprint 3 (`kidshub-landing/pricing.html`): hero + 3-tier cards + full feature comparison table + FAQ + inline contact-sales modal. Nav + mobile menu + footer link from index.html; served at `/pricing` via `vercel.json` cleanUrls._
- [x] **E2** Contact sales flow — form on landing + in-app modal (triggered from `<UpgradeCTA>`). Writes to `leads` collection, emails us via Resend. _Shipped Sprint 3: `kidshub-landing/api/contact-sales.js` writes `leads/{id}` via Firestore REST (see `createFirestoreDoc()` in `_shared.js`) and sends `salesNotificationEmail` to `SALES_NOTIFICATION_TO` with `reply_to` set to the lead's email. Firestore rules allow anonymous `create` with field validation, deny all `read/update/delete`._
- [x] **E3** Upgrade flow in dashboard — `/plans` page with current plan highlighted, compare table, "Contact sales to upgrade" button. (Stripe self-serve upgrade is Track F.) _Shipped Sprint 3 (`kidshub-dashboard/src/pages/Plans.jsx`): 3-tier cards with current-plan highlight, full feature comparison table, inline `<ContactSalesCard>` posting to the same `/api/contact-sales` endpoint. `<UpgradeCTA>` and Settings → Billing now route here instead of mailto; deep-links like `/plans?tier=pro&feature=photoJournal` pre-fill the form._
- [ ] **E4** Sales demo guide — short doc with the demo flow: register owner → admin flips `demoMode: true` → walk through all features unlocked → show feature gates by flipping demoMode off.
- [ ] **E5** Case study placeholder page on landing site — template we fill in after first customer.
- [ ] **E6** One-pager pitch PDF — features + tier comparison + screenshots, for outbound outreach. Generated from landing site.

### Track F — Billing (deferred until first customer)

Nothing here blocks demos or first-customer close. Build when someone actually wants to pay.

- [ ] **F1** Stripe integration — `kidshub-dashboard/src/pages/Billing.jsx`, Stripe Checkout for upgrade, Stripe Billing Portal for self-serve cancellation.
- [ ] **F2** Stripe webhook handler at `kidshub-landing/api/stripe-webhook.js` — updates `centers/{ownerId}.plan` on subscription events.
- [ ] **F3** Failed-payment grace period — 7 days of Pro access after a failed charge, then downgrade to Starter with data preserved (no deletions).
- [ ] **F4** Invoicing (via Stripe) — daycare gets a proper receipt per payment.

---

## Execution plan — recommended order

Sprint length is loose; each sprint is ~1 coding session or a few hours.

### Sprint 1 — Foundation + first visible win ✅ DONE
Goal: plumbing in place, obvious visual upgrade to show.

- [x] A1 · Tier data model on `centers/{ownerId}` — `plan` / `trialEndsAt` / `demoMode` fields stamped at register, lazy-migrated for pre-existing centers
- [x] A2 · `useEntitlements()` hook — dashboard + kidshub versions, same return shape
- [x] A3 · `useFeature(key)` hook — returns `{ enabled, reason, upgradeTo }`
- [x] A4 · `<FeatureGate feature="…">` — both apps
- [x] A5 · `<UpgradeCTA>` — dashboard (banner + card, mailto placeholder) + kidshub (banner + card)
- [x] A8 · Demo-mode toggle on dashboard Settings — visible only to `ADMIN_UIDS`
- [x] B1 · Web toggle flag — kidshub shows "Get the mobile app" splash on web when `ENABLE_WEB_APP=false`; override via `EXPO_PUBLIC_ENABLE_WEB_APP=true`
- [x] B2 · Teacher 5-tab nav: Home / Messages / `+` (center, elevated teal) / Reports / More — existing screens kept hidden-but-routable; `/reports` and `/more` are new scaffolds

**Demo checkpoint:** app still works on Android, web shows coming-soon splash, teacher sees new 5-tab Lillio-style nav, you can toggle demoMode from dashboard.

### Sprint 2 — Teacher home + quick-log (the "wow" moment) ✅ COMPLETE

- [x] B3 · Home screen consolidation — staff section (Pro-gated clock-in pill), children list with inline check-in / ⋯ action sheet, recent-activity ticker, live attendance vitals
- [x] B4 · Add Entry quick-log grid — 8-card 2-col grid + "Other entry" escape hatch, single `QuickLogSheet` bottom sheet (child picker + notes + save). Replaces the old 3-step modal; 2-tap from grid, 1-tap from the home per-child action sheet
- [x] B5 · Visual system pass — `Pill`, `ActionButton`, `EntityCard`, `SheetModal` primitives in `kidshub/components/ui/`, plus teacher-specific `QuickLogSheet` + `ChildActionSheet` in `components/teacher/`. All new components 44pt+ tap targets with soft shadows

**Demo checkpoint:** teacher app looks + feels like Lillio. This is the screen set you demo to prospects.

### Sprint 3 — Tier enforcement + pricing page ✅
- [x] A6 · Quota enforcement on writes (`quotas.js` + `<QuotaBanner>`)
- [x] A7 · Firestore rule `planAllows()` helper (feature matrix in rules)
- [x] A9 · Trial expiry (lazy owner-side downgrade via `useEntitlements`)
- [x] E1 · Pricing page on landing (`kidshub-landing/pricing.html`)
- [x] E2 · Contact sales flow (`/api/contact-sales` → `leads/{id}` + Resend)
- [x] E3 · In-dashboard `/plans` page (replaces all mailto CTAs)

**Demo checkpoint:** every feature gated correctly. Visit pricing → contact sales flow works. Admins can flip demoMode and watch gates disappear.

### Sprint 4 — Messages + Reports + More + Parent polish ✅
- [x] B6 · Messages redesign (Inbox / Sent / Archived tabs + search + compose + archive via latest-message flag)
- [x] B7 · Reports tab (Pro+ live daily report; Starter preview + `<UpgradeCTA feature="dailyReports">`)
- [x] B8 · More menu (Profile + Pro-locked rows + Settings + ghost-danger Sign out)
- [x] C1 · Parent visual system apply (`Pill` across schedule/activity/profile/messages; `ActionButton` sign out)
- [x] C2 · Parent home polish (`StatusPill` hero, `ActionButton` CTAs with `router.push`, `Pill` "View all", `Card` quick-action grid)

**Demo checkpoint:** entire teacher + parent app is visually consistent + on-brand.

### Sprint 5 — First paid feature (the reason to upgrade) ✅
- [x] D1 · Photo journal (Pro) — live gallery + per-child tagging; teacher web-file upload + URL fallback; parent grouped-by-day gallery with `<UpgradeCTA>` for Starter
- [x] E4 · Sales demo guide written (`SALES_DEMO_GUIDE.md`)
- [x] E5 · Case study template page on landing (`kidshub-landing/case-study.html`)

**Demo checkpoint:** you can show a prospect "here's what happens when you upgrade to Pro — photo journal unlocks. Your parents get daily photos of their kids. Every competitor charges for this." Compelling close.

### Sprint 6 — Second wave of paid features ✅
- [x] D2 · Daily reports — owner Reports page with per-child rollup + CSV export
- [x] D4 · Staff clock-in — `attendance` collection + teacher pill wired to `attendanceApi.clockIn/Out`; owner sees shifts in Reports
- [x] D11 · Custom branding — logo URL + accent color on `centers/{ownerId}`, Settings UI Pro-gated
- [x] C3 · Parent messaging polish — day dividers, "Sending…" hint
- [x] C4 · Parent Photos — live gallery (Pro), Starter preview + CTA
- [x] C5 · Parent Schedule — today's weekly plan (Pro) above template routine

### Sprint 7+ — Scale features + billing ✅ (MVPs + scaffolds)
- [x] D3 · Attendance CSV export (Reports page)
- [x] D5 · Health reports — `healthLogs` collection + teacher composer + owner Reports card w/ CSV
- [x] D6 · Weekly planner (teacher) + parent read-only (under Schedule)
- [x] D7 · Activity planner / curriculum library (`activityTemplates` + teacher `/curriculum`)
- [x] D8 · Morning screenings (`screenings` + teacher `/screenings`)
- [x] D9 · Aria AI in-app (Premium) — local templated assistant; server endpoint to swap in later
- [~] D10 · Multi-daycare per owner — design doc committed (`MULTI_DAYCARE.md`); not live
- [~] F1-F4 · Stripe billing — scaffolded endpoints (`/api/stripe-checkout`, `/api/stripe-webhook`); `BILLING.md` documents go-live flip
- [x] E6 · One-pager pitch (`KIDSHUB_ONE_PAGER.md`)

---

## Central configuration

**Every tier/pricing/feature/limit decision lives in one file: `config/product.ts`.**

See `config/README.md` for the full how-to. Strawman values are already in place — work is unblocked. When you're ready to revisit any decision, search for `TODO(` in `config/product.ts`:

```bash
grep -n 'TODO(' config/product.ts
```

That gives you a checklist of every open decision and the exact line to edit. No hunting through code to find where tier names or prices are defined — it's all one file.

### Current placeholder values (edit in `config/product.ts` when you decide)

| Decision | Placeholder | Where to change |
|---|---|---|
| Tier names | `Starter` / `Pro` / `Premium` (+ `Trial`) | `TIERS[tier].name` |
| Pricing | $0 / $39 / $99 | `TIERS[tier].monthlyPriceUsd` |
| Starter limits | 1 classroom · 15 children · 2 staff | `QUOTAS` |
| Pro limits | 5 classrooms · 75 children · 15 staff | `QUOTAS` |
| Premium limits | unlimited (-1) | `QUOTAS` |
| Trial duration | 14 days | `TRIAL_DURATION_DAYS` |
| Web app default | hidden (`false`) — env var override | `ENABLE_WEB_APP_DEFAULT` |
| Admin UIDs (demoMode privilege) | empty `[]` | `ADMIN_UIDS` |

These placeholders are internally consistent — the app runs correctly with them. Revisit before first-customer close; no rush.

---

## Progress log

_Append dated notes as sprints complete._

- **2026-04-22** — Plan drafted. Tier structure + feature matrix + 7-sprint execution plan laid out. Created `config/product.ts` as single source of truth for all tier/pricing/feature decisions; placeholders in place so Sprint 1 is unblocked. User deferred decisions on tier names, pricing, limits, trial duration — all tracked via `TODO(` markers in the config file.
- **2026-04-23** — Sprints 5, 6, 7 shipped in one push. Added `photos`, `attendance`, `healthLogs`, `weeklyPlans`, `activityTemplates`, `screenings` collections with types + Firestore rules + API modules + live hooks. New teacher pages: `/photos`, `/weekly-planner`, `/health-log`, `/curriculum`, `/screenings`, `/aria`. New owner dashboard page: `/reports` (Daily + Attendance CSV + Health CSV). Parent app updates: photo journal, weekly plan on schedule, messaging day dividers. Branding Settings section (D11). Scaffolded Stripe checkout + webhook endpoints and documented go-live flow in `BILLING.md`. Documented multi-daycare migration plan in `MULTI_DAYCARE.md`. Authored `SALES_DEMO_GUIDE.md`, `KIDSHUB_ONE_PAGER.md`, and a case-study template page on the landing site.
