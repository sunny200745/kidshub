/**
 * useIsRouteActive — "is the current path this route (or one of its children)?"
 *
 * Replaces the `<NavLink>` + `className={({ isActive }) => ...}` pattern from
 * react-router-dom, which legacy kidshub and kidshub-dashboard both leaned on
 * for BottomNav / Sidebar active styles. expo-router doesn't ship an equivalent,
 * so we roll our own on top of `usePathname()`.
 *
 * Two modes:
 *   useIsRouteActive('/home')              → exact match only
 *   useIsRouteActive('/home', { exact: false }) → matches '/home' AND
 *                                                 '/home/anything/nested'
 *
 * Example:
 *   const isHomeActive = useIsRouteActive('/home');
 *   <Pressable className={isHomeActive ? 'bg-brand-500' : 'bg-surface-200'}>
 */
import { usePathname } from 'expo-router';

export type UseIsRouteActiveOptions = {
  /** Require pathname === path. Default: true. */
  exact?: boolean;
};

export function useIsRouteActive(
  path: string,
  { exact = true }: UseIsRouteActiveOptions = {}
): boolean {
  const pathname = usePathname();
  if (exact) return pathname === path;
  if (pathname === path) return true;
  return pathname.startsWith(path.endsWith('/') ? path : `${path}/`);
}
