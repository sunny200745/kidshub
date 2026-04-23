/**
 * /teacher-profile — teacher's own profile + settings + sign-out.
 *
 * Live wiring (live-data-14):
 *   - Classroom name, color, and age range come from `useClassroom`
 *     using the teacher's `profile.classroomId`.
 *   - Roster size comes from `useClassroomRoster`.
 *   - Co-teachers are derived from `useStaffForDaycare` filtered to
 *     the same classroom and excluding the signed-in teacher (matched
 *     by `linkedUserId === uid` first, then by email).
 *   - Settings rows + sign-out flow are unchanged from the mock-data
 *     version.
 */
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Avatar, Card, CardBody } from '@/components/ui';
import { useAuth } from '@/contexts';
import { useClassroom, useClassroomRoster, useStaffForDaycare } from '@/hooks';

type RowProps = {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
};

function SettingsRow({
  icon: Icon,
  iconColor,
  label,
  detail,
  onPress,
  trailing,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${iconColor}1F` }}>
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-surface-900 dark:text-surface-50 font-medium">
          {label}
        </Text>
        {detail ? (
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing ?? <ChevronRight size={18} color="#9CA3AF" />}
    </Pressable>
  );
}

export default function TeacherProfile() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const uid = profile?.uid;
  const email = (profile?.email as string | undefined) ?? '';
  const classroomId = profile?.classroomId as string | undefined;

  const { data: classroom } = useClassroom(classroomId);
  const { data: roster } = useClassroomRoster();
  const { data: allStaff } = useStaffForDaycare();

  // Resolve "me" within the staff roster so we know my role + can
  // exclude myself from the co-teachers list. Match by linkedUserId
  // (the canonical link), falling back to email for legacy records.
  const me = useMemo(
    () =>
      allStaff.find((s) => s.linkedUserId === uid) ??
      allStaff.find((s) => s.email && email && s.email.toLowerCase() === email.toLowerCase()),
    [allStaff, uid, email],
  );
  const coTeachers = useMemo(
    () =>
      allStaff.filter(
        (s) =>
          (s.classroomId ?? s.classroom) === classroomId &&
          s.id !== me?.id &&
          s.linkedUserId !== uid,
      ),
    [allStaff, classroomId, me?.id, uid],
  );

  const firstName =
    me?.firstName ||
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '') ||
    'Teacher';
  const lastName =
    me?.lastName ||
    (profile?.lastName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ').slice(1).join(' ')
      : '') ||
    '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Teacher';

  const roleLabel = (() => {
    switch (me?.role) {
      case 'lead-teacher':
        return 'Lead teacher';
      case 'assistant-teacher':
        return 'Assistant teacher';
      case 'floater':
        return 'Floater';
      default:
        return 'Teacher';
    }
  })();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  };

  const classroomColor = classroom?.color ?? '#14B8A6';
  const classroomName = classroom?.name ?? 'No classroom assigned';
  const classroomDetail = classroom?.ageRange
    ? `${roster.length} enrolled · ${classroom.ageRange}`
    : `${roster.length} enrolled`;

  return (
    <ScreenContainer title="Profile" subtitle="Your teacher account">
      {/* Hero */}
      <Card className="mb-4">
        <CardBody className="p-5 items-center">
          <Avatar name={fullName} size="xl" />
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-3">
            {fullName}
          </Text>
          {email ? (
            <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {email}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2 mt-3">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: classroomColor }}
            />
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {classroomName} · {roleLabel}
            </Text>
          </View>
        </CardBody>
      </Card>

      {/* Classroom info */}
      <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2 mt-2">
        My classroom
      </Text>
      <Card className="mb-4">
        <CardBody className="p-0">
          <SettingsRow
            icon={Users}
            iconColor={classroomColor}
            label="Children"
            detail={classroomDetail}
          />
          <View className="h-px bg-surface-100 dark:bg-surface-800 mx-4" />
          <SettingsRow
            icon={Users}
            iconColor="#8B5CF6"
            label="Co-teachers"
            detail={
              coTeachers.length
                ? coTeachers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
                : 'No co-teachers'
            }
          />
          <View className="h-px bg-surface-100 dark:bg-surface-800 mx-4" />
          <SettingsRow
            icon={FileText}
            iconColor="#0891B2"
            label="Classroom documents"
            detail="Coming soon"
          />
        </CardBody>
      </Card>

      {/* Settings */}
      <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2 mt-2">
        Settings
      </Text>
      <Card className="mb-4">
        <CardBody className="p-0">
          <SettingsRow
            icon={Bell}
            iconColor="#D97706"
            label="Notifications"
            detail="Coming soon"
          />
          <View className="h-px bg-surface-100 dark:bg-surface-800 mx-4" />
          <SettingsRow
            icon={Shield}
            iconColor="#16A34A"
            label="Privacy"
            detail="Coming soon"
          />
          <View className="h-px bg-surface-100 dark:bg-surface-800 mx-4" />
          <SettingsRow
            icon={HelpCircle}
            iconColor="#0891B2"
            label="Help & support"
            detail="FAQs, contact us"
          />
        </CardBody>
      </Card>

      {/* Sign out */}
      <Card>
        <CardBody className="p-0">
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            className="flex-row items-center gap-3 px-4 py-3">
            <View className="w-9 h-9 rounded-xl items-center justify-center bg-danger-50 dark:bg-danger-500/15">
              <LogOut size={18} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-danger-700 dark:text-danger-300 font-semibold">
                Sign out
              </Text>
            </View>
            {signingOut ? <ActivityIndicator color="#DC2626" /> : null}
          </Pressable>
        </CardBody>
      </Card>

      <View className="h-6" />
    </ScreenContainer>
  );
}
