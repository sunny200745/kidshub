/**
 * useRoleTheme — role-aware theme tokens for parent vs teacher views.
 *
 * Why this exists:
 *   Parents and teachers share the same Expo app but we want them to feel
 *   visually distinct — parent view leans warm/personal (pink brand), teacher
 *   view leans operational (teal). Rather than sprinkle `role === 'teacher'
 *   ? 'bg-teal-600' : 'bg-brand-500'` in 30 places, every screen calls this
 *   hook once and reads the tokens it needs.
 *
 * Tokens returned:
 *   - `role`             'parent' | 'teacher' | null (fallback to parent look)
 *   - `label`            human-readable ('Parent' / 'Teacher') for the role pill
 *   - `accentHex`        primary role color (used in inline `style={{color}}`
 *                        props, tab bar tint, etc. — NativeWind can't infer
 *                        dynamic class names reliably, so we pass hex for the
 *                        things that need computed values)
 *   - `accentSoftHex`    very light tint of the accent (used for badge bg)
 *   - `accentDarkHex`    600-level accent for active/pressed states
 *   - `accentClass`      'bg-brand-500' | 'bg-teacher-500'  (literal string,
 *                        safe for Tailwind's content scanner)
 *   - `accentTextClass`  'text-brand-600 dark:text-brand-400' | teacher equiv
 *   - `accentBorderClass`'border-brand-500' | 'border-teacher-500'
 *   - `accentSoftBgClass`'bg-brand-50 dark:bg-brand-900/30' | teacher equiv
 *   - `badgeBgClass`     soft bg for the role pill
 *   - `badgeTextClass`   text color for the role pill
 *
 * Usage:
 *     const theme = useRoleTheme();
 *     <Pressable className={`${theme.accentClass} py-3 rounded-xl`}>
 *     <Bell color={theme.accentHex} />
 *
 * All class strings are returned as literal values (no template composition
 * at call sites), which means Tailwind's content scanner picks them up
 * correctly during the build.
 */
import { ROLES, type Role } from '@/constants/roles';
import { useAuth } from '@/contexts';

export type RoleTheme = {
  role: Role | null;
  label: string;
  accentHex: string;
  accentSoftHex: string;
  accentDarkHex: string;
  accentClass: string;
  accentTextClass: string;
  accentBorderClass: string;
  accentSoftBgClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
};

const PARENT_THEME: RoleTheme = {
  role: ROLES.PARENT,
  label: 'Parent',
  accentHex: '#FF2D8A', // brand-500
  accentSoftHex: '#FFE0EF', // brand-100
  accentDarkHex: '#F0106B', // brand-600
  accentClass: 'bg-brand-500',
  accentTextClass: 'text-brand-600 dark:text-brand-400',
  accentBorderClass: 'border-brand-500',
  accentSoftBgClass: 'bg-brand-50 dark:bg-brand-900/30',
  badgeBgClass: 'bg-brand-50 dark:bg-brand-900/30',
  badgeTextClass: 'text-brand-700 dark:text-brand-300',
};

const TEACHER_THEME: RoleTheme = {
  role: ROLES.TEACHER,
  label: 'Teacher',
  accentHex: '#14B8A6', // teacher-500
  accentSoftHex: '#CCFBF1', // teacher-100
  accentDarkHex: '#0D9488', // teacher-600
  accentClass: 'bg-teacher-500',
  accentTextClass: 'text-teacher-600 dark:text-teacher-400',
  accentBorderClass: 'border-teacher-500',
  accentSoftBgClass: 'bg-teacher-50 dark:bg-teacher-900/30',
  badgeBgClass: 'bg-teacher-50 dark:bg-teacher-900/30',
  badgeTextClass: 'text-teacher-700 dark:text-teacher-300',
};

export function useRoleTheme(): RoleTheme {
  const { role } = useAuth();
  if (role === ROLES.TEACHER) return TEACHER_THEME;
  return PARENT_THEME;
}

/**
 * Escape hatch for layouts/screens that need a theme for a role *they already
 * know* (e.g. Tabs bar config in (teacher)/_layout.tsx) — avoids reading auth
 * context inside components that render before it's resolved.
 */
export function getRoleTheme(role: Role | null | undefined): RoleTheme {
  return role === ROLES.TEACHER ? TEACHER_THEME : PARENT_THEME;
}
