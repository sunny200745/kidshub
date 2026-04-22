/**
 * ActivityIcon + activity type maps — RN port of
 * kidshub-legacy/src/components/icons/ActivityIcons.jsx.
 *
 * Responsibilities:
 *   - Map an ActivityType (meal, nap, diaper, …) to a Lucide RN icon.
 *   - Map an ActivityType to a soft-pastel bg + matching icon color. Legacy
 *     used Tailwind class tuples (bg/text/border); on RN we don't use
 *     `border-*` here because icons are in filled containers, only the bg +
 *     icon stroke color matter. Border is left out for leaner render trees.
 *   - Expose human-readable labels for use in badges/chips (e.g. "Check In").
 *
 * Icon size strategy:
 *   Legacy used three sizes (sm=8, md=10, lg=12 tailwind units). We keep the
 *   same three breakpoints and forward an explicit pixel size to the lucide
 *   component (RN lucide doesn't respect `className="w-5 h-5"` for sizing).
 */
import {
  Utensils,
  Apple,
  Moon,
  Baby,
  Palette,
  TreePine,
  BookOpen,
  Smile,
  AlertTriangle,
  Pill,
  Star,
  Camera,
  FileText,
  LogIn,
  LogOut,
  Heart,
  Droplets,
  Music,
  Blocks,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import type { ActivityType } from '@/data/mockData';

export const activityIcons: Record<ActivityType, LucideIcon> = {
  meal: Utensils,
  snack: Apple,
  nap: Moon,
  diaper: Baby,
  potty: Droplets,
  activity: Palette,
  outdoor: TreePine,
  learning: BookOpen,
  mood: Smile,
  incident: AlertTriangle,
  medication: Pill,
  milestone: Star,
  photo: Camera,
  note: FileText,
  checkin: LogIn,
  checkout: LogOut,
  health: Heart,
  music: Music,
  play: Blocks,
};

type ColorPair = { bg: string; icon: string };

/**
 * `icon` is a raw hex value passed to the lucide `color` prop; lucide-rn does
 * not honor NativeWind text-* classes for stroke color. `bg` uses a NativeWind
 * class so dark-mode variants keep working.
 */
export const activityColors: Record<ActivityType, ColorPair> = {
  meal: { bg: 'bg-warning-100 dark:bg-warning-900/30', icon: '#D97706' },
  snack: { bg: 'bg-warning-100 dark:bg-warning-900/30', icon: '#D97706' },
  nap: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
  diaper: { bg: 'bg-accent-100 dark:bg-accent-900/30', icon: '#9333EA' },
  potty: { bg: 'bg-accent-100 dark:bg-accent-900/30', icon: '#9333EA' },
  activity: { bg: 'bg-success-100 dark:bg-success-900/30', icon: '#16A34A' },
  outdoor: { bg: 'bg-success-100 dark:bg-success-900/30', icon: '#16A34A' },
  learning: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
  mood: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
  incident: { bg: 'bg-danger-100 dark:bg-danger-900/30', icon: '#DC2626' },
  medication: { bg: 'bg-danger-100 dark:bg-danger-900/30', icon: '#DC2626' },
  milestone: { bg: 'bg-warning-100 dark:bg-warning-900/30', icon: '#D97706' },
  photo: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
  note: { bg: 'bg-surface-100 dark:bg-surface-800', icon: '#475569' },
  checkin: { bg: 'bg-success-100 dark:bg-success-900/30', icon: '#16A34A' },
  checkout: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
  health: { bg: 'bg-danger-100 dark:bg-danger-900/30', icon: '#DC2626' },
  music: { bg: 'bg-accent-100 dark:bg-accent-900/30', icon: '#9333EA' },
  play: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
};

export const activityLabels: Record<ActivityType, string> = {
  meal: 'Meal',
  snack: 'Snack',
  nap: 'Nap',
  diaper: 'Diaper',
  potty: 'Potty',
  activity: 'Activity',
  outdoor: 'Outdoor',
  learning: 'Learning',
  mood: 'Mood',
  incident: 'Incident',
  medication: 'Medication',
  milestone: 'Milestone',
  photo: 'Photo',
  note: 'Note',
  checkin: 'Check In',
  checkout: 'Check Out',
  health: 'Health',
  music: 'Music',
  play: 'Play',
};

type ActivityIconSize = 'sm' | 'md' | 'lg';

const BOX_SIZES: Record<ActivityIconSize, number> = { sm: 32, md: 40, lg: 48 };
const ICON_SIZES: Record<ActivityIconSize, number> = { sm: 16, md: 20, lg: 24 };

export type ActivityIconProps = {
  type: ActivityType;
  size?: ActivityIconSize;
  className?: string;
};

export function ActivityIcon({ type, size = 'md', className = '' }: ActivityIconProps) {
  const Icon = activityIcons[type] ?? FileText;
  const colors = activityColors[type] ?? activityColors.note;
  const box = BOX_SIZES[size];
  const iconSize = ICON_SIZES[size];

  return (
    <View
      style={{ width: box, height: box, borderRadius: 12 }}
      className={`items-center justify-center ${colors.bg} ${className}`}>
      <Icon size={iconSize} color={colors.icon} />
    </View>
  );
}
