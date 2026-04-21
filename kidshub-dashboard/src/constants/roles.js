/**
 * Single source of truth for user roles across the KidsHub monorepo.
 *
 * Roles model:
 *   - owner    Daycare business owner. Self-registers via kidshub-dashboard.
 *              Owns a `centers/{ownerId}` tenant doc. Can invite teachers and
 *              enroll children (who trigger parent invites).
 *   - teacher  Classroom staff. Created via owner-invite flow (Phase 3, p3-14).
 *              Scoped to one or more classroomIds within their daycareId.
 *   - parent   Child guardian. Self-registers or invited when a child is
 *              enrolled. Scoped to one or more childIds.
 *
 * Per-app access:
 *   - kidshub-dashboard: owner only (enforced by ProtectedRoute).
 *   - kidshub (Phase 3): parent and teacher, routed into role-specific groups.
 *   - kidshub-landing:   no auth.
 *
 * Role is stored at `users/{uid}.role` in Firestore. The client reads it via
 * AuthContext; Firestore security rules should also gate reads/writes on the
 * same field (Phase 3, p3-15) so the client check is defense-in-depth, not the
 * only line of defense.
 */

export const ROLES = Object.freeze({
  OWNER: 'owner',
  TEACHER: 'teacher',
  PARENT: 'parent',
});

export const ROLE_LIST = Object.freeze(Object.values(ROLES));

/**
 * Roles allowed to sign into this app (kidshub-dashboard). Keep this the only
 * place ProtectedRoute/Unauthorized need to change if the scope ever widens.
 */
export const DASHBOARD_ALLOWED_ROLES = Object.freeze([ROLES.OWNER]);

export function isValidRole(role) {
  return typeof role === 'string' && ROLE_LIST.includes(role);
}

/**
 * Human-readable labels for UI (role badges, unauthorized screens, etc.).
 */
export const ROLE_LABELS = Object.freeze({
  [ROLES.OWNER]: 'Owner',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.PARENT]: 'Parent',
});
