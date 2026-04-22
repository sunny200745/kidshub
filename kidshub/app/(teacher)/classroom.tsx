/**
 * /classroom — teacher's landing tab.
 *
 * Port of `kidshub-dashboard/src/pages/Children.jsx` scoped to a single
 * classroom (the teacher's own), reshaped as an "operational cockpit":
 *   - Dark teal top band shows classroom name, live check-in count, and
 *     live attendance percentage — the kind of at-a-glance vitals a teacher
 *     coming back from the playground actually wants.
 *   - Compact pill row for the mini stats right under it.
 *   - Two primary actions (Take attendance, Log activity) pinned as large
 *     tap targets directly below the header — the two things a teacher
 *     actually does on this screen.
 *   - Dense 3-col roster grid (vs the previous 2-col parent-ish layout)
 *     with thin accent stripes per classroom color.
 *
 * Visual intent: feels closer to a hotel reception dashboard or a clinic's
 * daily intake view. Deliberately different from parent /home which leans
 * personal/warm.
 */
import { Link } from 'expo-router';
import { AlertTriangle, ClipboardList, UserCheck, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/layout';
import { Avatar, Card, CardBody } from '@/components/ui';
import { classroomRoster, classrooms } from '@/data/mockData';
import { useAuth } from '@/contexts';
import { useRoleTheme } from '@/hooks';

function formatCheckInTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type RosterChild = (typeof classroomRoster)[number];

function RosterTile({ child }: { child: RosterChild }) {
  const classroom = classrooms.find((c) => c.id === child.classroom);
  const isCheckedIn = child.status === 'checked-in';

  return (
    <Pressable onPress={() => {}} className="flex-1">
      <View className="h-full bg-white dark:bg-surface-800 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
        <View style={{ height: 3, backgroundColor: classroom?.color || '#e2e8f0' }} />
        <View className="p-3 items-center">
          <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" className="mb-2" />
          <Text
            className="font-semibold text-surface-900 dark:text-surface-50 text-xs text-center"
            numberOfLines={1}>
            {child.firstName}
          </Text>
          <Text
            className="text-[10px] text-surface-500 dark:text-surface-400 mt-0.5"
            numberOfLines={1}>
            {child.age}
          </Text>

          <View className="mt-2">
            {isCheckedIn ? (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-success-500" />
                <Text className="text-[10px] font-semibold text-success-700 dark:text-success-400">
                  In · {child.checkInTime ? formatCheckInTime(child.checkInTime) : ''}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-surface-300" />
                <Text className="text-[10px] font-semibold text-surface-500 dark:text-surface-400">
                  Absent
                </Text>
              </View>
            )}
          </View>

          {child.allergies && child.allergies.length > 0 ? (
            <View className="mt-1.5 flex-row items-center gap-0.5">
              <AlertTriangle size={10} color="#B91C1C" />
              <Text className="text-[10px] font-bold text-danger-700">
                {child.allergies.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function TeacherClassroom() {
  const { profile } = useAuth();
  const theme = useRoleTheme();

  const firstName =
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '') ||
    'Teacher';

  const classroom = classrooms[0];

  const totalCount = classroomRoster.length;
  const checkedInCount = classroomRoster.filter((c) => c.status === 'checked-in').length;
  const absentCount = totalCount - checkedInCount;
  const attendancePct = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Operational cockpit header — dark teal band with live vitals.
          Deliberately dense + data-first to contrast with the parent home
          screen, which leans warm + photo-led. */}
      <View style={{ backgroundColor: theme.accentDarkHex }} className="px-4 pt-4 pb-5">
        <View className="flex-row items-center justify-between mb-3">
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
            <Text className="text-[11px] font-semibold tracking-wide uppercase text-white">
              Teacher view
            </Text>
          </View>
          <Text className="text-white/80 text-xs font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <Text className="text-white text-2xl font-bold">{classroom.name}</Text>
        <Text className="text-white/70 text-sm mt-0.5">Good morning, {firstName}</Text>

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
            <Text className="text-white text-4xl font-bold leading-none">{attendancePct}%</Text>
            <Text className="text-white/70 text-xs mt-1 uppercase tracking-wider font-semibold">
              Attendance
            </Text>
          </View>
        </View>

        {/* Live attendance bar */}
        <View className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <View
            style={{ width: `${attendancePct}%`, backgroundColor: '#5EEAD4' }}
            className="h-full rounded-full"
          />
        </View>
      </View>

      <ScreenContainer hideHeader showRoleBadge={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Primary actions — two big, square buttons */}
        <View className="flex-row gap-3 mt-4 mb-5">
          <Link href="/check-in" asChild>
            <Pressable
              style={{ backgroundColor: theme.accentHex }}
              className="flex-1 rounded-2xl py-4 px-3 items-center active:opacity-80">
              <UserCheck size={22} color="white" />
              <Text className="text-white font-bold text-sm mt-2">Take attendance</Text>
              <Text className="text-white/80 text-[11px] mt-0.5">
                {absentCount} still absent
              </Text>
            </Pressable>
          </Link>
          <Link href="/activities" asChild>
            <Pressable className="flex-1 rounded-2xl py-4 px-3 items-center bg-surface-900 dark:bg-surface-800 active:opacity-80">
              <ClipboardList size={22} color="white" />
              <Text className="text-white font-bold text-sm mt-2">Log activity</Text>
              <Text className="text-white/60 text-[11px] mt-0.5">Meal · Nap · Note</Text>
            </Pressable>
          </Link>
        </View>

        {/* Roster section */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Users size={16} color={theme.accentDarkHex} />
            <Text className="text-base font-bold text-surface-900 dark:text-surface-50">
              Today&apos;s roster
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: theme.accentSoftHex }}>
            <Text className="text-[11px] font-bold" style={{ color: theme.accentDarkHex }}>
              {totalCount} kids
            </Text>
          </View>
        </View>

        {totalCount === 0 ? (
          <Card>
            <CardBody className="p-6 items-center">
              <Users size={32} color="#94a3b8" />
              <Text className="text-sm font-semibold text-surface-600 dark:text-surface-300 mt-2">
                No children enrolled yet
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400 text-center mt-1">
                Ask your owner to add children to this classroom.
              </Text>
            </CardBody>
          </Card>
        ) : (
          <View className="flex-row flex-wrap -mx-1">
            {classroomRoster.map((child) => (
              <View key={child.id} className="w-1/3 px-1 mb-2">
                <RosterTile child={child} />
              </View>
            ))}
          </View>
        )}

        {/* Compact legend row */}
        <View className="flex-row items-center gap-4 mt-4 px-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-success-500" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              Checked in ({checkedInCount})
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-surface-300" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              Absent ({absentCount})
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <AlertTriangle size={10} color="#B91C1C" />
            <Text className="text-[11px] text-surface-500 dark:text-surface-400">
              = has allergies
            </Text>
          </View>
        </View>

      </ScreenContainer>
    </SafeAreaView>
  );
}
