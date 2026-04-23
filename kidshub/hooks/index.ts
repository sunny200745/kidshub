/**
 * Barrel for kidshub custom hooks. Import from '@/hooks' so refactors stay
 * local to this file.
 *
 * Theme helpers (from the Expo template, kept as-is):
 */
export { useColorScheme } from './use-color-scheme';
export { useThemeColor } from './use-theme-color';

/**
 * Navigation helpers (added in p3-7 for the react-router-dom → expo-router
 * migration). See hooks/README.md for the full pattern map.
 */
export { useIsRouteActive } from './use-is-route-active';
export type { UseIsRouteActiveOptions } from './use-is-route-active';

/**
 * Auth / role guards (added in p3-7, used in p3-9 / p3-13).
 */
export { useAuthRedirect } from './use-auth-redirect';
export type { AuthRequirement, UseAuthRedirectOptions } from './use-auth-redirect';
export { useRequireRole } from './use-require-role';
export type { UseRequireRoleOptions } from './use-require-role';

/**
 * Role-aware theming (parent: pink, teacher: teal). See use-role-theme.ts
 * for the token map + usage patterns.
 */
export { useRoleTheme, getRoleTheme } from './use-role-theme';
export type { RoleTheme } from './use-role-theme';

/**
 * Live Firestore data hooks (added in live-data-2). All tenant-scoped
 * via the auth profile; see hooks/use-live-data.ts for the full doc.
 */
export {
  useMyChildren,
  useChild,
  useClassroomRoster,
  useClassroom,
  useTodaysActivitiesForChildren,
  useTodaysActivitiesForClassroom,
  useAnnouncements,
  useStaffForDaycare,
  useMyMessages,
  useConversations,
} from './use-live-data';

/**
 * Entitlements / feature-gating (Sprint 1 of PRODUCT_PLAN). See
 * config/product.ts for the tier + feature matrix that drives these.
 */
export { useEntitlements } from './use-entitlements';
export type { EntitlementsState } from './use-entitlements';
export { useFeature } from './use-feature';
export type { FeatureState } from './use-feature';

/**
 * Paid-feature live hooks (Sprints 5-7). Each hook is feature-gated —
 * returns an empty/loading state when the tier doesn't unlock the
 * underlying collection, preserving the "insufficient permissions"
 * silence in Firestore logs.
 */
export {
  useMyChildrenPhotos,
  useClassroomPhotos,
  useMyOpenShift,
  useChildHealthLogs,
  useClassroomHealthLogs,
  useClassroomWeeklyPlan,
  useActivityTemplates,
  useClassroomScreeningsForDate,
  useChildScreenings,
} from './use-paid-features';
