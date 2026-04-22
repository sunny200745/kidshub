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
  ClipboardList,
  LayoutGrid,
  MessageSquare,
  UserCheck,
  UserCog,
} from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RouteSplash } from '@/components/route-splash';
import { ROLES } from '@/constants/roles';
import { getRoleTheme, useRequireRole } from '@/hooks';

const TEACHER_THEME = getRoleTheme(ROLES.TEACHER);

export default function TeacherLayout() {
  const { status } = useRequireRole({ allowedRoles: [ROLES.TEACHER] });

  if (status !== 'allowed') return <RouteSplash />;

  // Teacher view uses teal for active tab tint (vs brand pink on parent side)
  // — same hook all other teacher screens pull their accent from.
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TEACHER_THEME.accentHex,
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, letterSpacing: 0.2 },
      }}>
      <Tabs.Screen
        name="classroom"
        options={{
          title: 'Roster',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <UserCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
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
          title: 'Staff',
          tabBarIcon: ({ color, size }) => <UserCog size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
