/**
 * /forgot-password — sends a Firebase password reset email.
 *
 * Two visual states:
 *   1. form  — collect the email
 *   2. sent  — confirmation that an email is on its way
 *
 * Visual chrome (gradient + blobs + logo header + footer) lives in
 * <AuthShell />. This screen renders only the form card, matching
 * /login so users hopping between them never see a layout pop.
 *
 * Firebase's sendPasswordResetEmail returns successfully even if the email
 * isn't on file (anti-enumeration); we surface that as "if an account exists"
 * copy rather than confirming the email is registered.
 */
import { Link, useRouter } from 'expo-router';
import { ArrowRight, Loader2, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth';
import { useAuth } from '@/contexts';
import { getFriendlyAuthError } from '@/firebase/errors';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      console.error('[ForgotPasswordScreen] reset failed:', err);
      // Even on auth/user-not-found we choose to show success to avoid
      // leaking whether an email is registered. But a network error or
      // malformed email should still tell the user.
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(getFriendlyAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Reset your password">
      <View
        className="bg-white/95 dark:bg-surface-800/95 rounded-3xl p-6 sm:p-8 border border-brand-100/60 dark:border-surface-700"
        style={{
          shadowColor: '#FF2D8A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
          elevation: 8,
        }}>
        {sent ? (
          <View className="items-center py-2">
            <View className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/40 items-center justify-center mb-4">
              <Mail size={28} color="#16a34a" />
            </View>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-50 text-center mb-2">
              Check your email
            </Text>
            <Text className="text-sm text-surface-600 dark:text-surface-300 text-center mb-6">
              If an account exists for{' '}
              <Text className="font-semibold text-surface-900 dark:text-surface-100">
                {email.trim()}
              </Text>
              , we&apos;ve sent password reset instructions.
            </Text>
            <Pressable
              onPress={() => router.replace('/login')}
              accessibilityRole="button"
              className="w-full py-3 rounded-xl bg-brand-500 active:bg-brand-600 items-center">
              <Text className="text-white font-semibold">Back to sign in</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="text-sm text-surface-600 dark:text-surface-300 mb-5">
              Enter the email associated with your account and we&apos;ll send you a link to
              reset your password.
            </Text>

            {error ? (
              <View
                className="mb-5 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl"
                accessibilityLiveRegion="polite">
                <Text className="text-sm text-danger-700 dark:text-danger-300">{error}</Text>
              </View>
            ) : null}

            <View className="mb-5">
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

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              className={`flex-row items-center justify-center py-4 rounded-xl ${
                canSubmit
                  ? 'bg-brand-500 active:bg-brand-600'
                  : 'bg-brand-300 dark:bg-brand-800'
              }`}
              style={
                canSubmit
                  ? {
                      shadowColor: '#FF2D8A',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      elevation: 4,
                    }
                  : undefined
              }>
              {submitting ? (
                <Loader2 size={20} color="white" />
              ) : (
                <>
                  <Text className="text-white text-base font-semibold mr-2">
                    Send Reset Link
                  </Text>
                  <ArrowRight size={18} color="white" />
                </>
              )}
            </Pressable>

            <View className="mt-6 items-center">
              <Link href="/login" asChild>
                <Pressable hitSlop={8}>
                  <Text className="text-sm text-surface-500 dark:text-surface-400">
                    Back to sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </>
        )}
      </View>
    </AuthShell>
  );
}
