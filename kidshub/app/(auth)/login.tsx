/**
 * /login — email + password sign in for parents and teachers.
 *
 * The (auth) layout already calls useAuthRedirect({ require: 'anonymous' }),
 * so any authenticated visitor is bounced to / before this screen renders.
 * After a successful sign in, AuthContext fires onAuthStateChanged → the
 * (auth) guard fires the redirect → app/index.tsx (the role router) sends
 * the user to /home (parent), /classroom (teacher), or /unauthorized.
 *
 * Error handling: Firebase error codes are mapped to friendly copy via
 * getFriendlyAuthError; we log the raw error to console for debugging.
 */
import { Link } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts';
import { getFriendlyAuthError } from '@/firebase/errors';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // The (auth) guard will handle redirect on next render — nothing to do here.
    } catch (err) {
      console.error('[LoginScreen] login failed:', err);
      setError(getFriendlyAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 bg-surface-50 dark:bg-surface-900"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled">
        <View className="px-6 py-10 items-center">
          <View className="w-full max-w-md">
            <View className="items-center mb-8">
              <Text className="text-4xl font-bold text-brand-600 dark:text-brand-400">KidsHub</Text>
              <Text className="text-surface-600 dark:text-surface-300 text-base mt-2 text-center">
                Sign in to see your child&apos;s updates
              </Text>
            </View>

            <View className="bg-white dark:bg-surface-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              {error ? (
                <View
                  className="mb-5 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl"
                  accessibilityLiveRegion="polite">
                  <Text className="text-sm text-danger-700 dark:text-danger-300">{error}</Text>
                </View>
              ) : null}

              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                  Email
                </Text>
                <View className="relative">
                  <View
                    pointerEvents="none"
                    className="absolute left-3 top-0 bottom-0 justify-center z-10">
                    <Mail size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    editable={!submitting}
                    onSubmitEditing={handleSubmit}
                    className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-3 py-3 text-base text-surface-900 dark:text-surface-50"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                  Password
                </Text>
                <View className="relative">
                  <View
                    pointerEvents="none"
                    className="absolute left-3 top-0 bottom-0 justify-center z-10">
                    <Lock size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!submitting}
                    onSubmitEditing={handleSubmit}
                    className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-11 py-3 text-base text-surface-900 dark:text-surface-50"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <EyeOff size={18} color="#94a3b8" />
                    ) : (
                      <Eye size={18} color="#94a3b8" />
                    )}
                  </Pressable>
                </View>
              </View>

              <View className="items-end mb-5">
                <Link href="/forgot-password" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="text-sm text-brand-600 dark:text-brand-400 font-medium">
                      Forgot password?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit, busy: submitting }}
                className={`flex-row items-center justify-center py-4 rounded-xl ${
                  canSubmit
                    ? 'bg-brand-500 active:bg-brand-600'
                    : 'bg-brand-300 dark:bg-brand-800'
                }`}>
                {submitting ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <>
                    <Text className="text-white text-base font-semibold mr-2">Sign In</Text>
                    <ArrowRight size={18} color="white" />
                  </>
                )}
              </Pressable>

              <View className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-700 items-center">
                <Text className="text-sm text-surface-500 dark:text-surface-400 text-center">
                  Need access?{' '}
                  <Link href="/register" className="text-brand-600 dark:text-brand-400 font-semibold">
                    Ask your daycare for an invite
                  </Link>
                </Text>
              </View>
            </View>

            <Text className="text-center text-xs text-surface-400 mt-6">
              © {new Date().getFullYear()} KidsHub. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
