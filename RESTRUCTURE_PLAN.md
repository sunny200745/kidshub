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

## Open decisions (resolve before Phase 3)

- [ ] Styling on mobile: `NativeWind` (default, keeps Tailwind muscle memory) **or** `Tamagui`.
- [ ] Firebase on mobile: Firebase JS SDK (default, one code path) **or** `@react-native-firebase/*` (native perf, web needs a separate path).
- [ ] Keep `kidshub-legacy/` snapshot during port, or rely purely on git history.
- [ ] Expo monorepo strategy: stay on npm workspaces + Metro config (default) **or** migrate to pnpm for smoother RN ergonomics.

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

## Phase 2 — `kidshub-dashboard` (rename from `kidshub-owner`)

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
  - [ ] **p2-5a** _(user, dashboard)_ Lock down the Google Cloud Console API key with HTTP-referrer restrictions (`getkidshub.com/*`, `www.getkidshub.com/*`, `*.vercel.app/*`, `localhost:*/*`).
  - [ ] **p2-5b** _(user, dashboard)_ Audit Firestore Security Rules — paste them to the assistant for review. Must be scoped per-user/owner, not `allow ... if true` or `if request.auth != null`.
  - [ ] **p2-5c** _(optional)_ Rotate the Firebase web API key and update `VITE_FIREBASE_API_KEY` in Vercel env vars for all three apps. Don't bother rewriting git history (destructive, doesn't scrub GitHub caches).
- [x] **p2-6** Write `README.md` (owner portal purpose, deploy, local dev). Covers tech stack, access-control model (role gating + defense-in-depth caveat), full folder layout, local dev + seed flow, Firestore data model (including the `users.role` vs `staff.role` trap), env vars with the Firebase-keys-aren't-secrets nuance, deploy steps, and a p2-7 Vercel post-rename checklist for the user to execute.
- [ ] **p2-7** Reconfigure Vercel project name + domain, deploy, smoke-test owner flow.

---

## Phase 3 — `kidshub` (biggest lift: unify parent + teacher, Expo + RN Web)

**Goal:** Single Expo app serving parents and teachers with role-based routing, shipping to iOS, Android, and Web.

### 3a. Bootstrap

- [ ] **p3-1** Back up existing `kidshub/` → `kidshub-legacy/` for reference.
- [ ] **p3-2** Bootstrap fresh Expo app (TypeScript + Expo Router template).
- [ ] **p3-3** Enable React Native Web + verify `expo start --web` works.
- [ ] **p3-4** Configure `app.json` for web + iOS/Android bundle IDs.

### 3b. Foundations

- [ ] **p3-5** Port Firebase config (decide: JS SDK cross-platform vs `@react-native-firebase`).
- [ ] **p3-6** Port auth/user/theme contexts to Expo.
- [ ] **p3-7** Port hooks, swapping `react-router-dom` for `expo-router` equivalents.
- [ ] **p3-8** Replace Tailwind with NativeWind (or Tamagui) for cross-platform styling.

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

- **2026-04-21** — Phase 0 complete. Flattened `kidshub-app/*` into `daycares/`, added root `package.json` (npm workspaces), `.editorconfig`, `daycares.code-workspace`, extended `.gitignore` for Expo/RN. Removed stale per-app `package-lock.json` files and nested `node_modules/`; root `npm install` produced a single hoisted tree (261 MB, down from 542 MB) with one canonical `package-lock.json`. Commits: `21ad22f` (scaffolding), `2f16764` (lockfile consolidation).
- **2026-04-21** — Phase 1 (code) complete. Audited `kidshub-landing` and confirmed marketing-only (no Firebase, auth, or leaked secrets). Added `dev`/`dev:vercel`/`build`/`deploy` scripts so `npm run dev:landing` works from the monorepo root. Merged Resend lead-email flow from an orphaned `js/chat.js` into the live `api/chat.js`, added CORS origin allowlist, generated a brand favicon at `assets/favicon.svg`. Added `vercel.json` with security headers and cache policy. Rewrote `kidshub-landing/README.md` for monorepo context and current env-var names. p1-4 (sign-in CTAs) confirmed as a no-op per product decision. Commits: `fb30a3a` (landing scripts), `ad7e014` (Aria harden + dead-code removal), pending (vercel.json + README). p1-6 (Vercel deploy + smoke test) handed off to user via Vercel dashboard.
- **2026-04-21 (evening)** — Phase 1 fully ✅. Aria was returning 400s on prod (the widget was sending `claude-haiku-4-5-20251001`, an Anthropic-direct model ID invalid on OpenRouter); the old handler had hidden this by hardcoding the model. Pinned model server-side (`ceef18b`). Chased a subsequent free-tier 429 through Llama 3.3 70B and a fallback chain (`ef27f26`, `3d3efb3`), ultimately choosing paid `anthropic/claude-3-haiku` for uptime (`829ecd9`) — ~$0.0025 per conversation is negligible for a lead widget. Created dedicated OpenRouter account for KidsHub, rotated key into Vercel env vars, set $10 per-key spend cap. Hardened `/api/chat` against abuse: Origin/Referer rejection (Layer 1) + request shape + size caps + `max_tokens` ceiling (Layer 2) — all running pre-upstream so bogus requests cost zero. Commit `7ec406d`. Verified with 6 live curl tests: legit traffic → 200, no Origin → 403, evil Origin → 403, oversized message → 400, too many messages → 400, `max_tokens: 5000` capped to 500. Upstash rate limiting (Layer 3) parked as optional polish.
- **2026-04-21 (late evening)** — Phase 2 kicked off. p2-1 folder rename (`kidshub-owner` → `kidshub-dashboard`, 58 files, history preserved) in commit `4988fcc`. p2-2 internal rename (package.json name, 13 mock staff emails scrubbed to `@example.com` per RFC 2606, lockfile rebuilt cleanly) in commit `7da147b`. p2-3 page audit done — 6 pages port to kidshub (Children, ChildProfile, Messages, Schedule, CheckIn, Activities), 5 stay in dashboard (Login, Register, Dashboard, Classrooms, Staff), Settings splits; matrix above drives Phase 3 (commit `85432ff`). p2-5 surfaced a git-history Firebase key leak (`810abbd`) — Firebase web keys aren't server secrets but needs GCP referrer restrictions + Firestore rules audit + optional rotation (dashboard work, tracked as p2-5a/b/c). p2-4 implemented the full role model (didn't exist — no central enum, no profile-doc subscription, no role-gated routing). Added `constants/roles.js` (ROLES + DASHBOARD_ALLOWED_ROLES), wired `AuthContext` to subscribe to `users/{uid}` via onSnapshot and expose `role` + role predicates, made `ProtectedRoute` take `allowedRoles` (default owner-only), built on-brand `Unauthorized` page distinguishing no-profile / wrong-role / unknown cases, switched `Register.jsx` to `ROLES.OWNER`. Dashboard builds clean (836kB bundle, pre-existing size warning). Client check is defense-in-depth — real gate is Firestore rules in p3-15.
