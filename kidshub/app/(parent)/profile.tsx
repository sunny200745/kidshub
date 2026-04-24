/**
 * /profile — child profile + settings + sign-out.
 *
 * The screen is a stack of section cards:
 *   1. Hero card — child avatar + name + classroom + allergy badges
 *   2. Child Information — medical, emergency contacts, pickups, schedule, docs
 *   3. Settings — notifications, privacy, help
 *   4. Sign out
 *
 * Most row onPress handlers are intentionally no-ops for now — the
 * detail screens they'd navigate to get built in later tickets. The
 * current release just needs the parity shell so Profile isn't a stub.
 *
 * Data: live `useSelectedChild` (parent-scoped context that wraps
 * `useMyChildren` + a persisted active-child id) for the hero + the
 * medical/allergy summary. Emergency contacts / authorized pickups /
 * schedule remain placeholder counts (those fields aren't part of the
 * children-doc schema yet — adding them is a separate ticket on
 * RESTRUCTURE_PLAN).
 *
 * Multi-sibling: <ChildSwitcher /> renders above the hero card whenever
 * the parent has 2+ linked children, so they can flip between siblings'
 * profiles in one tap. Hidden for single-child families.
 *
 * Sign-out actively uses AuthContext.logout(); the RootRedirect layer
 * (app/index.tsx) handles the navigation after `user` flips to null.
 */
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  Heart,
  HelpCircle,
  LogOut,
  Phone,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { ChildSwitcher } from '@/components/parent';
import {
  ActionButton,
  Avatar,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
} from '@/components/ui';
import { useAuth, useSelectedChild } from '@/contexts';
import { useClassroom } from '@/hooks';

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider px-1 mb-2">
        {title}
      </Text>
      <Card>
        <CardBody className="p-0">{children}</CardBody>
      </Card>
    </View>
  );
}

type ProfileItemProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
  loading?: boolean;
};

function ProfileItem({
  icon: Icon,
  label,
  value,
  onPress,
  danger = false,
  isLast = false,
  loading = false,
}: ProfileItemProps) {
  const iconBg = danger
    ? 'bg-danger-100 dark:bg-danger-900/30'
    : 'bg-surface-100 dark:bg-surface-700';
  const iconColor = danger ? '#DC2626' : '#475569';
  const labelColor = danger
    ? 'text-danger-600 dark:text-danger-400'
    : 'text-surface-900 dark:text-surface-50';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`flex-row items-center gap-3 p-4 active:bg-surface-50 dark:active:bg-surface-800 ${
        isLast ? '' : 'border-b border-surface-100 dark:border-surface-700'
      }`}>
      <View
        style={{ width: 40, height: 40, borderRadius: 12 }}
        className={`items-center justify-center ${iconBg}`}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Icon size={20} color={iconColor} />
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className={`font-medium ${labelColor}`}>{label}</Text>
        {value ? (
          <Text
            numberOfLines={1}
            className="text-sm text-surface-500 dark:text-surface-400">
            {value}
          </Text>
        ) : null}
      </View>
      {!danger ? <ChevronRight size={20} color="#CBD5E1" /> : null}
    </Pressable>
  );
}

export default function ParentProfile() {
  const router = useRouter();
  const { logout, profile } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  // Multi-sibling: the profile screen now reflects whichever child is
  // currently selected globally. The ChildSwitcher up top changes the
  // selection; medical/allergy/classroom info below re-keys to the new
  // child without a tab change.
  const { selectedChild: child, loading: childrenLoading } = useSelectedChild();
  const { data: classroom } = useClassroom(
    child?.classroomId ?? child?.classroom ?? null,
  );

  const parentEmail = (profile?.email as string | undefined) ?? '';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (childrenLoading) {
    return (
      <ScreenContainer title="Profile" subtitle="Manage your child's information">
        <LoadingState message="Loading profile" />
      </ScreenContainer>
    );
  }

  const allergies = child?.allergies ?? [];
  const dietaryRestrictions = child?.dietaryRestrictions ?? [];
  const accentColor = classroom?.color ?? child?.classroomColor ?? '#FF2D8A';
  const ageLabel =
    child?.age ||
    (child?.dateOfBirth
      ? `${Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(child.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          ),
        )} years`
      : '');

  return (
    <ScreenContainer title="Profile" subtitle="Manage your child's information">
      {/* Sibling switcher (multi-child only). When the parent has more
          than one linked child, this strip lets them pick which child's
          profile to view. Hidden for single-child families. */}
      <View className="mb-4">
        <ChildSwitcher />
      </View>
      {/* Hero card: avatar, name, classroom dot, allergies */}
      {child ? (
        <Card className="mb-6">
          <CardBody className="p-5">
            <View className="flex-row items-start gap-4">
              <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" />
              <View className="flex-1">
                <Text className="text-xl font-bold text-surface-900 dark:text-surface-50">
                  {child.firstName} {child.lastName}
                </Text>
                {ageLabel ? (
                  <Text className="text-surface-500 dark:text-surface-400">{ageLabel}</Text>
                ) : null}
                <View className="flex-row items-center gap-2 mt-2">
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: accentColor,
                    }}
                  />
                  <Text className="text-sm text-surface-600 dark:text-surface-300">
                    {classroom?.name ?? child.classroom ?? 'Classroom'}
                  </Text>
                </View>
              </View>
            </View>

            {allergies.length > 0 ? (
              <View className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-700">
                <View className="flex-row items-center gap-2 mb-3">
                  <AlertTriangle size={16} color="#EF4444" />
                  <Text className="text-sm font-medium text-surface-700 dark:text-surface-200">
                    Allergies
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <Pill
                      key={allergy}
                      tone="danger"
                      variant="soft"
                      size="sm"
                      icon={AlertTriangle}
                      label={allergy}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardBody>
            <EmptyState
              icon={HelpCircle}
              title="No child linked yet"
              description="Once your daycare links your child to your account, their profile will appear here."
            />
          </CardBody>
        </Card>
      )}

      {/* Child information — counts come from the live child doc; rows
          without backing fields show "Coming soon" instead of fake data. */}
      {child ? (
        <ProfileSection title="Child Information">
          <ProfileItem
            icon={Heart}
            label="Medical & Allergies"
            value={
              allergies.length || dietaryRestrictions.length
                ? `${allergies.length} allergies, ${dietaryRestrictions.length} restrictions`
                : 'No medical notes on file'
            }
          />
          <ProfileItem
            icon={Users}
            label="Emergency Contacts"
            value="Coming soon"
          />
          <ProfileItem
            icon={Phone}
            label="Authorized Pickups"
            value="Coming soon"
          />
          <ProfileItem icon={Calendar} label="Schedule" value="Coming soon" />
          <ProfileItem
            icon={FileText}
            label="Documents"
            value="View enrollment forms"
            isLast
          />
        </ProfileSection>
      ) : null}

      <ProfileSection title="Account">
        <ProfileItem
          icon={Users}
          label="Signed in as"
          value={parentEmail || 'Parent'}
          isLast
        />
      </ProfileSection>

      <ProfileSection title="Settings">
        <ProfileItem icon={Bell} label="Notifications" value="Manage alerts" />
        <ProfileItem icon={Shield} label="Privacy & Security" />
        <ProfileItem icon={HelpCircle} label="Help & Support" isLast />
      </ProfileSection>

      <ActionButton
        label={loggingOut ? 'Signing out…' : 'Sign out'}
        icon={LogOut}
        variant="ghost"
        tone="danger"
        size="lg"
        loading={loggingOut}
        onPress={handleLogout}
      />

      <Text className="text-center text-xs text-surface-400 dark:text-surface-500 mt-6">
        KidsHub Parent App v1.0.0
      </Text>
    </ScreenContainer>
  );
}
