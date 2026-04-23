# `config/` — central product configuration

**One file. One source of truth. Edit here, changes flow everywhere.**

This folder holds configuration that both the `kidshub-dashboard` (owner web app) and `kidshub` (parent/teacher mobile app) need to agree on — tier boundaries, feature matrix, quotas, admin allowlist, web toggle.

## What's in here

| File | Purpose |
|---|---|
| `product.ts` | Single source of truth for tiers, features, quotas, pricing, admin UIDs, web-app flag. Pure TypeScript, no runtime deps. |

## How to edit

Almost every question in `PRODUCT_PLAN.md` under "Open decisions" maps to a value in `product.ts`. Search for `TODO(` to see every open decision:

```bash
grep -n 'TODO(' config/product.ts
```

The big knobs:

| Decision | Variable in `product.ts` |
|---|---|
| Pricing (per tier) | `TIERS[tier].monthlyPriceUsd` |
| Tier names | `TIERS[tier].name` |
| Tier taglines | `TIERS[tier].tagline` |
| Starter/Pro/Premium limits | `QUOTAS` |
| Trial duration | `TRIAL_DURATION_DAYS` |
| Which features are Pro-only | `FEATURES['<featureKey>']` |
| Admin allowlist (demoMode privilege) | `ADMIN_UIDS` |
| Web-app default-on/off | `ENABLE_WEB_APP_DEFAULT` |

## How to find your admin UID

Three options, easiest first:

### Option 1 — Firebase Console (30 seconds)

1. Open [Firebase Console](https://console.firebase.google.com/project/kidhub-7a207/authentication/users)
2. Go to **Authentication** → **Users** tab
3. Find your owner account (look for the email you registered with, e.g. `owner1@kidshub.test` or whatever you used)
4. The **User UID** column is your admin UID — copy that value

### Option 2 — Dashboard devtools (while signed in)

1. Sign in to [dashboard.getkidshub.com](https://dashboard.getkidshub.com) as your owner account
2. Open browser devtools → Console
3. Run:
   ```js
   firebase.auth().currentUser.uid
   ```
   If `firebase` isn't defined globally, run:
   ```js
   // In the dashboard app specifically:
   JSON.parse(
     Object.keys(localStorage)
       .filter((k) => k.includes('firebase:authUser'))
       .map((k) => localStorage.getItem(k))[0]
   ).uid
   ```

### Option 3 — Firestore Console

1. Open [Firestore Console](https://console.firebase.google.com/project/kidhub-7a207/firestore/data)
2. Navigate to the `users/` collection
3. Each document ID **is** a user's UID. Find the doc whose `role: 'owner'` and `email` matches yours.

Once you have the UID, paste it into `ADMIN_UIDS` in `product.ts`:

```ts
export const ADMIN_UIDS: readonly string[] = [
  'abc123YourActualFirebaseUidHere456',
];
```

## How the apps consume this

Both apps import from this folder via relative path. No npm-package publishing dance needed — Metro (kidshub) and Vite (dashboard) both resolve the path at build time.

### From `kidshub-dashboard/`

```ts
import { TIERS, FEATURES, quotaFor } from '../../../config/product';
```

### From `kidshub/`

```ts
import { TIERS, FEATURES, quotaFor } from '../../config/product';
```

Serverless functions in `kidshub-landing/api/*.js` can also import — though they're JS, so use the compiled output or JSDoc types.

## When to split into a workspace package

For now, a single `config/product.ts` consumed via relative imports is simple and works. If we ever need to:
- Share runtime code (not just static config) between apps
- Publish types independently of the apps
- Version config with its own semver

…then we'll promote this into `@kidshub/shared` as a proper npm workspace package. Until that day comes, YAGNI.
