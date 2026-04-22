/**
 * /classroom — teacher's landing tab. Stub while p3-9 ships the routing
 * shell. p3-11 replaces this with the classroom roster + quick-actions
 * screen, lifted out of kidshub-dashboard.
 */
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/contexts';

export default function TeacherClassroom() {
  const { profile, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-surface-500 dark:text-surface-400 text-sm">
          {profile?.email ? String(profile.email) : 'Signed in'}
        </Text>
        <Text className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">
          Your classroom
        </Text>
      </View>
      <View className="px-6">
        <View className="bg-warning-100 border border-warning-300 p-4 rounded-xl">
          <Text className="text-warning-800 font-semibold">Stub — p3-9 scaffolding</Text>
          <Text className="text-warning-700 text-sm mt-1">
            Classroom roster + quick actions get lifted from kidshub-dashboard in p3-11.
          </Text>
        </View>
        <Pressable
          onPress={logout}
          className="mt-6 border border-surface-300 dark:border-surface-600 px-6 py-3 rounded-xl self-start">
          <Text className="text-surface-800 dark:text-surface-100 font-semibold">Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
