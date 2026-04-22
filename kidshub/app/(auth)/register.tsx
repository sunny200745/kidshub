/**
 * /register — stub. Parent self-registration form + Firebase createUser
 * lives in p3-10. Teachers don't self-register; they're invited by owners
 * via the dashboard (p3-14).
 */
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 px-6">
      <View className="max-w-md w-full items-center">
        <Text className="text-3xl font-bold text-brand-600 mb-6">Create account</Text>
        <View className="bg-warning-100 border border-warning-300 p-4 rounded-xl w-full">
          <Text className="text-warning-800 font-semibold">Stub — p3-9 scaffolding</Text>
          <Text className="text-warning-700 text-sm mt-1">
            Parent self-registration form lands in p3-10. Teachers join via invite (p3-14).
          </Text>
        </View>
        <Link href="/login" className="mt-6 text-brand-600 font-semibold">
          <Text>Already have an account? Sign in</Text>
        </Link>
      </View>
    </View>
  );
}
