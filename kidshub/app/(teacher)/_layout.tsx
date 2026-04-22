/**
 * (teacher) group layout — guarded Tabs for teacher-role users only.
 *
 * Same guard pattern as (parent): useRequireRole bounces anon users to
 * /login and wrong-role users to /unauthorized. The layout waits for the
 * guard to resolve (RouteSplash) before mounting the tab bar so wrong-role
 * users don't see a one-frame flash of the teacher UI.
 *
 * Tabs (wired in p3-11):
 *   Classroom → /classroom           (home: today's roster + quick actions)
 *   Check in  → /check-in            (attendance workflow)
 *   Activities→ /activities          (quick log + timeline)
 *   Messages  → /messages            (parent conversations)
 *   Profile   → /teacher-profile     (account + classroom info + sign out)
 *
 * `teacher-profile.tsx` is the file name for the Profile tab. It's NOT
 * named `profile.tsx` — that name is already claimed by `(parent)/profile`
 * and although Expo Router's group resolution would technically route
 * correctly, sharing a URL segment between two role-specific screens
 * makes role-based linking brittle (e.g. `router.push('/profile')` from
 * a shared component would be ambiguous). Distinct URLs per role keeps
 * navigation explicit.
 */
import { Tabs } from 'expo-router';
import {
  Activity as ActivityIcon,
  Home,
  MessageSquare,
  User,
  UserCheck,
} from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RouteSplash } from '@/components/route-splash';
import { Colors } from '@/constants/theme';
import { ROLES } from '@/constants/roles';
import { useTheme } from '@/contexts';
import { useRequireRole } from '@/hooks';

export default function TeacherLayout() {
  const { status } = useRequireRole({ allowedRoles: [ROLES.TEACHER] });
  const { effective } = useTheme();

  if (status !== 'allowed') return <RouteSplash />;

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
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check in',
          tabBarIcon: ({ color, size }) => <UserCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => <ActivityIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="teacher-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
