/**
 * /more — teacher "More" tab.
 *
 * Overflow menu for secondary surfaces that aren't in the primary 5-tab
 * bottom bar (Home / Messages / Add entry / Reports / More). Intentionally
 * generous with locked-but-visible items — seeing "Classroom documents
 * (Pro)" creates upgrade desire in a way that hiding the row entirely
 * does not.
 *
 * Sections (Sprint 4 / B8):
 *   1. Your classroom — Attendance, Profile & settings
 *   2. Pro features    — Classroom documents, Weekly planner, Activity
 *      planner (all locked-preview on Starter)
 *   3. Settings        — Notifications, Privacy & security, Help & support
 *   4. Sign out (danger-styled card)
 *
 * The Notifications / Privacy / Help rows are intentional placeholders
 * (onPress = no-op for now). Shipping the shell before the destinations
 * are built keeps the visual surface consistent with the parent Profile
 * screen — so when a teacher taps around, it feels like a finished app
 * rather than a prototype with missing links.
 */
import { useRouter } from 'expo-router';
import {
  Bell,
  Book,
  CalendarRange,
  Camera,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  HelpCircle,
  LogOut,
  MessageCircle,
  Shield,
  Settings as SettingsIcon,
  Stethoscope,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Card, CardBody, TierBadge } from '@/components/ui';
import { useAuth } from '@/contexts';
import { useFeature } from '@/hooks';
import type { FeatureKey } from '@/constants/product';

type MoreRow = {
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  /** When set, the row displays a lock badge if the feature is gated. */
  feature?: FeatureKey;
  /** Inline pressable — useful for rows that open modals/sheets in the future. */
  onPress?: () => void;
};

type MoreSection = {
  title: string;
  rows: MoreRow[];
};

const SECTIONS: MoreSection[] = [
  {
    title: 'Your classroom',
    rows: [
      {
        icon: UserCheck,
        label: 'Attendance',
        description: 'Check children in and out',
        href: '/check-in',
      },
      {
        icon: SettingsIcon,
        label: 'Profile & settings',
        description: 'Your account, classroom info, sign out',
        href: '/teacher-profile',
      },
    ],
  },
  {
    title: 'Pro features',
    rows: [
      {
        icon: Camera,
        label: 'Photo journal',
        description: 'Share photos with tagged parents',
        feature: 'photoJournal',
        href: '/photos',
      },
      {
        icon: CalendarRange,
        label: 'Weekly planner',
        description: 'Plan the week’s activities for your classroom',
        feature: 'weeklyPlanner',
        href: '/weekly-planner',
      },
      {
        icon: Book,
        label: 'Curriculum library',
        description: 'Reusable activity templates',
        feature: 'activityPlanner',
        href: '/curriculum',
      },
      {
        icon: Stethoscope,
        label: 'Health log',
        description: 'Symptoms, medication, incidents',
        feature: 'healthReports',
        href: '/health-log',
      },
      {
        icon: ClipboardCheck,
        label: 'Morning screenings',
        description: 'Temperature + symptoms at drop-off',
        feature: 'morningScreenings',
        href: '/screenings',
      },
      {
        icon: FolderOpen,
        label: 'Classroom documents',
        description: 'Permission slips, field trip forms',
        feature: 'photoJournal',
      },
    ],
  },
  {
    title: 'Premium features',
    rows: [
      {
        icon: MessageCircle,
        label: 'Aria AI assistant',
        description: 'Draft messages and reports in seconds',
        feature: 'ariaAiInApp',
        href: '/aria',
      },
    ],
  },
];

/**
 * Settings rows that open destinations not yet built. We still render
 * them so the Settings card mirrors the parent app's Profile screen.
 * Shipping the shell (even with no-op presses) is preferable to an
 * empty More menu — the UI stays the same when the real screens land.
 */
const SETTINGS_ROWS: MoreRow[] = [
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Manage push alerts',
  },
  {
    icon: Shield,
    label: 'Privacy & security',
    description: 'App lock, data controls',
  },
  {
    icon: HelpCircle,
    label: 'Help & support',
    description: 'FAQ, contact us',
  },
];

function RowBody({ row, showChevron = true }: { row: MoreRow; showChevron?: boolean }) {
  const Icon = row.icon;
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 items-center justify-center">
        <Icon size={20} color="#0f766e" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
          {row.label}
        </Text>
        {row.description ? (
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {row.description}
          </Text>
        ) : null}
      </View>
      {showChevron ? <ChevronRight size={20} color="#94a3b8" /> : null}
    </View>
  );
}

function GatedRow({
  row,
  router,
}: {
  row: MoreRow & { feature: FeatureKey };
  router: ReturnType<typeof useRouter>;
}) {
  const state = useFeature(row.feature);
  const locked = !state.enabled && !state.loading;

  const handlePress = () => {
    if (locked) {
      router.push(`/plans?feature=${row.feature}` as never);
      return;
    }
    if (row.href) router.push(row.href as never);
    else row.onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-50 dark:active:bg-surface-800 ${
        locked ? 'opacity-70' : ''
      }`}>
      <View className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 items-center justify-center">
        <row.icon size={20} color={locked ? '#94a3b8' : '#0f766e'} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
            {row.label}
          </Text>
          <TierBadge feature={row.feature} />
        </View>
        {row.description ? (
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {row.description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </Pressable>
  );
}

function SectionCard({
  title,
  rows,
  router,
}: {
  title: string;
  rows: MoreRow[];
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 px-1 mb-2">
        {title}
      </Text>
      <Card>
        <CardBody className="p-0">
          {rows.map((row, idx) => {
            const divider =
              idx > 0 ? (
                <View className="h-px bg-surface-100 dark:bg-surface-700 mx-4" />
              ) : null;

            if (row.feature) {
              return (
                <View key={row.label}>
                  {divider}
                  <GatedRow
                    row={row as MoreRow & { feature: FeatureKey }}
                    router={router}
                  />
                </View>
              );
            }

            const handlePress = () => {
              if (row.onPress) return row.onPress();
              if (row.href) router.push(row.href as never);
            };

            return (
              <View key={row.label}>
                {divider}
                <Pressable
                  onPress={handlePress}
                  className="active:bg-surface-50 dark:active:bg-surface-800">
                  <RowBody row={row} showChevron={!!(row.href || row.onPress)} />
                </Pressable>
              </View>
            );
          })}
        </CardBody>
      </Card>
    </View>
  );
}

export default function TeacherMore() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('[teacher more] logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ScreenContainer title="More" subtitle="Everything else in your teacher app">
      {SECTIONS.map((section) => (
        <SectionCard
          key={section.title}
          title={section.title}
          rows={section.rows}
          router={router}
        />
      ))}

      <SectionCard title="Settings" rows={SETTINGS_ROWS} router={router} />

      <Card>
        <CardBody className="p-0">
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className="flex-row items-center justify-center gap-2 p-4 active:bg-danger-50 dark:active:bg-danger-900/20 rounded-2xl">
            {loggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <LogOut size={20} color="#DC2626" />
            )}
            <Text className="font-semibold text-danger-600 dark:text-danger-400">
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </Text>
          </Pressable>
        </CardBody>
      </Card>

      <Text className="text-center text-xs text-surface-400 dark:text-surface-500 mt-6">
        KidsHub Teacher App v1.0.0
      </Text>
    </ScreenContainer>
  );
}
