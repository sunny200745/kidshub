import React from 'react';
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
} from 'lucide-react';

export const activityIcons = {
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

export const activityColors = {
  meal: { bg: 'bg-warning-100', text: 'text-warning-600', border: 'border-warning-200' },
  snack: { bg: 'bg-warning-100', text: 'text-warning-600', border: 'border-warning-200' },
  nap: { bg: 'bg-info-100', text: 'text-info-600', border: 'border-info-200' },
  diaper: { bg: 'bg-accent-100', text: 'text-accent-600', border: 'border-accent-200' },
  potty: { bg: 'bg-accent-100', text: 'text-accent-600', border: 'border-accent-200' },
  activity: { bg: 'bg-success-100', text: 'text-success-600', border: 'border-success-200' },
  outdoor: { bg: 'bg-success-100', text: 'text-success-600', border: 'border-success-200' },
  learning: { bg: 'bg-brand-100', text: 'text-brand-600', border: 'border-brand-200' },
  mood: { bg: 'bg-brand-100', text: 'text-brand-600', border: 'border-brand-200' },
  incident: { bg: 'bg-danger-100', text: 'text-danger-600', border: 'border-danger-200' },
  medication: { bg: 'bg-danger-100', text: 'text-danger-600', border: 'border-danger-200' },
  milestone: { bg: 'bg-warning-100', text: 'text-warning-600', border: 'border-warning-200' },
  photo: { bg: 'bg-info-100', text: 'text-info-600', border: 'border-info-200' },
  note: { bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200' },
  checkin: { bg: 'bg-success-100', text: 'text-success-600', border: 'border-success-200' },
  checkout: { bg: 'bg-info-100', text: 'text-info-600', border: 'border-info-200' },
  health: { bg: 'bg-danger-100', text: 'text-danger-600', border: 'border-danger-200' },
  music: { bg: 'bg-accent-100', text: 'text-accent-600', border: 'border-accent-200' },
  play: { bg: 'bg-brand-100', text: 'text-brand-600', border: 'border-brand-200' },
};

export const activityLabels = {
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

export function ActivityIcon({ type, size = 'md', className = '' }) {
  const Icon = activityIcons[type] || FileText;
  const colors = activityColors[type] || activityColors.note;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center ${colors.bg} ${className}`}
    >
      <Icon className={`${iconSizes[size]} ${colors.text}`} />
    </div>
  );
}
