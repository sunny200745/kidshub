/**
 * /home — parent landing tab.
 *
 * Ported from kidshub-legacy/src/pages/Home.jsx. Renders (top → bottom):
 *   1. Greeting — mobile-friendly "Good morning, Ava's doing great today"
 *   2. High-priority announcement banner (if any)
 *   3. ChildStatusCard — avatar, classroom, check-in state + quick stats
 *   4. Recent activity preview (4 most-recent timeline items, links to /activity)
 *   5. Quick actions — 2x2 grid linking to Messages / Activity / Photos / Schedule
 *
 * Legacy used `<Link to>` from react-router-dom; on RN we use expo-router's
 * `<Link href>` which works with Pressable children on both mobile and web.
 *
 * Data source: mock data for now (data/mockData.ts). Swapped for Firestore
 * live reads in p3-15 once security rules are in place.
 */
import { Link } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  Moon,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ActivityIcon } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import { Avatar, Card, CardBody } from '@/components/ui';
import {
  announcements,
  myChildren,
  todaysActivities,
  type Activity,
  type Child,
} from '@/data/mockData';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ChildStatusCard({ child }: { child: Child }) {
  const isCheckedIn = child.status === 'checked-in';
  const checkInTime = formatTime(child.checkInTime);

  return (
    <Card className="overflow-hidden">
      {/* Accent stripe in the classroom's assigned color */}
      <View style={{ height: 8, backgroundColor: child.classroomColor }} />
      <CardBody className="p-4">
        <View className="flex-row items-start gap-4">
          <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" />
          <View className="flex-1">
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {child.firstName} {child.lastName}
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              {child.classroom}
            </Text>

            <View className="flex-row flex-wrap items-center gap-4 mt-3">
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`w-2 h-2 rounded-full ${
                    isCheckedIn ? 'bg-success-500' : 'bg-surface-300'
                  }`}
                />
                <Text className="text-sm text-surface-600 dark:text-surface-300">
                  {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                </Text>
              </View>
              {isCheckedIn ? (
                <View className="flex-row items-center gap-1.5">
                  <Clock size={14} color="#64748B" />
                  <Text className="text-sm text-surface-500 dark:text-surface-400">
                    {checkInTime}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Quick stats: 3-up grid of meals / nap / photos counts */}
        <View className="flex-row gap-3 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <QuickStat icon={Utensils} label="Meals" value="2" color="warning" />
          <QuickStat icon={Moon} label="Nap" value="Sleeping" color="info" />
          <QuickStat icon={Camera} label="Photos" value="3" color="brand" />
        </View>
      </CardBody>
    </Card>
  );
}

type StatColor = 'warning' | 'info' | 'brand' | 'success';

const STAT_STYLES: Record<StatColor, { bg: string; icon: string }> = {
  warning: { bg: 'bg-warning-100 dark:bg-warning-900/30', icon: '#D97706' },
  info: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
  brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
  success: { bg: 'bg-success-100 dark:bg-success-900/30', icon: '#16A34A' },
};

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: StatColor;
}) {
  const style = STAT_STYLES[color];
  return (
    <View className="flex-1 items-center">
      <View
        style={{ width: 48, height: 48, borderRadius: 12 }}
        className={`items-center justify-center mb-2 ${style.bg}`}>
        <Icon size={22} color={style.icon} />
      </View>
      <Text className="text-xs text-surface-500 dark:text-surface-400">{label}</Text>
      <Text className="text-sm font-medium text-surface-900 dark:text-surface-50">
        {value}
      </Text>
    </View>
  );
}

function ActivityPreview() {
  const recent: Activity[] = todaysActivities.slice(0, 4);

  return (
    <Card>
      <CardBody>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-semibold text-surface-900 dark:text-surface-50">
            Recent Activity
          </Text>
          <Link href="/activity" asChild>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-sm text-brand-600 font-medium">View All</Text>
              <ChevronRight size={16} color="#F0106B" />
            </Pressable>
          </Link>
        </View>

        <View className="gap-3">
          {recent.map((activity) => (
            <View key={activity.id} className="flex-row items-start gap-3">
              <ActivityIcon type={activity.type} size="sm" />
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {activity.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs text-surface-500 dark:text-surface-400">
                  {activity.description}
                </Text>
              </View>
              <Text className="text-xs text-surface-400 dark:text-surface-500">
                {formatTime(activity.time)}
              </Text>
            </View>
          ))}
        </View>
      </CardBody>
    </Card>
  );
}

function AnnouncementBanner() {
  const highPriority = announcements.find((a) => a.priority === 'high');
  if (!highPriority) return null;

  return (
    <View className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-2xl p-4">
      <View className="flex-row items-start gap-3">
        <View
          style={{ width: 40, height: 40, borderRadius: 12 }}
          className="bg-warning-100 dark:bg-warning-900/40 items-center justify-center">
          <Bell size={20} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-warning-800 dark:text-warning-200">
            {highPriority.title}
          </Text>
          <Text className="text-xs text-warning-700 dark:text-warning-300 mt-0.5">
            {highPriority.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

type QuickAction = {
  href: '/messages' | '/activity' | '/photos' | '/schedule';
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'info' | 'accent';
};

const QUICK_ACTION_TONES: Record<QuickAction['tone'], { bg: string; icon: string }> = {
  brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
  success: { bg: 'bg-success-100 dark:bg-success-900/30', icon: '#16A34A' },
  info: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
  accent: { bg: 'bg-accent-100 dark:bg-accent-900/30', icon: '#7C3AED' },
};

const QUICK_ACTIONS: QuickAction[] = [
  { href: '/messages', label: 'Message', hint: 'Chat with teacher', icon: MessageSquare, tone: 'brand' },
  { href: '/activity', label: 'Daily Report', hint: 'View full details', icon: FileText, tone: 'success' },
  { href: '/photos', label: 'Photos', hint: 'View gallery', icon: Camera, tone: 'info' },
  { href: '/schedule', label: 'Schedule', hint: 'Daily routine', icon: Clock, tone: 'accent' },
];

function QuickActions() {
  return (
    <View>
      <Text className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap -m-1.5">
        {QUICK_ACTIONS.map((action) => {
          const tone = QUICK_ACTION_TONES[action.tone];
          const Icon = action.icon;
          return (
            <View key={action.href} className="w-1/2 p-1.5">
              <Link href={action.href} asChild>
                <Pressable>
                  <Card className="p-4">
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{ width: 40, height: 40, borderRadius: 12 }}
                        className={`${tone.bg} items-center justify-center`}>
                        <Icon size={20} color={tone.icon} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {action.label}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-xs text-surface-500 dark:text-surface-400">
                          {action.hint}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ParentHome() {
  const child = myChildren[0];
  const greeting = getGreeting();

  return (
    <ScreenContainer title="Home" subtitle={`Here's how ${child.firstName} is doing today`}>
      <View className="gap-4">
        <View>
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-50">
            {greeting}!
          </Text>
          <Text className="text-sm text-surface-500 dark:text-surface-400">
            Here&apos;s how {child.firstName} is doing today
          </Text>
        </View>

        <AnnouncementBanner />
        <ChildStatusCard child={child} />
        <ActivityPreview />
        <QuickActions />
      </View>
    </ScreenContainer>
  );
}
