/**
 * Single source of truth for user roles in the kidshub Expo app.
 *
 * Mirror of kidshub-dashboard/src/constants/roles.js — same role enum, same
 * helpers, but the *allowed* roles for THIS app are different. Phase 4 p4-2
 * will lift this to a shared workspace package so the two never drift.
 *
 * Roles model (recap from kidshub-dashboard):
 *   - owner    Daycare owner. Allowed in kidshub-dashboard ONLY.
 *   - teacher  Classroom staff. Allowed in kidshub (this app), routed to
 *              the (teacher) Expo Router group.
 *   - parent   Child guardian. Allowed in kidshub (this app), routed to
 *              the (parent) Expo Router group.
 *
 * Role is stored at users/{uid}.role in Firestore (same project for all
 * three apps). AuthContext reads it via onSnapshot; Firestore security
 * rules also gate reads/writes on the same field (see firestore.rules at
 * the monorepo root) so this client check is defense-in-depth.
 */

export const ROLES = Object.freeze({
  OWNER: 'owner',
  TEACHER: 'teacher',
  PARENT: 'parent',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: readonly Role[] = Object.freeze(Object.values(ROLES));

/**
 * Roles allowed to sign into THIS app (kidshub). Owners belong on the
 * kidshub-dashboard portal — if they sign in here, they get bounced to
 * an /unauthorized screen with a link to dashboard.getkidshub.com.
 */
export const KIDSHUB_ALLOWED_ROLES: readonly Role[] = Object.freeze([
  ROLES.PARENT,
  ROLES.TEACHER,
]);

export function isValidRole(role: unknown): role is Role {
  return typeof role === 'string' && (ROLE_LIST as readonly string[]).includes(role);
}

export const ROLE_LABELS: Readonly<Record<Role, string>> = Object.freeze({
  [ROLES.OWNER]: 'Owner',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.PARENT]: 'Parent',
});
