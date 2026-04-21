# KidsHub

Monorepo for the KidsHub daycare platform. Three sibling workspaces, one npm workspace root.

## Apps

| Folder | Purpose | Stack | Platforms |
| --- | --- | --- | --- |
| [`kidshub/`](./kidshub) | Unified app for parents and teachers (role-based) | React + Vite _(Phase 3: migrating to Expo + React Native Web)_ | Web _(mobile coming)_ |
| [`kidshub-owner/`](./kidshub-owner) | Daycare owner dashboard _(renaming to `kidshub-dashboard` in Phase 2)_ | React + Vite | Web only |
| [`kidshub-landing/`](./kidshub-landing) | Public marketing site | Static HTML/CSS/JS + Vercel `/api` routes | Web only |

## Getting started

```bash
npm install          # installs all workspaces

npm run dev:kidshub  # run parent+teacher app (http://localhost:5174)
npm run dev:owner    # run owner dashboard (http://localhost:5173)
npm run dev:landing  # run marketing site
```

Or run per-workspace: `npm run dev --workspace kidshub-owner`.

## Repo layout

```
daycares/
├── kidshub/            # parent + teacher (web + mobile, role-based)
├── kidshub-owner/      # owner dashboard (web only)  →  kidshub-dashboard
├── kidshub-landing/    # marketing site (web only)
├── package.json        # npm workspaces root
├── RESTRUCTURE_PLAN.md # live tracking doc for the in-progress refactor
└── daycares.code-workspace
```

## Restructure in progress

This monorepo is actively being restructured. See [`RESTRUCTURE_PLAN.md`](./RESTRUCTURE_PLAN.md) for:

- Target state (parent+teacher unified, owner-only dashboard, marketing-only landing)
- Phase-by-phase task list and decisions
- Progress log

## Firebase

All three apps share a single Firebase project. Config currently lives in each app's `src/firebase/config.js` — Phase 4 will consolidate this to an env-driven single source of truth.

## Deployment

Deployed on Vercel. Domain plan (Phase 4):

- `kidshub.com` → `kidshub-landing`
- `app.kidshub.com` → `kidshub`
- `dashboard.kidshub.com` → `kidshub-dashboard`

## License

MIT
