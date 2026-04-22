/**
 * /activity — today's activity timeline for the current child.
 *
 * Ported from kidshub-legacy/src/pages/Activity.jsx. Three main blocks:
 *   1. Child header (colored avatar + name + classroom)
 *   2. NapStatusCard — only when a nap is currently in progress (uses
 *      expo-linear-gradient for the brand "in-progress" feel; RN has no
 *      native CSS gradient)
 *   3. Filter chip row — horizontal scroll of pills (All / Meals / Naps /
 *      Activities / Diaper). Sticky-selected pill fills with brand color.
 *   4. ActivityCard list — one card per filtered entry.
 *
 * Filter implementation detail: the legacy grouped "snack" into the "meal"
 * filter since a snack is effectively a small meal for a parent's purposes.
 * That special case is preserved here.
 */
import { LinearGradient } from 'expo-linear-gradient';
import {
  Baby,
  Camera,
  Moon,
  Palette,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActivityIcon } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import { Badge, Card, CardBody } from '@/components/ui';
import { myChildren, todaysActivities, type Activity } from '@/data/mockData';

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card>
      <CardBody className="p-4">
        <View className="flex-row gap-4">
          <ActivityIcon type={activity.type} size="lg" />
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 min-w-0">
                <Text className="font-medium text-surface-900 dark:text-surface-50">
                  {activity.title}
                </Text>
                <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                  {activity.description}
                </Text>
              </View>
              <View className="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">
                <Text className="text-xs text-surface-400 dark:text-surface-300">
                  {formatTime(activity.time)}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center gap-2 mt-3">
              <Text className="text-xs text-surface-400 dark:text-surface-500">
                by {activity.staffName}
              </Text>
              {activity.hasPhoto ? (
                <Badge variant="info">
                  <Camera size={12} color="#0E7490" />
                  <Text className="text-xs font-medium text-info-700 dark:text-info-300">
                    Photo
                  </Text>
                </Badge>
              ) : null}
              {activity.details?.amount ? (
                <Badge variant="neutral">Ate: {activity.details.amount}</Badge>
              ) : null}
            </View>
          </View>
        </View>
      </CardBody>
    </Card>
  );
}

function NapStatusCard() {
  const napActivity = todaysActivities.find(
    (a) => a.type === 'nap' && a.details?.status === 'Sleeping'
  );
  if (!napActivity || !napActivity.details?.startTime) return null;

  const startTime = new Date(napActivity.details.startTime);
  const now = new Date();
  const duration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  const startLabel = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    // LinearGradient fills the role of `bg-gradient-to-r from-info-500 to-info-600`
    // that existed in legacy web. rounded-2xl matches Card's visual weight.
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
  const child = myChildren[0];

  const filteredActivities = useMemo<Activity[]>(() => {
    if (activeFilter === 'all') return todaysActivities;
    return todaysActivities.filter((a) => {
      if (a.type === activeFilter) return true;
      // Special case: snacks show up under the "Meals" filter.
      if (activeFilter === 'meal' && a.type === 'snack') return true;
      return false;
    });
  }, [activeFilter]);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScreenContainer title="Activity Feed" subtitle={dateLabel}>
      {/* Child header */}
      <View className="flex-row items-center gap-3 mb-6">
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
            {child.firstName}&apos;s Day
          </Text>
          <Text className="text-sm text-surface-500 dark:text-surface-400">
            {child.classroom}
          </Text>
        </View>
      </View>

      {/* Nap status — only rendered when there's a live nap */}
      <View className="mb-6">
        <NapStatusCard />
      </View>

      {/* Filter chips — horizontal scroll (important on narrow phones) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8, gap: 8 }}
        className="mb-6">
        {FILTER_OPTIONS.map((filter) => {
          const Icon = filter.icon;
          const active = activeFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              className={`flex-row items-center gap-2 px-4 py-2 rounded-xl ${
                active
                  ? 'bg-brand-500'
                  : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700'
              }`}>
              {Icon ? (
                <Icon size={16} color={active ? '#FFFFFF' : '#475569'} />
              ) : null}
              <Text
                className={`text-sm font-medium ${
                  active ? 'text-white' : 'text-surface-600 dark:text-surface-300'
                }`}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      <View className="gap-4">
        {filteredActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </View>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardBody className="py-12 items-center">
            <Text className="text-surface-400 dark:text-surface-500">
              No activities found
            </Text>
          </CardBody>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
