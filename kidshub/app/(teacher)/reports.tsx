/**
 * /reports — teacher reports tab.
 *
 * Feature-gated behind `dailyReports` (Pro).
 *
 *   - Pro+ / demoMode: renders today's classroom report — attendance
 *     headline, activity tallies by type, per-child mini summaries.
 *     Pulls live from `useClassroomRoster` + `useTodaysActivitiesForClassroom`.
 *   - Starter: renders a locked preview card — the same layout rendered
 *     once with the underlying data dimmed and an `<UpgradeCTA>` pinned
 *     above it. Showing the exact shape of what they'd unlock is what
 *     creates upgrade desire (Lillio's own Reports tab does the same
 *     thing — preview + CTA).
 *
 * Sprint 5 (D2) will extend this with a per-child drill-down + a daily
 * email digest. For Sprint 4 we just ship the at-a-glance classroom view.
 */
import { LinearGradient } from 'expo-linear-gradient';
import {
  Baby,
  Camera,
  FileText,
  Moon,
  Palette,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import {
  Avatar,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
} from '@/components/ui';
import { UpgradeCTA } from '@/components/upgrade-cta';
import { useAuth } from '@/contexts';
import type { Activity, ActivityType, Child } from '@/firebase/types';
import {
  useClassroom,
  useClassroomRoster,
  useFeature,
  useTodaysActivitiesForClassroom,
} from '@/hooks';

const ACTIVITY_BUCKETS: {
  key: 'meals' | 'naps' | 'activities' | 'diapers' | 'photos';
  label: string;
  icon: LucideIcon;
  color: string;
  types: ActivityType[];
}[] = [
  { key: 'meals', label: 'Meals', icon: Utensils, color: '#D97706', types: ['meal', 'snack'] },
  { key: 'naps', label: 'Naps', icon: Moon, color: '#2563EB', types: ['nap'] },
  {
    key: 'activities',
    label: 'Activities',
    icon: Palette,
    color: '#7C3AED',
    types: ['activity', 'learning', 'outdoor', 'play', 'music'],
  },
  { key: 'diapers', label: 'Diapers', icon: Baby, color: '#16A34A', types: ['diaper', 'potty'] },
  { key: 'photos', label: 'Photos', icon: Camera, color: '#0891B2', types: ['photo'] },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function tallyActivities(activities: Activity[]) {
  const counts: Record<string, number> = {};
  for (const bucket of ACTIVITY_BUCKETS) counts[bucket.key] = 0;
  for (const activity of activities) {
    for (const bucket of ACTIVITY_BUCKETS) {
      if (bucket.types.includes(activity.type)) {
        counts[bucket.key] += 1;
        break;
      }
    }
  }
  return counts;
}

type ChildSummary = {
  child: Child;
  meals: number;
  napMinutes: number;
  lastActivity: Activity | null;
};

function summarizeChildren(roster: Child[], activities: Activity[]): ChildSummary[] {
  const byChild = new Map<string, Activity[]>();
  for (const a of activities) {
    const list = byChild.get(a.childId) ?? [];
    list.push(a);
    byChild.set(a.childId, list);
  }

  return roster.map((child) => {
    const mine = (byChild.get(child.id) ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    );
    const meals = mine.filter((a) => a.type === 'meal' || a.type === 'snack').length;
    const nap = mine.find((a) => a.type === 'nap');
    const napMinutes = (nap?.details as { durationMinutes?: number } | undefined)
      ?.durationMinutes ?? 0;
    const lastActivity = mine.length > 0 ? mine[mine.length - 1] : null;

    return { child, meals, napMinutes, lastActivity };
  });
}

function AttendanceHeadline({
  roster,
  classroomName,
  classroomColor,
}: {
  roster: Child[];
  classroomName: string;
  classroomColor: string;
}) {
  const checkedIn = roster.filter((c) => c.status === 'checked-in').length;
  const absent = roster.filter((c) => c.status === 'absent' || !c.status).length;
  const checkedOut = roster.filter((c) => c.status === 'checked-out').length;
  const pct = roster.length > 0 ? Math.round((checkedIn / roster.length) * 100) : 0;
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LinearGradient
      colors={['#0F766E', '#14B8A6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20 }}>
      <View className="p-5">
        <Text className="text-white/70 text-xs uppercase tracking-wider font-semibold">
          Today · {dateLabel}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: classroomColor }} />
          <Text className="text-white/90 font-semibold">{classroomName}</Text>
        </View>

        <View className="flex-row items-end gap-3 mt-4">
          <Text className="text-4xl font-extrabold text-white leading-none">
            {checkedIn}
          </Text>
          <Text className="text-white/80 pb-1">of {roster.length} here today</Text>
        </View>

        <View className="h-1.5 rounded-full bg-white/20 mt-3 overflow-hidden">
          <View
            className="h-full bg-white"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </View>

        <View className="flex-row gap-2 mt-4">
          <View className="flex-1 bg-white/10 rounded-xl px-3 py-2">
            <Text className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">
              Checked out
            </Text>
            <Text className="text-white font-bold text-base">{checkedOut}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl px-3 py-2">
            <Text className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">
              Absent
            </Text>
            <Text className="text-white font-bold text-base">{absent}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl px-3 py-2">
            <Text className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">
              Attendance
            </Text>
            <Text className="text-white font-bold text-base">{pct}%</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function ActivityTally({ activities }: { activities: Activity[] }) {
  const counts = useMemo(() => tallyActivities(activities), [activities]);
  return (
    <Card>
      <CardBody>
        <Text className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3">
          What happened today
        </Text>
        <View className="flex-row flex-wrap -m-1.5">
          {ACTIVITY_BUCKETS.map((bucket) => {
            const Icon = bucket.icon;
            const value = counts[bucket.key] ?? 0;
            return (
              <View key={bucket.key} className="w-1/3 p-1.5">
                <View className="rounded-2xl bg-surface-50 dark:bg-surface-800 p-3 items-start">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: `${bucket.color}1A`,
                    }}
                    className="items-center justify-center mb-2">
                    <Icon size={18} color={bucket.color} />
                  </View>
                  <Text className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 leading-none">
                    {value}
                  </Text>
                  <Text className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    {bucket.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </CardBody>
    </Card>
  );
}

function ChildRoll({ summaries }: { summaries: ChildSummary[] }) {
  if (summaries.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={FileText}
            title="No children on the roster yet"
            description="Once your classroom has children assigned, each child's day appears here."
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Every child, at a glance
          </Text>
        </View>
        {summaries.map((s, idx) => {
          const statusTone =
            s.child.status === 'checked-in'
              ? 'success'
              : s.child.status === 'checked-out'
                ? 'info'
                : 'neutral';
          const statusLabel =
            s.child.status === 'checked-in'
              ? 'In'
              : s.child.status === 'checked-out'
                ? 'Out'
                : 'Absent';
          return (
            <View
              key={s.child.id}
              className={`flex-row items-center gap-3 px-4 py-3 ${idx < summaries.length - 1 ? 'border-b border-surface-100 dark:border-surface-700' : ''}`}>
              <Avatar
                name={`${s.child.firstName} ${s.child.lastName}`}
                size="md"
              />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-sm font-semibold text-surface-900 dark:text-surface-50"
                    numberOfLines={1}>
                    {s.child.firstName} {s.child.lastName}
                  </Text>
                  <Pill tone={statusTone} variant="soft" size="sm" label={statusLabel} />
                </View>
                <Text
                  className="text-xs text-surface-500 dark:text-surface-400 mt-0.5"
                  numberOfLines={1}>
                  {s.meals} meal{s.meals === 1 ? '' : 's'}
                  {s.napMinutes > 0 ? ` · ${s.napMinutes} min nap` : ''}
                  {s.lastActivity
                    ? ` · last at ${formatTime(s.lastActivity.timestamp)}`
                    : ' · no activity yet'}
                </Text>
              </View>
            </View>
          );
        })}
      </CardBody>
    </Card>
  );
}

function ReportBody() {
  const { profile } = useAuth();
  const classroomId = (profile?.classroomId as string | undefined) ?? null;
  const { data: roster, loading: rosterLoading } = useClassroomRoster();
  const { data: activities, loading: activitiesLoading } =
    useTodaysActivitiesForClassroom();
  const { data: classroom } = useClassroom(classroomId);

  const summaries = useMemo(
    () => summarizeChildren(roster, activities),
    [roster, activities],
  );

  if (rosterLoading || activitiesLoading) {
    return <LoadingState message="Building today's report" />;
  }

  const classroomName = classroom?.name ?? 'Classroom';
  const classroomColor = classroom?.color ?? '#14B8A6';

  return (
    <View className="gap-4">
      <AttendanceHeadline
        roster={roster}
        classroomName={classroomName}
        classroomColor={classroomColor}
      />
      <ActivityTally activities={activities} />
      <ChildRoll summaries={summaries} />
    </View>
  );
}

/**
 * Locked preview — same skeleton as the real report, but dimmed and with
 * static placeholder data. The point is to show the *shape* of what the
 * teacher/owner is paying for, not to tease with real numbers.
 */
function ReportPreview() {
  const mockRoster: Child[] = [
    { id: '1', firstName: 'Emma', lastName: 'R.', status: 'checked-in', daycareId: '' } as Child,
    { id: '2', firstName: 'Noah', lastName: 'M.', status: 'checked-in', daycareId: '' } as Child,
    { id: '3', firstName: 'Ava', lastName: 'T.', status: 'checked-out', daycareId: '' } as Child,
    { id: '4', firstName: 'Leo', lastName: 'K.', status: 'absent', daycareId: '' } as Child,
  ];
  const mockSummaries: ChildSummary[] = mockRoster.map((c, i) => ({
    child: c,
    meals: 2 - (i % 2),
    napMinutes: (i + 1) * 45,
    lastActivity: null,
  }));

  return (
    <View className="gap-4" pointerEvents="none" style={{ opacity: 0.55 }}>
      <AttendanceHeadline
        roster={mockRoster}
        classroomName="Your classroom"
        classroomColor="#14B8A6"
      />
      <Card>
        <CardBody>
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
            What happened today
          </Text>
          <View className="flex-row flex-wrap -m-1.5">
            {ACTIVITY_BUCKETS.map((bucket) => {
              const Icon = bucket.icon;
              return (
                <View key={bucket.key} className="w-1/3 p-1.5">
                  <View className="rounded-2xl bg-surface-50 p-3 items-start">
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${bucket.color}1A`,
                      }}
                      className="items-center justify-center mb-2">
                      <Icon size={18} color={bucket.color} />
                    </View>
                    <Text className="text-2xl font-extrabold text-surface-900 leading-none">
                      —
                    </Text>
                    <Text className="text-xs text-surface-500 mt-1">{bucket.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </CardBody>
      </Card>
      <ChildRoll summaries={mockSummaries} />
    </View>
  );
}

export default function TeacherReports() {
  const state = useFeature('dailyReports');

  return (
    <ScreenContainer
      title="Reports"
      subtitle="Daily summaries, attendance, and health at a glance."
      contentContainerStyle={{ paddingBottom: 48 }}>
      {state.loading ? (
        <LoadingState message="Checking your plan" />
      ) : state.enabled ? (
        <ReportBody />
      ) : (
        <View className="gap-4">
          <View className="flex-row items-center gap-2 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 px-4 py-3">
            <Sparkles size={16} color="#E11D74" />
            <Text className="text-xs text-brand-700 dark:text-brand-300 flex-1">
              Here&apos;s a live preview of the Pro Reports dashboard — unlock it to see real data.
            </Text>
          </View>

          <UpgradeCTA
            feature="dailyReports"
            upgradeTo={state.upgradeTo}
            variant="card"
          />

          <ReportPreview />
        </View>
      )}
    </ScreenContainer>
  );
}
