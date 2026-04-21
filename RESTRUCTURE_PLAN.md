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

- [ ] **p2-1** Rename folder `kidshub-owner` → `kidshub-dashboard`.
- [ ] **p2-2** Update `package.json` name + global find/replace of `kidshub-owner` references.
- [ ] **p2-3** Audit pages — mark teacher-relevant pages (`Activities`, `CheckIn`, `Messages`, `Schedule`, `ChildProfile`) for extraction to `kidshub`.
- [ ] **p2-4** Strengthen `ProtectedRoute` to owner-only + friendly redirect for non-owners.
- [ ] **p2-5** Update `.env.example`, rotate any committed secrets.
- [ ] **p2-6** Write `README.md` (owner portal purpose, deploy, local dev).
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
- **2026-04-21 (evening)** — Phase 1 fully ✅. Aria was returning 400s on prod (the widget was sending `claude-haiku-4-5-20251001`, an Anthropic-direct model ID invalid on OpenRouter); the old handler had hidden this by hardcoding the model. Pinned model server-side (`ceef18b`). Chased a subsequent free-tier 429 through Llama 3.3 70B and a fallback chain (`ef27f26`, `3d3efb3`), ultimately choosing paid `anthropic/claude-3-haiku` for uptime (`829ecd9`) — ~$0.0025 per conversation is negligible for a lead widget. Created dedicated OpenRouter account for KidsHub, rotated key into Vercel env vars, set $10 per-key spend cap. Hardened `/api/chat` against abuse: Origin/Referer rejection (Layer 1) + request shape + size caps + `max_tokens` ceiling (Layer 2) — all running pre-upstream so bogus requests cost zero. Commit `7ec406d`. Verified with 6 live curl tests: legit traffic → 200, no Origin → 403, evil Origin → 403, oversized message → 400, too many messages → 400, `max_tokens: 5000` capped to 500. Upstash rate limiting (Layer 3) parked as optional polish. Next: Phase 2 — `kidshub-dashboard` rename.
