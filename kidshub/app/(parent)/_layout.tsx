/**
 * (parent) group layout — guarded Tabs for parent-role users only.
 *
 * Guard: useRequireRole bounces anon users to /login and wrong-role users
 * (teachers, owners, missing role) to /unauthorized. Defense-in-depth —
 * Firestore security rules (p3-15) will reject their queries too, but
 * UX-wise it's much better to bounce early than to show a page full of
 * "permission denied" errors.
 *
 * Tabs: starting with just Home; p3-10 adds Schedule / Activity / Messages /
 * Photos / Profile as we port those pages from kidshub-legacy.
 */
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ROLES } from '@/constants/roles';
import { useTheme } from '@/contexts';
import { useRequireRole } from '@/hooks';

export default function ParentLayout() {
  useRequireRole({ allowedRoles: [ROLES.PARENT] });

  const { effective } = useTheme();

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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* p3-10 adds: schedule, activity, messages, photos, profile */}
    </Tabs>
  );
}
