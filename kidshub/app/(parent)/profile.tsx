/**
 * /profile — child profile + settings + sign-out.
 *
 * Ported from kidshub-legacy/src/pages/Profile.jsx. The screen is a stack of
 * "section" cards:
 *   1. Hero card — child avatar + name + classroom + allergy badges
 *   2. Child Information — medical, emergency contacts, pickups, schedule, docs
 *   3. Settings — notifications, privacy, help
 *   4. Sign out
 *
 * Most row onPress handlers are intentionally no-ops for now — the detail
 * screens they'd navigate to get built in later tickets. The current release
 * just needs the parity shell so Profile isn't a stub.
 *
 * Sign-out actively uses AuthContext.logout(); the RootRedirect layer (app/
 * index.tsx) handles the navigation after `user` flips to null.
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
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import { useAuth } from '@/contexts';
import { childProfile, myChildren } from '@/data/mockData';

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
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const child = myChildren[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      // Keep the user on the page so they can retry; log for diagnostics.
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ScreenContainer title="Profile" subtitle="Manage your child's information">
      {/* Hero card: avatar, name, classroom dot, allergies */}
      <Card className="mb-6">
        <CardBody className="p-5">
          <View className="flex-row items-start gap-4">
            <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" />
            <View className="flex-1">
              <Text className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {child.firstName} {child.lastName}
              </Text>
              <Text className="text-surface-500 dark:text-surface-400">{child.age}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: child.classroomColor,
                  }}
                />
                <Text className="text-sm text-surface-600 dark:text-surface-300">
                  {child.classroom}
                </Text>
              </View>
            </View>
          </View>

          {childProfile.allergies.length > 0 ? (
            <View className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-700">
              <View className="flex-row items-center gap-2 mb-3">
                <AlertTriangle size={16} color="#EF4444" />
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  Allergies
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {childProfile.allergies.map((allergy) => (
                  <Badge key={allergy} variant="danger">
                    <AlertTriangle size={12} color="#B91C1C" />
                    <Text className="text-xs font-medium text-danger-700 dark:text-danger-300">
                      {allergy}
                    </Text>
                  </Badge>
                ))}
              </View>
            </View>
          ) : null}
        </CardBody>
      </Card>

      {/* Child information section — detail routes are TODO for a later ticket */}
      <ProfileSection title="Child Information">
        <ProfileItem
          icon={Heart}
          label="Medical & Allergies"
          value={`${childProfile.allergies.length} allergies, ${childProfile.dietaryRestrictions.length} restrictions`}
        />
        <ProfileItem
          icon={Users}
          label="Emergency Contacts"
          value={`${childProfile.emergencyContacts.length} contacts`}
        />
        <ProfileItem
          icon={Phone}
          label="Authorized Pickups"
          value={`${childProfile.authorizedPickups.length} people`}
        />
        <ProfileItem icon={Calendar} label="Schedule" value="Mon - Fri" />
        <ProfileItem
          icon={FileText}
          label="Documents"
          value="View enrollment forms"
          isLast
        />
      </ProfileSection>

      <ProfileSection title="Settings">
        <ProfileItem icon={Bell} label="Notifications" value="Manage alerts" />
        <ProfileItem icon={Shield} label="Privacy & Security" />
        <ProfileItem icon={HelpCircle} label="Help & Support" isLast />
      </ProfileSection>

      {/* Sign out card — full-width pressable with spinner on submit */}
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
            <Text className="font-medium text-danger-600 dark:text-danger-400">
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </CardBody>
      </Card>

      <Text className="text-center text-xs text-surface-400 dark:text-surface-500 mt-6">
        KidsHub Parent App v1.0.0
      </Text>
    </ScreenContainer>
  );
}
