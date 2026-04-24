/**
 * /home — parent landing tab.
 *
 * Sections top → bottom:
 *   1. Greeting hero  — child-aware "Ava's doing great today" with a
 *      check-in status pill.
 *   2. Announcement banner (Firestore live; only high-priority shown)
 *   3. Child status card (classroom name + today's snapshot — meals,
 *      nap, photos)
 *   4. Recent activity preview (4 most-recent, links to /activity)
 *   5. Primary CTA row — Message teacher / View full day (ActionButton)
 *   6. Quick actions grid (Photos, Schedule)
 *
 * Sprint 4 / C1 + C2: rebuilt on top of the B5 visual primitives — Pill
 * for the status chip, ActionButton for the primary CTAs, tighter grid
 * for secondary quick actions. Parent tone is pink, matching the brand.
 *
 * Data: live Firestore subscriptions via `useSelectedChild` (which wraps
 * `useMyChildren` + a per-parent persisted active-child id),
 * `useAnnouncements`, `useTodaysActivitiesForChildren` and `useClassroom`.
 * Empty states cover "no children linked" and "no activity yet" without
 * ever falling back to mock data.
 *
 * Multi-sibling: the <ChildSwitcher /> chip strip up top is rendered for
 * parents with more than one linked child (single-sibling parents see no
 * switcher and the same UX as before). Switching siblings re-keys this
 * whole screen — the hero, status card, activity preview, classroom dot,
 * and CTA labels all reflect the newly selected child without a tab change.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  Moon,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActivityIcon } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import { UnreadMessagesBanner } from '@/components/messages';
import { ChildSwitcher } from '@/components/parent';
import {
  ActionButton,
  Avatar,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
  RoleBadge,
} from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useAuth, useSelectedChild } from '@/contexts';
import type { Activity, Announcement, Child, Classroom } from '@/firebase/types';
import {
  useAnnouncements,
  useClassroom,
  useTodaysActivitiesForChildren,
} from '@/hooks';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function activityTitle(activity: Activity): string {
  const map: Record<string, string> = {
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
  return map[activity.type] ?? 'Activity';
}

function ChildStatusCard({
  child,
  classroom,
  todaysActivities,
}: {
  child: Child;
  classroom: Classroom | null;
  todaysActivities: Activity[];
}) {
  const childActivities = todaysActivities.filter((a) => a.childId === child.id);
  const meals = childActivities.filter(
    (a) => a.type === 'meal' || a.type === 'snack',
  ).length;
  const napEntry = childActivities.find((a) => a.type === 'nap');
  const napStatus = napEntry
    ? (napEntry.details as { status?: string } | undefined)?.status ?? 'Logged'
    : '—';
  const photos = childActivities.filter((a) => a.type === 'photo').length;
  const stripeColor = classroom?.color || child.classroomColor || '#FF2D8A';

  return (
    <Card className="overflow-hidden">
      <View style={{ height: 6, backgroundColor: stripeColor }} />
      <CardBody className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            {classroom?.name ?? child.classroom ?? 'Classroom'}
          </Text>
          <Text className="text-[11px] text-surface-400 uppercase tracking-wider font-semibold">
            Today&apos;s snapshot
          </Text>
        </View>
        <View className="flex-row gap-3">
          <QuickStat icon={Utensils} label="Meals" value={String(meals)} color="warning" />
          <QuickStat icon={Moon} label="Nap" value={String(napStatus)} color="info" />
          <QuickStat icon={Camera} label="Photos" value={String(photos)} color="brand" />
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
      <Text
        numberOfLines={1}
        className="text-sm font-medium text-surface-900 dark:text-surface-50">
        {value}
      </Text>
    </View>
  );
}

function ActivityPreview({
  activities,
  loading,
  childId,
}: {
  activities: Activity[];
  loading: boolean;
  childId: string;
}) {
  const recent = activities.filter((a) => a.childId === childId).slice(0, 4);

  return (
    <Card>
      <CardBody>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-semibold text-surface-900 dark:text-surface-50">
            Recent activity
          </Text>
          <Link href="/activity" asChild>
            <Pressable>
              <Pill tone="pink" variant="soft" size="sm" label="View all" />
            </Pressable>
          </Link>
        </View>

        {loading ? (
          <LoadingState compact message="Loading today's updates" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No activity logged yet today"
            description="Updates from your child's classroom will appear here as they're posted."
          />
        ) : (
          <View className="gap-3">
            {recent.map((activity) => (
              <View key={activity.id} className="flex-row items-start gap-3">
                <ActivityIcon type={activity.type} size="sm" />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {activityTitle(activity)}
                  </Text>
                  {activity.notes ? (
                    <Text
                      numberOfLines={1}
                      className="text-xs text-surface-500 dark:text-surface-400">
                      {activity.notes}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs text-surface-400 dark:text-surface-500">
                  {formatTime(activity.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </CardBody>
    </Card>
  );
}

function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const highPriority = announcements.find((a) => a.priority === 'high');
  if (!highPriority) return null;
  const body = highPriority.body || highPriority.content || '';

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
          {body ? (
            <Text className="text-xs text-warning-700 dark:text-warning-300 mt-0.5">
              {body}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// Secondary quick-actions grid (Photos + Schedule). The primary actions
// (Message + Daily report) live as ActionButtons above this grid since
// they're the highest-intent taps on the home screen.
type QuickAction = {
  href: '/photos' | '/schedule';
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: 'brand' | 'info';
};

const QUICK_ACTION_TONES: Record<QuickAction['tone'], { bg: string; icon: string }> = {
  brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', icon: '#E11D74' },
  info: { bg: 'bg-info-100 dark:bg-info-900/30', icon: '#0891B2' },
};

const QUICK_ACTIONS: QuickAction[] = [
  { href: '/photos', label: 'Photos', hint: 'View gallery', icon: Camera, tone: 'brand' },
  { href: '/schedule', label: 'Schedule', hint: 'Daily routine', icon: Clock, tone: 'info' },
];

function QuickActions() {
  return (
    <View>
      <Text className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
        More
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

function StatusPill({ child }: { child: Child }) {
  if (child.status === 'checked-in' && child.checkInTime) {
    return (
      <Pill
        tone="success"
        variant="soft"
        size="md"
        label={`Checked in · ${formatTime(child.checkInTime)}`}
      />
    );
  }
  if (child.status === 'checked-out') {
    return <Pill tone="info" variant="soft" size="md" label="Checked out for the day" />;
  }
  return <Pill tone="neutral" variant="soft" size="md" label="Not checked in yet" />;
}

export default function ParentHome() {
  const router = useRouter();
  const { profile } = useAuth();
  // Multi-sibling: pull the active child from SelectedChildContext (mounted
  // in (parent)/_layout.tsx). The ChildSwitcher rendered below lets the
  // parent flip between siblings; the rest of this screen re-keys to the
  // new child automatically. Single-sibling parents see no switcher and
  // the same UX as before.
  const {
    children,
    selectedChild: child,
    loading: childrenLoading,
  } = useSelectedChild();
  // Today's activities still load for ALL children (one query, then we
  // filter per-child below). Cheaper than re-subscribing every time the
  // parent flips siblings, and lets us show "X meals across both kids"
  // style aggregates in a future iteration.
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const { data: todaysActivities, loading: activitiesLoading } =
    useTodaysActivitiesForChildren(childIds);
  const { data: announcements } = useAnnouncements();
  const { data: classroom } = useClassroom(
    child?.classroomId ?? child?.classroom ?? null,
  );

  const greeting = getGreeting();
  const parentFirstName =
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '');

  return (
    <ScreenContainer hideHeader showRoleBadge={false}>
      <View className="gap-4 pt-2">
        {/* Sibling switcher — renders nothing for single-child parents,
            so this is a no-op for the common case. For multi-child
            parents it sits above the hero so the active child the hero
            describes is always one tap away from changing. */}
        <ChildSwitcher />
        {/* Parent hero — pink-gradient card, big avatar, personal greeting.
            Intentionally contrasts with the teacher cockpit's teal band so
            a glance tells you whose view you're in. */}
        <View className="overflow-hidden rounded-3xl">
          <LinearGradient
            colors={['#FFE0EF', '#FFF0F7', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ padding: 20 }}>
            <View className="flex-row items-center justify-between mb-4">
              <RoleBadge />
              <Text className="text-[11px] text-surface-500 font-medium">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {childrenLoading ? (
              <LoadingState message="Loading your child's day" />
            ) : child ? (
              <View className="items-center">
                <View
                  style={{
                    shadowColor: '#FF2D8A',
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}>
                  <Avatar
                    name={`${child.firstName} ${child.lastName}`}
                    size="2xl"
                    className="border-4 border-white"
                  />
                </View>
                <Text
                  className="text-surface-500 dark:text-surface-300 text-sm mt-3"
                  style={{ fontFamily: Fonts.rounded }}>
                  {greeting}
                  {parentFirstName ? `, ${parentFirstName}` : ''},
                </Text>
                <Text
                  className="text-3xl font-bold text-surface-900 dark:text-surface-50 text-center"
                  style={{ fontFamily: Fonts.rounded }}>
                  {child.firstName}&apos;s doing great
                  <Text style={{ color: '#F0106B' }}> today</Text>
                </Text>

                <View className="mt-3">
                  <StatusPill child={child} />
                </View>
              </View>
            ) : (
              <EmptyState
                icon={HelpCircle}
                title="No child linked yet"
                description="Once your daycare links your child to your account, their day will appear here."
              />
            )}
          </LinearGradient>
        </View>

        <AnnouncementBanner announcements={announcements} />
        {/* Unread-messages banner — renders nothing when count = 0, so
            it disappears the moment the parent opens /messages and the
            inbox marks inbound messages read. Sits between the hero and
            the snapshot card so it's high-prominence without burying
            the child-of-the-day greeting that anchors this screen. */}
        <UnreadMessagesBanner />
        {child ? (
          <>
            <ChildStatusCard
              child={child}
              classroom={classroom}
              todaysActivities={todaysActivities}
            />
            <ActivityPreview
              activities={todaysActivities}
              loading={activitiesLoading}
              childId={child.id}
            />

            {/* Primary CTAs. Pink tone to match the parent palette.
                Using onPress + router.push directly because ActionButton
                already owns its Pressable — wrapping in Link asChild
                would double up the handler. */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  label="Message teacher"
                  icon={MessageSquare}
                  tone="pink"
                  size="lg"
                  onPress={() => router.push('/messages')}
                />
              </View>
              <View className="flex-1">
                <ActionButton
                  label="Daily report"
                  icon={FileText}
                  tone="pink"
                  variant="ghost"
                  size="lg"
                  onPress={() => router.push('/activity')}
                />
              </View>
            </View>
          </>
        ) : null}
        <QuickActions />
      </View>
    </ScreenContainer>
  );
}
