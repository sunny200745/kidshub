/**
 * /teacher-profile — teacher's own profile + settings + sign-out.
 *
 * Parallel to `(parent)/profile.tsx` but scoped to teacher data:
 *   - Hero card shows the teacher (not a child) + their classroom
 *   - No allergy/medical section (that's parent-facing)
 *   - "My classroom" section instead of "Child information"
 *   - Same settings rows (notifications, privacy, help)
 *   - Same sign-out flow via AuthContext.logout()
 *
 * Route name uses `teacher-profile` instead of `profile` because Expo
 * Router's group resolution doesn't fully prevent accidental collisions
 * when two files from different groups map to the same segment; giving
 * this one a distinct name keeps the URL space unambiguous. Tab label is
 * still "Profile".
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
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Avatar, Card, CardBody } from '@/components/ui';
import { useAuth } from '@/contexts';
import { classrooms, classroomRoster, staff } from '@/data/mockData';

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

  const firstName =
    (profile?.firstName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ')[0]
      : '') ||
    'Teacher';
  const lastName =
    (profile?.lastName as string | undefined) ||
    (typeof profile?.displayName === 'string'
      ? profile.displayName.split(' ').slice(1).join(' ')
      : '') ||
    '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Teacher';
  const email = (profile?.email as string | undefined) ?? '';

  const classroom = classrooms[0];
  const leadTeacher = staff.find((s) => s.role === 'lead-teacher');
  const coTeachers = staff.filter(
    (s) => s.id !== (leadTeacher?.id ?? '') && s.classroom === classroom.id
  );

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
              style={{ backgroundColor: classroom.color }}
            />
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {classroom.name} · {leadTeacher?.id === 'staff-1' ? 'Lead teacher' : 'Teacher'}
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
            iconColor="#14B8A6"
            label="Children"
            detail={`${classroomRoster.length} enrolled · ${classroom.ageRange}`}
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
            detail="Lesson plans, schedules, notes"
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
            detail="New messages, parent updates"
          />
          <View className="h-px bg-surface-100 dark:bg-surface-800 mx-4" />
          <SettingsRow
            icon={Shield}
            iconColor="#16A34A"
            label="Privacy"
            detail="Who can see your profile"
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
