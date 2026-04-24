# KidsHub — Manual Test Plan (Sprints 1–7 + Parent Onboarding)

End-to-end smoke-test plan for the dashboard + kidshub apps + Firestore rules. Run through this any time you ship a meaningful change to onboarding, RBAC, billing, or shared data.

Companion to `PRODUCT_PLAN.md` (what we're building) and `firestore.rules` (what's enforced server-side). When a step here references a behavior, the source of truth is the rule or the linked component file.

---

## How to use this doc

- Each section has **Setup**, **Steps**, and **Expected** broken out so you can hand any single section to a non-engineer (or to a future-you who's lost context).
- **Bold ✅** = pass. **Bold ❌** = fail — file a bug, link the section + step number.
- Run sections **in order** the first time. Most flows have prerequisites (you can't test "parent sees their child" without first running "owner adds child" and "owner invites parent").
- Pre-flight: clear browser data on `dashboard.getkidshub.com` AND `app.getkidshub.com` (localhost equivalents OK) so cached auth doesn't poison test runs.

---

## 0. Environment + accounts (one-time)

You need three test accounts on the same daycare tenant:

| Role | How to create | Notes |
|---|---|---|
| **Owner** | Sign up at `/register` on the dashboard | Becomes `daycareId` for the tenant |
| **Teacher** | Owner invites via Staff page | Created by `acceptTeacherInvite` |
| **Parent**  | Owner invites via Parents page | Created by `acceptParentInvite` |

Use **distinct real emails** you can read inboxes for (Resend delivers actual mail in non-dev environments). Gmail `+` aliases work: `you+owner@gmail.com`, `you+teacher@gmail.com`, etc.

Verify before starting:
- [ ] Firebase project: dashboard + kidshub apps point at the same project
- [ ] `firestore.rules` deployed (latest revision matches working tree — `git diff firestore.rules` should be empty against deployed)
- [ ] Resend API key configured (otherwise email-send steps fail with a visible "Resend failed" badge — that's fine for sanity, just note it)

---

## Sprint 1–2 — Dashboard fundamentals (Owner UI)

### 1.1 Owner sign-up + first sign-in

**Setup:** Logged out, fresh tab on dashboard URL.

**Steps:**
1. Visit `/register`
2. Enter first name, last name, email, password
3. Submit

**Expected:** ✅ Redirected to `/` (Dashboard). Sidebar shows your name. Firestore: `users/{uid}` exists with `role: 'owner'` and `daycareId == uid`.

### 1.2 Logout + login

**Steps:**
1. Click "Sign Out" in sidebar → land on `/login`
2. Enter the same email + password → submit

**Expected:** ✅ Land back on `/`. Same dashboard data visible.

### 1.3 Add classroom (CRUD)

**Steps:**
1. Sidebar → Classrooms → "Add Classroom"
2. Fill name, age range, color → save

**Expected:** ✅ New card appears immediately (live snapshot). `classrooms/{id}.daycareId == owner.uid`.

### 1.4 Add child (CRUD)

**Steps:**
1. Sidebar → Children → "Add Child"
2. Fill name, DOB, classroom (pick the one from 1.3) → save

**Expected:** ✅ Card appears in grid. `children/{id}.classroom == classroomId`. Child appears under its classroom on the Classrooms page.

### 1.5 Add staff (CRUD — pre-invite)

**Steps:**
1. Sidebar → Staff → "Add Staff"
2. Fill name, email, classroom → save

**Expected:** ✅ Card appears with "Invite to app" button visible (because `appStatus == 'none'`). Email + classroom shown.

---

## Sprint 3 — RBAC + invite flows

### 3.1 Teacher invite (happy path)

**Setup:** Owner logged in. Staff record from 1.5 exists with email + classroom.

**Steps:**
1. Staff page → click "Invite to app" on the staff card
2. Confirm in modal → "Create invite"
3. **Owner side:** Verify the result screen shows "Invite email sent" + invite URL. Card status flips to "Invite pending".
4. **Owner side:** Verify "Pending invites" panel at top of Staff page shows this invite.
5. **Teacher side:** Open the invite URL in a private window OR check the teacher's email inbox for the activation email and click the link.
6. Fill name + password → submit.

**Expected:**
- ✅ Lands in kidshub teacher app (`app.getkidshub.com`).
- ✅ Sees only the assigned classroom's children.
- ✅ Can log activities for those children.
- ✅ Owner-side: staff card flips to "App access" badge. `staff/{id}.linkedUserId == teacher.uid`, `appStatus == 'active'`.
- ✅ `invites/{token}` is deleted (not in Firestore Console).

### 3.2 Teacher invite — revoke before accept

**Steps:**
1. Repeat 3.1 step 1–3 (don't accept).
2. In "Pending invites", click the trash icon → confirm revoke.

**Expected:** ✅ Invite disappears. Staff card returns to "Invite to app" (appStatus reset to 'none').

### 3.3 Teacher invite — expired link

**Steps:**
1. Manually set `expiresAt` on the invite doc to a past date (Firestore Console).
2. Open the invite URL.

**Expected:** ✅ Accept screen shows "This invite has expired" — no form rendered.

### 3.4 RBAC: teacher cannot read other classrooms

**Steps:**
1. Logged in as teacher (post-3.1).
2. In browser devtools, attempt a manual Firestore read of a child in a DIFFERENT classroom (or just navigate within the app — they should not be visible).

**Expected:** ✅ Other classroom's children are NOT visible in any UI. Manual reads return permission-denied.

---

## Sprint 4 — Activities, messaging, announcements

### 4.1 Teacher logs an activity

**Setup:** Logged in as teacher.

**Steps:**
1. Pick a child → log a feeding (or nap, or diaper).
2. Sign out.
3. Sign in as owner → Children → that child → Timeline tab.

**Expected:** ✅ Activity appears in the timeline, attributed to the teacher's name.

### 4.2 Parent ↔ teacher message

**Setup:** Need a parent account first — defer this to **Section 7** below. Come back here after running 7.1.

**Steps:**
1. Parent app → Messages → tap the assigned teacher → send a text message.
2. Switch to teacher app → Messages → see the new conversation.
3. Reply.
4. Switch back to parent app → see the reply.

**Expected:** ✅ Realtime delivery in both directions. Message author labels are correct.

### 4.3 Owner posts announcement

**Steps:**
1. Owner → Announcements → "New announcement" → title + body → publish.
2. Open kidshub parent app → Home tab.
3. Open kidshub teacher app → Home tab.

**Expected:** ✅ Announcement visible on both apps.

---

## Sprint 5 — Auth hardening + invite emails

### 5.1 Resend integration sanity

**Steps:**
1. Issue a fresh teacher invite (Section 3.1).
2. Check the invited email inbox.

**Expected:** ✅ Activation email arrives within ~1 minute, formatted, with the correct invite URL.

### 5.2 Resend retry from owner side

**Steps:**
1. In the "Pending invites" panel, click "Resend email" on a pending invite.

**Expected:** ✅ Button briefly shows "Sending…", then a green "Email sent" pill on the row. Inbox receives a duplicate.

### 5.3 Welcome email on accept

**Steps:**
1. Complete a teacher invite-accept (Section 3.1).
2. Check inbox.

**Expected:** ✅ Welcome email arrives shortly after the accept completes.

---

## Sprint 6 — Reports + check-in/out

### 6.1 Check-in / check-out

**Steps:**
1. Owner OR teacher → Check In/Out tab → mark a child checked-in.
2. Verify status badge updates.
3. Mark them checked-out.

**Expected:** ✅ Child status flips immediately. Dashboard counters reflect new state.

### 6.2 Reports tab visible (Pro+) / locked (Starter)

**Steps:**
1. Set tenant tier to `starter` (Firestore Console → `daycares/{ownerUid}.tier = 'starter'`).
2. Sidebar → Reports.

**Expected:** ✅ Page loads but shows upgrade CTA / lock state.

3. Set tier to `pro`. Reload.

**Expected:** ✅ Reports unlock. Charts/exports render against your real data.

---

## Sprint 7 — Feature gating, billing scaffold, paid features

### 7.1 Quota enforcement (Starter)

**Setup:** Tier = `starter`. Already created 1 classroom (1.3) + 1 child (1.4) + 1 staff (1.5).

**Steps:**
1. Add 14 more children (so you're AT the 15-child cap).
2. Try to add a 16th child.

**Expected:** ✅ Form submission fails with a `quota-exceeded` error — `QuotaBanner` renders inside the modal pointing to upgrade.

### 7.2 Pro-only feature lock

**Steps:**
1. Tier = `starter`. Try to access photo upload (in any flow that uses it).

**Expected:** ✅ Locked with upgrade CTA.

2. Bump tier to `pro`. Reload.

**Expected:** ✅ Feature unlocks.

### 7.3 Billing UI shell

**Steps:**
1. Settings → Plans (or `/plans` directly).
2. Confirm current tier badge + upgrade CTA copy is correct.

**Expected:** ✅ Reflects the current tier from `daycares/{uid}.tier`.

---

## NEW: Parent onboarding (Sprint 8 — this work)

The flow we just built. Mirrors the teacher onboarding (record-first, invite-second) and supports multi-sibling parents on a single record + single invite link.

### 8.1 Add a parent (CRUD)

**Setup:** Owner logged in. At least one child exists (Section 1.4). Sidebar now has a **Parents** entry (with a heart icon, between Staff and Messages).

**Steps:**
1. Sidebar → **Parents**.
2. "Add Parent".
3. Fill: first name, last name, email, phone, relationship (e.g. Mother), check ONE child in the linked-children list. Leave Emergency contact unchecked, Pickup checked. Save.

**Expected:**
- ✅ Modal closes; a new ParentCard appears in the grid.
- ✅ Card shows: avatar, name, "Mother" label, the linked child as an info badge, "Pickup" success badge, and **"Invite to app"** button (active — no blockers).
- ✅ Firestore: `parents/{id}` exists with `email` lowercased, `childIds: [<childId>]`, `daycareId == owner.uid`, `appStatus: 'none'`, `linkedUserId: null`.

### 8.2 Add a multi-sibling parent

**Setup:** At least 2 children exist.

**Steps:**
1. Parents → "Add Parent".
2. Fill basics. In the "Linked children" checklist, **check 2 or more children**.
3. Save.

**Expected:** ✅ Card shows 2 child badges (or 2 + "+N" if >2). `parents/{id}.childIds` array has all selected ids.

### 8.3 Edit a parent

**Steps:**
1. Hover any ParentCard → click the pencil icon (top-right).
2. Form opens pre-filled with everything from 8.1/8.2.
3. Change phone, toggle Emergency on, uncheck one of the linked children. Save.

**Expected:** ✅ Card updates immediately. Firestore: `parents/{id}` reflects edits, `appStatus` and `linkedUserId` UNCHANGED (the form/API strip them defensively).

### 8.4 Invite parent to app — Option B path

**Setup:** Parent record from 8.2 (with multiple linked children) exists, status = "Invite to app".

**Steps:**
1. Click "Invite to app" on the card.
2. Confirm modal shows: parent's name in the banner, locked email field (pulled from the record), and a **Children** row listing all linked siblings.
3. Click "Create invite".

**Expected:**
- ✅ Result screen: "Invite email sent" + URL.
- ✅ Card status flips to "Invite pending" (yellow badge with clock).
- ✅ "Pending parent invites" panel at top of Parents page shows this invite, with `Primary child name +N siblings` microcopy.
- ✅ Firestore: `invites/{token}` has `role: 'parent'`, `parentId: <pid>`, `childId: <primary>`, `childIds: [<all>]` (denormalized at create), `email == parent.email`.
- ✅ `parents/{pid}.appStatus == 'invited'`.

### 8.5 Parent accepts invite — multi-child link

**Setup:** Invite from 8.4 still pending.

**Steps:**
1. Open the invite URL in a private window (or click the link in the parent's inbox).
2. Accept screen shows: "You're invited to connect with {primaryChildName}", invite email displayed.
3. Fill first name, last name, password (any length ≥6, optional phone). Submit.

**Expected:**
- ✅ Lands in kidshub parent app (`app.getkidshub.com`).
- ✅ Home/dashboard tab shows **all linked children** (not just the primary).
- ✅ Each child's Timeline shows real activity from owner/teacher (if any was logged).
- ✅ Firestore: `users/{newUid}` has `role: 'parent'`, `childIds` matches the invite's `childIds`, `daycareId == owner.uid`, `linkedParentId == <pid>`, `inviteToken == <token>`.
- ✅ `parents/{pid}.linkedUserId == newUid`, `appStatus == 'active'`.
- ✅ Each `children/{cid}.parentIds` contains `newUid`.
- ✅ `invites/{token}` deleted.
- ✅ Owner-side Parents page: card flips to green "App access" badge.

### 8.6 RBAC — parent sees ONLY their linked children

**Setup:** Logged in as parent from 8.5. There is a child in the daycare NOT in their `childIds` (e.g. another classroom's kid).

**Steps:**
1. Browse the kidshub parent app fully — Home, Activities, Photos (if Pro+), Messages.
2. In devtools, attempt a manual Firestore read of an unlinked child id.

**Expected:**
- ✅ NO unlinked children appear anywhere in the UI.
- ✅ Manual read returns permission-denied.
- ✅ Manual read of any other tenant's data also denied.

### 8.7 Single-sibling parent (regression — Option B with N=1)

**Steps:**
1. Repeat 8.1 + 8.4 + 8.5 with a parent record linked to **just one** child.

**Expected:** ✅ Same behavior as 8.5 but `childIds` is `[singleId]`. UI doesn't say "siblings", just shows the single child.

### 8.8 Legacy ChildProfile path (deep-link → Parents page)

**Steps:**
1. Owner → Children → click any child → Contacts tab.
2. Click **"Invite parent to app"**.

**Expected:**
- ✅ Browser navigates to `/parents?addFor={childId}`.
- ✅ ParentFormModal opens immediately in **add mode** with that child **pre-checked** in the linked-children list.
- ✅ Owner can add other siblings, fill the form, save → land on Parents page with the new card.
- ✅ URL `?addFor=` query param is stripped after the modal opens (back navigation doesn't reopen the modal).

### 8.9 Revoke pending parent invite

**Steps:**
1. Issue a parent invite via 8.4 but DON'T accept.
2. In the "Pending parent invites" panel, click the trash icon → confirm.

**Expected:** ✅ Invite disappears. Card flips back to "Invite to app". `parents/{pid}.appStatus == 'none'` (reset by `invitesApi.delete` → `parentsApi.resetAppStatus`).

### 8.10 Resend parent invite email

**Steps:**
1. Pending parent invite from 8.4.
2. Click "Resend email" on the row in the Pending panel.

**Expected:** ✅ Briefly "Sending…", then "Email sent" pill. Inbox receives a duplicate.

### 8.11 Delete a parent (with appStatus guard)

**Steps:**
1. Try to delete a parent with `appStatus == 'active'` (post-accept) — hover card, click trash icon.

**Expected:** ✅ Trash icon is **disabled** with a tooltip "Revoke app access first to delete". ConfirmDialog (if it opens via the detail modal) shows the blocked-reason microcopy.

2. Delete a parent with `appStatus == 'none'`.

**Expected:** ✅ ConfirmDialog with the correct microcopy. Confirming deletes `parents/{id}`. Card disappears.

### 8.12 Form validation

**Steps:**
1. Add Parent → submit with empty required fields.

**Expected:** ✅ Inline error: "Please fill in first name, last name, and email."

2. Pick "Other" relationship without typing a label → submit.

**Expected:** ✅ Inline error: "Please enter a relationship label, or pick from the list."

3. Edit a parent who has `appStatus == 'active'`.

**Expected:** ✅ Email field is **locked** (greyed) with microcopy "Email is locked while the parent has app access".

### 8.13 Empty states

**Steps:**
1. Brand new tenant (no parents yet) → Parents page.

**Expected:** ✅ EmptyState card: "No parents on the roster yet" + "Add your first parent" CTA.

2. With parents but search/filter that matches nothing.

**Expected:** ✅ EmptyState: "No parents match those filters" + suggestion to clear filters.

### 8.14 Filter by child

**Steps:**
1. Multiple parents linked to different children.
2. Use the child dropdown to filter.

**Expected:** ✅ Only parents with that child in their `childIds` (or legacy `children`) array show.

---

## Cross-cutting checks (run after any rules change)

### X.1 Tenant isolation

**Setup:** Two owner accounts on different tenants (different `daycareId`).

**Steps:**
1. As owner-A, attempt to read `parents/{id}` belonging to owner-B (via Firestore Console as owner-B's auth, or via dev console manual fetch).

**Expected:** ✅ Permission denied across all collections (children, classrooms, staff, parents, activities, messages, invites, announcements).

### X.2 Parent self-link rule (Step 2 surface)

**Steps:**
1. As parent (post-8.5), in devtools attempt:
   - `updateDoc(parents/{theirParentId}, { firstName: 'Hacker' })` → ✅ denied (only `linkedUserId|appStatus|updatedAt` allowed)
   - `updateDoc(parents/{otherParentId}, { linkedUserId: their.uid })` → ✅ denied (email mismatch)
   - `updateDoc(parents/{theirParentId}, { linkedUserId: someOtherUid })` → ✅ denied (`linkedUserId == auth.uid` required)

### X.3 Invite immutability

**Steps:**
1. As any signed-in user, attempt to mutate an existing `invites/{token}` doc (set/update).

**Expected:** ✅ Permission denied. Only owner-create + invitee-delete (on accept) are allowed.

---

## Latest UI/UX polish (from today's session)

> ⚠️ Add specific items here as they ship. The list below is a placeholder — fill in once you've reviewed the morning's UI changes (ask the agent to summarize them, or skim recent commits).

- [ ] (placeholder) Visual change A — verify on dashboard `/path`
- [ ] (placeholder) Visual change B — verify on kidshub parent home

---

## Triage notes

- **Resend failures**: visible in-product as warning banners; not a blocker for invite functionality (link copy/paste still works). Investigate the Resend dashboard.
- **`auth/email-already-in-use` on parent accept**: an old auth account exists for that email. We do NOT auto-merge for security (a dormant self-signup parent shouldn't get auto-linked to a daycare). Owner action: revoke + reissue to a different email, or have the parent recover the existing account first.
- **Parent missing a sibling after accept**: check `invites/{token}.childIds` was denormalized at create — if not, re-issue the invite (the dashboard will pull the latest `parents/{id}.childIds`). Also check `children/{cid}.parentIds` includes the parent's uid; if a single-child arrayUnion failed, re-link via owner action.
- **`linkedParentId` missing on users doc**: invite was issued without `parentId` (legacy path or pre-Sprint-8 invite). Acceptance still works — the parent just isn't joined back to a `parents/{id}` contact record. Manually patch `users/{uid}.linkedParentId` if you need the joinable view.
