# KidsHub Monorepo Restructure Plan

Tracking doc for the restructure of the `daycares/` monorepo into three clearly-scoped apps.

## Decisions locked in

- **Mobile + web stack for `kidshub`:** Expo (React Native) + React Native Web — one codebase, native iOS/Android + web.
- **Repo strategy:** Single monorepo at `daycares/`.
- **Order of work:** `kidshub-landing` → `kidshub-dashboard` → `kidshub`.

## Decisions resolved

- [x] Monorepo root: **flattened** — `kidshub-app/*` moved up into `daycares/`.
- [x] Workspace tool: **npm workspaces** (plain, no Turborepo for now).
- [x] Lockfile strategy: **single root `package-lock.json`**; per-app lockfiles removed.

## Open decisions (resolved 2026-04-21 night, before Phase 3 kickoff)

- [x] **Styling on mobile: NativeWind.** Existing dashboard + legacy kidshub are heavily Tailwind, classes port ~1:1. Lower-risk than Tamagui; can migrate later if perf walls hit.
- [x] **Firebase on mobile: Firebase JS SDK.** One code path across web + iOS + Android, simpler EAS builds. When push notifications become important, swap **just** the messaging layer to `@react-native-firebase/messaging` without disturbing the data layer.
- [x] **Keep `kidshub-legacy/` snapshot.** `git mv` it instead of deleting — quick local reference during port, removed from workspaces so it doesn't pull deps. Deleted after Phase 3 parity confirmed (p3-19).
- [x] **Expo monorepo: stay on npm workspaces + Metro config.** No pnpm migration. If Metro chokes on hoisting, fix with `metro.config.js` resolver tweaks rather than swapping the package manager.

---

## Target state

```
daycares/
├── kidshub/                 # unified parent + teacher, web + mobile (role-based, Expo + RN Web)
├── kidshub-dashboard/       # owner-only, web-only (renamed from kidshub-owner, React + Vite)
└── kidshub-landing/         # marketing site, web-only (static HTML/CSS/JS + Vercel /api)
```

---

## Phase 0 — Monorepo scaffolding ✅

- [x] **p0-1** Flatten monorepo — move `kidshub-app/*` up into `daycares/` (preserve `.git` history).
- [x] **p0-2** Add root `package.json` with npm workspaces for the 3 apps.
- [x] **p0-3** Add root `.gitignore`, `.editorconfig`, `README.md`, `.vscode` workspace file.
- [x] **p0-4** Commit clean baseline before any app-level changes.
- [x] **p0-5** Consolidate to a single root `package-lock.json`, remove per-app lockfiles + `node_modules/`.

---

## Phase 1 — `kidshub-landing` ✅

**Goal:** Public marketing site, web-only, clearly scoped.

- [x] **p1-1** Audit `index.html` to confirm it's marketing-only (no app logic). Also cleaned up the orphaned `js/chat.js` serverless handler (merged Resend lead-email flow into `api/chat.js`), added CORS origin allowlist, generated placeholder `assets/favicon.svg`.
- [x] **p1-2** Flesh out `package.json` (name, scripts `dev`/`build`/`deploy`).
- [x] **p1-3** Add `vercel.json` pinning static site + `/api` routes + security headers.
- [x] **p1-4** ~~Update CTAs to point at `kidshub` app and `kidshub-dashboard`.~~ _No-op — landing page is intentionally lead-capture-only; no sign-in links. Confirmed 2026-04-21._
- [x] **p1-5** Write `README.md` (purpose, deploy target, local dev).
- [x] **p1-6** Deploy to Vercel and smoke-test `/api/chat` + `/api/test`. Live on `getkidshub.com`, Claude 3 Haiku via OpenRouter responding in ~3s.

### Bonus scope — Aria hardening (added in Phase 1, not originally planned)

- [x] **p1-7** Fix Aria 400 — removed invalid Anthropic-direct model ID from client, pinned model server-side in `api/chat.js`.
- [x] **p1-8** Cost + isolation — dedicated OpenRouter account for KidsHub, $10 per-key spend cap, pinned to `anthropic/claude-3-haiku` (~$2.50 / 1000 conversations).
- [x] **p1-9** Layer 1 defense — Origin/Referer allowlist check in `/api/chat`, rejects curl/bot traffic without spoofed headers (403).
- [x] **p1-10** Layer 2 defense — request body validation: max 20 messages, 2000 chars/message, 4000 chars/system prompt, 500 chars/lead field, hard `max_tokens` ceiling of 500. Runs pre-upstream so bogus requests cost zero credit.
- [ ] **p1-11** Layer 3 defense — per-IP rate limiting via Upstash Redis. Optional polish; $10 spend cap already limits blast radius.

---

## Phase 2 — `kidshub-dashboard` (rename from `kidshub-owner`) ✅

**Goal:** Owner-only web app, web-only, stays React + Vite.

- [x] **p2-1** Rename folder `kidshub-owner` → `kidshub-dashboard`. `git mv` preserved history on all 58 tracked files; untracked `.env` moved intact. Root `package.json` workspaces + scripts (`dev:dashboard`/`build:dashboard`), `daycares.code-workspace`, and root `README.md` updated in the same commit. Commit: `4988fcc`.
- [x] **p2-2** Update `package.json` name (`kidshub-owner` → `kidshub-dashboard`) + added product description. Replaced 13 fake-staff `@kidshub-owner.com` mock-email references with IANA-reserved `@example.com` (correct for mock data per RFC 2606). Lockfile rebuilt cleanly (0 `kidshub-owner` refs remain outside the plan doc's historical notes). Build verified green.
- [x] **p2-3** Audit pages — classification matrix below, ready to drive Phase 3 extraction.

  All 12 pages in `kidshub-dashboard/src/pages/` reviewed. Classifications:

  | Page | Audience today | Phase 3 destination | Notes |
  | --- | --- | --- | --- |
  | `Login.jsx` | Owner auth | Keep in dashboard; `kidshub` gets its own role-aware login | Different flow: kidshub login routes to `(parent)` or `(teacher)` based on Firestore user role |
  | `Register.jsx` | Owner self-signup | Keep in dashboard; `kidshub` gets parent-only register | Teachers join via owner-invite flow (p3-14), not self-register |
  | `Dashboard.jsx` | Owner overview (stats across classrooms, staff, parents) | **Owner-only — stays** | Teacher "home" in kidshub is a different component scoped to their classroom; parent "home" is scoped to their child |
  | `Children.jsx` | All roles, different scopes | **Port to `kidshub`** (both groups) | Owner: all children + add. Teacher: classroom-scoped, read-only. Parent: own child only. Same component with scope prop, or three thin wrappers over a shared list |
  | `ChildProfile.jsx` | Teacher + parent | **Port to `kidshub`** (both groups) | Teacher creates logs (meal/nap/diaper/photo/note); parent reads timeline. Gate quick-log actions behind role check |
  | `Classrooms.jsx` | Owner (manage classrooms + assign staff/children) | **Owner-only — stays** | Teachers see only their own classroom (embedded in teacher home), don't need the list view |
  | `Staff.jsx` | Owner (manage teacher roster) | **Owner-only — stays** | Teachers don't manage other staff |
  | `Messages.jsx` | All roles | **Port to `kidshub`** (both groups); owner keeps moderate view in dashboard | Parent ↔ teacher DMs scoped by childId |
  | `Schedule.jsx` | All roles, different edit rights | **Port to `kidshub`** (both groups) | Teacher: edit their classroom schedule. Parent: read-only of their child's classroom |
  | `CheckIn.jsx` | Teacher-primary | **Port to `kidshub`** `(teacher)` | Parents see check-in status on their ChildProfile; they don't actually check kids in |
  | `Activities.jsx` | Teacher-primary | **Port to `kidshub`** `(teacher)` | Parents read activities via ChildProfile timeline; they don't log them |
  | `Settings.jsx` | All roles, scoped | **Split** in Phase 3 | Personal (profile/notifications/theme) → kidshub shared. Business (building info/billing/plan) → stays in dashboard |

  Shared components also destined for kidshub port in Phase 3 (p3-12): `Layout`, `Header`, `Sidebar`, `Notifications`, all `ui/*` atoms, `ActivityIcons`, `ChildCard`, `HighlightNoteBox`, `QuickLogBar`, and scoped versions of `AddChildModal` (teacher flow may differ from owner flow).

  Net: **6 pages port to `kidshub`** (Children, ChildProfile, Messages, Schedule, CheckIn, Activities), **5 stay** (Login, Register, Dashboard, Classrooms, Staff), **1 splits** (Settings).
- [x] **p2-4** Strengthen `ProtectedRoute` to owner-only + friendly redirect for non-owners. Ended up being the whole role system since it didn't exist:

  - New `src/constants/roles.js` defines `ROLES` enum (`owner` / `teacher` / `parent`), `ROLE_LABELS` for UI, and `DASHBOARD_ALLOWED_ROLES = [ROLES.OWNER]` as the dashboard's allowlist. Single source of truth — will be lifted to a shared package if/when the Phase 3 `kidshub` app needs the same values.
  - `AuthContext` now loads the Firestore `users/{uid}` doc alongside the Firebase Auth session via `onSnapshot`, exposes `profile`, `role`, and role-predicate helpers (`isOwner`, `isTeacher`, `isParent`). Subscription auto-cleans on sign-out or unmount. Fails closed on Firestore rule rejection.
  - `ProtectedRoute` now takes an `allowedRoles` prop (default `DASHBOARD_ALLOWED_ROLES`). Unauthenticated → `/login`. Authenticated + no profile doc → `/unauthorized` with `reason: 'no-profile'`. Authenticated + disallowed role → `/unauthorized` with `reason: 'wrong-role'`.
  - New `pages/Unauthorized.jsx` — on-brand bounce page with three distinct messages (no-profile, wrong-role, unknown), sign-out button, link to `getkidshub.com`, alt-account sign-in link. Parent/teacher copy teases the upcoming `kidshub` app.
  - `Register.jsx` now writes `role: ROLES.OWNER` instead of a magic string.
  - **Security posture:** this is client-side defense-in-depth. The authoritative gate is Firestore security rules (Phase 3 p3-15). Anyone with devtools can bypass the client check — so the rules **must** verify `request.auth.uid`'s role server-side before allowing reads/writes of other tenants' data.
- [ ] **p2-5** Update `.env.example`, rotate any committed secrets.
  - **Audit finding (2026-04-21):** `.env.example` files are clean (placeholder values only). `src/firebase/config.js` is already fully env-driven in both `kidshub-dashboard/` and `kidshub/`. **However** commit `810abbd` left real Firebase web config values in git history — `kidhub-7a207` project, api key `AIzaSyCxt-...`. Firebase web keys are client-side by design, not server secrets, so this isn't an instant breach — but needs hardening:
  - [x] **p2-5a** _(user, dashboard)_ Locked the Google Cloud Console API key with Website restrictions: `getkidshub.com`, `*.getkidshub.com`, `*.vercel.app`, `localhost`, `127.0.0.1` (2026-04-21). Note: the new GCP "Websites" UI rejects port (`:*`) and path (`/*`) wildcards, so bare domains were used — they match across any scheme/port/path anyway. API restrictions left at "25 APIs" (Firebase default, already appropriately scoped). Key still public in git history but now unusable from unauthorized origins.
  - [x] **p2-5b** Firestore Security Rules audit + fix. **Rules were wide open** — Firebase default test rules allowed `read, write: if request.time < 2026-05-06` (no auth required, world-readable until May 6). With the project ID in git history, this was a one-line script away from total data loss/exfiltration. Wrote tightened ruleset at repo root `firestore.rules` covering the current flat-collection data model: `users/{uid}` gated to self + role immutable post-creation (prevents self-promotion), `centers/{ownerId}` gated to the matching owner only, flat business collections (`children`/`classrooms`/`staff`/`activities`/`messages`/`parents`/`announcements`) gated to any authenticated owner via `isOwner()` helper, default-deny catch-all. Extensively commented with the pilot-era caveat that multi-tenancy (owner-A can't see owner-B's data) still isn't enforced — that waits for Phase 3 p3-15 when the data model is refactored to add `centerId` or nested subcollections. Source-of-truth now lives in git; user deployed by pasting into the Firebase Console for now, CI-driven `firebase deploy` in Phase 4.
  - [ ] **p2-5c** _(optional)_ Rotate the Firebase web API key and update `VITE_FIREBASE_API_KEY` in Vercel env vars for all three apps. Don't bother rewriting git history (destructive, doesn't scrub GitHub caches).
- [x] **p2-6** Write `README.md` (owner portal purpose, deploy, local dev). Covers tech stack, access-control model (role gating + defense-in-depth caveat), full folder layout, local dev + seed flow, Firestore data model (including the `users.role` vs `staff.role` trap), env vars with the Firebase-keys-aren't-secrets nuance, deploy steps, and a p2-7 Vercel post-rename checklist for the user to execute.
- [x] **p2-7** Reconfigured Vercel project to `kidshub-dashboard`, deployed to `kidshub-owner.vercel.app` (Vercel keeps the original auto-assigned URL after rename — harmless), added custom domain `dashboard.getkidshub.com` via GoDaddy CNAME → `cname.vercel-dns.com`. SPA rewrites + security headers shipped via `kidshub-dashboard/vercel.json` (commit `2d36547`). DNS propagated in <10 min, Vercel auto-issued SSL cert, owner-flow smoke test green.

---

## Phase 3 — `kidshub` (biggest lift: unify parent + teacher, Expo + RN Web)

**Goal:** Single Expo app serving parents and teachers with role-based routing, shipping to iOS, Android, and Web.

### 3a. Bootstrap

- [x] **p3-1** Backed up existing `kidshub/` → `kidshub-legacy/` via `git mv` (28 files, history preserved). Removed from npm workspaces (root `package.json`) — won't pull deps on `npm install`. Root scripts updated: `dev:kidshub` now exits with a helpful message pointing at the legacy run instructions; `build:kidshub` removed entirely. `daycares.code-workspace` updated to surface `kidshub-legacy` as a clearly-labeled "frozen reference" folder. Root `README.md` rewritten to reflect current 4-folder reality with status flags (✅/🚧/🧊). Lockfile rebuilt cleanly.
- [x] **p3-2** Bootstrapped Expo SDK 54 (latest stable) at `kidshub/` via `npx create-expo-app@latest --template default --no-install`. Stack landed: Expo SDK 54.0.33, React 19.1, React Native 0.81.5, Expo Router 6.0 (typed routes + React Compiler experiments enabled), TypeScript 5.9, eslint-config-expo. Came with `app/(tabs)/`, `_layout.tsx`, `modal.tsx` — proper Expo Router file-based routing. Default template intentionally chosen over `blank` so we get realistic `_layout`/route group examples to learn the patterns from before deleting them in p3-9. Added back to root npm workspaces with hoisted install (1045 packages).
- [x] **p3-3** Enabled React Native Web (already in template at v0.21) and verified web works. Two infra issues hit + fixed:
  - **Node version mismatch:** Metro/Expo SDK 54 uses `Array.prototype.toReversed` (Node 20+ only). Project was on Node 18.20.8 → bump to 20.19.5. Added `.nvmrc` (`20.19.5`) and `engines: { node: ">=20.0.0" }` in root `package.json` so onboarding `nvm use` auto-picks the right version.
  - **Workspace hoisting collision:** root had `semver@6.3.1` hoisted (an old transitive of webpack/etc); `react-native-reanimated@4.x` requires the modular API (`semver/functions/satisfies`) only available in semver v7+. With Metro's `disableHierarchicalLookup` it couldn't see the v7 nested deeper. Fixed by `npm install --workspace kidshub semver@^7.6.0` — installs v7.7.4 into `kidshub/node_modules/semver`, Metro finds it via local `nodeModulesPaths`. Added `metro.config.js` with the standard Expo monorepo template (watchFolders includes monorepo root, both nodeModulesPaths registered, hierarchical lookup disabled for determinism).
  - Smoke test: `expo start --web --port 5174` → HTTP 200, 30 KB rendered output, RN-Web stylesheet (`css-view-*`, `r-borderColor-*` classes) confirms RN-Web is bundling correctly. Metro bundled 1146 modules cleanly with React Compiler enabled.
- [x] **p3-4** Configured `app.json` for cross-platform shipping: display name `KidsHub` (proper casing), slug `kidshub`, scheme `kidshub://` for deep links, **`ios.bundleIdentifier` and `android.package` both pinned to `com.getkidshub.app`** (matches the marketing domain — clean for App Store + Play Store discoverability). Web bundler explicitly set to Metro (`web.bundler: "metro"`); web output stays `static` (Vercel-deployable). Kept `newArchEnabled: true` (RN's New Architecture is default in SDK 54) and `experiments: { typedRoutes, reactCompiler }` from the template.

### 3b. Foundations

- [x] **p3-5** Wired Firebase JS SDK + EXPO_PUBLIC env vars.
  - `kidshub/firebase/config.ts` — initializeApp guarded by getApps().length===0 (hot-reload safe), exports `auth`, `db`, `storage`, default app. Uses `process.env.EXPO_PUBLIC_FIREBASE_*` (Expo's convention for client-exposed vars; same kidhub-7a207 project as kidshub-dashboard / kidshub-landing — Phase 4 p4-2 will lift to a shared workspace package).
  - `kidshub/.env` — copied from `kidshub-dashboard/.env` with VITE_FIREBASE_* → EXPO_PUBLIC_FIREBASE_* via sed.
  - `kidshub/.env.example` — committed checked-in template with the same EXPO_PUBLIC_* keys + comments explaining Expo conventions and why the Firebase web key isn't a secret (referrer-locked in GCP).
  - `kidshub/constants/roles.ts` — TypeScript port of `kidshub-dashboard/src/constants/roles.js`. Same `ROLES` enum, but `KIDSHUB_ALLOWED_ROLES = [PARENT, TEACHER]` (owners belong on dashboard). Phase 4 p4-2 lifts the duplicate.
  - **Auth persistence note**: `getAuth(app)` works fine on web (IndexedDB) and renders/builds clean on native, but on iOS/Android it'll warn "no persistence" and default to in-memory (logout on app restart). Proper RN persistence (`initializeAuth` + `getReactNativePersistence` + AsyncStorage) deferred to **p3-16** (mobile build config) since we're testing on web first.
  - **babel-preset-expo cleanup along the way**: when installing `nativewind`, npm pulled in babel-preset-expo@55 which Expo SDK 54 flagged as incompatible. Tried explicit pin in `kidshub/package.json` → npm wrote v55 anyway because some transitive forced it. Resolved with a root-level `overrides: { "babel-preset-expo": "~54.0.10" }` in the monorepo `package.json`, removed the (now-redundant) explicit dep from `kidshub/package.json`, and confirmed via `npm ls babel-preset-expo --all` that the only resolved copy is `expo@54.0.33 → babel-preset-expo@54.0.10 overridden`. Warning gone from `expo start` output.
  - Smoke test: home screen shows two NativeWind cards — pink "NativeWind smoke test" and green "Firebase project: kidhub-7a207". `curl localhost:5178/` returns the project ID + brand colors in the bundled HTML, confirming env loading + Firebase init work end-to-end.
- [x] **p3-6** Ported AuthContext + added ThemeContext for the kidshub Expo app.
  - `kidshub/contexts/AuthContext.tsx` — TS port of `kidshub-dashboard/src/contexts/AuthContext.jsx`. Same two-subscription pattern: `onAuthStateChanged(auth)` chained into `onSnapshot(users/{uid})` for live role/profile. Exposes `user`, `profile`, `role`, `isAuthenticated`, `isOwner`/`isTeacher`/`isParent`, `login`, `logout`, `resetPassword`, `loading`. Fails-closed on profile read errors (role=null → ProtectedRoute will bounce in p3-13). Legacy kidshub used a one-shot `getDoc(parents/{uid})` — we're going with the dashboard's live-snapshot pattern because role changes (teacher invite accepted, parent onboarded) need to propagate without a full logout.
  - `kidshub/contexts/ThemeContext.tsx` — new piece. Three-state preference (`'system' | 'light' | 'dark'`) layered on top of `useColorScheme` from `react-native`. Exposes `preference`, `setPreference(p)`, `effective` ('light' | 'dark' — what to actually render). In-memory only for MVP; AsyncStorage persistence will land with the same install that adds RN auth persistence in p3-16.
  - `kidshub/contexts/index.ts` — barrel export for `{ AuthProvider, useAuth, ThemeProvider, useTheme }` and their types.
  - `kidshub/app/_layout.tsx` — wired provider tree: `<ThemeProvider><AuthProvider><NavigationThemeBridge>…`. The bridge component consumes our ThemeContext's `effective` value and hands React Navigation the appropriate DarkTheme/DefaultTheme so header/tab chrome flip with user preference. Aliased RN's `ThemeProvider` import as `NavigationThemeProvider` to avoid collision with ours.
  - Smoke tests on home screen (4 cards now — pink/green/purple/blue): AuthContext card shows `signed out` / `signed in (role: X)` / `loading…` depending on state, and ThemeContext card has three Pressable pills (`system` / `light` / `dark`) that swap the `effective` value live. Verified via `curl`: `bg-accent-600`, `bg-info-600`, `AuthContext: <!-- -->loading…` all present in served HTML, meaning both providers mount cleanly during SSR without throwing the "useXxx must be used within an XxxProvider" guard.
- [x] **p3-7** Seeded `kidshub/hooks/` with the navigation + auth scaffolding the page ports (p3-9 through p3-13) will need.
  - **Legacy had zero custom hooks** — react-router-dom primitives were used inline. So p3-7 is really "write the hooks we'll need so porting is mechanical", not "port existing hooks".
  - Kept the template's theme helpers (`use-color-scheme`, `use-theme-color`) as-is.
  - Added three:
    - `use-is-route-active.ts` — replaces RRD's `<NavLink>` active-class pattern by wrapping `usePathname()`. Exact-match default; opt-in `{ exact: false }` for "path OR any nested child" matches. Used by BottomNav/Sidebar ports in p3-12.
    - `use-auth-redirect.ts` — one-liner for auth-sensitive screens. Two modes: `{ require: 'authenticated', redirectTo: '/login' }` bounces anons out; `{ require: 'anonymous', redirectTo: '/' }` keeps signed-in users off /login. Waits for `AuthContext.loading` so there's no flicker-bounce.
    - `use-require-role.ts` — layered on top. Takes an allow-list of roles, redirects to `/login` if anon, `/unauthorized` if signed-in-but-wrong-role. Defense-in-depth with Firestore rules (p3-15 is the real gate).
  - `hooks/index.ts` — barrel so `@/hooks` imports don't care about internal layout.
  - `hooks/README.md` — full RRD → expo-router migration map table. Pinned reference so page ports in p3-10/p3-11 don't require re-thinking per-file (useNavigate → useRouter, useLocation → usePathname + useLocalSearchParams, useParams → useLocalSearchParams, Navigate → Redirect, NavLink → useIsRouteActive, &lt;Routes&gt; → file tree). This doc is the p3-7 deliverable as much as the hooks themselves are.
  - Final smoke test: all 4 context cards (pink/green/purple/blue) render, `curl` confirms `bg-brand-500` / `bg-success-500` / `bg-accent-600` / `bg-info-600` / `kidhub-7a207` / `loading…` all present in served HTML. No babel-preset-expo warning. Phase 3b foundations done.
- [x] **p3-8** Installed NativeWind v4 + Tailwind 3.4. Six-file setup per the official Expo guide:
  - `tailwind.config.js` with full color palette ported from `kidshub-legacy/tailwind.config.js` (brand pink ramp #FFF0F7→#8F0040, accent purple, surface slate, success/warning/danger/info, plus Inter font family). NB: dropped the `boxShadow` and `keyframes`/`animation` extensions — RN doesn't honor CSS box shadows or CSS keyframes the same way; we'll use `react-native-reanimated` for animations and platform-aware shadow styles in p3-12 if we miss them. Content globs cover `app/`, `components/`, `hooks/`, `constants/`.
  - `global.css` — three Tailwind directives only (`@tailwind base/components/utilities`).
  - `babel.config.js` — `babel-preset-expo` with `jsxImportSource: 'nativewind'` + `nativewind/babel` preset chained.
  - `metro.config.js` — extended the existing monorepo config (watchFolders + nodeModulesPaths + disableHierarchicalLookup) by wrapping the final export in `withNativeWind(config, { input: './global.css' })`.
  - `nativewind-env.d.ts` — single triple-slash directive for type completion. NativeWind installer auto-added it to `tsconfig.json` includes.
  - `app/_layout.tsx` — added `import '../global.css'` at the top so the stylesheet is in the bundle from app boot.
  - Pinned `babel-preset-expo@~54.0.10` (npm initially installed v55 which Expo SDK 54 flagged as incompatible).
  - Visual smoke test: dropped a `<View className="bg-brand-500 p-4 rounded-xl my-2">` banner on the home screen, verified `bg-brand-500` compiled to `rgb(255 45 138)` (= #FF2D8A, our brand pink), `font-bold`/`p-4`/`rounded-xl`/`text-white` all present in served HTML. Banner gets removed in p3-9 when we replace the screen wholesale.

### 3c. Routing + UI

- [ ] **p3-9** Set up Expo Router role-based groups — `(auth)`, `(parent)`, `(teacher)`.
- [ ] **p3-10** Port parent pages (`Home`, `Schedule`, `Activity`, `Messages`, `Photos`, `Profile`) to `(parent)` group.
- [ ] **p3-11** Port teacher-relevant pages from `kidshub-dashboard` into `(teacher)` group.
- [ ] **p3-12** Port shared components (`layout`, `ui`, `icons`) — swap `<div>` for `<View>`/`<Pressable>`, `lucide` → `lucide-react-native`.

### 3d. Auth + data

- [ ] **p3-13** Implement role-aware login + route guards (parents can't access teacher routes, vice versa).
- [ ] **p3-14** Add teacher invite flow (owner invites in dashboard → Firestore user doc gets `role` + `daycareId`).
- [ ] **p3-15** Update Firestore security rules for role-scoped queries (`classroomId` for teachers, `childId` for parents).

### 3e. Build + deploy

- [ ] **p3-16** Configure EAS Build (`eas.json`) for iOS + Android.
- [ ] **p3-17** Configure web deploy for RN-Web output (Vercel or Expo hosting).
- [ ] **p3-18** Smoke-test on iOS simulator, Android emulator, and web.
- [ ] **p3-19** Delete `kidshub-legacy/` once parity is confirmed.

---

## Phase 4 — Cross-cutting cleanup

- [ ] **p4-1** Update root `README.md` with final 3-app layout + run commands.
- [ ] **p4-2** Consolidate Firebase config to env-driven single source of truth.
- [ ] **p4-3** Add GitHub Actions CI running `build` per workspace on PRs.
- [ ] **p4-4** Set up 3 Vercel projects + domain plan (`kidshub.com`, `app.kidshub.com`, `dashboard.kidshub.com`).

---

## Progress log

_Append dated notes as phases complete._

- **2026-04-21 (after midnight)** — Phase 3a (bootstrap) ✅. p3-1: legacy snapshot via `git mv kidshub kidshub-legacy` (28 files, history preserved), removed from workspaces (commit `8fd2d75`). p3-2/3/4: Expo SDK 54 bootstrapped, RN-Web verified, app.json configured. Two infrastructure landmines defused along the way: (1) Node 18.20 → 20.19 forced by Metro's use of `toReversed` (now pinned via `.nvmrc` + engines field — onboarding `nvm use` will auto-switch); (2) `semver@6` hoisting clash with reanimated@4's need for the v7 modular API, fixed by installing v7 into the `kidshub` workspace directly. Added monorepo-aware `metro.config.js` (watchFolders + nodeModulesPaths + disableHierarchicalLookup — the standard Expo monorepo template). Bundle IDs pinned to `com.getkidshub.app` for both iOS + Android (matches marketing domain). Web smoke test green: HTTP 200, RN-Web CSS classes present, 1146 modules bundled. Decisions locked in: NativeWind for styling (Tailwind classes port ~1:1), Firebase JS SDK for one-codepath data layer, `kidshub-legacy/` kept as reference until p3-19 parity check, npm workspaces over pnpm. Phase 3b (Firebase + contexts + NativeWind) starts next session.

- **2026-04-21** — Phase 0 complete. Flattened `kidshub-app/*` into `daycares/`, added root `package.json` (npm workspaces), `.editorconfig`, `daycares.code-workspace`, extended `.gitignore` for Expo/RN. Removed stale per-app `package-lock.json` files and nested `node_modules/`; root `npm install` produced a single hoisted tree (261 MB, down from 542 MB) with one canonical `package-lock.json`. Commits: `21ad22f` (scaffolding), `2f16764` (lockfile consolidation).
- **2026-04-21** — Phase 1 (code) complete. Audited `kidshub-landing` and confirmed marketing-only (no Firebase, auth, or leaked secrets). Added `dev`/`dev:vercel`/`build`/`deploy` scripts so `npm run dev:landing` works from the monorepo root. Merged Resend lead-email flow from an orphaned `js/chat.js` into the live `api/chat.js`, added CORS origin allowlist, generated a brand favicon at `assets/favicon.svg`. Added `vercel.json` with security headers and cache policy. Rewrote `kidshub-landing/README.md` for monorepo context and current env-var names. p1-4 (sign-in CTAs) confirmed as a no-op per product decision. Commits: `fb30a3a` (landing scripts), `ad7e014` (Aria harden + dead-code removal), pending (vercel.json + README). p1-6 (Vercel deploy + smoke test) handed off to user via Vercel dashboard.
- **2026-04-21 (evening)** — Phase 1 fully ✅. Aria was returning 400s on prod (the widget was sending `claude-haiku-4-5-20251001`, an Anthropic-direct model ID invalid on OpenRouter); the old handler had hidden this by hardcoding the model. Pinned model server-side (`ceef18b`). Chased a subsequent free-tier 429 through Llama 3.3 70B and a fallback chain (`ef27f26`, `3d3efb3`), ultimately choosing paid `anthropic/claude-3-haiku` for uptime (`829ecd9`) — ~$0.0025 per conversation is negligible for a lead widget. Created dedicated OpenRouter account for KidsHub, rotated key into Vercel env vars, set $10 per-key spend cap. Hardened `/api/chat` against abuse: Origin/Referer rejection (Layer 1) + request shape + size caps + `max_tokens` ceiling (Layer 2) — all running pre-upstream so bogus requests cost zero. Commit `7ec406d`. Verified with 6 live curl tests: legit traffic → 200, no Origin → 403, evil Origin → 403, oversized message → 400, too many messages → 400, `max_tokens: 5000` capped to 500. Upstash rate limiting (Layer 3) parked as optional polish.
- **2026-04-21 (night)** — Phase 2 security track closed. p2-5a: GCP Console Website restrictions added to the Firebase browser key (`getkidshub.com`, `*.getkidshub.com`, `*.vercel.app`, `localhost`, `127.0.0.1`) — leaked key in git history now unusable from unauthorized origins (commit `2dea7a6`). p2-5b: **critical finding** — Firestore rules were Firebase's default test rules, `allow read, write: if request.time < 2026-05-06`, meaning the entire database was world-readable and world-writable until May 6. With the project ID already exposed in git, this was a one-line exfiltration script from total data loss. Wrote tightened `firestore.rules` at repo root, published to Firebase Console: users/{uid} gated to self with immutable role, centers/{ownerId} gated to matching owner, flat business collections gated to any authenticated owner via `isOwner()` helper, default-deny catch-all. Extensively documented pilot-era multi-tenancy caveat (Phase 3 p3-15 will tighten). Smoke-tested by logging in with freshly registered owner account and clicking every page — no permission errors (commit `cce5fe4`). Remaining p2 work: p2-7 (Vercel rename + domain).
- **2026-04-21 (late night)** — Phase 2 ✅. p2-7 closed: Vercel project reconfigured (renamed `kidshub-owner` → `kidshub-dashboard` in dashboard, kept the auto-assigned `kidshub-owner.vercel.app` URL since Vercel doesn't rename `.vercel.app` URLs on project rename — purely cosmetic). Added `kidshub-dashboard/vercel.json` with SPA rewrites (`/(.*) → /index.html`) and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`) plus `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` (commit `2d36547`). Custom domain `dashboard.getkidshub.com` added in Vercel, GoDaddy CNAME pointed at `cname.vercel-dns.com`, DNS propagated under 10 min, SSL cert auto-issued. Owner login + dashboard smoke test green. **Subdomain choice (`dashboard.*`) free — no domain purchase, runs alongside the apex `getkidshub.com` landing on the same registrar.** Phase 2 complete; Phase 3 (`kidshub` Expo + RN Web rebuild) is next, biggest lift in the restructure.

- **2026-04-21 (late evening)** — Phase 2 kicked off. p2-1 folder rename (`kidshub-owner` → `kidshub-dashboard`, 58 files, history preserved) in commit `4988fcc`. p2-2 internal rename (package.json name, 13 mock staff emails scrubbed to `@example.com` per RFC 2606, lockfile rebuilt cleanly) in commit `7da147b`. p2-3 page audit done — 6 pages port to kidshub (Children, ChildProfile, Messages, Schedule, CheckIn, Activities), 5 stay in dashboard (Login, Register, Dashboard, Classrooms, Staff), Settings splits; matrix above drives Phase 3 (commit `85432ff`). p2-5 surfaced a git-history Firebase key leak (`810abbd`) — Firebase web keys aren't server secrets but needs GCP referrer restrictions + Firestore rules audit + optional rotation (dashboard work, tracked as p2-5a/b/c). p2-4 implemented the full role model (didn't exist — no central enum, no profile-doc subscription, no role-gated routing). Added `constants/roles.js` (ROLES + DASHBOARD_ALLOWED_ROLES), wired `AuthContext` to subscribe to `users/{uid}` via onSnapshot and expose `role` + role predicates, made `ProtectedRoute` take `allowedRoles` (default owner-only), built on-brand `Unauthorized` page distinguishing no-profile / wrong-role / unknown cases, switched `Register.jsx` to `ROLES.OWNER`. Dashboard builds clean (836kB bundle, pre-existing size warning). Client check is defense-in-depth — real gate is Firestore rules in p3-15.
