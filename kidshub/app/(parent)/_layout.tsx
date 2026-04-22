/**
 * (parent) group layout — guarded Tabs for parent-role users only.
 *
 * Guard: useRequireRole bounces anon users to /login and wrong-role users
 * (teachers, owners, missing role) to /unauthorized. Defense-in-depth —
 * Firestore security rules (p3-15) will reject their queries too, but
 * UX-wise it's much better to bounce early than to show a page full of
 * "permission denied" errors.
 *
 * Tabs (left-to-right on the tab bar):
 *   Home → Activity → Schedule → Messages → Photos → Profile
 *
 * Why lucide-react-native instead of IconSymbol for the tab bar:
 *   IconSymbol maps to SF Symbols on iOS and MaterialIcons on Android/web,
 *   which gave us inconsistent glyphs (e.g. "house.fill" became a Material
 *   house on Android that looked very different from the iOS one). Lucide
 *   ships a single vector family that renders identically on every platform
 *   and matches the legacy web UI exactly.
 */
import { Tabs } from 'expo-router';
import {
  Activity as ActivityIcon,
  Calendar,
  Home,
  ImageIcon,
  MessageSquare,
  User,
} from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RouteSplash } from '@/components/route-splash';
import { Colors } from '@/constants/theme';
import { ROLES } from '@/constants/roles';
import { useTheme } from '@/contexts';
import { useRequireRole } from '@/hooks';

export default function ParentLayout() {
  const { status } = useRequireRole({ allowedRoles: [ROLES.PARENT] });
  const { effective } = useTheme();

  // Hold the splash until the role check settles. A teacher tapping a stale
  // /home link would otherwise see the parent tab bar render for one frame
  // before useEffect bounces them to /unauthorized.
  if (status !== 'allowed') return <RouteSplash />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[effective].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <ActivityIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
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
        name="photos"
        options={{
          title: 'Photos',
          tabBarIcon: ({ color, size }) => <ImageIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
