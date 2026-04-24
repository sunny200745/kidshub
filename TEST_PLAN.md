# KidsHub — End-to-End Manual Test Plan

A single linear playbook for verifying the entire product before a release, a
demo, or a customer hand-off. Phases are numbered **0 → 17** and each one
assumes the previous phases passed. Run them top-to-bottom the first time.

Companion docs:
- `PRODUCT_PLAN.md` — what we built and why.
- `firestore.rules` / `storage.rules` — what the server actually enforces.
- `BILLING.md` — Stripe integration intent (still scaffolded, not live).
- `SALES_DEMO_GUIDE.md` — what to actually say in front of a prospect.

---

## How to use this doc

- Each phase has **Setup**, **Steps**, and **Expected**. You can hand any
  single phase to a non-engineer (or to a future-you who's lost context).
- **✅** = pass. **❌** = fail — file a bug, link the phase + step number.
- Run phases **in order** the first time. Most flows have prerequisites.
- After any rules change, also re-run **Phase 15 (RBAC sweep)** at minimum.
- After any Firebase/Vercel deploy, re-run **Phase 0** and **Phase 1** as a
  smoke test before going wider.

### Glossary (avoid the same trap twice)

- **`centers/{ownerId}`** — the canonical center doc. `ownerId` is the
  owner's Firebase Auth UID. **Not** `daycares/{...}` (older docs used that
  name; the collection has always been `centers`).
- **`daycareId`** — on every other doc (children, staff, parents,
  classrooms, activities, etc.) this field stores the same value as the
  owner's UID. It's the tenant key.
- **`plan`** — `'starter' | 'pro' | 'premium'`. `'trial'` is a legacy key
  that auto-migrates to `'starter'` on the next owner login.
- **`starterStartedAt`** — Firestore Timestamp on `centers/{ownerId}`,
  stamped at register. Drives the 60-day countdown and the `/paywall`
  redirect (`STARTER_FREE_DAYS = 60` in `config/product.ts`).
- **`demoMode`** — boolean on `centers/{ownerId}`. When true, every
  feature gate unlocks for sales demos. Toggleable from `Settings → Admin`,
  visible only to `ADMIN_UIDS`.

---

## Phase 0 — Pre-flight (one-time setup, ~15 min)

### 0.1 Deploys are live

**Steps:**
1. Hit `https://getkidshub.com/` (landing) → loads.
2. Hit `https://getkidshub.com/pricing` → loads.
3. Hit `https://dashboard.getkidshub.com/login` → loads.
4. Hit `https://app.getkidshub.com/` on desktop → see the "Download on App
   Store / Play Store" mobile-only splash (Phase 5.5 verifies this in
   detail).
5. Run `firebase deploy --only firestore:rules,storage:rules` from a
   clean working tree, or verify in Firebase Console that the deployed
   rules revision matches `git log --oneline firestore.rules | head -1`.

**Expected:** ✅ All four URLs return 200. ✅ Deployed rules match the working
tree (no drift between repo and prod).

### 0.2 Vercel env vars

Confirm these are set on the **kidshub-landing** Vercel project (Settings
→ Environment Variables, Production scope).

**Required for the test plan to pass:**

| Env var | Why | What breaks if missing |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `_shared.js → createFirestoreDoc` writes `leads/{id}` via the Firestore REST endpoint, which needs the project ID in the URL. The leads collection is `allow create: if true` in `firestore.rules` so no service-account auth is needed — just the project ID. | **Phase 1.3 + 11.3 fail with 502** — no lead saved, the user-facing modal shows "Could not save your request". |
| `RESEND_API_KEY` | Sends invite emails (Phase 5.1), parent-invite emails (Phase 6.1), welcome emails on accept (Phase 5.4 / 6.4), sales-notification email (Phase 1.3). | Lead-save still succeeds (it's wrapped in try/catch and the response stays 200), but **no notification email** reaches your inbox; **invite + welcome emails silently fail**. |

**Optional (have safe defaults — set only to override):**

| Env var | Default | When you'd set it |
|---|---|---|
| `SALES_NOTIFICATION_TO` | `support@nuvaro.ca` (`contact-sales.js` line 43) | If you want sales notifications routed somewhere else. |
| `EMAIL_FROM` | `_shared.js` `DEFAULT_FROM` | If you want a different "from" address on outbound mail. |
| `EMAIL_REPLY_TO` | `_shared.js` `DEFAULT_REPLY_TO` | If you want replies to go elsewhere. |
| `KIDSHUB_APP_URL` | `https://app.getkidshub.com` | Only relevant when testing against a non-prod app URL. |
| `LEAD_EMAIL` | `chat.js` `DEFAULT_LEAD_EMAIL` | Used by Aria chat lead routing only. |
| `OPENROUTER_API_KEY` | unset | Required only if you're going to test the Aria chat flow on the landing page. |

**Stripe vars (leave UNSET until Track F goes live):**

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`,
`STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.
Until set, `/api/stripe-checkout` returns a friendly "billing not
configured" stub (verified in Phase 11.4) — that's the desired pre-launch
state.

> **`FIREBASE_SERVICE_ACCOUNT` is NOT needed today.** It only appears as
> a TODO comment in `stripe-webhook.js` for the future Track-F flow that
> will need admin-level Firestore writes from the webhook. The contact-
> sales path deliberately uses public REST + a permissive `/leads`
> rule (anonymous create, denied read/update/delete) so the function
> stays zero-dependency and fast-cold-starting.

**Expected:** ✅ `FIREBASE_PROJECT_ID` and `RESEND_API_KEY` present. ❌
Either missing? Set them and redeploy before Phase 1.3.

### 0.3 Test accounts (Gmail `+` aliases work great)

Create three real-inbox emails you control. Aliases are easiest:

| Role    | Email                            | Used in                     |
|---------|----------------------------------|-----------------------------|
| Owner   | `you+owner@gmail.com`            | Phase 2                     |
| Teacher | `you+teacher@gmail.com`          | Phase 5                     |
| Parent  | `you+parent@gmail.com`           | Phase 6                     |
| Owner B | `you+ownerb@gmail.com` (Phase 15)| Tenant isolation only       |

**Expected:** ✅ You can read each inbox in real time during the run.

### 0.4 Find your admin UID (skip if you're not the maintainer)

You need this for **Phase 12 (demo mode)** and the **Phase 13 admin
bypass**. Your UID is already in `config/product.ts → ADMIN_UIDS` as
`Q2WtGGneZtcuBY2I2jJGdUQTDKq1` — confirm it matches the UID of the owner
account you'll register in Phase 2.

**Steps:**
1. After Phase 2 finishes, open the Firebase Console → Authentication →
   Users tab.
2. Find the email from row "Owner" above; copy the UID.
3. Compare to `ADMIN_UIDS` in `config/product.ts`.

**Expected:** ✅ The owner UID matches. If it doesn't, you'll fail Phase
12.1 and Phase 13.5 — either re-register with the admin email, or add the
new UID to `ADMIN_UIDS`, commit, and redeploy. (Detail: see
`config/README.md` "How to find your admin UID".)

### 0.5 Browser hygiene

Cached auth from past runs will cross-contaminate this one. For each
browser profile you'll use:

1. Clear cookies + localStorage for `dashboard.getkidshub.com` and
   `app.getkidshub.com`.
2. Confirm you're signed out everywhere.

**Pro tip:** use **three distinct browser profiles** (or
Chrome + Safari + Firefox) — one per role. That way you can keep all three
windows open in parallel from Phase 7 onward without sign-in juggling.

---

## Phase 1 — Marketing site smoke (~10 min)

### 1.1 Pages render

**Steps:**
1. Visit `getkidshub.com/` → home.
2. Visit `getkidshub.com/pricing` → pricing.
3. Visit `getkidshub.com/case-study` → case-study **template** (still
   has `[Daycare Name]` and other bracketed placeholders today —
   that's expected; see "Going-live TODOs" below).

**Expected:** ✅ All three pages render, no console errors, no broken
images.

> **Going-live TODOs (NOT blocking this test plan, but track them
> separately):**
> - **Legal pages don't exist yet.** No `/legal/privacy`, no
>   `/legal/terms`, no cookie banner. For a Canadian launch with
>   PIPEDA-aware positioning (per `KIDSHUB_ONE_PAGER.md`) you'll
>   want both before the first paying customer.
> - **`case-study.html` is unlinked.** It's reachable at
>   `/case-study` (set up in `vercel.json` cleanUrls) but no nav,
>   footer, or in-page link points at it. See "What to do with the
>   case study" below the test plan body.

### 1.2 Pricing copy reflects the 60-day Starter (NOT 14-day trial)

**Steps:**
1. On `/pricing`, scan for any of these strings — if you see them, the
   wrong build deployed:
   - "14-day"
   - "Premium trial"
   - "Free for 2 months" / "Free for your first 2 months"
2. Confirm the hero subhead reads "Start free for 60 days on Starter".
3. Confirm the Starter card price note says "Free for 60 days · No credit
   card required".
4. Confirm the FAQ "Is it really free to start?" answer mentions "60 days".

**Expected:** ✅ All four checks pass. ❌ Any 14-day / 2-month text means
`pricing.html` is stale — redeploy the landing project from `main`.

### 1.3 Contact Sales lead → Firestore

**Steps:**
1. From the pricing page, click any "Contact sales" button → modal opens.
2. Fill name, email (`you+lead@gmail.com`), daycare name, message; submit.
3. Check Firebase Console → Firestore → `leads/` collection.
4. Check the `SALES_NOTIFICATION_TO` inbox.

**Expected:**
- ✅ Modal shows success state with "We'll be in touch within one business
  day".
- ✅ A new `leads/{id}` doc exists with the form fields + `source` (e.g.
  `pricing-page` or `paywall`) + `createdAt`.
- ✅ Notification email arrives at `SALES_NOTIFICATION_TO`, with
  `reply_to` set to the lead's email so you can reply directly.

### 1.4 Mobile responsiveness

**Steps:** Open the pricing page in DevTools mobile emulation (iPhone 13).

**Expected:** ✅ Hero, pricing cards, comparison table, FAQ all scroll
cleanly. ✅ "Contact sales" CTA reachable without horizontal scroll.

---

## Phase 2 — Owner registration (~5 min)

### 2.1 /register form completes

**Setup:** Browser profile A (the owner profile from Phase 0.3),
signed out.

**Steps:**
1. Visit `dashboard.getkidshub.com/register`.
2. Fill first name, last name, `you+owner@gmail.com`, password (≥6 chars).
3. Submit.

**Expected:**
- ✅ Redirects to `/welcome` (not `/`) on success — fresh owners go
  through the wizard first.
- ✅ Sidebar shows the owner's first name.
- ✅ No console errors.

### 2.2 Firestore doc shape (the most important check in this phase)

**Steps:** In Firebase Console → Firestore, open these two docs.

**Expected:**

`users/{uid}`:
- ✅ `role: 'owner'`
- ✅ `daycareId == uid` (same value as the doc ID)
- ✅ `email`, `firstName`, `lastName`, `createdAt` populated

`centers/{uid}`:
- ✅ `plan: 'starter'` — **NOT** `'trial'`
- ✅ `starterStartedAt: <Timestamp ≈ now>`
- ✅ `demoMode: false` (or absent — both treated as false)
- ✅ `name`, `ownerId == uid`, `createdAt` populated
- ❌ `trialEndsAt` should NOT exist on a brand-new doc — if it does,
  `Register.jsx` regressed.

### 2.3 Plan banner shows the 60-day countdown

**Steps:** From `/welcome`, glance at the `PlanStateBanner` (top of layout).

**Expected:** ✅ Green-tinted banner: "Starter free for X days. Upgrade
anytime." X should be **60** on a brand-new register, decrementing as
days pass. ✅ Banner disappears (or flips to amber) once you're inside
the warning window (`STARTER_PROMO_WARNING_DAYS = 14`); we'll exercise
amber + expired in Phase 13.

---

## Phase 3 — Welcome wizard (~5 min)

### 3.1 Cards reflect live state

**Setup:** On `/welcome`, freshly registered, no classrooms / children
/ staff yet.

**Steps:**
1. Read each onboarding card. Note which are "to-do" and which are
   already ticked.
2. In another tab, add a classroom (Phase 4.1 below).
3. Return to `/welcome` (or leave it open — it's live).

**Expected:**
- ✅ "Add your first classroom" card flips from to-do → done **without
  a refresh**.
- ✅ Greeting shows your first name ("Welcome, Alex").
- ✅ Starter day-counter pill matches `PlanStateBanner` (e.g. both say
  "60 days left").

### 3.2 Dismiss + revisit

**Steps:**
1. Click "I'm done — take me to the dashboard" (or equivalent CTA).
2. Sidebar → "Finish setup" (or visit `/welcome` directly).

**Expected:**
- ✅ Lands on `/`.
- ✅ Revisiting `/welcome` honestly reflects current state — finished
  cards still show as done; remaining ones are still to-do.
- ✅ `users/{uid}.onboardingDismissedAt` is stamped (Firestore Console).

---

## Phase 4 — Owner CRUD (~15 min)

> Goal: stand up enough roster data that Phases 5–8 have something to
> exercise.

### 4.1 Add classroom

**Steps:** Sidebar → Classrooms → "Add Classroom". Name, age range,
color → save.

**Expected:** ✅ Card appears immediately (live snapshot).
`classrooms/{id}.daycareId == owner.uid`.

### 4.2 Add child

**Steps:** Sidebar → Children → "Add Child". Name, DOB, classroom from
4.1 → save.

**Expected:** ✅ Card appears in grid. ✅ `children/{id}.classroom ==
classroomId`. ✅ Child appears under its classroom on the Classrooms page.

### 4.3 Add staff record (pre-invite)

**Steps:** Sidebar → Staff → "Add Staff". Name, email
(`you+teacher@gmail.com`), classroom → save.

**Expected:** ✅ Card appears with **"Invite to app"** button visible
(because `appStatus == 'none'`).

### 4.4 Add parent record (single-child)

**Steps:** Sidebar → Parents → "Add Parent". Fill basics, relationship
("Mother"), check ONE child from 4.2, leave Pickup checked. Save.

**Expected:**
- ✅ ParentCard renders with avatar + relationship + 1 child badge +
  "Pickup" badge + "Invite to app" button.
- ✅ `parents/{id}` has `childIds: [<childId>]`, `daycareId == owner.uid`,
  `appStatus: 'none'`, `linkedUserId: null`.

### 4.5 Add parent record (multi-sibling)

**Setup:** Add a second child first (repeat 4.2).

**Steps:** Repeat 4.4 but check **both** children in the linked list.

**Expected:** ✅ Card shows 2 child badges. ✅ `childIds` array has both
ids. (We'll exercise the multi-sibling invite flow in Phase 6.2.)

### 4.6 Edit + delete safety

**Steps:**
1. Edit any record — change a field, save → card updates immediately.
2. Try to delete a parent (or staff) — currently `appStatus == 'none'` →
   ConfirmDialog → confirm → record disappears.

**Expected:** ✅ Edits live-update. ✅ Delete succeeds for `none` accounts.
**(Note: delete is BLOCKED while `appStatus == 'active'` — verified after
Phase 6.5.)**

---

## Phase 5 — Teacher onboarding (~15 min)

### 5.1 Issue invite from staff card

**Steps:**
1. Staff page → "Invite to app" on the staff card from 4.3.
2. Confirm modal → "Create invite".

**Expected:**
- ✅ Result screen shows "Invite email sent" + the invite URL.
- ✅ Card status flips to **"Invite pending"** (yellow badge).
- ✅ "Pending invites" panel at the top of Staff page lists this invite.
- ✅ Firestore: `invites/{token}` exists with `role: 'teacher'`,
  `staffId: <id>`, `email == staff.email`, `expiresAt` ~7 days out.
- ✅ Email arrives in `you+teacher@gmail.com` within ~1 minute.

### 5.2 Resend email + revoke (run on a fresh test invite, then re-issue)

**Steps:**
1. From Pending invites, click "Resend email" → "Sending…" → green
   "Email sent" pill.
2. Inbox: a duplicate arrives.
3. Click the trash icon → "Revoke".

**Expected:** ✅ Resend succeeds. ✅ Revoke removes the invite + flips the
card back to "Invite to app" + `staff/{id}.appStatus == 'none'`.

### 5.3 Expired-link error state

**Setup:** Issue a fresh invite, then in Firestore Console set
`invites/{token}.expiresAt` to a past date.

**Steps:** Open the invite URL.

**Expected:** ✅ Accept screen renders "This invite has expired" with no
form. (Re-issue from the dashboard for the next steps.)

### 5.4 Teacher accepts → mobile sign-in

**Setup:** Browser profile B + a phone (or DevTools mobile emulation).

**Steps:**
1. Tap the link from the email on a phone (recommended) **OR** open in
   incognito on desktop. (Desktop will hit the splash from 5.5 — see note.)
2. Fill first name, last name, password → submit.

**Expected:**
- ✅ Lands inside the kidshub teacher app — 5-tab nav at the bottom
  (Home / Messages / `+` (center, elevated teal) / Reports / More).
- ✅ Sees only the assigned classroom's children.
- ✅ Owner side: staff card flips from "Invite pending" → green **"App
  access"** badge.
- ✅ Firestore: `users/{newUid}.role: 'teacher'`,
  `daycareId == owner.uid`, `staffId: <id>`. `staff/{id}.linkedUserId ==
  newUid`, `appStatus: 'active'`. `invites/{token}` is deleted.

### 5.5 Mobile-only web splash

**Setup:** A regular desktop browser (not Expo dev tools).

**Steps:** Visit `app.getkidshub.com`.

**Expected:** ✅ Coming-Soon splash with App Store / Play Store CTAs;
**no app shell** loads. This is `EXPO_PUBLIC_ENABLE_WEB_APP=false` doing
its job.

> **For testing only:** if you must use the app on web (e.g. you don't
> have a phone handy), set `EXPO_PUBLIC_ENABLE_WEB_APP=true` on Vercel
> for the kidshub project, redeploy, and run Phases 5/6/7 in incognito.
> **REVERT THIS BEFORE LEAVING TESTING** — there's a reminder in
> Phase 17.

### 5.6 RBAC: teacher cannot read other classrooms

**Setup:** Add a second classroom + a child in it (as owner). Stay
signed in as teacher.

**Steps:**
1. In the teacher app, browse all tabs — confirm the second classroom's
   child does NOT appear anywhere.
2. In DevTools console, attempt a manual Firestore read of that child's
   doc id.

**Expected:** ✅ Other classroom's children invisible in UI. ✅ Manual
read returns `permission-denied`.

---

## Phase 6 — Parent onboarding (~25 min — the most-tested flow)

### 6.1 Single-sibling invite (happy path)

**Setup:** Parent record from 4.4 (one child, `appStatus: 'none'`).

**Steps:**
1. Parents page → "Invite to app" on the card.
2. Confirm modal: parent's name in banner, locked email field, single
   child listed in the Children row.
3. "Create invite".

**Expected:**
- ✅ "Invite email sent" + URL on result screen.
- ✅ Card flips to **"Invite pending"** (yellow + clock).
- ✅ "Pending parent invites" panel lists this invite.
- ✅ `invites/{token}`: `role: 'parent'`, `parentId: <pid>`,
  `childId: <cid>`, `childIds: [<cid>]`, `email == parent.email`.
- ✅ `parents/{pid}.appStatus == 'invited'`.

### 6.2 Multi-sibling invite

**Setup:** Parent record from 4.5 (two children).

**Steps:** Same as 6.1, but the modal's Children row shows BOTH siblings.

**Expected:**
- ✅ Pending invites microcopy: `Primary child name +N siblings`.
- ✅ `invites/{token}.childIds` has both ids (denormalized at create
  time so accept doesn't need to re-read `parents/{id}`).

### 6.3 Resend + revoke

**Steps:** Same as 5.2 but on a parent invite.

**Expected:** ✅ Resend works. ✅ Revoke restores card to "Invite to app",
`parents/{pid}.appStatus == 'none'` (reset by `parentsApi.resetAppStatus`
inside the invite delete).

### 6.4 Parent accepts (multi-sibling) → mobile sign-in

**Setup:** Browser profile C + a second phone (or DevTools emulation).
Invite from 6.2 still pending.

**Steps:**
1. Tap the link from `you+parent@gmail.com` on the phone.
2. Accept screen reads "You're invited to connect with {primary child}",
   email locked.
3. Fill first name, last name, password → submit.

**Expected:**
- ✅ Lands in the parent app — Home tab shows **all linked children**,
  not just the primary.
- ✅ Each child's Activities/Timeline tab is reachable.
- ✅ Owner side: card flips to green **"App access"**.
- ✅ Firestore: `users/{newUid}.role: 'parent'`, `childIds == invite.childIds`,
  `daycareId == owner.uid`, `linkedParentId == <pid>`,
  `inviteToken == <token>`. ✅ `parents/{pid}.linkedUserId == newUid`,
  `appStatus: 'active'`. ✅ Each `children/{cid}.parentIds` includes the
  parent's uid. ✅ `invites/{token}` deleted.

### 6.5 RBAC: parent only sees their linked children

**Steps:**
1. As parent (post-6.4), browse Home, Activities, Photos (Pro — should
   show CTA), Messages.
2. In DevTools, attempt to read a child doc that is NOT in the parent's
   `childIds`.

**Expected:** ✅ Only their linked children visible anywhere. ✅ Manual
unlinked read returns `permission-denied`. ✅ Manual cross-tenant read
also denied.

### 6.6 Delete safety on active accounts

**Steps:** As owner, try to delete the parent record from 6.4 (now
`appStatus: 'active'`).

**Expected:** ✅ Trash icon disabled with tooltip "Revoke app access
first to delete". ✅ Detail-modal ConfirmDialog (if reachable) shows
the same blocked-reason microcopy.

### 6.7 Legacy ChildProfile deep-link (regression)

**Steps:**
1. Owner → Children → click any child → Contacts tab.
2. Click "Invite parent to app".

**Expected:**
- ✅ Browser navigates to `/parents?addFor={childId}`.
- ✅ ParentFormModal opens in **add mode** with that child pre-checked.
- ✅ URL `?addFor=` query param is stripped after the modal opens (back
  navigation doesn't reopen the modal).

### 6.8 Form validation

**Steps:**
1. Add Parent → submit empty.
2. Pick "Other" relationship without a label → submit.
3. Edit a parent with `appStatus == 'active'`.

**Expected:**
- ✅ "Please fill in first name, last name, and email."
- ✅ "Please enter a relationship label, or pick from the list."
- ✅ Email field locked + microcopy "Email is locked while the parent
  has app access".

### 6.9 Empty + filter states

**Steps:**
1. (Briefly delete all parents in a scratch tenant, or imagine.) Visit
   Parents page.
2. With parents present, type a search that matches nothing.
3. Use the child dropdown to filter to a child with no parents.

**Expected:** ✅ "No parents on the roster yet" + "Add your first parent"
CTA. ✅ "No parents match those filters" + clear-filters suggestion.

---

## Phase 7 — Live data flow (~15 min)

> Goal: prove the realtime spine works. Owner / teacher / parent windows
> should all be open in parallel here.

### 7.1 Teacher logs an activity → parent sees in real time

**Steps:**
1. Teacher app → pick the parent's child → log a feeding ("Ate most of
   lunch").
2. **Without refreshing**, switch to the parent app → Home / Timeline.

**Expected:** ✅ Activity appears in the parent's feed within ~2 seconds,
attributed to the teacher's name. ✅ Owner-side child Timeline tab also
reflects it.

### 7.2 Parent ↔ teacher messaging

**Steps:**
1. Parent app → Messages → tap the assigned teacher → send a message.
2. Teacher app → Messages → see the new conversation; reply.
3. Parent app: see the reply.

**Expected:** ✅ Realtime delivery in both directions, correct author
labels, day-divider rendering, "Sending…" hint visible briefly.

### 7.3 Owner posts announcement

**Steps:** Owner → Announcements → "New announcement" → title + body →
publish.

**Expected:** ✅ Visible on parent Home and teacher Home, no refresh.

### 7.4 Check-in / check-out

**Steps:** Owner OR teacher → Check In/Out → mark the child checked-in.
Verify status badge. Mark them out.

**Expected:** ✅ Status flips immediately. Dashboard counters update.

---

## Phase 8 — Pro-tier feature sweep (~30 min)

> For each feature: verify it's **locked on Starter** with an upgrade CTA,
> then verify it **unlocks** in demoMode (Phase 12) or after a manual
> Firestore plan flip. Don't bother flipping the plan yet — just verify
> the locks here, and Phase 12 will sweep the unlock side.

### 8.1 Photo journal (Pro)

> ⚠️ **`photoJournal` is INFRA-LOCKED** (config/product.ts →
> `INFRA_LOCKED_FEATURES`) until Firebase Storage Blaze is enabled. While
> infra-locked, EVERY tier — including Premium and demoMode — sees the
> upgrade CTA. This is correct behaviour for now; remove `photoJournal`
> from `INFRA_LOCKED_FEATURES` when Storage is live (see the
> `photos-infra-lock-flip` reminder in PRODUCT_PLAN).

**Steps (Starter):** Owner → any child → Photos. Teacher → child →
Photos. Parent → Photos tab.

**Expected:** ✅ All three see the `<UpgradeCTA feature="photoJournal">`,
not the gallery.

### 8.2 Daily reports (Pro)

**Steps:** Owner → Reports → Daily.

**Expected (Starter):** ✅ Page loads but shows the locked preview +
upgrade CTA.

### 8.3 Attendance reports / CSV (Pro)

**Steps:** Owner → Reports → Attendance → "Export CSV".

**Expected (Starter):** ✅ Locked.

### 8.4 Health log (Pro)

**Steps:** Teacher → Health log composer; Owner → Reports → Health card +
CSV export.

**Expected (Starter):** ✅ Composer hidden / locked. Reports card locked.

### 8.5 Weekly planner (Pro)

**Steps:** Teacher → Weekly planner. Parent → Schedule → look for
"This week" section.

**Expected (Starter):** ✅ Teacher sees lock. Parent only sees the
template routine, no live weekly plan.

### 8.6 Curriculum / activity templates (Pro)

**Steps:** Teacher → Curriculum.

**Expected (Starter):** ✅ Lock + CTA.

### 8.7 Morning screenings (Pro)

**Steps:** Teacher → Screenings.

**Expected (Starter):** ✅ Lock + CTA.

### 8.8 Staff clock-in (Pro)

**Steps:** Teacher Home → look for the clock-in pill on the staff strip.

**Expected (Starter):** ✅ Pill rendered as locked / labelled "Pro".
Tapping shows upgrade CTA.

### 8.9 Custom branding (Pro)

**Steps:** Owner → Settings → Branding (logo URL, accent color).

**Expected (Starter):** ✅ Section visible but inputs disabled / wrapped
in `<UpgradeCTA feature="customBranding">`.

---

## Phase 9 — Premium-tier feature sweep (~10 min)

### 9.1 Aria AI in-app (Premium)

**Steps:** Teacher → Aria.

**Expected (Starter):** ✅ Lock + CTA naming "Premium" as the upgrade
target.

### 9.2 Multi-daycare scaffold (Premium — design only, no live UI)

**Steps:** Verify `MULTI_DAYCARE.md` exists; verify NO multi-daycare
switcher is rendered in the dashboard sidebar.

**Expected:** ✅ Doc present and honest ("not live"). ✅ No switcher
shipped. (When it ships, add a 9.2 sub-step here.)

---

## Phase 10 — Quotas (~10 min)

### 10.1 Classroom quota (Starter cap = 1)

**Steps:** Try to add a 2nd classroom.

**Expected:** ✅ Form submission fails with `quota-exceeded`.
`<QuotaBanner>` renders inside the modal pointing to upgrade.

### 10.2 Children quota (Starter cap = 15)

**Setup:** Add 14 more children so you're at the 15-cap.

**Steps:** Try to add a 16th.

**Expected:** ✅ Same `quota-exceeded` block.

### 10.3 Staff quota (Starter cap = 2)

**Setup:** Add 1 more staff so you're at the 2-cap.

**Steps:** Try to add a 3rd.

**Expected:** ✅ Same `quota-exceeded` block.

### 10.4 Banner copy

**Expected:** ✅ Banner text names the quota correctly ("You're at the
1-classroom Starter cap"), the upgrade target tier ("Pro adds 4 more"),
and links to `/plans`.

---

## Phase 11 — Plan management UX (~10 min)

### 11.1 `/plans` page

**Steps:** Sidebar → Plans (or visit `/plans`).

**Expected:**
- ✅ 3 tier cards in order: Starter / Pro / Premium.
- ✅ The current tier is **highlighted** (badge / outline).
- ✅ Starter card shows "Free for 60 days" + days-left pill if you're
  in the window.
- ✅ Comparison table renders the full feature matrix from
  `config/product.ts`.

### 11.2 Settings → Plan & Billing

**Steps:** Sidebar → Settings → "Plan & billing" card.

**Expected:** ✅ Same plan name + days-left as Phase 11.1. ✅ "Manage your
plan" CTA links to `/plans`.

### 11.3 Contact Sales modal (in-app)

**Steps:** From `/plans`, click any "Contact sales" button.

**Expected:** ✅ Modal opens, prefills name/email from the signed-in
profile. ✅ Submit posts to `/api/contact-sales` and writes
`leads/{id}` (re-verify in Firebase Console). ✅ `source` field on the
new lead doc reflects where it came from (`plans-page`, etc.).

### 11.4 Stripe checkout placeholder

**Steps:** Trigger any "Upgrade now" button that would call
`/api/stripe-checkout` (currently a stub).

**Expected:** ✅ Friendly response — "Billing isn't configured yet";
no crash. (When `STRIPE_SECRET_KEY` is set, this becomes a real
checkout — Track F.)

---

## Phase 12 — Demo mode (~5 min) — Admin only

> Requires your owner UID to be in `ADMIN_UIDS` (Phase 0.4).

### 12.1 demoMode toggle visible

**Steps:** Owner → Settings → scroll to "Admin" section.

**Expected:** ✅ Section renders **only** for `ADMIN_UIDS`. Non-admin
owners don't see it. ✅ "demoMode" toggle present.

### 12.2 Flip demoMode → everything unlocks

**Steps:** Toggle demoMode ON. Wait ~2 seconds (live snapshot).

**Expected (in this window):**
- ✅ All Pro/Premium feature gates from Phase 8 + Phase 9 unlock.
- ✅ `centers/{ownerId}.demoMode == true` in Firestore.
- ✅ `useEntitlements().effectiveTier === 'premium'` (verifiable via
  the plan badge — should now read "Premium").
- ✅ Quota errors from Phase 10 stop firing (effectiveTier=premium has
  no caps).

### 12.3 Teachers + parents reflect demoMode within seconds

**Steps:** Switch to the teacher and parent windows. Don't refresh.

**Expected:** ✅ Photos, Reports, etc. unlock for them too — they read
the same `centers/{ownerId}` doc via `subscribeByDaycare`.

### 12.4 Flip demoMode OFF — gates re-engage

**Steps:** Toggle demoMode OFF.

**Expected:** ✅ All locks return on all three apps within seconds.

---

## Phase 13 — Paywall (60-day Starter expiry) (~15 min)

> The whole point of the Sprint 3.5 pivot. Verify the lock works,
> verify the escapes work, verify the bypass works.

### 13.1 Simulate expiry (backdate the clock)

**Steps:** Firestore Console → `centers/{ownerUid}` → edit
`starterStartedAt`. Set it to **now − 61 days** (any timestamp older
than 60 days ago). Save.

**Expected:** ✅ Field saved. Owner doc still has `plan: 'starter'`.
(We're not changing the plan — just aging the clock.)

### 13.2 Owner reload → `/paywall` redirect

**Steps:** In the owner browser, navigate to `/` (or any route).

**Expected:**
- ✅ `ProtectedRoute` redirects to `/paywall`.
- ✅ Full-screen blocker renders: hero ("Your 60-day Starter window has
  ended"), Contact Sales button, "See plan details" button, Pro/Premium
  snapshot, support footer.
- ✅ The dashboard nav / sidebar / main app shell does NOT render — this
  is intentional.

### 13.3 Other routes also redirect

**Steps:** Manually type `/children` (or `/staff`, `/messages`,
`/announcements`, etc.) into the URL bar.

**Expected:** ✅ All redirect to `/paywall`. (Anything **except**
`/paywall` and `/plans` should redirect.)

### 13.4 `/plans` is escapable

**Steps:** From `/paywall`, click "See plan details" (or type `/plans`
into the URL bar).

**Expected:** ✅ `/plans` renders normally — no redirect loop. ✅ The
"Contact sales" buttons there also work (Phase 11.3 already verified
them).

### 13.5 Admin UID bypass

**Setup:** Confirm your owner UID matches `ADMIN_UIDS`.

**Steps:** With the same backdated `starterStartedAt`, reload `/`.

**Expected:** ✅ NO `/paywall` redirect. The dashboard renders normally.
This is the "KidsHub staff can keep demoing past day 60" escape hatch
documented in `ProtectedRoute.jsx`.

> If you're not an admin and want to test the bypass, temporarily add
> a non-admin UID to `ADMIN_UIDS`, redeploy, test, revert.

### 13.6 Plan upgrade clears the paywall

**Steps:** In Firestore Console, change `centers/{ownerUid}.plan` from
`'starter'` to `'pro'`. Reload the dashboard.

**Expected:** ✅ Owner is no longer redirected to `/paywall`.
`useEntitlements().starterPromoExpired` only fires when
`plan === 'starter'`, so promoting clears it. ✅ Pro features unlock
normally.

### 13.7 Teachers + parents are NOT affected

**Steps:** Restore `plan: 'starter'` (so the owner is still expired).
Switch to the teacher + parent windows.

**Expected:** ✅ Both apps continue to function — no `/paywall` for
them. The paywall is owner-side only. ✅ Feature gates still respect
the plan (Pro features remain locked because we're back on Starter).

### 13.8 Cleanup

**Steps:** Restore the original `starterStartedAt` (or set it back to
`<now>`), and restore `plan` to whatever you want (`starter` for the
rest of the run is fine).

---

## Phase 14 — Legacy trial migration (~5 min)

> Verifies that pre-Sprint-3.5 owners (anyone whose center doc was
> stamped with `plan: 'trial'`) are gracefully promoted on next login.

### 14.1 Seed a legacy state

**Steps:** Firestore Console → `centers/{ownerUid}`:
- Set `plan: 'trial'`.
- Delete `starterStartedAt` (or leave it — the migration ignores it).
- (Optional) Delete `trialEndsAt` if it lingers from a past test run.
Save.

### 14.2 Sign out + sign back in (to force a fresh entitlements read)

**Steps:** Owner: sign out → sign in.

**Expected:** Within 1–2 seconds of the dashboard mounting:
- ✅ `centers/{ownerUid}.plan` flips to `'starter'`.
- ✅ `centers/{ownerUid}.starterStartedAt` is freshly stamped to now.
- ✅ `PlanStateBanner` shows "60 days left".
- ✅ Console: no errors. (`useEntitlements` log line "[useEntitlements]
  migrating legacy trial → starter" if you've added one — optional.)

### 14.3 Idempotency

**Steps:** Refresh the dashboard.

**Expected:** ✅ Migration does NOT re-fire (the snapshot now shows
`plan: 'starter'`, so the `if (data.plan === 'trial')` branch is
skipped). No write storm.

---

## Phase 15 — Tenant isolation + RBAC sweep (~15 min)

> Re-run this after **any** rules change.

### 15.1 Cross-tenant reads denied

**Setup:** A second owner account (`you+ownerb@gmail.com` from Phase 0.3)
in a separate browser profile. Add at least one classroom + child as
Owner B.

**Steps:** As Owner A, in DevTools console, attempt:
```js
firebase.firestore().collection('children').doc('<ownerB-childId>').get()
```
(or use the `firebase/firestore` modular SDK equivalent).

**Expected:** ✅ `permission-denied`. ✅ Same for `parents`, `classrooms`,
`staff`, `activities`, `messages`, `invites`, `announcements`,
`photos`, `attendance`, `healthLogs`, `weeklyPlans`,
`activityTemplates`, `screenings`.

### 15.2 Parent self-link rule

**Steps:** As parent (post-6.4), in DevTools attempt each:
- `updateDoc(parents/{theirParentId}, { firstName: 'Hacker' })` → ✅
  denied (only `linkedUserId|appStatus|updatedAt` are writable by the
  parent self-link rule).
- `updateDoc(parents/{otherParentId}, { linkedUserId: their.uid })` →
  ✅ denied (email mismatch).
- `updateDoc(parents/{theirParentId}, { linkedUserId: someOtherUid })` →
  ✅ denied (`linkedUserId == auth.uid` required).

### 15.3 Invite immutability

**Steps:** As any signed-in user, try to mutate an existing
`invites/{token}` (set / update).

**Expected:** ✅ `permission-denied`. Only owner-create + invitee-delete
(on accept) are allowed.

### 15.4 Teacher classroom isolation (regression of 5.6)

**Steps:** Re-run 5.6.

**Expected:** ✅ Still passes. (We list it again because rule edits to
`children` and `activities` have historically broken teacher reads.)

### 15.5 Storage rules

**Steps:** If Firebase Storage is enabled (Blaze plan), run the
following with parent auth:
- Read a photo from your own daycare's `daycares/{daycareId}/...` path
  → ✅ allowed.
- Read a photo from another daycare's path → ✅ denied.
- Write to your own path → ✅ allowed only for staff (teacher / owner)
  per `storage.rules`.

If Storage is NOT enabled, skip this step (and remember `photoJournal`
is INFRA-LOCKED until then — see Phase 8.1 note).

---

## Phase 16 — Auth edge cases (~10 min)

### 16.1 Sign-out + sign-back-in on each app

**Steps:** Sign out from owner, teacher, parent. Sign back in on each.

**Expected:** ✅ All three land back on their default route. ✅ No stuck
loading spinners. ✅ Live data reappears.

### 16.2 Forgot password

**Steps:** Sign-in screen → "Forgot password?" → enter owner email →
submit. Check inbox. Click reset link → set new password → sign in.

**Expected:** ✅ Email arrives, link works, new password authenticates.

### 16.3 Wrong-password UX

**Steps:** Sign-in with the right email and a wrong password.

**Expected:** ✅ Inline error, no console-only error, password field
not cleared (so the user can fix a typo).

### 16.4 Authenticated user hits `/login` or `/register`

**Steps:** Signed-in owner manually navigates to `/login`.

**Expected:** ✅ Redirected to `/`. (Same for `/register`.)

### 16.5 Direct deep-link to `/paywall` while NOT expired

**Steps:** With a healthy plan + non-expired Starter, visit `/paywall`.

**Expected:** ✅ Page renders (it's exempted from the redirect — see
`PAYWALL_EXEMPT_PATHS`). User can navigate away normally; no
self-imposed lock.

### 16.6 Disallowed-role access

**Steps:** As teacher (mobile-only role), in a desktop browser visit
`dashboard.getkidshub.com`.

**Expected:** ✅ `/unauthorized` page renders with sign-out CTA. No
dashboard data leaks.

---

## Phase 17 — Cleanup after testing (~5 min)

> Do not skip this — Phase 13 and Phase 14 mutated production data.

- [ ] **17.1** Restore `centers/{ownerUid}.starterStartedAt` to its
      original value (or leave it; Phase 13.8 should already have).
- [ ] **17.2** Confirm `centers/{ownerUid}.plan` is back to where you
      want it for ongoing use.
- [ ] **17.3** Confirm `centers/{ownerUid}.demoMode` is **false** (Phase
      12.4 should already have).
- [ ] **17.4** If you flipped `EXPO_PUBLIC_ENABLE_WEB_APP=true` on
      Vercel for the kidshub project to test on desktop (Phase 5.5
      note), set it back to `false` (or remove the override) and
      redeploy. **Goal: restore mobile-first Coming Soon splash before
      real users notice.**
- [ ] **17.5** Delete the test `leads/{id}` docs from Firebase Console
      (Phase 1.3, Phase 11.3).
- [ ] **17.6** Optional: delete the test owner / teacher / parent users
      from Firebase Auth + their Firestore docs to keep the project
      clean. Or leave them in a `test-` named tenant for next time.

---

## Triage notes (failure-mode cheat sheet)

- **Resend failures**: visible in-product as warning banners; not a
  blocker for invite functionality (link copy/paste still works).
  Investigate the Resend dashboard. Re-test Phase 5.1 / 6.1 after fixing.

- **`auth/email-already-in-use` on parent accept**: an old auth account
  exists for that email. We do **not** auto-merge for security (a
  dormant self-signup parent shouldn't get auto-linked to a daycare).
  Owner action: revoke + reissue to a different email, or have the
  parent recover the existing account first.

- **Parent missing a sibling after accept**: check
  `invites/{token}.childIds` was denormalized at create time — if not,
  re-issue the invite (the dashboard pulls latest
  `parents/{id}.childIds`). Also check `children/{cid}.parentIds`
  includes the parent's uid; if a single-child arrayUnion failed,
  re-link via owner action.

- **`linkedParentId` missing on users doc**: invite was issued without
  `parentId` (legacy path or pre-Sprint-8 invite). Acceptance still
  works — the parent just isn't joined back to a `parents/{id}` contact
  record. Manually patch `users/{uid}.linkedParentId` if you need the
  joinable view.

- **Phase 13 owner stays on `/paywall` after upgrading**: the live
  snapshot should have re-fired within ~1s of the Firestore write. If
  not, hard-refresh. Persistent failure = `useEntitlements` is not
  picking up the snapshot — check the browser console for snapshot
  errors and that the rule allows the owner to read their own center
  doc.

- **Phase 14 migration didn't fire**: confirm `centers/{ownerUid}.plan
  === 'trial'` in Firestore (string, not boolean). Confirm the owner
  signed in (the migration runs in `useEntitlements`, which only
  mounts after auth resolves). Check the browser console for
  `[centersApi] migrateLegacyTrialToStarter` warnings.

- **`photoJournal` still locked even on Premium / demoMode**: that's
  expected today — `photoJournal` is in `INFRA_LOCKED_FEATURES` until
  Firebase Storage Blaze is enabled. See the
  `photos-infra-lock-flip` reminder in PRODUCT_PLAN.

- **Tenant isolation regression**: a parent / teacher snapshot starts
  returning unrelated docs after a rules change. Cause is almost
  always: the client query filter doesn't pin `daycareId`, AND the
  rule's `allow list:` branch doesn't enforce it either. Audit the
  query in the app code and the matching rule branch together — the
  client filter must match (or be stricter than) the rule's
  `where`-equivalent. (Tracked as `lint-listquery-vs-rule` in the
  ongoing reminder list.)

---

## Quick reference

- **Starter limits**: 1 classroom · 15 children · 2 staff (`config/product.ts`
  → `QUOTAS`).
- **Starter free window**: `STARTER_FREE_DAYS = 60` days.
- **Amber warning**: `STARTER_PROMO_WARNING_DAYS = 14` days remaining.
- **Paywall-exempt routes**: `/paywall`, `/plans` (`ProtectedRoute.jsx`).
- **Admin allowlist** (paywall bypass + demoMode): `ADMIN_UIDS` in
  `config/product.ts`.
- **Tier ranks** (server + client agree): starter=0, pro=1, premium=2,
  legacy trial=0.
