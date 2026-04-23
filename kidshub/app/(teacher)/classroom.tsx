/**
 * /classroom — teacher "Home" tab (Sprint 2 / B3).
 *
 * This is the redesigned Lillio-style home that replaced the old
 * "operational cockpit + 3-col roster" layout. It composes three
 * sections:
 *
 *   1. Header band (teal): classroom name, greeting, live attendance
 *      vitals, progress bar. Unchanged in spirit from Sprint 1, lightly
 *      tightened.
 *
 *   2. Primary quick actions row: two big <ActionButton>s that route
 *      to the attendance screen + the Add Entry grid. Kept deliberately
 *      short — the real volume of actions lives in the child rows.
 *
 *   3. Staff section: one <EntityCard> per teacher assigned to this
 *      classroom, trailing a "Clock in" pill. Pill is gated behind the
 *      `staffClockIn` feature — Starter daycares see a locked "Pro"
 *      pill (visible desire), Pro daycares see the real action.
 *
 *   4. Children section: one <EntityCard> per child with status-aware
 *      meta ("Since 9:12am" / "Checked out" / "Not in"), a trailing
 *      inline check-in/out pill, and a `⋯` button that opens
 *      ChildActionSheet. The sheet dispatches either a direct
 *      check-in/out write or a quick-log request — both pipe through
 *      THIS screen's handlers so there is exactly one write path.
 *
 * Writes:
 *   - `childrenApi.checkIn|checkOut` for attendance (same helper as
 *     /check-in.tsx — the dedicated attendance screen is kept for
 *     bulk workflows and is reachable via the "Take attendance" action).
 *   - `activitiesApi.create` for quick-log entries.
 *
 * Errors surface as inline banners inside the relevant sheet; the
 * Firestore subscription is the source of truth, so after a successful
 * write we don't touch local state — the next snapshot does it.
 */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Lock,
  LogIn,
  LogOut,
  MoreHorizontal,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ActivityIcon, activityLabels } from '@/components/icons/activity-icon';
import { ScreenContainer } from '@/components/layout';
import {
  ActionButton,
  Card,
  CardBody,
  EmptyState,
  EntityCard,
  LoadingState,
  Pill,
} from '@/components/ui';
import { ChildActionSheet, type ChildAction } from '@/components/teacher/child-action-sheet';
import { QuickLogSheet } from '@/components/teacher/quick-log-sheet';
import { useAuth } from '@/contexts';
import { activitiesApi, attendanceApi, childrenApi } from '@/firebase/api';
import type { Activity, ActivityType, Child, Staff } from '@/firebase/types';
import {
  useClassroom,
  useClassroomRoster,
  useFeature,
  useMyOpenShift,
  useRoleTheme,
  useStaffForDaycare,
  useTodaysActivitiesForClassroom,
} from '@/hooks';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ageFromDob(dob: string | undefined): string {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const ageMs = Date.now() - birth.getTime();
  const years = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years >= 2) return `${years} yrs`;
  const months = Math.max(1, Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000)));
  return `${months} mo`;
}

function childStatusMeta(child: Child): string {
  if (child.status === 'checked-in' && child.checkInTime) {
    return `Since ${formatTime(child.checkInTime)}`;
  }
  if (child.status === 'checked-in') return 'Checked in';
  if (child.status === 'checked-out' && child.checkOutTime) {
    return `Picked up at ${formatTime(child.checkOutTime)}`;
  }
  if (child.status === 'checked-out') return 'Checked out';
  return 'Not in today';
}

export default function TeacherHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const theme = useRoleTheme();
  const uid = profile?.uid;
  const daycareId = (profile?.daycareId as string | undefined) ?? undefined;
  const classroomId = (profile?.classroomId as string | undefined) ?? null;

  const { data: roster, loading: rosterLoading } = useClassroomRoster();
  const { data: classroom } = useClassroom(classroomId);
  const { data: allStaff } = useStaffForDaycare();
  const { data: todaysLog } = useTodaysActivitiesForClassroom();
  const clockInFeature = useFeature('staffClockIn');
  const { data: openShift } = useMyOpenShift();
  const [clockBusy, setClockBusy] = useState(false);

  const handleClockToggle = async (staffRow: Staff) => {
    if (!profile?.uid || !profile?.daycareId || clockBusy) return;
    // The clock-in pill only surfaces on the *current user's* staff row
    // (see render below). Still, keep a hard check — a misconfigured
    // linked staff doc could otherwise produce a rules error.
    if (staffRow.linkedUserId && staffRow.linkedUserId !== profile.uid) return;
    setClockBusy(true);
    try {
      if (openShift) {
        await attendanceApi.clockOut(openShift.id, openShift.clockInAt);
      } else {
        const displayName = [profile.firstName, profile.lastName]
          .filter(Boolean)
          .join(' ');
        await attendanceApi.clockIn({
          daycareId: profile.daycareId as string,
          userId: profile.uid as string,
          userName: displayName || undefined,
          classroomId: (profile.classroomId as string | undefined) ?? null,
          staffId: staffRow.id,
        });
      }
    } catch (err) {
      console.error('[teacher classroom] clock toggle failed:', err);
      Alert.alert(
        'Clock action failed',
        openShift
          ? 'Could not clock out. Please try again.'
          : 'Could not clock in. Please try again.',
      );
    } finally {
      setClockBusy(false);
    }
  };

  // Action sheets — one is open at a time. We keep them as two separate
  // pieces of state instead of a discriminated union because the
  // quick-log sheet needs `preselectedChild` (from the action sheet's
  // source child) AND a type; merging state would just push the
  // discriminated-union noise into every setter.
  const [actionChild, setActionChild] = useState<Child | null>(null);
  const [quickLog, setQuickLog] = useState<{
    type: ActivityType;
    child: Child | null;
  } | null>(null);
  const [quickLogError, setQuickLogError] = useState<string | null>(null);

  // ── Derived data ────────────────────────────────────────────────
  const firstName =
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '') ||
    'Teacher';
  const classroomName = classroom?.name ?? 'My classroom';
  const accentColor = classroom?.color ?? theme.accentHex;

  const totalCount = roster.length;
  const checkedInCount = roster.filter((c) => c.status === 'checked-in').length;
  const absentCount = totalCount - checkedInCount;
  const attendancePct =
    totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const classroomStaff = useMemo<Staff[]>(() => {
    if (!classroomId) return [];
    return allStaff.filter(
      (s) => s.classroomId === classroomId || s.classroom === classroomId,
    );
  }, [allStaff, classroomId]);

  // Most recent 4 activities — a quick "what's happened today" ticker
  // to anchor the home screen in live data.
  const recentActivities = useMemo<Activity[]>(
    () => todaysLog.slice(0, 4),
    [todaysLog],
  );

  // ── Handlers ────────────────────────────────────────────────────
  const handleInlineCheckInOut = async (child: Child) => {
    if (!uid) return;
    try {
      if (child.status === 'checked-in') {
        await childrenApi.checkOut(child.id, 'Guardian', '');
      } else {
        await childrenApi.checkIn(child.id, 'Guardian', '');
      }
      if (classroomId && daycareId) {
        try {
          await activitiesApi.create({
            childId: child.id,
            classroomId,
            staffId: uid,
            type: child.status === 'checked-in' ? 'checkout' : 'checkin',
            notes:
              child.status === 'checked-in'
                ? 'Picked up by guardian'
                : 'Dropped off by guardian',
            daycareId,
          });
        } catch (logErr) {
          console.warn('[home] activity log failed:', logErr);
        }
      }
    } catch (err) {
      console.error('[home] check in/out failed:', err);
      Alert.alert(
        'Could not update attendance',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  };

  const handleChildAction = (child: Child, action: ChildAction) => {
    switch (action.kind) {
      case 'checkin':
      case 'checkout':
        void handleInlineCheckInOut(child);
        return;
      case 'quick-log':
        setQuickLogError(null);
        setQuickLog({ type: action.type, child });
        return;
      case 'message':
        router.push('/messages');
        return;
      case 'profile':
        // TODO(profile-route): deep-link to a child profile screen once
        // that exists on the teacher side. For now, route to roster.
        router.push('/classroom');
        return;
    }
  };

  const handleQuickLogSubmit = async (payload: {
    childId: string;
    type: ActivityType;
    notes: string;
  }) => {
    if (!uid || !classroomId || !daycareId) {
      setQuickLogError(
        'Missing classroom assignment. Sign out and back in to refresh.',
      );
      return;
    }
    try {
      setQuickLogError(null);
      await activitiesApi.create({
        ...payload,
        classroomId,
        staffId: uid,
        daycareId,
      });
      setQuickLog(null);
    } catch (err) {
      console.error('[home] quick log failed:', err);
      setQuickLogError(
        err instanceof Error
          ? err.message
          : 'Could not save that entry. Please try again.',
      );
    }
  };

  // ── Rendering ───────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header band — dense vitals up top, role pill + date up top. */}
      <View
        style={{ backgroundColor: theme.accentDarkHex }}
        className="px-5 pt-4 pb-6 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
            <Text className="text-[11px] font-semibold tracking-wide uppercase text-white">
              Teacher
            </Text>
          </View>
          <Text className="text-white/80 text-xs font-semibold">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <Text className="text-white/80 text-sm">Good morning,</Text>
        <Text className="text-white text-2xl font-bold">{firstName}</Text>
        <Text className="text-white/70 text-sm mt-0.5">{classroomName}</Text>

        <View className="flex-row items-end justify-between mt-5">
          <View>
            <Text className="text-white text-5xl font-bold leading-none">
              {checkedInCount}
              <Text className="text-white/60 text-2xl">/{totalCount}</Text>
            </Text>
            <Text className="text-white/70 text-xs mt-1 uppercase tracking-wider font-semibold">
              Present
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-white text-4xl font-bold leading-none">
              {attendancePct}%
            </Text>
            <Text className="text-white/70 text-xs mt-1 uppercase tracking-wider font-semibold">
              Attendance
            </Text>
          </View>
        </View>

        <View className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <View
            style={{ width: `${attendancePct}%`, backgroundColor: '#5EEAD4' }}
            className="h-full rounded-full"
          />
        </View>
      </View>

      <ScreenContainer
        hideHeader
        showRoleBadge={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}>
        {/* Primary quick actions */}
        <View className="flex-row gap-3 mb-6">
          <ActionButton
            label="Take attendance"
            caption={`${absentCount} still absent`}
            icon={UserCheck}
            onPress={() => router.push('/check-in')}
            size="lg"
          />
          <ActionButton
            label="Add entry"
            caption="Meal · Nap · Note"
            icon={ClipboardList}
            variant="secondary"
            onPress={() => router.push('/activities')}
            size="lg"
          />
        </View>

        {/* Staff section */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
            Staff here today
          </Text>
          <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400">
            {classroomStaff.length} {classroomStaff.length === 1 ? 'teacher' : 'teachers'}
          </Text>
        </View>

        {classroomStaff.length === 0 ? (
          <Card className="mb-6">
            <CardBody>
              <EmptyState
                icon={Users}
                title="No staff assigned"
                description="Ask your owner to assign staff to this classroom from the dashboard."
              />
            </CardBody>
          </Card>
        ) : (
          <View className="gap-2 mb-6">
            {classroomStaff.map((s) => {
              const isMe = s.linkedUserId === uid;
              const displayRole =
                s.role === 'lead-teacher'
                  ? 'Lead teacher'
                  : s.role === 'assistant-teacher'
                    ? 'Assistant'
                    : s.role === 'floater'
                      ? 'Floater'
                      : 'Teacher';
              return (
                <EntityCard
                  key={s.id}
                  name={`${s.firstName} ${s.lastName}${isMe ? ' (you)' : ''}`}
                  meta={displayRole}
                  trailing={
                    clockInFeature.enabled ? (
                      isMe ? (
                        <Pill
                          label={
                            clockBusy
                              ? '…'
                              : openShift
                                ? `Out · ${formatTime(openShift.clockInAt)}`
                                : 'Clock in'
                          }
                          icon={openShift ? LogOut : LogIn}
                          tone={openShift ? 'success' : 'teal'}
                          variant="soft"
                          size="sm"
                          onPress={() => handleClockToggle(s)}
                        />
                      ) : null
                    ) : (
                      <Pill label="Pro" icon={Lock} tone="neutral" variant="soft" size="sm" />
                    )
                  }
                />
              );
            })}
          </View>
        )}

        {/* Children section */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
            Children
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-success-500" />
              <Text className="text-[11px] font-semibold text-surface-600 dark:text-surface-300">
                {checkedInCount} in
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-surface-300" />
              <Text className="text-[11px] font-semibold text-surface-500 dark:text-surface-400">
                {absentCount} absent
              </Text>
            </View>
          </View>
        </View>

        {!classroomId ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Users}
                title="No classroom assigned yet"
                description="Ask your daycare owner to assign you to a classroom from the dashboard."
              />
            </CardBody>
          </Card>
        ) : rosterLoading ? (
          <Card>
            <CardBody>
              <LoadingState message="Loading your roster" />
            </CardBody>
          </Card>
        ) : totalCount === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Users}
                title="No children enrolled yet"
                description="Ask your owner to add children to this classroom."
              />
            </CardBody>
          </Card>
        ) : (
          <View className="gap-2">
            {roster.map((child) => {
              const isCheckedIn = child.status === 'checked-in';
              const hasAllergies = child.allergies && child.allergies.length > 0;
              const ageLabel = child.age || ageFromDob(child.dateOfBirth);

              return (
                <EntityCard
                  key={child.id}
                  name={`${child.firstName} ${child.lastName}`}
                  meta={[ageLabel, childStatusMeta(child)].filter(Boolean).join(' · ')}
                  accentColor={accentColor}
                  nameAdornment={
                    hasAllergies ? (
                      <View className="flex-row items-center gap-0.5">
                        <AlertTriangle size={11} color="#B91C1C" />
                      </View>
                    ) : null
                  }
                  trailing={
                    <>
                      <Pill
                        label={isCheckedIn ? 'Out' : 'In'}
                        icon={isCheckedIn ? LogOut : LogIn}
                        tone={isCheckedIn ? 'neutral' : 'success'}
                        variant={isCheckedIn ? 'soft' : 'solid'}
                        size="sm"
                        onPress={() => handleInlineCheckInOut(child)}
                      />
                      <Pressable
                        onPress={() => setActionChild(child)}
                        hitSlop={10}
                        className="p-1.5 rounded-full active:bg-surface-100 dark:active:bg-surface-800">
                        <MoreHorizontal size={18} color="#64748B" />
                      </Pressable>
                    </>
                  }
                />
              );
            })}
          </View>
        )}

        {/* Recent activity ticker — keeps the screen feeling alive
            without replacing the dedicated Activities tab. */}
        {recentActivities.length > 0 ? (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3 px-1">
              <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
                Latest today
              </Text>
              <Pressable onPress={() => router.push('/activities')} hitSlop={8}>
                <Text className="text-xs font-semibold text-teacher-600 dark:text-teacher-300">
                  See all
                </Text>
              </Pressable>
            </View>
            <Card>
              <CardBody className="p-0">
                {recentActivities.map((activity, idx) => {
                  const child = roster.find((c) => c.id === activity.childId);
                  const isLast = idx === recentActivities.length - 1;
                  return (
                    <View
                      key={activity.id}
                      className={`flex-row items-center gap-3 p-3 ${
                        isLast ? '' : 'border-b border-surface-100 dark:border-surface-800'
                      }`}>
                      <ActivityIcon type={activity.type} size="sm" />
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                          {child
                            ? `${child.firstName} ${child.lastName}`
                            : 'Unknown child'}
                        </Text>
                        <Text
                          className="text-xs text-surface-500 dark:text-surface-400 mt-0.5"
                          numberOfLines={1}>
                          {activityLabels[activity.type] ?? activity.type}
                          {activity.notes ? ` · ${activity.notes}` : ''}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-surface-400">
                        {formatTime(activity.timestamp)}
                      </Text>
                    </View>
                  );
                })}
              </CardBody>
            </Card>
          </>
        ) : null}

        {/* Notifications placeholder — a small pitch for Pro. Cheap way
            to surface that engagement features exist without building
            them. Tapping opens /more. */}
        <Pressable
          onPress={() => router.push('/more')}
          className="mt-6 flex-row items-center gap-3 bg-teacher-50 dark:bg-teacher-900/30 rounded-2xl p-4">
          <View className="w-10 h-10 rounded-xl bg-teacher-100 dark:bg-teacher-900/50 items-center justify-center">
            <Bell size={20} color="#0D9488" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-teacher-700 dark:text-teacher-200">
              Parent notifications
            </Text>
            <Text className="text-xs text-teacher-600 dark:text-teacher-300 mt-0.5">
              Preview what parents will see in their feed today.
            </Text>
          </View>
          <Pill label="Pro" icon={Lock} tone="neutral" variant="soft" size="sm" />
        </Pressable>

        {/* Legend row — small but keeps ambiguity out of the status dots. */}
        <View className="flex-row items-center justify-center gap-4 mt-5">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-success-500" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              Checked in
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-surface-300" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              Absent
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <AlertTriangle size={10} color="#B91C1C" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              Allergies
            </Text>
          </View>
        </View>
      </ScreenContainer>

      {/* Sheets — mounted at the root so they float above the scroll view
          and the tab bar. */}
      <ChildActionSheet
        visible={actionChild !== null}
        child={actionChild}
        onClose={() => setActionChild(null)}
        onSelect={(action) => {
          if (actionChild) handleChildAction(actionChild, action);
        }}
      />
      <QuickLogSheet
        visible={quickLog !== null}
        type={quickLog?.type ?? null}
        preselectedChild={quickLog?.child ?? null}
        roster={roster}
        onSubmit={handleQuickLogSubmit}
        onClose={() => {
          setQuickLog(null);
          setQuickLogError(null);
        }}
        errorMessage={quickLogError}
      />
    </SafeAreaView>
  );
}
