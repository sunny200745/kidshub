/**
 * (teacher) group layout — guarded Tabs for teacher-role users only.
 *
 * Sprint 1 (B2) of PRODUCT_PLAN restructured the teacher nav into a
 * Lillio-inspired 5-tab layout with a prominent center "Add entry" CTA.
 *
 * Tab → route mapping (labels change; underlying routes stay stable so
 * existing deep-links keep working):
 *
 *   "Home"       → /classroom       (today's roster + quick actions; Sprint 2 (B3) merges check-in here)
 *   "Messages"   → /messages        (parent conversations; Sprint 2 (B6) refines)
 *   "Add entry"  → /activities      (CENTER tab, elevated teal circle; Sprint 2 (B4) replaces modal with quick-log grid)
 *   "Reports"    → /reports         (NEW; Pro-gated — Starter sees UpgradeCTA)
 *   "More"       → /more            (NEW; overflow menu — links to attendance, profile, locked previews)
 *
 * Hidden-but-routable:
 *   /check-in          — reached via More → Attendance
 *   /teacher-profile   — reached via More → Profile & settings
 *
 * Why we didn't rename classroom→home / activities→add-entry: `(parent)`
 * already owns the `/home` route (expo-router groups don't consume URL
 * segments), and renaming would break every existing link in the codebase.
 * Relabeling the tab display is the cheapest move that gets the Lillio
 * layout without a migration.
 *
 * Same role guard pattern as (parent): useRequireRole bounces anon users
 * to /login and wrong-role users to /unauthorized. The layout waits for
 * the guard to resolve (RouteSplash) before mounting the tab bar so
 * wrong-role users don't see a one-frame flash of the teacher UI.
 */
import { Tabs } from 'expo-router';
import {
  Home as HomeIcon,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RouteSplash } from '@/components/route-splash';
import { ROLES } from '@/constants/roles';
import { getRoleTheme, useRequireRole } from '@/hooks';

const TEACHER_THEME = getRoleTheme(ROLES.TEACHER);

/**
 * Custom tab icon for the center "Add entry" CTA. Elevated teal circle
 * with a white plus — borrowed directly from the Lillio reference. Keeps
 * the target hit area large (56px) without blowing up the tab bar.
 *
 * On press (active), the circle gets a white ring. On rest it sits
 * slightly above the tab bar, so the eye is drawn to it.
 */
function AddEntryTabIcon({ focused }: { focused: boolean; color: string; size: number }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: TEACHER_THEME.accentHex,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -18,
        shadowColor: TEACHER_THEME.accentHex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: focused ? 0.45 : 0.28,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: focused ? 3 : 0,
        borderColor: '#ffffff',
      }}>
      <Plus size={28} color="#ffffff" strokeWidth={3} />
    </View>
  );
}

export default function TeacherLayout() {
  const { status } = useRequireRole({ allowedRoles: [ROLES.TEACHER] });

  if (status !== 'allowed') return <RouteSplash />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TEACHER_THEME.accentHex,
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, letterSpacing: 0.2 },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8 },
      }}>
      {/* Visible tabs — left to right. Order matters: center slot = Add entry. */}
      <Tabs.Screen
        name="classroom"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
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
        name="activities"
        options={{
          title: '',
          tabBarIcon: AddEntryTabIcon,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />

      {/* Hidden-but-routable screens. href: null is expo-router's idiom
          for "keep the route, drop the tab slot". */}
      <Tabs.Screen name="check-in" options={{ href: null }} />
      <Tabs.Screen name="teacher-profile" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="weekly-planner" options={{ href: null }} />
      <Tabs.Screen name="health-log" options={{ href: null }} />
      <Tabs.Screen name="screenings" options={{ href: null }} />
      <Tabs.Screen name="curriculum" options={{ href: null }} />
      <Tabs.Screen name="aria" options={{ href: null }} />
    </Tabs>
  );
}
