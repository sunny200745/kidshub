/**
 * (teacher) group layout — guarded Tabs for teacher-role users only.
 *
 * Same guard pattern as (parent): useRequireRole bounces anon users to
 * /login and wrong-role users to /unauthorized.
 *
 * Tabs start with just Classroom; p3-11 adds the teacher-relevant pages
 * we're lifting out of kidshub-dashboard (classroom roster, attendance,
 * activity logging, messages, photos).
 */
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ROLES } from '@/constants/roles';
import { useTheme } from '@/contexts';
import { useRequireRole } from '@/hooks';

export default function TeacherLayout() {
  useRequireRole({ allowedRoles: [ROLES.TEACHER] });

  const { effective } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[effective].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="classroom"
        options={{
          title: 'Classroom',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* p3-11 adds: attendance, activity, messages, photos, profile */}
    </Tabs>
  );
}
