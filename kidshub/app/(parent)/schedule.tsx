/**
 * /schedule — daily classroom routine timeline.
 *
 * Ported from kidshub-legacy/src/pages/Schedule.jsx. Renders a vertical
 * timeline (dot + connecting line + time/activity label) with three states:
 *   - completed: green check, muted text
 *   - current:   pink ring, highlighted row, "Now" badge
 *   - upcoming:  gray circle, regular text
 *
 * Legacy used flexbox with Tailwind's arbitrary shape classes. RN can't lean
 * on pseudo-elements, so the connector line is a plain 2px View between
 * timeline dots. The trailing item skips the line entirely.
 *
 * Data: mockData.ts → dailySchedule (12 items, 7am–5pm). Real classroom
 * schedules come from Firestore in p3-15.
 */
import { Clock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Badge, Card, CardBody } from '@/components/ui';
import { dailySchedule, myChildren, type ScheduleItem as ScheduleItemModel } from '@/data/mockData';

type Status = ScheduleItemModel['status'];

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

function ScheduleItem({ item, isLast }: { item: ScheduleItemModel; isLast: boolean }) {
  const isCurrent = item.status === 'current';

  return (
    <View className="flex-row gap-4">
      {/* Left rail — dot + connecting line */}
      <View className="items-center">
        {isCurrent ? (
          // Current state uses a slightly bigger dot with a ringed halo.
          <View
            style={{ width: 20, height: 20, borderRadius: 10 }}
            className={DOT_CLASS.current}
          />
        ) : (
          <View
            style={{ width: 12, height: 12, borderRadius: 6 }}
            className={DOT_CLASS[item.status]}
          />
        )}
        {!isLast ? (
          <View style={{ width: 2, flex: 1, minHeight: 28 }} className={LINE_CLASS[item.status]} />
        ) : null}
      </View>

      {/* Row content */}
      <View className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
        <View
          className={`flex-row items-center justify-between ${
            isCurrent ? 'bg-brand-50 dark:bg-brand-900/20 -mx-3 px-3 py-2 rounded-xl' : ''
          }`}>
          <View className="flex-1">
            <Text className={`text-sm ${TEXT_CLASS[item.status]}`}>{item.activity}</Text>
            <Text className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
              {item.time}
            </Text>
          </View>
          {isCurrent ? <Badge variant="brand">Now</Badge> : null}
        </View>
      </View>
    </View>
  );
}

export default function ParentSchedule() {
  const child = myChildren[0];
  const now = new Date();

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

  return (
    <ScreenContainer title="Daily Schedule" subtitle={dateLabel}>
      {/* Classroom header: colored avatar + name, current time on the right */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: child.classroomColor,
            }}
            className="items-center justify-center">
            <Text className="text-white font-bold">{child.firstName[0]}</Text>
          </View>
          <View>
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              {child.classroom}
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

      {/* Timeline card */}
      <Card>
        <CardBody className="p-5">
          {dailySchedule.map((item, index) => (
            <ScheduleItem
              key={`${item.time}-${item.activity}`}
              item={item}
              isLast={index === dailySchedule.length - 1}
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
