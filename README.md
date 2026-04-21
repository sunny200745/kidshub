# KidsHub

Monorepo for the KidsHub daycare platform.

## Apps

| Folder | Purpose | Stack | Platforms | Status |
| --- | --- | --- | --- | --- |
| [`kidshub/`](./kidshub) | Unified app for parents and teachers (role-based) | Expo + React Native Web (TypeScript) | iOS, Android, Web | 🚧 Phase 3 — being rebuilt from `kidshub-legacy/` |
| [`kidshub-dashboard/`](./kidshub-dashboard) | Daycare owner portal | React + Vite | Web only | ✅ Live at [dashboard.getkidshub.com](https://dashboard.getkidshub.com) |
| [`kidshub-landing/`](./kidshub-landing) | Public marketing site | Static HTML/CSS/JS + Vercel `/api` routes | Web only | ✅ Live at [getkidshub.com](https://getkidshub.com) |
| [`kidshub-legacy/`](./kidshub-legacy) | Frozen snapshot of the old React + Vite parent app | React + Vite | Web only | 🧊 Reference only, deleted after Phase 3 parity |

## Getting started

```bash
npm install            # installs workspaces (excludes kidshub-legacy)

npm run dev:dashboard  # owner dashboard  → http://localhost:5173
npm run dev:landing    # marketing site   → http://localhost:3000
# npm run dev:kidshub  # disabled until Phase 3 bootstrap completes
```

To run the legacy parent app for reference (not part of workspaces):

```bash
cd kidshub-legacy && npm install && npm run dev    # → http://localhost:5174
```

## Repo layout

```
daycares/
├── kidshub/                # parent + teacher (Expo + RN Web) — being built in Phase 3
├── kidshub-dashboard/      # owner dashboard (web only) — live
├── kidshub-landing/        # marketing site (web only) — live
├── kidshub-legacy/         # frozen reference snapshot — deleted after Phase 3
├── firestore.rules         # source of truth for Firestore Security Rules
├── package.json            # npm workspaces root
├── RESTRUCTURE_PLAN.md     # live tracking doc for the in-progress refactor
└── daycares.code-workspace
```

## Restructure in progress

This monorepo is actively being restructured. See [`RESTRUCTURE_PLAN.md`](./RESTRUCTURE_PLAN.md) for:

- Target state (parent+teacher unified, owner-only dashboard, marketing-only landing)
- Phase-by-phase task list and decisions
- Progress log

Current status: **Phase 0 ✅ → Phase 1 ✅ → Phase 2 ✅ → Phase 3 in progress.**

## Firebase

All apps share a single Firebase project (`kidhub-7a207`). Each app's `src/firebase/config.js` is env-driven (`VITE_FIREBASE_*` for Vite apps, `EXPO_PUBLIC_FIREBASE_*` for Expo). Firestore Security Rules live at the repo root in [`firestore.rules`](./firestore.rules) — deploy via Firebase Console for now, CI-driven `firebase deploy` planned for Phase 4.

The Firebase **web API key** is locked down with HTTP referrer restrictions in GCP Console (`getkidshub.com`, `*.getkidshub.com`, `*.vercel.app`, `localhost`, `127.0.0.1`) — leaked-key-in-git-history risk mitigated.

## Deployment

| App | Vercel project | Production URL |
| --- | --- | --- |
| `kidshub-landing` | `kidshub-landing` | https://getkidshub.com |
| `kidshub-dashboard` | `kidshub-dashboard` | https://dashboard.getkidshub.com |
| `kidshub` | _TBD (Phase 3, p3-17)_ | `app.getkidshub.com` (planned) |

## License

MIT
