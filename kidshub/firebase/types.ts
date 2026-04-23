/**
 * Canonical Firestore data types for the kidshub app.
 *
 * Mirrors the shapes written by the dashboard's API helpers
 * (`kidshub-dashboard/src/firebase/api/*.js`). Keep in sync with the
 * Firestore security rules at repo-root `firestore.rules` — the rules are
 * the actual source of truth on what fields exist and who can write them.
 *
 * Doc IDs are NOT part of the data; we attach `id` after reading via
 * `{ id: snap.id, ...snap.data() }`.
 */

export type Role = 'owner' | 'teacher' | 'parent';

export type CheckInStatus = 'checked-in' | 'absent' | 'checked-out';

export type ActivityType =
  | 'meal'
  | 'snack'
  | 'nap'
  | 'diaper'
  | 'potty'
  | 'activity'
  | 'outdoor'
  | 'learning'
  | 'mood'
  | 'incident'
  | 'medication'
  | 'milestone'
  | 'photo'
  | 'note'
  | 'checkin'
  | 'checkout'
  | 'health'
  | 'music'
  | 'play';

/** A child enrolled at a daycare. */
export type Child = {
  id: string;
  firstName: string;
  lastName: string;
  /** ISO date (YYYY-MM-DD) — optional for legacy records. */
  dateOfBirth?: string;
  /** Free-form age string ("2 years"). Optional; UI derives from DOB if missing. */
  age?: string;
  /** Classroom FK. Some legacy docs use `classroom`, newer use `classroomId`. */
  classroom?: string;
  classroomId?: string;
  /** Cached classroom color for UI. Often missing on real Firestore docs. */
  classroomColor?: string;
  status?: CheckInStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  avatar?: string | null;
  allergies?: string[];
  medicalConditions?: string[];
  dietaryRestrictions?: string[];
  /** Set of parent uids linked via dashboard's link-parent-to-child action. */
  parentIds?: string[];
  daycareId: string;
  /** Optional cached display fields. Real schema may expand later. */
  emergencyContacts?: { name: string; relationship: string; phone: string }[];
  authorizedPickups?: { name: string; relationship: string }[];
  schedule?: Record<string, boolean>;
};

export type Classroom = {
  id: string;
  name: string;
  /** Hex color used as the per-classroom accent across the app. */
  color?: string;
  ageRange?: string;
  daycareId: string;
  capacity?: number;
};

export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  /** Job role within the staff roster — different from app role. */
  role?: 'lead-teacher' | 'assistant-teacher' | 'floater' | string;
  /** Classroom FK. Same dual-naming as children. */
  classroom?: string;
  classroomId?: string;
  daycareId: string;
  /** Option B linkage to users/{uid}. */
  linkedUserId?: string | null;
  appStatus?: 'none' | 'invited' | 'active';
};

/**
 * Activity log entry. Created by teachers (via /activities or /check-in)
 * and read by both teachers (classroom-scoped) and parents (child-scoped).
 */
export type Activity = {
  id: string;
  childId: string;
  classroomId: string;
  staffId: string;
  type: ActivityType;
  notes?: string;
  /** ISO timestamp; server-generated `createdAt` is separate. */
  timestamp: string;
  details?: Record<string, unknown>;
  daycareId: string;
};

/**
 * One message inside a parent ↔ teacher conversation. The dashboard
 * doesn't model conversations as separate docs — they're derived from
 * groups of `messages` sharing a `conversationId`. We mirror that here.
 */
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderType?: 'parent' | 'staff';
  recipientId?: string;
  childId?: string;
  content: string;
  /** ISO timestamp; same time the doc was written. */
  timestamp: string;
  read?: boolean;
  readAt?: string | null;
  daycareId: string;
  /**
   * Staff-side archive flag (Sprint 4 / B6). When true on the *latest*
   * message in a thread, the thread shows up under the teacher's
   * "Archived" tab instead of "Inbox". New parent-sent messages leave
   * this unset, which naturally un-archives the thread.
   */
  archivedByStaff?: boolean;
  /** ISO timestamp the staff archive flip happened — purely for audit. */
  staffArchivedAt?: string | null;
};

/**
 * UI-derived conversation summary. Built client-side by grouping
 * `messages` rows by `conversationId`. Not a Firestore doc.
 */
export type Conversation = {
  id: string;
  /** Other participant — for a teacher this is a parent, for a parent it's a staff member. */
  otherPartyId: string;
  otherPartyName: string;
  childId?: string;
  childName?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  /** Full message list (sorted ascending by timestamp). */
  messages: Message[];
};

export type Announcement = {
  id: string;
  title: string;
  body?: string;
  content?: string;
  priority?: 'high' | 'normal' | 'low';
  audience?: 'all' | 'parents' | 'staff';
  /** ISO timestamp. */
  timestamp: string;
  daycareId: string;
};

// ─────────────────────────────────────────────────────────────────────
// Sprint 5 / D1 — Photo journal (Pro)
// ─────────────────────────────────────────────────────────────────────

/**
 * A photo uploaded by a staff member for a specific child (or classroom
 * group shot). Stored in the top-level `photos` Firestore collection
 * with the binary content living under Firebase Storage at
 * `daycares/{daycareId}/photos/{photoId}/{filename}`.
 *
 * Rules (see `firestore.rules` → `/photos`):
 *   - create: owner OR teacher in tenant AND `planAllows('photoJournal')`
 *   - read: owner, teacher in classroom, parent whose child is tagged
 *   - delete: uploader or owner
 *
 * `childIds` is a list (not just `childId`) so a single group photo can
 * be surfaced on every tagged parent's gallery without duplicating the
 * upload. UI almost always tags exactly one child; the list keeps the
 * "class field trip" case simple.
 */
export type Photo = {
  id: string;
  daycareId: string;
  classroomId: string;
  /** Uid of the uploader (teacher or owner). */
  uploadedBy: string;
  uploadedByName?: string;
  /** List of child ids tagged in the photo. At least 1. */
  childIds: string[];
  /** Full-size image URL in Firebase Storage. */
  imageUrl: string;
  /** Optional 256px thumbnail. Falls back to imageUrl if unset. */
  thumbnailUrl?: string;
  caption?: string;
  /** ISO timestamp. */
  timestamp: string;
};

// ─────────────────────────────────────────────────────────────────────
// Sprint 6 / D4 — Staff clock-in (Pro)
// ─────────────────────────────────────────────────────────────────────

/**
 * One shift for a staff member. `clockOutAt` is null while the shift is
 * in-progress, set when they clock out. Owner-read for timesheets;
 * teacher read/write scoped to their own uid.
 */
export type Attendance = {
  id: string;
  daycareId: string;
  /** Firebase Auth uid of the teacher. */
  userId: string;
  /** Display name stamped at clock-in for fast timesheet rendering. */
  userName?: string;
  staffId?: string | null;
  classroomId?: string | null;
  /** ISO timestamp clock-in. */
  clockInAt: string;
  /** ISO timestamp clock-out; null while the shift is open. */
  clockOutAt?: string | null;
  /** Derived total minutes on clock-out. */
  minutesWorked?: number;
  notes?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Sprint 7 / D5 — Health reports (Pro)
// ─────────────────────────────────────────────────────────────────────

export type HealthLogKind = 'symptom' | 'medication' | 'incident' | 'injury';

/**
 * One entry in the compliance-oriented health log. Separate from
 * `activities` of type 'health' so reports, retention policy, and
 * owner oversight can be scoped independently.
 */
export type HealthLog = {
  id: string;
  daycareId: string;
  classroomId: string;
  childId: string;
  staffId: string;
  kind: HealthLogKind;
  summary: string;
  /** Free-form details — severity, witnesses, action taken. */
  details?: string;
  /** Optional follow-up required flag surfaced to the owner. */
  followUpRequired?: boolean;
  /** ISO timestamp. */
  timestamp: string;
};

// ─────────────────────────────────────────────────────────────────────
// Sprint 7 / D6 · D7 — Weekly planner + Activity planner (Pro)
// ─────────────────────────────────────────────────────────────────────

/** One item on the weekly plan grid. */
export type WeeklyPlanItem = {
  /** Stable id within the plan (uuid). */
  id: string;
  /** 0 = Monday, 6 = Sunday. */
  dayOfWeek: number;
  timeSlot: string;
  title: string;
  description?: string;
  /** Optional link back to an activity template (curriculum library). */
  templateId?: string;
};

/**
 * Plan for a single (classroom, week-of) pair. Week keys use ISO
 * `YYYY-Www` notation. Parents read, teachers edit.
 */
export type WeeklyPlan = {
  id: string;
  daycareId: string;
  classroomId: string;
  /** ISO week start, e.g. 2026-04-20. */
  weekStartDate: string;
  items: WeeklyPlanItem[];
  /** Uid of the teacher who last saved. */
  updatedBy?: string;
  updatedAt?: string;
};

/**
 * Reusable activity template from the curriculum library. Teachers can
 * save their own AND browse a daycare-wide shared set (ownerId =
 * daycareId uid) or a system catalog (ownerId = 'system').
 */
export type ActivityTemplate = {
  id: string;
  daycareId: string;
  ownerId: string;
  title: string;
  category: 'art' | 'music' | 'outdoor' | 'stem' | 'story' | 'circle' | 'other';
  ageRange?: string;
  durationMinutes?: number;
  materials?: string[];
  description: string;
  createdAt?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Sprint 7 / D8 — Morning screenings (Pro)
// ─────────────────────────────────────────────────────────────────────

/**
 * One morning drop-off screening. Written by the teacher at check-in.
 * Owner reads all; parent reads their own child's.
 */
export type Screening = {
  id: string;
  daycareId: string;
  classroomId: string;
  childId: string;
  staffId: string;
  /** ISO date of the screening (YYYY-MM-DD). */
  date: string;
  /** Body temperature in Fahrenheit. */
  temperatureF?: number;
  hasSymptoms: boolean;
  symptoms?: string[];
  /** Signed by parent at drop-off (digital). */
  parentAcknowledged?: boolean;
  notes?: string;
  /** ISO timestamp. */
  timestamp: string;
};
