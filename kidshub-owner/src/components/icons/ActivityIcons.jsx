import React from 'react';
import {
  Utensils,
  Apple,
  Moon,
  Baby,
  Toilet,
  Palette,
  TreePine,
  BookOpen,
  Smile,
  AlertTriangle,
  Pill,
  Star,
  Camera,
  FileText,
  CheckCircle,
  LogOut,
  Clock,
  Heart,
  Thermometer,
  Droplets,
  Sun,
  Music,
  Blocks,
  Pencil,
} from 'lucide-react';

export const activityIcons = {
  meal: Utensils,
  snack: Apple,
  nap: Moon,
  diaper: Baby,
  potty: Toilet,
  activity: Palette,
  outdoor: TreePine,
  learning: BookOpen,
  mood: Smile,
  incident: AlertTriangle,
  medication: Pill,
  milestone: Star,
  photo: Camera,
  note: FileText,
  checkin: CheckCircle,
  checkout: LogOut,
  temperature: Thermometer,
  bottle: Droplets,
  sunscreen: Sun,
  music: Music,
  play: Blocks,
  art: Pencil,
};

export const activityColors = {
  meal: { bg: 'bg-warning-100', text: 'text-warning-600' },
  snack: { bg: 'bg-warning-100', text: 'text-warning-600' },
  nap: { bg: 'bg-info-100', text: 'text-info-600' },
  diaper: { bg: 'bg-accent-100', text: 'text-accent-600' },
  potty: { bg: 'bg-accent-100', text: 'text-accent-600' },
  activity: { bg: 'bg-success-100', text: 'text-success-600' },
  outdoor: { bg: 'bg-success-100', text: 'text-success-600' },
  learning: { bg: 'bg-brand-100', text: 'text-brand-600' },
  mood: { bg: 'bg-brand-100', text: 'text-brand-600' },
  incident: { bg: 'bg-danger-100', text: 'text-danger-600' },
  medication: { bg: 'bg-danger-100', text: 'text-danger-600' },
  milestone: { bg: 'bg-warning-100', text: 'text-warning-600' },
  photo: { bg: 'bg-info-100', text: 'text-info-600' },
  note: { bg: 'bg-surface-100', text: 'text-surface-600' },
  checkin: { bg: 'bg-success-100', text: 'text-success-600' },
  checkout: { bg: 'bg-info-100', text: 'text-info-600' },
};

export const activityLabels = {
  meal: 'Meal',
  snack: 'Snack',
  nap: 'Nap',
  diaper: 'Diaper',
  potty: 'Potty',
  activity: 'Activity',
  outdoor: 'Outdoor Play',
  learning: 'Learning',
  mood: 'Mood Check',
  incident: 'Incident',
  medication: 'Medication',
  milestone: 'Milestone',
  photo: 'Photo',
  note: 'Note',
  checkin: 'Check-in',
  checkout: 'Check-out',
};

export function ActivityIcon({ type, size = 'md', className = '' }) {
  const Icon = activityIcons[type] || FileText;
  const colors = activityColors[type] || activityColors.note;
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-lg sm:rounded-xl ${colors.bg} flex items-center justify-center ${className}`}>
      <Icon className={`${iconSizes[size]} ${colors.text}`} />
    </div>
  );
}

export function getActivityConfig(type) {
  return {
    icon: activityIcons[type] || FileText,
    label: activityLabels[type] || type,
    colors: activityColors[type] || activityColors.note,
  };
}
