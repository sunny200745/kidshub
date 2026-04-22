# KidsHub

Monorepo for the KidsHub daycare platform — three independent apps sharing one Firebase backend.

## Apps

| Folder | Purpose | Stack | Platforms | Status |
| --- | --- | --- | --- | --- |
| [`kidshub/`](./kidshub) | Unified app for parents and teachers (role-based) | Expo + React Native Web (TypeScript) | iOS, Android, Web | ✅ Live at [kidshub-app.vercel.app](https://kidshub-app.vercel.app) |
| [`kidshub-dashboard/`](./kidshub-dashboard) | Daycare owner portal | React + Vite (JavaScript) | Web only | ✅ Live at [dashboard.getkidshub.com](https://dashboard.getkidshub.com) |
| [`kidshub-landing/`](./kidshub-landing) | Public marketing site + Aria AI chat API | Static HTML/CSS/JS + Vercel `/api` routes (Node) | Web only | ✅ Live at [getkidshub.com](https://getkidshub.com) |

## Requirements

- Node.js ≥ 20 (see [`.nvmrc`](./.nvmrc))
- npm ≥ 10 (ships with Node 20)
- For kidshub native builds: Xcode 15+ (iOS) / Android Studio (Android) — web-only dev needs neither

## Quick start

```bash
# From the repo root — installs all three workspaces via npm workspaces
npm install

# Run each app locally (each opens its own dev server)
npm run dev:kidshub          # Expo web  → http://localhost:5180
npm run dev:kidshub:ios      # Expo iOS simulator
npm run dev:kidshub:android  # Expo Android emulator
npm run dev:dashboard        # Vite      → http://localhost:5173
npm run dev:landing          # Vercel CLI → http://localhost:3000

# Production builds (each workspace outputs into its own dist/)
npm run build:kidshub
npm run build:dashboard
npm run build:landing
npm run build:all            # all three sequentially
```

## Environment variables

Each app has its own `.env.example`. Copy to `.env` (or `.env.local`) and fill in values for your Firebase project:

```bash
cp kidshub/.env.example kidshub/.env
cp kidshub-dashboard/.env.example kidshub-dashboard/.env.local
# kidshub-landing has no env file — Aria chat secrets live in Vercel project settings
```

Env var prefixes differ because of bundler conventions — there's no way around this:

| App | Prefix | Why |
| --- | --- | --- |
| `kidshub` | `EXPO_PUBLIC_FIREBASE_*` | Expo exposes `EXPO_PUBLIC_*` to client code |
| `kidshub-dashboard` | `VITE_FIREBASE_*` | Vite exposes `VITE_*` to client code |
| `kidshub-landing` | N/A (inlined) | Static HTML, Firebase SDK loaded via CDN |

All three point to the same Firebase project (`kidhub-7a207`).

## Repo layout

```
daycares/
├── kidshub/                    # parent + teacher (Expo + RN Web, TypeScript)
├── kidshub-dashboard/          # owner dashboard (React + Vite, JavaScript)
├── kidshub-landing/            # marketing site + Aria chat API (static + Vercel /api)
├── firestore.rules             # source of truth for Firestore Security Rules
├── package.json                # npm workspaces root (overrides + shared scripts)
├── package-lock.json           # single root lockfile (no per-workspace lockfiles)
├── RESTRUCTURE_PLAN.md         # historical tracking doc for the 2026 restructure
├── daycares.code-workspace     # VS Code multi-root workspace
└── README.md                   # this file
```

## Firebase

All apps share one Firebase project: **`kidhub-7a207`**.

- **Authentication**: email/password, used by all three apps. Role is stored at `users/{uid}.role` (values: `owner`, `teacher`, `parent`).
- **Firestore**: source-of-truth data layer. Security rules live at [`firestore.rules`](./firestore.rules) — deploy via Firebase Console → Firestore → Rules → paste → Publish. (Automated CI-driven `firebase deploy` planned for Phase 4.)
- **Storage**: child photos + message attachments. Rules baked into the Firestore rules file (Storage uses its own rules file in Firebase Console — mirror from `firestore.rules` Storage section.)

The Firebase **web API key** is locked down with HTTP referrer restrictions in GCP Console (`getkidshub.com`, `*.getkidshub.com`, `*.vercel.app`, `localhost`, `127.0.0.1`) so the key being visible in client bundles is not a security issue.

## Role model

| Role | Signs in on | Lands on | Can create | Typical tenancy |
| --- | --- | --- | --- | --- |
| `owner` | `dashboard.getkidshub.com` | `/dashboard` | classrooms, children, staff, parents, activities, messages, announcements, invites | 1 daycare (UID = daycareId) |
| `teacher` | `kidshub-app.vercel.app` | `/classroom` | activities, messages, attendance | their assigned classroom in an owner's daycare |
| `parent` | `kidshub-app.vercel.app` | `/home` | messages only | their linked children in an owner's daycare |

Teachers and parents are **invite-only** — no self-signup from the kidshub app. Owners issue invite links from the dashboard (Staff → Invite teacher / ChildProfile → Invite parent).

## Deployment

| App | Vercel project | Production URL | Preview URL |
| --- | --- | --- | --- |
| `kidshub-landing` | `kidshub-landing` | https://getkidshub.com | Auto per-PR |
| `kidshub-dashboard` | `kidshub-dashboard` | https://dashboard.getkidshub.com | Auto per-PR |
| `kidshub` | `kidshub-app` | https://kidshub-app.vercel.app | Auto per-PR |

Long-term domain plan (post-domain-purchase, tracked in Phase 4):

- `kidshub.com` → kidshub-landing
- `app.kidshub.com` → kidshub (parent + teacher)
- `dashboard.kidshub.com` → kidshub-dashboard

See `RESTRUCTURE_PLAN.md` → Phase 4 → p4-4 for the full DNS/Vercel migration plan.

## Testing

There's no automated test suite yet — every feature has been hand-smoke-tested end-to-end. GitHub Actions CI (Phase 4 p4-3) will run `npm run build` per workspace on every PR to catch regressions.

## Restructure history

This monorepo went through a full restructure in April 2026. See [`RESTRUCTURE_PLAN.md`](./RESTRUCTURE_PLAN.md) for the phase-by-phase task list, decisions, and progress log. Current status: **all 4 phases shipped** — monorepo flatten ✅, landing ✅, dashboard ✅, kidshub rebuild on Expo + RN Web ✅, cleanup in progress.

## License

MIT
