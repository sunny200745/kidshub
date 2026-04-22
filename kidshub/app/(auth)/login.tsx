/**
 * /login — stub. Full login form (email + password + Firebase auth.signIn) is
 * the body of p3-10 / p3-13; this file just establishes the route so the
 * role router has somewhere to redirect anonymous users to.
 */
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 px-6">
      <View className="max-w-md w-full items-center">
        <Text className="text-4xl font-bold text-brand-600 mb-2">KidsHub</Text>
        <Text className="text-surface-600 dark:text-surface-300 text-base text-center mb-8">
          Sign in to connect with your daycare
        </Text>
        <View className="bg-warning-100 border border-warning-300 p-4 rounded-xl w-full">
          <Text className="text-warning-800 font-semibold">Stub — p3-9 scaffolding</Text>
          <Text className="text-warning-700 text-sm mt-1">
            Full login form + Firebase auth.signInWithEmailAndPassword lands in p3-10 / p3-13.
          </Text>
        </View>
        <Link href="/register" className="mt-6 text-brand-600 font-semibold">
          <Text>Create an account</Text>
        </Link>
        <Link href="/forgot-password" className="mt-2 text-surface-500">
          <Text>Forgot password?</Text>
        </Link>
      </View>
    </View>
  );
}
