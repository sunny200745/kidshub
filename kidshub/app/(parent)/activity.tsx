/**
 * /activity — today's activity timeline for the current child.
 *
 * Three main blocks:
 *   1. Child header (colored avatar + name + classroom)
 *   2. NapStatusCard — only when a nap is currently in progress (uses
 *      expo-linear-gradient for the brand "in-progress" feel; RN has no
 *      native CSS gradient)
 *   3. Filter chip row — horizontal scroll of pills (All / Meals / Naps /
 *      Activities / Diaper). Sticky-selected pill fills with brand color.
 *   4. ActivityCard list — one card per filtered entry.
 *
 * Filter implementation detail: snacks fall under the "Meals" filter since
 * a snack is effectively a small meal for a parent's purposes.
 *
 * Data: live via `useMyChildren` (primary child) +
 * `useTodaysActivitiesForChildren` (today's activity log) +
 * `useClassroom` (classroom name + accent color).
 */
import { LinearGradient } from 'expo-linear-gradient';
import {
  Baby,
  Camera,
  FileText,
  HelpCircle,
  Moon,
  Palette,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ActivityIcon } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import { Badge, Card, CardBody, EmptyState, LoadingState, Pill } from '@/components/ui';
import type { Activity } from '@/firebase/types';
import {
  useClassroom,
  useMyChildren,
  useTodaysActivitiesForChildren,
} from '@/hooks';

type FilterId = 'all' | 'meal' | 'nap' | 'activity' | 'diaper';

type FilterOption = {
  id: FilterId;
  label: string;
  icon: LucideIcon | null;
};

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', icon: null },
  { id: 'meal', label: 'Meals', icon: Utensils },
  { id: 'nap', label: 'Naps', icon: Moon },
  { id: 'activity', label: 'Activities', icon: Palette },
  { id: 'diaper', label: 'Diaper', icon: Baby },
];

const ACTIVITY_TITLE: Partial<Record<Activity['type'], string>> = {
  meal: 'Meal',
  snack: 'Snack',
  nap: 'Nap',
  diaper: 'Diaper change',
  potty: 'Potty',
  activity: 'Activity',
  outdoor: 'Outdoor play',
  learning: 'Learning',
  mood: 'Mood update',
  incident: 'Incident',
  medication: 'Medication',
  milestone: 'Milestone',
  photo: 'Photo',
  note: 'Note',
  checkin: 'Checked in',
  checkout: 'Checked out',
  health: 'Health',
  music: 'Music',
  play: 'Play',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ActivityCard({ activity }: { activity: Activity }) {
  const details = activity.details as
    | { amount?: string; hasPhoto?: boolean }
    | undefined;
  return (
    <Card>
      <CardBody className="p-4">
        <View className="flex-row gap-4">
          <ActivityIcon type={activity.type} size="lg" />
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 min-w-0">
                <Text className="font-medium text-surface-900 dark:text-surface-50">
                  {ACTIVITY_TITLE[activity.type] ?? 'Activity'}
                </Text>
                {activity.notes ? (
                  <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                    {activity.notes}
                  </Text>
                ) : null}
              </View>
              <View className="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">
                <Text className="text-xs text-surface-400 dark:text-surface-300">
                  {formatTime(activity.timestamp)}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center gap-2 mt-3">
              {details?.hasPhoto ? (
                <Badge variant="info">
                  <Camera size={12} color="#0E7490" />
                  <Text className="text-xs font-medium text-info-700 dark:text-info-300">
                    Photo
                  </Text>
                </Badge>
              ) : null}
              {details?.amount ? (
                <Badge variant="neutral">Ate: {details.amount}</Badge>
              ) : null}
            </View>
          </View>
        </View>
      </CardBody>
    </Card>
  );
}

function NapStatusCard({ activities, childId }: { activities: Activity[]; childId: string }) {
  const napActivity = activities.find(
    (a) =>
      a.childId === childId &&
      a.type === 'nap' &&
      (a.details as { status?: string } | undefined)?.status === 'Sleeping',
  );
  const startTimeIso =
    (napActivity?.details as { startTime?: string } | undefined)?.startTime ??
    napActivity?.timestamp;
  if (!napActivity || !startTimeIso) return null;

  const startTime = new Date(startTimeIso);
  const now = new Date();
  const duration = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
  const startLabel = formatTime(startTimeIso);

  return (
    <LinearGradient
      colors={['#3B82F6', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: 16 }}>
      <View className="p-5">
        <View className="flex-row items-center gap-4">
          <View
            style={{ width: 64, height: 64, borderRadius: 16 }}
            className="bg-white/20 items-center justify-center">
            <Moon size={32} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-white/80 text-sm">Currently Napping</Text>
            <Text className="text-3xl font-bold text-white">{duration} minutes</Text>
            <Text className="text-white/60 text-sm mt-0.5">Started at {startLabel}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function ParentActivity() {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const { data: children, loading: childrenLoading } = useMyChildren();
  const child = children[0] ?? null;
  const childIds = useMemo(() => (child ? [child.id] : []), [child]);
  const { data: activities, loading: activitiesLoading } =
    useTodaysActivitiesForChildren(childIds);
  const { data: classroom } = useClassroom(
    child?.classroomId ?? child?.classroom ?? null,
  );

  const filteredActivities = useMemo<Activity[]>(() => {
    if (!child) return [];
    const mine = activities.filter((a) => a.childId === child.id);
    if (activeFilter === 'all') return mine;
    return mine.filter((a) => {
      if (a.type === activeFilter) return true;
      if (activeFilter === 'meal' && a.type === 'snack') return true;
      return false;
    });
  }, [activities, activeFilter, child]);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (childrenLoading) {
    return (
      <ScreenContainer title="Activity Feed" subtitle={dateLabel}>
        <LoadingState message="Loading your child's day" />
      </ScreenContainer>
    );
  }

  if (!child) {
    return (
      <ScreenContainer title="Activity Feed" subtitle={dateLabel}>
        <EmptyState
          icon={HelpCircle}
          title="No child linked yet"
          description="Once your daycare links your child to your account, today's activities will show up here."
        />
      </ScreenContainer>
    );
  }

  const accentColor = classroom?.color ?? child.classroomColor ?? '#FF2D8A';

  return (
    <ScreenContainer title="Activity Feed" subtitle={dateLabel}>
      {/* Child header */}
      <View className="flex-row items-center gap-3 mb-6">
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: accentColor,
          }}
          className="items-center justify-center">
          <Text className="text-white font-bold">{child.firstName[0]}</Text>
        </View>
        <View>
          <Text className="font-semibold text-surface-900 dark:text-surface-50">
            {child.firstName}&apos;s Day
          </Text>
          <Text className="text-sm text-surface-500 dark:text-surface-400">
            {classroom?.name ?? child.classroom ?? 'Classroom'}
          </Text>
        </View>
      </View>

      {/* Nap status — only rendered when there's a live nap */}
      <View className="mb-6">
        <NapStatusCard activities={activities} childId={child.id} />
      </View>

      {/* Filter chips — horizontal scroll (important on narrow phones).
          Pill handles the solid/soft tone + icon alignment; we just pick
          the variant based on which one is selected. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8, gap: 8 }}
        className="mb-6">
        {FILTER_OPTIONS.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <Pill
              key={filter.id}
              tone="pink"
              variant={active ? 'solid' : 'outline'}
              size="md"
              icon={filter.icon ?? undefined}
              label={filter.label}
              onPress={() => setActiveFilter(filter.id)}
            />
          );
        })}
      </ScrollView>

      {/* Timeline */}
      {activitiesLoading ? (
        <LoadingState message="Loading today's activities" />
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FileText}
              title={
                activeFilter === 'all'
                  ? 'No activities logged today yet'
                  : `No ${activeFilter} entries today`
              }
              description="Updates will appear here as teachers log them throughout the day."
            />
          </CardBody>
        </Card>
      ) : (
        <View className="gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
