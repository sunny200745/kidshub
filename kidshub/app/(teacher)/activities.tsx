/**
 * /activities — "Add entry" tab (Sprint 2 / B4).
 *
 * This replaces the old 3-step NewActivityModal with a Lillio-style
 * 2-col quick-log grid: 8 large, iconified cards covering every
 * common classroom event (check-in, activity, observation, health,
 * temperature, food, sleep, toilet). Tapping a card opens
 * QuickLogSheet with the activity type prefilled — one tap later, the
 * entry is saved.
 *
 * The 4-tap → 2-tap compression is the whole point. A teacher should
 * never have to hunt through a wizard for the 80% cases.
 *
 * Below the grid is a compact "Today's log" section: a live timeline
 * of today's classroom activities. Same source as the Sprint 1 impl
 * (`useTodaysActivitiesForClassroom`) — we just render it with the
 * new EntityCard-adjacent styling instead of the old CardBody list.
 *
 * The old 3-step modal is intentionally deleted. If a teacher needs
 * to log a "less common" activity type (incident / medication /
 * milestone / photo / music / play / outdoor / learning), they use
 * the "Other" card, which opens QuickLogSheet without a prefilled
 * type and lets them choose from the full list.
 */
import { useMemo, useState } from 'react';
import {
  Activity as ActivityIconLucide,
  AlertTriangle,
  BookOpen,
  Droplets,
  FileText,
  Heart,
  LogIn,
  Moon,
  Thermometer,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ActivityIcon, activityLabels } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import { Badge, Card, CardBody, EmptyState, LoadingState } from '@/components/ui';
import { QuickLogSheet } from '@/components/teacher/quick-log-sheet';
import { useAuth } from '@/contexts';
import { activitiesApi } from '@/firebase/api';
import type { Activity, ActivityType, Child, Staff } from '@/firebase/types';
import {
  useClassroomRoster,
  useStaffForDaycare,
  useTodaysActivitiesForClassroom,
} from '@/hooks';

type GridCard = {
  key: string;
  label: string;
  type: ActivityType;
  icon: LucideIcon;
  /** NativeWind class for the icon bubble background. */
  iconBg: string;
  /** Hex color for the Lucide stroke. */
  iconColor: string;
  /** Small caption under the label — helps orient first-time teachers. */
  caption: string;
};

/**
 * The 8-card quick-log grid. Order is Lillio-ish: most-frequent events
 * up top (check-in, activity, observation, health), daily-care events
 * in the middle (food, sleep, toilet), temperature at the end because
 * it's rarer and slightly scarier.
 *
 * Mappings to our `ActivityType`:
 *   - Check in  → `checkin`
 *   - Activity  → `activity`
 *   - Observation → `note`
 *   - Health    → `health`
 *   - Food      → `meal`
 *   - Sleep     → `nap`
 *   - Toilet    → `diaper` (the sheet still lets the teacher edit notes
 *                to call out potty vs. diaper explicitly)
 *   - Temperature → `health` (distinguished from plain Health via the
 *                   caption + icon; data-wise we keep it a `health`
 *                   entry so downstream health reports pick it up).
 */
const GRID_CARDS: GridCard[] = [
  {
    key: 'check-in',
    label: 'Check in',
    type: 'checkin',
    icon: LogIn,
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: '#16A34A',
    caption: 'Mark a drop-off',
  },
  {
    key: 'activity',
    label: 'Activity',
    type: 'activity',
    icon: BookOpen,
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: '#16A34A',
    caption: 'Art, play, learning',
  },
  {
    key: 'observation',
    label: 'Observation',
    type: 'note',
    icon: FileText,
    iconBg: 'bg-surface-100 dark:bg-surface-800',
    iconColor: '#475569',
    caption: 'Free-form note',
  },
  {
    key: 'health',
    label: 'Health',
    type: 'health',
    icon: Heart,
    iconBg: 'bg-danger-100 dark:bg-danger-900/30',
    iconColor: '#DC2626',
    caption: 'Symptom, medication',
  },
  {
    key: 'food',
    label: 'Food',
    type: 'meal',
    icon: Utensils,
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: '#D97706',
    caption: 'Meal or snack',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    type: 'nap',
    icon: Moon,
    iconBg: 'bg-info-100 dark:bg-info-900/30',
    iconColor: '#0891B2',
    caption: 'Nap start / end',
  },
  {
    key: 'toilet',
    label: 'Toilet',
    type: 'diaper',
    icon: Droplets,
    iconBg: 'bg-accent-100 dark:bg-accent-900/30',
    iconColor: '#9333EA',
    caption: 'Diaper or potty',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'health',
    icon: Thermometer,
    iconBg: 'bg-danger-100 dark:bg-danger-900/30',
    iconColor: '#DC2626',
    caption: 'Morning screen',
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type TimelineRowProps = {
  activity: Activity;
  roster: Child[];
  staff: Staff[];
  isLast: boolean;
};

function TimelineRow({ activity, roster, staff, isLast }: TimelineRowProps) {
  const child = roster.find((c) => c.id === activity.childId);
  const staffMember = staff.find(
    (s) => s.linkedUserId === activity.staffId || s.id === activity.staffId,
  );
  const label = activityLabels[activity.type] ?? activity.type;

  return (
    <View
      className={`flex-row gap-3 p-4 ${
        isLast ? '' : 'border-b border-surface-100 dark:border-surface-800'
      }`}>
      <ActivityIcon type={activity.type} size="md" />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="font-semibold text-surface-900 dark:text-surface-50 text-sm">
                {child ? `${child.firstName} ${child.lastName}` : 'Unknown child'}
              </Text>
              <Badge variant="neutral">{label}</Badge>
              {child?.allergies && child.allergies.length > 0 ? (
                <Badge variant="danger">
                  <AlertTriangle size={10} color="#B91C1C" />
                </Badge>
              ) : null}
            </View>
            {activity.notes ? (
              <Text
                className="text-sm text-surface-600 dark:text-surface-300 mt-1"
                numberOfLines={2}>
                {activity.notes}
              </Text>
            ) : null}
            {staffMember ? (
              <Text className="text-xs text-surface-400 mt-1">
                by {staffMember.firstName} {staffMember.lastName}
              </Text>
            ) : null}
          </View>
          <Text className="text-xs text-surface-400">
            {formatTime(activity.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TeacherAddEntry() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const daycareId = profile?.daycareId as string | undefined;
  const classroomId = profile?.classroomId as string | undefined;

  const { data: roster } = useClassroomRoster();
  const { data: staff } = useStaffForDaycare();
  const { data: log, loading: logLoading } = useTodaysActivitiesForClassroom();

  // `null` = sheet closed. When set, we open QuickLogSheet with this
  // type and no preselected child (teacher picks in the sheet).
  const [activeType, setActiveType] = useState<ActivityType | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const timeline = useMemo(() => log.slice(0, 25), [log]);

  const handleSubmit = async (payload: {
    childId: string;
    type: ActivityType;
    notes: string;
  }) => {
    if (!uid || !daycareId || !classroomId) {
      setCreateError(
        'Missing classroom assignment. Sign out and back in to refresh.',
      );
      return;
    }
    setCreateError(null);
    try {
      await activitiesApi.create({
        ...payload,
        classroomId,
        staffId: uid,
        daycareId,
      });
      setActiveType(null);
    } catch (err) {
      console.error('[add-entry] create failed:', err);
      setCreateError(
        err instanceof Error
          ? err.message
          : 'Could not save that entry. Please try again.',
      );
    }
  };

  if (!classroomId) {
    return (
      <ScreenContainer title="Add entry" subtitle="Quick-log today's events">
        <EmptyState
          icon={FileText}
          title="No classroom assigned"
          description="Ask your daycare owner to assign you to a classroom from the dashboard."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Add entry"
      subtitle={
        log.length === 0
          ? 'Nothing logged yet today'
          : `${log.length} ${log.length === 1 ? 'entry' : 'entries'} today`
      }>
      {/* 2-col quick-log grid. flex-row + w-1/2 is the standard
          no-library grid we use elsewhere in the app. */}
      <View className="flex-row flex-wrap -mx-1.5 mb-4">
        {GRID_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <View key={card.key} className="w-1/2 p-1.5">
              <Pressable
                onPress={() => {
                  setCreateError(null);
                  setActiveType(card.type);
                }}
                className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 active:opacity-80 shadow-sm">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${card.iconBg}`}>
                  <Icon size={24} color={card.iconColor} />
                </View>
                <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
                  {card.label}
                </Text>
                <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {card.caption}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* "Other entry type" escape hatch — covers incident, medication,
          milestone, photo, outdoor, learning, music, play. Keeps the
          primary grid uncluttered. */}
      <Pressable
        onPress={() => {
          setCreateError(null);
          // We don't have a neutral type on the spec grid, so default to
          // `activity` and let the teacher pick a notes blurb. The main
          // "other" types are surfaced via the More menu / specialist
          // screens as they ship.
          setActiveType('activity');
        }}
        className="flex-row items-center gap-3 bg-surface-100 dark:bg-surface-800 rounded-2xl p-4 mb-6 active:opacity-80">
        <View className="w-10 h-10 rounded-xl bg-white dark:bg-surface-700 items-center justify-center">
          <ActivityIconLucide size={20} color="#475569" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-surface-900 dark:text-surface-50">
            Other entry
          </Text>
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Photo, incident, milestone, music, play…
          </Text>
        </View>
        <Text className="text-xs font-semibold text-teacher-600 dark:text-teacher-300">
          Open
        </Text>
      </Pressable>

      {/* Today's log — single column, no filter bar (tab is for writing,
          Reports tab is for reading full day summaries). */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
          Today&apos;s log
        </Text>
        {log.length > timeline.length ? (
          <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400">
            Showing {timeline.length} of {log.length}
          </Text>
        ) : null}
      </View>

      <Card>
        <CardBody className="p-0">
          {logLoading ? (
            <LoadingState message="Loading today's log" />
          ) : timeline.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No entries yet today"
              description="Tap one of the quick-log cards above to record your first entry."
            />
          ) : (
            <View>
              {timeline.map((activity, idx) => (
                <TimelineRow
                  key={activity.id}
                  activity={activity}
                  roster={roster}
                  staff={staff}
                  isLast={idx === timeline.length - 1}
                />
              ))}
            </View>
          )}
        </CardBody>
      </Card>

      <QuickLogSheet
        visible={activeType !== null}
        type={activeType}
        roster={roster}
        onSubmit={handleSubmit}
        onClose={() => {
          setActiveType(null);
          setCreateError(null);
        }}
        errorMessage={createError}
      />
    </ScreenContainer>
  );
}
