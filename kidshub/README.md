# kidshub

Unified parent + teacher app — Expo + React Native Web (TypeScript) with role-based routing, invite-only signup, and a shared Firebase backend with [`kidshub-dashboard`](../kidshub-dashboard) and [`kidshub-landing`](../kidshub-landing).

## Stack

- **Expo SDK 54** (React Native + React Native Web), TypeScript
- **Expo Router** for file-based routing with role-based groups
- **NativeWind v4** (Tailwind for React Native) for styling
- **Firebase JS SDK** (Auth + Firestore + Storage)
- **lucide-react-native** for icons

## Local development

From the **monorepo root** (`daycares/`):

```bash
npm install
npm run dev:kidshub           # Expo web  → http://localhost:5180
npm run dev:kidshub:ios       # iOS simulator
npm run dev:kidshub:android   # Android emulator
```

From **this workspace** directly:

```bash
npx expo start --web          # same as dev:kidshub
npx expo start --ios
npx expo start --android
```

## Environment variables

Copy `.env.example` → `.env` and fill in the Firebase project's values. All keys are **client-side public** (Firebase API key is HTTP-referrer-locked in GCP Console — see root `README.md`).

```bash
cp .env.example .env
```

## File structure

```
kidshub/
├── app/                      # Expo Router — file-based routing
│   ├── (auth)/               # /login, /register (invite-only explainer), /forgot-password
│   ├── (parent)/             # /home, /activity, /schedule, /messages, /photos, /profile
│   ├── (teacher)/            # /classroom, /check-in, /activities, /messages, /teacher-profile
│   ├── invite/[token].tsx    # public invite-accept flow (parent OR teacher)
│   ├── index.tsx             # role router — dispatches to the right group
│   └── unauthorized.tsx      # owners / no-role / wrong-role landing
├── components/               # Layout, UI primitives, icons
├── contexts/                 # AuthContext (role + profile), ThemeContext
├── hooks/                    # useAuthRedirect, useRequireRole, useRoleTheme
├── firebase/config.ts        # Firebase SDK init (shared Firebase project)
├── constants/roles.ts        # role enum + allow-list for this app
├── tailwind.config.js        # Tailwind tokens including role theme colors
└── eas.json                  # EAS Build profiles (see Native builds below)
```

## Role-based routing

See [root README](../README.md#role-model) for the full role model. Quick recap:

- `/` → `RoleRouter` → `(parent)/home` (parent) or `(teacher)/classroom` (teacher)
- Owners get bounced to `/unauthorized` with a link to [dashboard.getkidshub.com](https://dashboard.getkidshub.com)
- No self-signup — `/register` is just an explainer, actual signup happens via `/invite/[token]`

## Native builds (EAS)

The `eas.json` in this folder defines three build profiles. First time only, you need to link this app to an EAS cloud project.

### One-time setup

```bash
cd kidshub
npm install -g eas-cli
eas login                      # uses your Expo account
eas init                       # creates the EAS project, writes extra.eas.projectId into app.json
```

After `eas init`, commit the `app.json` change — the `extra.eas.projectId` field is how EAS associates this source with a cloud project for OTA updates.

### Build profiles

| Profile | Distribution | Purpose | Command |
| --- | --- | --- | --- |
| `development` | Internal | Dev client with hot reload on simulators | `eas build --profile development --platform ios` |
| `preview` | Internal | Ad-hoc TestFlight / internal APK for QA | `eas build --profile preview --platform all` |
| `production` | Store | Final iOS/Android store submissions | `eas build --profile production --platform all` |

### Setting secrets in EAS

The `preview` and `production` profiles read Firebase env vars from EAS Secrets (not from your local `.env`). Upload them once:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "kidhub-7a207.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "kidhub-7a207"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "kidhub-7a207.firebasestorage.app"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "G-..."
```

Verify with `eas secret:list`. Re-use any values you already have in Vercel project settings for consistency.

### Store submission prerequisites (edit `eas.json`)

Before your first `eas submit`, fill in the submit section in `eas.json`:

- **iOS**: `appleId` (your Apple ID), `ascAppId` (App Store Connect app ID — create the app in App Store Connect first), `appleTeamId`
- **Android**: Upload a Google Play service account JSON key to this folder as `android-service-account.json` (git-ignored) and reference it via `serviceAccountKeyPath`

## Web deployment

The web build (`npm run build`) runs `expo export --platform web`, outputting to `dist/`. Deployed to Vercel as the `kidshub-app` project, live at [https://kidshub-app.vercel.app](https://kidshub-app.vercel.app).

Vercel settings:

- Framework preset: **Other**
- Build command: `cd .. && npm run build:kidshub`
- Output directory: `dist` (relative to this folder, which Vercel auto-detects as root because the project is configured to deploy from `kidshub/`)
- Env vars: all `EXPO_PUBLIC_FIREBASE_*` set in Vercel project settings → Environment Variables

## Troubleshooting

- **"configs.toReversed is not a function"** on `expo start --web` → Node version mismatch. Use Node 20 (see `.nvmrc`).
- **Port conflict on 5180** → change with `npx expo start --web --port 5181`.
- **Routing goes to wrong view after role change in Firestore** → sign out + hard refresh. Firestore's IndexedDB cache holds the old profile until the next server snapshot.
- **"Firebase App named '[DEFAULT]' already exists"** on HMR → already guarded via `getApps()` check in `firebase/config.ts`; if you see this, you have an older build artifact — clear `.expo/` and restart.
