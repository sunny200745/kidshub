/**
 * /classroom — teacher's landing tab.
 *
 * Port of `kidshub-dashboard/src/pages/Children.jsx` scoped to a single
 * classroom (the teacher's own). Shows today's attendance summary + a 2-col
 * grid of child cards. Tapping a card is deferred until ChildProfile ships;
 * for now it's visual only (cards swallow the press with a console.log
 * replaced by a no-op to avoid accidental navigation attempts to routes
 * that don't exist).
 *
 * Design decisions:
 *   - Dropped the grid/list view toggle from the dashboard. On a phone-first
 *     layout a 2-col grid is the only mode that reads well; the list mode
 *     was a desktop-table artifact.
 *   - Dropped the "Add Child" button — that's an owner action, not a
 *     teacher one.
 *   - Dropped the search + status + classroom filters. A teacher's
 *     classroom has ~15 kids max; filtering is over-engineered for this
 *     scope. Swap back in if the classroom grows past that.
 */
import { Link } from 'expo-router';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import { classroomRoster, classrooms, staff } from '@/data/mockData';
import { useAuth } from '@/contexts';

function formatCheckInTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type RosterChild = (typeof classroomRoster)[number];

function ChildCard({ child }: { child: RosterChild }) {
  const classroom = classrooms.find((c) => c.id === child.classroom);
  const isCheckedIn = child.status === 'checked-in';

  return (
    <Pressable
      onPress={() => {
        // ChildProfile detail route lands with p3-15 (Firestore-wired).
      }}
      className="flex-1">
      <Card className="h-full">
        <CardBody className="p-4 items-center">
          <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" className="mb-3" />
          <Text className="font-semibold text-surface-900 dark:text-surface-50 text-sm text-center">
            {child.firstName} {child.lastName}
          </Text>
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {child.age}
          </Text>

          <View className="flex-row items-center gap-1.5 mt-2">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: classroom?.color }}
            />
            <Text className="text-xs text-surface-500 dark:text-surface-400">
              {classroom?.name}
            </Text>
          </View>

          <View className="mt-3">
            <Badge variant={isCheckedIn ? 'success' : 'neutral'}>
              {isCheckedIn ? 'Checked in' : 'Absent'}
            </Badge>
          </View>

          {isCheckedIn && child.checkInTime ? (
            <View className="mt-2 flex-row items-center gap-1">
              <Clock size={12} color="#9CA3AF" />
              <Text className="text-xs text-surface-400">
                Since {formatCheckInTime(child.checkInTime)}
              </Text>
            </View>
          ) : null}

          {child.allergies && child.allergies.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-1.5 justify-center">
              {child.allergies.slice(0, 2).map((allergy) => (
                <Badge key={allergy} variant="danger">
                  <View className="flex-row items-center gap-1">
                    <AlertTriangle size={10} color="#B91C1C" />
                    <Text className="text-xs text-danger-700 font-semibold">{allergy}</Text>
                  </View>
                </Badge>
              ))}
              {child.allergies.length > 2 ? (
                <Badge variant="danger">+{child.allergies.length - 2}</Badge>
              ) : null}
            </View>
          ) : null}
        </CardBody>
      </Card>
    </Pressable>
  );
}

export default function TeacherClassroom() {
  const { profile } = useAuth();

  // The logged-in teacher's first name, falling back to a friendly default.
  const firstName =
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '') ||
    'Teacher';

  const leadTeacher = staff.find((s) => s.role === 'lead-teacher');
  const classroom = classrooms[0];

  const checkedInCount = classroomRoster.filter((c) => c.status === 'checked-in').length;
  const absentCount = classroomRoster.length - checkedInCount;

  return (
    <ScreenContainer
      title={`Good morning, ${firstName}`}
      subtitle={`${classroom.name} · ${classroomRoster.length} children enrolled`}>
      {/* Stats */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        <View className="flex-row items-center gap-2 px-4 py-2 bg-success-50 dark:bg-success-500/15 rounded-xl">
          <CheckCircle size={16} color="#047857" />
          <Text className="text-sm font-medium text-success-700 dark:text-success-300">
            {checkedInCount} Checked In
          </Text>
        </View>
        <View className="flex-row items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-xl">
          <XCircle size={16} color="#6B7280" />
          <Text className="text-sm font-medium text-surface-600 dark:text-surface-300">
            {absentCount} Absent
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <Card className="mb-4">
        <CardBody className="p-4">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">
            Quick actions
          </Text>
          <View className="flex-row gap-3">
            <Link href="/check-in" asChild>
              <Pressable className="flex-1 bg-brand-500 rounded-xl py-3 px-4 items-center">
                <Text className="text-white font-semibold text-sm">Check in / out</Text>
              </Pressable>
            </Link>
            <Link href="/activities" asChild>
              <Pressable className="flex-1 bg-surface-900 dark:bg-surface-700 rounded-xl py-3 px-4 items-center">
                <Text className="text-white font-semibold text-sm">Log activity</Text>
              </Pressable>
            </Link>
          </View>
        </CardBody>
      </Card>

      {/* Lead teacher info */}
      {leadTeacher ? (
        <Card className="mb-4">
          <CardBody className="p-4 flex-row items-center gap-3">
            <Avatar
              name={`${leadTeacher.firstName} ${leadTeacher.lastName}`}
              size="md"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                {leadTeacher.firstName} {leadTeacher.lastName}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Lead teacher · {classroom.name}
              </Text>
            </View>
          </CardBody>
        </Card>
      ) : null}

      {/* Roster grid — 2 col on phone */}
      <Text className="text-lg font-bold text-surface-900 dark:text-surface-50 mt-2 mb-3">
        Today&apos;s roster
      </Text>
      <View className="flex-row flex-wrap -mx-1.5">
        {classroomRoster.map((child) => (
          <View key={child.id} className="w-1/2 px-1.5 mb-3">
            <ChildCard child={child} />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
