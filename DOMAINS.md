# Domain plan

Tracking the migration from Vercel-generated domains to final custom domains. No purchases or DNS changes have been made yet — this doc locks in the plan so it's easy to execute when you're ready.

## Current state (April 2026)

| App | Domain | DNS | Notes |
| --- | --- | --- | --- |
| `kidshub-landing` | [getkidshub.com](https://getkidshub.com) | **GoDaddy** → Vercel | Root domain, already custom |
| `kidshub-dashboard` | [dashboard.getkidshub.com](https://dashboard.getkidshub.com) | **GoDaddy** → Vercel | Subdomain, already custom |
| `kidshub` | [kidshub-app.vercel.app](https://kidshub-app.vercel.app) | Vercel auto-generated | **Not yet on a custom domain** |

`getkidshub.com` is the current production apex. All three apps can stay on this apex indefinitely — `kidshub.com` is a "nicer" second-tier option if and when you want it.

## Target state — two options

### Option A — keep `getkidshub.com` (recommended short term)

Add one more subdomain for the kidshub app. No new domain purchase required.

| App | Target domain | DNS change needed |
| --- | --- | --- |
| `kidshub-landing` | `getkidshub.com` | none |
| `kidshub-dashboard` | `dashboard.getkidshub.com` | none |
| `kidshub` | **`app.getkidshub.com`** | Add CNAME `app` → `cname.vercel-dns.com` |

**Pros:** zero purchase cost, matches existing subdomain convention, one small DNS change in GoDaddy, zero user confusion with existing links.

**Cons:** `getkidshub.com` is slightly less memorable than `kidshub.com` for marketing.

### Option B — migrate to `kidshub.com` (nicer brand, costs ~$10–30/yr + work)

Buy `kidshub.com`, keep `getkidshub.com` as a 301-redirect for SEO.

| App | Target domain | DNS / setup |
| --- | --- | --- |
| `kidshub-landing` | `kidshub.com` | Buy domain → point apex to Vercel → add to Vercel landing project |
| `kidshub-dashboard` | `dashboard.kidshub.com` | Add CNAME `dashboard` → Vercel |
| `kidshub` | `app.kidshub.com` | Add CNAME `app` → Vercel |
| `getkidshub.com` | 301 → `kidshub.com` | Configure redirect in GoDaddy or Vercel |

**Pros:** cleaner brand, shorter URLs, easier to say on a phone call.

**Cons:** domain purchase + renewal (~$10–30/yr), 301 redirects to maintain, updates needed in: Firebase Auth authorized domains, GCP HTTP-referrer allowlist on the Firebase API key, Firestore CORS where applicable, OpenRouter allowed origins for Aria, email templates (password reset), any hardcoded URLs in the landing page.

## Recommended sequence

1. **Now (~15 min):** Execute Option A — add `app.getkidshub.com` → Vercel for the kidshub app. Update references in:
   - `kidshub-dashboard/src/components/modals/InviteParentModal.jsx` (fallback `VITE_KIDSHUB_APP_URL`)
   - `kidshub-dashboard/src/components/modals/InviteTeacherModal.jsx` (same)
   - `kidshub-dashboard/src/pages/ChildProfile.jsx` (same)
   - `kidshub-dashboard/src/pages/Staff.jsx` (same)
   - Vercel env var `VITE_KIDSHUB_APP_URL` = `https://app.getkidshub.com`
   - Firebase Console → Authentication → Settings → Authorized domains → add `app.getkidshub.com`
   - GCP Console → API Keys → edit Web API key → add referrer `https://app.getkidshub.com/*`
2. **When ready to rebrand (later):** Execute Option B. Plan a 30-min migration window where you update the items listed in "Cons" above in sequence, verify each app still loads, then flip the 301.

## Domain checklist (for either option)

When adding a new domain to Vercel:

- [ ] Add domain to the Vercel project → Settings → Domains
- [ ] Copy the exact DNS record (A for apex, CNAME for subdomain) Vercel tells you to add
- [ ] Add the record in your DNS provider (GoDaddy → DNS → Manage)
- [ ] Wait for Vercel to say "valid configuration" (usually 1–5 min)
- [ ] Add the domain to Firebase Auth → Settings → Authorized domains
- [ ] Add the domain to the GCP API key's HTTP referrer allowlist
- [ ] Update any env var in Vercel that references the old URL
- [ ] Smoke-test sign-in on the new domain

## Current Firebase authorized domains (expected)

As of April 2026, the `kidhub-7a207` Firebase project's authorized domains are:

- `localhost`
- `127.0.0.1`
- `kidhub-7a207.firebaseapp.com`
- `getkidshub.com`
- `dashboard.getkidshub.com`
- `kidshub-app.vercel.app`
- `*.vercel.app` (for PR preview deployments)

When you add `app.getkidshub.com` or any `kidshub.com` variant, add them here too or Firebase Auth will reject sign-ins from those origins.
