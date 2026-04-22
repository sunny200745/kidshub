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
