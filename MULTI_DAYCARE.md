# Multi-daycare per owner — scaffold (Sprint 7 / D10)

> **Status:** not live. This doc is the architectural plan. Until we
> have a premium customer with 2+ centres, a single owner = single
> center stays the default (simplifies auth, rules, UI, billing).

---

## Why we don't build it yet

- Zero paying customers have asked for it.
- It ~triples the UX surface (a switcher in every major page, an
  "active daycare" concept in auth context, per-center settings
  instead of per-owner).
- It's a clean, incremental lift once we need it — none of today's
  data model blocks a future migration.

## The plan

### Data model migration

Today:
- `centers/{ownerId}` — a single center doc keyed by the owner's uid.
- Every tenant-scoped collection (`children`, `staff`, `activities`,
  `photos`, etc.) filters by `daycareId == ownerUid`.

For multi-daycare:
- Split `centers` into `centers/{centerId}` where `centerId` is an
  auto-id. Add `ownerUid` field inside. Keep the `ownerUid == currentUid`
  read/write invariant via Firestore rules, but via `resource.data.ownerUid`
  rather than document id.
- Keep every tenant-scoped collection's `daycareId` field, but repoint
  it from `ownerUid` → `centerId`.
- One-time migration script: for each existing center, assign
  `centerId = ownerUid` (identity mapping) so existing data keeps
  working without touching any downstream collection.

### Client

- Add `activeCenterId` to `AuthContext`. Default = the first center
  the owner owns. Persisted in `localStorage` (dashboard) and
  `AsyncStorage` (mobile apps).
- `centersApi.listOwnedCenters()` → dropdown data source.
- Switcher UI in the dashboard sidebar and in the mobile owner section.
- Every hook that currently reads `profile.uid` as the daycare id
  now reads `activeCenterId`.

### Firestore rules

Change helper `userDaycare()` to resolve via:
```
function userDaycare() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.activeDaycareId;
}
```
Store `activeDaycareId` on the user doc so rules can read it. The
switcher updates both `localStorage` AND the user doc in a single
write so rules stay in sync.

### Billing

One Stripe subscription **per center**, not per owner. Each center's
`plan` field is authoritative. The subscription ID lives on
`centers/{centerId}.stripeSubscriptionId`.

### Migration path for existing customers

Zero-impact. Existing centers keep their current `centerId == ownerUid`.
When an owner adds a second daycare, they get a new center doc with a
fresh auto-id and the switcher appears for the first time.

---

## What we *do* have in place today

- Every tenant-scoped read is already keyed by `daycareId`. Swapping
  `daycareId = ownerUid` for `daycareId = centerId` touches ~1 line per
  API module.
- `useEntitlements()` reads the active center doc; it just needs to
  take a `centerId` parameter instead of implicitly using `ownerUid`.
- The UI layer (parent, teacher, owner) already talks to centers
  through hooks — no page has hard-coded `auth.uid` as the daycare id.

Ship when the first multi-daycare prospect appears.
