# kidshub-dashboard

Owner portal for **KidsHub** — the web-only management dashboard used by daycare business owners to run their centers (enroll children, manage classrooms, invite staff, track activities, message parents, configure settings).

**Web-only by design.** Mobile parents and teachers use the separate [`kidshub/`](../kidshub) app. The dashboard is Chrome/desktop-optimized because owners do admin work at a laptop, not a phone.

This is one of three workspaces in the [`daycares/`](../README.md) monorepo:

- `kidshub-landing/` (marketing)
- `kidshub-dashboard/` ← **you are here** (owner portal)
- `kidshub/` (parent + teacher app, Expo + React Native Web)

## Tech

- **React 18** + **Vite 5** — SPA, no SSR
- **Tailwind CSS 3** — design tokens in [`tailwind.config.js`](./tailwind.config.js)
- **React Router 6** — client-side routing with a role-gated `ProtectedRoute`
- **Firebase JS SDK 10** — Auth (email/password), Firestore (data), Storage (future: photos)
- **lucide-react** — icon set

## Access control (owner-only)

Only users with `role: 'owner'` can sign in. Teachers and parents who try to log in are bounced to a friendly `/unauthorized` page that points them at the upcoming `kidshub` app.

The role model lives in [`src/constants/roles.js`](./src/constants/roles.js) — single source of truth for `owner` / `teacher` / `parent`. [`src/contexts/AuthContext.jsx`](./src/contexts/AuthContext.jsx) subscribes to `users/{uid}` in Firestore and exposes `role`, `isOwner`, `isTeacher`, `isParent`. [`src/components/ProtectedRoute.jsx`](./src/components/ProtectedRoute.jsx) takes an `allowedRoles` prop (default: owner-only) and handles the routing.

> **Defense-in-depth, not the only defense.** The client role check is bypass-able from browser devtools. The authoritative gate must be Firestore Security Rules — scoped per-tenant, gated on `request.auth.uid`'s role. Those rules are owned by the dashboard (Google Cloud Console → Firestore → Rules) and tracked as p3-15 in the [restructure plan](../RESTRUCTURE_PLAN.md).

## Folder layout

```
kidshub-dashboard/
├── src/
│   ├── App.jsx                  # Route definitions
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Tailwind directives + global styles
│   ├── constants/
│   │   └── roles.js             # ROLES enum (owner/teacher/parent), allowlists
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Firebase Auth + users/{uid} profile subscription
│   │   └── index.js
│   ├── components/
│   │   ├── ProtectedRoute.jsx   # Auth + role gate
│   │   ├── ChildCard.jsx
│   │   ├── HighlightNoteBox.jsx
│   │   ├── QuickLogBar.jsx
│   │   ├── layout/              # Header, Sidebar, Layout wrapper
│   │   ├── ui/                  # Card, Button, Modal, Badge, etc.
│   │   ├── icons/               # ActivityIcons (meal/nap/diaper/…)
│   │   └── modals/              # AddChildModal, AddClassroomModal, AddStaffModal
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx         # Owner self-signup (creates users/{uid} + centers/{uid})
│   │   ├── Unauthorized.jsx     # Bounce page for non-owners
│   │   ├── Dashboard.jsx        # Owner overview
│   │   ├── Children.jsx         # All children across the center
│   │   ├── ChildProfile.jsx
│   │   ├── Classrooms.jsx
│   │   ├── Staff.jsx
│   │   ├── Messages.jsx
│   │   ├── Schedule.jsx
│   │   ├── CheckIn.jsx
│   │   ├── Activities.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── index.js             # Re-exports
│   │   └── useFirebase.js       # useChildrenData, useClassroomsData, useStaffData, …
│   ├── firebase/
│   │   ├── config.js            # Reads VITE_FIREBASE_* env vars
│   │   ├── api.js               # childrenApi, activitiesApi, messagesApi, …
│   │   └── seedData.js          # Dev-only: populate Firestore with mock data
│   └── data/
│       └── mockData.js          # Static mock data for early development
├── index.html                   # Vite entry
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Local development

### First-time setup

```bash
# From monorepo root
npm install                       # Installs for all workspaces into hoisted node_modules/

# Per-app env vars
cp kidshub-dashboard/.env.example kidshub-dashboard/.env
# then edit .env with your Firebase project's real values
```

### Run the dev server

```bash
# From the monorepo root
npm run dev:dashboard             # http://localhost:5173

# Or from this folder
cd kidshub-dashboard
npm run dev
```

Vite hot-reloads on save. Firestore reads/writes hit the real Firebase project configured in `.env` — there's no emulator wiring yet.

### Seed dev data

The Dashboard page has a **Seed Database** button (visible when the center has no data). It creates mock classrooms, children, staff, and activities in Firestore under your current owner's tenant so you have something to navigate.

### Build

```bash
npm run build                     # outputs dist/
npm run preview                   # serve the built bundle locally
```

## Data model

Each owner owns one center. The owner's Firebase Auth UID is reused as the center ID (`centers/{ownerId}`) — simple 1:1 mapping for now.

```
users/{uid}
  uid, email, firstName, lastName, phone?, centerName
  role:    'owner' | 'teacher' | 'parent'
  status:  'active' | 'inactive' | 'invited'
  createdAt, updatedAt

centers/{ownerId}
  ownerId, name, email, phone?, address?
  settings: { timezone, operatingHours: {…} }
  createdAt, updatedAt

  classrooms/{classroomId}
    name, ageGroup, capacity, currentCount, color, schedule[], …

  children/{childId}
    firstName, lastName, dob, classroomId, parentIds[], status, …

  staff/{staffId}
    firstName, lastName, email, role (job title, not auth role), classroomId, …

  activities/{activityId}
    childId, staffId, type, note, timestamp, …

  messages/{conversationId}
    childId, participants, messages[]
```

> **`role` vs `member.role`.** `users/{uid}.role` is the auth role (owner/teacher/parent) — gates app access. `staff/{staffId}.role` is the job title (Lead Teacher, Assistant, Director) — metadata only, no access implications. Don't conflate them.

## Environment variables

Set in `.env` locally and in Vercel → Project → Settings → Environment Variables for deployed environments.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | `<project>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID (only if Analytics is enabled) |

> Firebase "web API keys" are **not server secrets** — they're public by design, embedded in the client bundle. Security comes from Firestore Rules + Google Cloud Console HTTP-referrer restrictions on the key, **not** from hiding the value. Historic commits that leaked these values to git aren't an instant breach, but do make the project discoverable — add HTTP-referrer restrictions in GCP Console as a safety net.

## Deployment (Vercel)

The dashboard is one of three Vercel projects in the monorepo. Its **Root Directory** must be set to `kidshub-dashboard` in Vercel project settings.

### Deploy

```bash
# From this folder
npx vercel --prod
```

Or push to `main` — Vercel deploys automatically on every push, creates preview deploys for branches/PRs.

### Domains

- Production (current): `kidshub-owner.vercel.app` (renamed project pending — see p2-7 in the [restructure plan](../RESTRUCTURE_PLAN.md))
- Target: `dashboard.getkidshub.com` (custom domain, Phase 2 cleanup)
- Previews: `*.vercel.app`

### Post-rename checklist (p2-7)

The folder was renamed from `kidshub-owner` to `kidshub-dashboard`. The Vercel project itself still uses the old name until these steps are done:

1. Vercel → Project → Settings → General → rename project to `kidshub-dashboard`.
2. Vercel → Project → Settings → Git → confirm **Root Directory** is `kidshub-dashboard`.
3. Vercel → Project → Settings → Domains → add `dashboard.getkidshub.com`.
4. DNS: add `CNAME dashboard → cname.vercel-dns.com.` in the registrar.
5. Smoke-test: register a new owner, confirm role check, seed DB, click through each page.

## Security notes

- **Role gating** is client-side defense-in-depth. Firestore Security Rules are the authoritative gate and must be tightened before `kidshub` launches (p3-15).
- **Firebase web API key** was committed to git history in commit `810abbd`. Web keys aren't server secrets, but add GCP HTTP-referrer restrictions (p2-5a) to scope the key to KidsHub domains only. Optional: rotate (p2-5c).
- **No CSP** configured yet. Low priority for a logged-in-only app, but worth adding when Phase 2 wraps up.

## Related docs

- Monorepo overview: [`../README.md`](../README.md)
- Full restructure plan and task log: [`../RESTRUCTURE_PLAN.md`](../RESTRUCTURE_PLAN.md)

---

Built by [Nuvaro](https://nuvaro.ca) · Langley, BC
