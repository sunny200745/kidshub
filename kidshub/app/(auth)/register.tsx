/**
 * /register — parent self-signup. Two-step form:
 *   Step 1: name + email + phone (optional)
 *   Step 2: password + confirm password
 *
 * Submits via AuthContext.registerParent which:
 *   1. createUserWithEmailAndPassword
 *   2. updateProfile(displayName)
 *   3. setDoc(users/{uid}, { role: 'parent', ... })
 *
 * Teachers do NOT register here — they're invited from the dashboard (p3-14).
 * If a teacher email tries to register, they'll get a parent role; the
 * invite flow will overwrite the doc when the owner sends the invite.
 *
 * After success Firebase auth state flips → (auth) layout's
 * useAuthRedirect bounces to / → role router sends parents to /home.
 */
import { Link } from 'expo-router';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react-native';
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

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { registerParent } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const validateStep1 = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleNext = () => {
    const e = validateStep1();
    if (e) {
      setError(e);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    const e = validateStep2();
    if (e) {
      setError(e);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await registerParent({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      // (auth) layout will detect the auth state change and bounce to /,
      // which is the role router; parents get sent to /home.
    } catch (err) {
      console.error('[RegisterScreen] register failed:', err);
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
            <View className="items-center mb-6">
              <Text className="text-4xl font-bold text-brand-600 dark:text-brand-400">KidsHub</Text>
              <Text className="text-surface-600 dark:text-surface-300 text-base mt-2 text-center">
                Create your parent account
              </Text>
            </View>

            <View className="bg-white dark:bg-surface-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              {/* Step indicator */}
              <View className="flex-row items-center justify-center mb-6">
                <View
                  className={`w-3 h-3 rounded-full ${
                    step >= 1 ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                  }`}
                />
                <View
                  className={`w-12 h-1 mx-1 rounded-full ${
                    step >= 2 ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                  }`}
                />
                <View
                  className={`w-3 h-3 rounded-full ${
                    step >= 2 ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                  }`}
                />
              </View>

              <Text className="text-center text-sm text-surface-500 dark:text-surface-400 mb-5">
                {step === 1 ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Set a password'}
              </Text>

              {error ? (
                <View
                  className="mb-5 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl"
                  accessibilityLiveRegion="polite">
                  <Text className="text-sm text-danger-700 dark:text-danger-300">{error}</Text>
                </View>
              ) : null}

              {step === 1 ? (
                <>
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                        First name
                      </Text>
                      <View className="relative">
                        <View
                          pointerEvents="none"
                          className="absolute left-3 top-0 bottom-0 justify-center z-10">
                          <User size={18} color="#94a3b8" />
                        </View>
                        <TextInput
                          value={form.firstName}
                          onChangeText={set('firstName')}
                          placeholder="Jane"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="words"
                          autoComplete="given-name"
                          textContentType="givenName"
                          editable={!submitting}
                          className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-3 py-3 text-base text-surface-900 dark:text-surface-50"
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                        Last name
                      </Text>
                      <TextInput
                        value={form.lastName}
                        onChangeText={set('lastName')}
                        placeholder="Doe"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        textContentType="familyName"
                        editable={!submitting}
                        className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-3 text-base text-surface-900 dark:text-surface-50"
                      />
                    </View>
                  </View>

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
                        value={form.email}
                        onChangeText={set('email')}
                        placeholder="you@example.com"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        editable={!submitting}
                        className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-3 py-3 text-base text-surface-900 dark:text-surface-50"
                      />
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                      Phone <Text className="text-surface-400">(optional)</Text>
                    </Text>
                    <View className="relative">
                      <View
                        pointerEvents="none"
                        className="absolute left-3 top-0 bottom-0 justify-center z-10">
                        <Phone size={18} color="#94a3b8" />
                      </View>
                      <TextInput
                        value={form.phone}
                        onChangeText={set('phone')}
                        placeholder="(555) 123-4567"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        editable={!submitting}
                        className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-3 py-3 text-base text-surface-900 dark:text-surface-50"
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleNext}
                    accessibilityRole="button"
                    className="flex-row items-center justify-center py-4 rounded-xl bg-brand-500 active:bg-brand-600">
                    <Text className="text-white text-base font-semibold mr-2">Continue</Text>
                    <ArrowRight size={18} color="white" />
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="mb-4">
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
                        value={form.password}
                        onChangeText={set('password')}
                        placeholder="At least 6 characters"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={!submitting}
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

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                      Confirm password
                    </Text>
                    <View className="relative">
                      <View
                        pointerEvents="none"
                        className="absolute left-3 top-0 bottom-0 justify-center z-10">
                        <Lock size={18} color="#94a3b8" />
                      </View>
                      <TextInput
                        value={form.confirmPassword}
                        onChangeText={set('confirmPassword')}
                        placeholder="Repeat your password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={!submitting}
                        onSubmitEditing={handleSubmit}
                        className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl pl-10 pr-11 py-3 text-base text-surface-900 dark:text-surface-50"
                      />
                      <Pressable
                        onPress={() => setShowConfirm((v) => !v)}
                        hitSlop={8}
                        className="absolute right-3 top-0 bottom-0 justify-center"
                        accessibilityRole="button"
                        accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}>
                        {showConfirm ? (
                          <EyeOff size={18} color="#94a3b8" />
                        ) : (
                          <Eye size={18} color="#94a3b8" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setError('');
                        setStep(1);
                      }}
                      disabled={submitting}
                      accessibilityRole="button"
                      className="flex-1 items-center justify-center py-4 rounded-xl border border-surface-300 dark:border-surface-600 active:bg-surface-100 dark:active:bg-surface-700">
                      <Text className="text-surface-800 dark:text-surface-100 text-base font-semibold">
                        Back
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSubmit}
                      disabled={submitting}
                      accessibilityRole="button"
                      accessibilityState={{ busy: submitting }}
                      className={`flex-[2] flex-row items-center justify-center py-4 rounded-xl ${
                        submitting ? 'bg-brand-300 dark:bg-brand-800' : 'bg-brand-500 active:bg-brand-600'
                      }`}>
                      {submitting ? (
                        <Loader2 size={20} color="white" />
                      ) : (
                        <>
                          <Text className="text-white text-base font-semibold mr-2">
                            Create Account
                          </Text>
                          <ArrowRight size={18} color="white" />
                        </>
                      )}
                    </Pressable>
                  </View>
                </>
              )}

              <View className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-700 items-center">
                <Text className="text-sm text-surface-500 dark:text-surface-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-brand-600 dark:text-brand-400 font-semibold">
                    Sign in
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
