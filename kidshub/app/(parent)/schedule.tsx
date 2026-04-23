/**
 * /schedule — daily classroom routine timeline.
 *
 * Renders a vertical timeline (dot + connecting line + time/activity
 * label) with three states:
 *   - completed: green check, muted text
 *   - current:   pink ring, highlighted row, "Now" badge
 *   - upcoming:  gray circle, regular text
 *
 * Status note (live-data-7): the schedule itself is still a hardcoded
 * sample template. The user explicitly chose to ship the parent app
 * with the placeholder template + a "Coming soon" badge while the
 * dashboard's schedule editor lands later. The classroom name + accent
 * color, however, ARE pulled live from Firestore so a parent in the
 * Sunshine Room sees "Sunshine Room" rather than the static label.
 */
import { CalendarRange, Clock, HelpCircle, Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Card, CardBody, EmptyState, LoadingState, Pill } from '@/components/ui';
import {
  useClassroom,
  useClassroomWeeklyPlan,
  useFeature,
  useMyChildren,
} from '@/hooks';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Status = 'completed' | 'current' | 'upcoming';

type ScheduleItemModel = {
  time: string;
  /** Hour (0-23) used to derive completed/current/upcoming relative to "now". */
  hour: number;
  minute: number;
  activity: string;
};

/**
 * Sample template schedule. Times are typical for a 2–3 yr classroom.
 * Status is computed dynamically from the current time on each render so
 * the "Now" pill always reflects the actual day, even though the items
 * themselves are static.
 */
const TEMPLATE: ScheduleItemModel[] = [
  { time: '7:00 AM', hour: 7, minute: 0, activity: 'Arrival & Free Play' },
  { time: '8:30 AM', hour: 8, minute: 30, activity: 'Breakfast' },
  { time: '9:00 AM', hour: 9, minute: 0, activity: 'Morning Circle Time' },
  { time: '9:30 AM', hour: 9, minute: 30, activity: 'Learning Centers' },
  { time: '10:30 AM', hour: 10, minute: 30, activity: 'Snack Time' },
  { time: '11:00 AM', hour: 11, minute: 0, activity: 'Outdoor Play' },
  { time: '11:45 AM', hour: 11, minute: 45, activity: 'Lunch' },
  { time: '12:30 PM', hour: 12, minute: 30, activity: 'Nap Time' },
  { time: '2:30 PM', hour: 14, minute: 30, activity: 'Wake Up & Snack' },
  { time: '3:00 PM', hour: 15, minute: 0, activity: 'Afternoon Activities' },
  { time: '4:00 PM', hour: 16, minute: 0, activity: 'Outdoor Play' },
  { time: '5:00 PM', hour: 17, minute: 0, activity: 'Free Play & Pickup' },
];

function deriveStatuses(items: ScheduleItemModel[]): { item: ScheduleItemModel; status: Status }[] {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Find the latest item whose start time has passed.
  let currentIdx = -1;
  for (let i = 0; i < items.length; i++) {
    const itemMinutes = items[i].hour * 60 + items[i].minute;
    if (itemMinutes <= nowMinutes) currentIdx = i;
  }
  return items.map((item, i) => {
    let status: Status = 'upcoming';
    if (i < currentIdx) status = 'completed';
    else if (i === currentIdx) status = 'current';
    return { item, status };
  });
}

const DOT_CLASS: Record<Status, string> = {
  completed: 'bg-success-500',
  current: 'bg-brand-500 border-4 border-brand-100 dark:border-brand-900/50',
  upcoming: 'bg-surface-300 dark:bg-surface-600',
};

const LINE_CLASS: Record<Status, string> = {
  completed: 'bg-success-200 dark:bg-success-900/50',
  current: 'bg-surface-200 dark:bg-surface-700',
  upcoming: 'bg-surface-200 dark:bg-surface-700',
};

const TEXT_CLASS: Record<Status, string> = {
  completed: 'text-surface-400 dark:text-surface-500',
  current: 'text-brand-600 dark:text-brand-300 font-medium',
  upcoming: 'text-surface-600 dark:text-surface-300',
};

function ScheduleRow({ item, status, isLast }: { item: ScheduleItemModel; status: Status; isLast: boolean }) {
  const isCurrent = status === 'current';
  return (
    <View className="flex-row gap-4">
      <View className="items-center">
        {isCurrent ? (
          <View
            style={{ width: 20, height: 20, borderRadius: 10 }}
            className={DOT_CLASS.current}
          />
        ) : (
          <View
            style={{ width: 12, height: 12, borderRadius: 6 }}
            className={DOT_CLASS[status]}
          />
        )}
        {!isLast ? (
          <View style={{ width: 2, flex: 1, minHeight: 28 }} className={LINE_CLASS[status]} />
        ) : null}
      </View>

      <View className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
        <View
          className={`flex-row items-center justify-between ${
            isCurrent ? 'bg-brand-50 dark:bg-brand-900/20 -mx-3 px-3 py-2 rounded-xl' : ''
          }`}>
          <View className="flex-1">
            <Text className={`text-sm ${TEXT_CLASS[status]}`}>{item.activity}</Text>
            <Text className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
              {item.time}
            </Text>
          </View>
          {isCurrent ? <Pill tone="pink" variant="solid" size="sm" label="Now" /> : null}
        </View>
      </View>
    </View>
  );
}

export default function ParentSchedule() {
  const { data: children, loading: childrenLoading } = useMyChildren();
  const child = children[0] ?? null;
  const classroomId = child?.classroomId ?? child?.classroom ?? null;
  const { data: classroom } = useClassroom(classroomId);
  const plannerFeature = useFeature('weeklyPlanner');
  const { data: weeklyPlan } = useClassroomWeeklyPlan(classroomId);
  const now = new Date();
  // Monday-first dayOfWeek: 0..6 with 0=Monday
  const todayDow = (now.getDay() + 6) % 7;
  const todaysPlanItems = (weeklyPlan?.items ?? []).filter((i) => i.dayOfWeek === todayDow);

  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const items = deriveStatuses(TEMPLATE);

  if (childrenLoading) {
    return (
      <ScreenContainer title="Daily Schedule" subtitle={dateLabel}>
        <LoadingState message="Loading schedule" />
      </ScreenContainer>
    );
  }

  if (!child) {
    return (
      <ScreenContainer title="Daily Schedule" subtitle={dateLabel}>
        <EmptyState
          icon={HelpCircle}
          title="No child linked yet"
          description="The classroom's daily routine will appear here once your child is linked."
        />
      </ScreenContainer>
    );
  }

  const accentColor = classroom?.color ?? child.classroomColor ?? '#FF2D8A';

  return (
    <ScreenContainer title="Daily Schedule" subtitle={dateLabel}>
      {/* Classroom header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
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
              {classroom?.name ?? child.classroom ?? 'Classroom'}
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Daily Routine
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Clock size={16} color="#64748B" />
          <Text className="text-sm text-surface-500 dark:text-surface-400">{timeLabel}</Text>
        </View>
      </View>

      {/* Today's weekly plan (Pro) — teacher-authored items show above the
          hourly template so parents see what's actually planned today. */}
      {plannerFeature.enabled && todaysPlanItems.length > 0 ? (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Sparkles size={16} color="#8b5cf6" />
            <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {DAY_NAMES[todayDow]}&apos;s plan
            </Text>
          </View>
          <Card>
            <CardBody className="p-4">
              <View className="gap-2.5">
                {todaysPlanItems.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-start gap-3 pl-1">
                    <View
                      style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7 }}
                      className="bg-brand-500"
                    />
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {item.title}
                      </Text>
                      {item.description ? (
                        <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {item.timeSlot ? (
                      <Pill tone="info" variant="soft" size="sm" label={item.timeSlot} />
                    ) : null}
                  </View>
                ))}
              </View>
            </CardBody>
          </Card>
        </View>
      ) : null}

      {/* Template routine notice. For Starter tenants this is all they get;
          for Pro tenants without a plan this week we still fall back. */}
      <View className="mb-3 flex-row items-center gap-2">
        <Pill
          tone="info"
          variant="soft"
          size="sm"
          icon={CalendarRange}
          label={plannerFeature.enabled ? 'Typical day' : 'Sample'}
        />
        <Text className="text-xs text-surface-500 dark:text-surface-400 flex-1">
          {plannerFeature.enabled
            ? "Below: the classroom's typical day-of flow."
            : "A sample routine — ask your daycare if they're on Pro to see today's planned activities."}
        </Text>
      </View>

      {/* Timeline card */}
      <Card>
        <CardBody className="p-5">
          {items.map(({ item, status }, index) => (
            <ScheduleRow
              key={`${item.time}-${item.activity}`}
              item={item}
              status={status}
              isLast={index === items.length - 1}
            />
          ))}
        </CardBody>
      </Card>

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-6 mt-6">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-success-500" />
          <Text className="text-xs text-surface-500 dark:text-surface-400">Completed</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-brand-500" />
          <Text className="text-xs text-surface-500 dark:text-surface-400">Current</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-surface-300 dark:bg-surface-600" />
          <Text className="text-xs text-surface-500 dark:text-surface-400">Upcoming</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
