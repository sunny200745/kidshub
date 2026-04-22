/**
 * /invite/[token] — invite acceptance screen for teachers (p3-14) AND
 * parents (p3-20).
 *
 * Lifecycle:
 *   1. Parse `token` from the URL.
 *   2. fetchInvite(token) — open Firestore read (token is the secret).
 *   3. Branch on result:
 *      - Loading        → spinner
 *      - Not found      → InvalidInvite error card
 *      - Expired        → InvalidInvite error card with "Ask for a new one" copy
 *      - Already signed in as someone else → SignOutToContinue card
 *      - OK             → AcceptForm — copy + accept handler depend on role
 *   4. On submit → acceptTeacherInvite | acceptParentInvite → AuthContext
 *      flips → role router sends the new user to /classroom or /home.
 *
 * Why this lives outside (auth)/(parent)/(teacher) groups:
 *   - The invitee arrives here BEFORE having an account, so (auth) would
 *     work, but (auth) layout aggressively bounces signed-in users to /,
 *     and we want a different UX when an already-signed-in user visits an
 *     invite link (the SignOutToContinue card explains why we won't auto-
 *     accept).
 *   - Living at app/invite/[token].tsx, this route uses the root Stack's
 *     no-header configuration directly — no extra layout file needed.
 *
 * Security model recap (full rationale in firestore.rules):
 *   - invites/{token} read is open. The token IS the unguessable capability.
 *   - Acceptance writes users/{uid} with role + inviteToken: token. The
 *     Firestore rule walks the inviteToken back to the invite doc and
 *     asserts the email on the auth token matches the invite's email — so
 *     nobody can self-promote without a real invite.
 *   - Expiry is enforced client-side here (Firestore can't easily compare
 *     server-set timestamps to request.time without overhead, and the only
 *     person reading the invite is the prospective invitee anyway).
 */
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth, type Invite } from '@/contexts';
import { getFriendlyAuthError } from '@/firebase/errors';

type AcceptFormState = {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: AcceptFormState = {
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
};

export default function InviteScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const {
    fetchInvite,
    acceptTeacherInvite,
    acceptParentInvite,
    user,
    loading: authLoading,
    role,
    logout,
  } = useAuth();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [fetchError, setFetchError] = useState<string>('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!token) {
      setFetchError('Missing invite token in the URL.');
      setFetching(false);
      return;
    }
    let cancelled = false;
    setFetching(true);
    setFetchError('');
    fetchInvite(token)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setFetchError('This invite link is no longer valid.');
        } else {
          setInvite(result);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[InviteScreen] failed to fetch invite:', err);
        setFetchError('Could not load this invite. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, fetchInvite]);

  // Edge case: a signed-in user whose email already matches the invite is
  // probably refreshing the page after a successful accept. Send them home
  // if their role matches the invite's role.
  if (
    !authLoading &&
    user &&
    invite &&
    user.email?.toLowerCase() === invite.email.toLowerCase() &&
    role === invite.role
  ) {
    return <Redirect href="/" />;
  }

  if (fetching || authLoading) {
    return (
      <CenteredScreen>
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-surface-600 dark:text-surface-300">
          Loading your invite\u2026
        </Text>
      </CenteredScreen>
    );
  }

  if (fetchError || !invite) {
    return (
      <InvalidInvite
        title="Invite link not valid"
        message={
          fetchError ||
          "This invite link doesn't work anymore. Ask your daycare to send you a fresh one."
        }
      />
    );
  }

  const expiresAtMs = invite.expiresAt?.toMillis?.();
  if (typeof expiresAtMs === 'number' && expiresAtMs < Date.now()) {
    return (
      <InvalidInvite
        title="This invite has expired"
        message="Invites are good for 7 days. Ask your daycare to send you a new one."
      />
    );
  }

  // Someone is signed in but it's not the invitee. Don't auto-sign them out
  // (could lose unsaved work in another tab); ask them to confirm.
  if (user && user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <SignOutToContinue
        currentEmail={user.email || ''}
        inviteEmail={invite.email}
        onSignOut={logout}
      />
    );
  }

  return (
    <AcceptForm
      invite={invite}
      acceptTeacherInvite={acceptTeacherInvite}
      acceptParentInvite={acceptParentInvite}
    />
  );
}

// =============================================================================
// Sub-screens — kept in this file because they're tightly coupled to the
// invite lifecycle and not reusable elsewhere.
// =============================================================================

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 px-6">
      {children}
    </View>
  );
}

function InvalidInvite({ title, message }: { title: string; message: string }) {
  return (
    <CenteredScreen>
      <View className="max-w-md w-full items-center">
        <View className="w-14 h-14 rounded-full bg-warning-100 dark:bg-warning-900/40 items-center justify-center mb-4">
          <AlertTriangle size={28} color="#d97706" />
        </View>
        <Text className="text-surface-900 dark:text-surface-50 text-2xl font-bold text-center">
          {title}
        </Text>
        <Text className="text-surface-600 dark:text-surface-300 text-base text-center mt-3">
          {message}
        </Text>
        <Link
          href="/login"
          className="mt-6 px-6 py-3 rounded-xl border border-surface-300 dark:border-surface-600">
          <Text className="text-surface-800 dark:text-surface-100 font-semibold">
            Go to sign in
          </Text>
        </Link>
      </View>
    </CenteredScreen>
  );
}

function SignOutToContinue({
  currentEmail,
  inviteEmail,
  onSignOut,
}: {
  currentEmail: string;
  inviteEmail: string;
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      // Stay on the page — once the auth listener fires, the parent component
      // re-renders and the AcceptForm shows. No router push needed.
      setSigningOut(false);
    }
  };

  return (
    <CenteredScreen>
      <View className="max-w-md w-full items-center">
        <View className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 items-center justify-center mb-4">
          <ShieldCheck size={28} color="#0ea5e9" />
        </View>
        <Text className="text-surface-900 dark:text-surface-50 text-2xl font-bold text-center">
          Different account signed in
        </Text>
        <Text className="text-surface-600 dark:text-surface-300 text-base text-center mt-3">
          You&apos;re signed in as <Text className="font-semibold">{currentEmail}</Text>, but
          this invite is for <Text className="font-semibold">{inviteEmail}</Text>. Sign out to
          accept the invite.
        </Text>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          className={`mt-6 flex-row items-center px-6 py-3 rounded-xl ${
            signingOut ? 'bg-brand-300 dark:bg-brand-800' : 'bg-brand-500 active:bg-brand-600'
          }`}>
          {signingOut ? (
            <Loader2 size={18} color="white" />
          ) : (
            <Text className="text-white font-semibold">Sign out and continue</Text>
          )}
        </Pressable>
      </View>
    </CenteredScreen>
  );
}

function AcceptForm({
  invite,
  acceptTeacherInvite,
  acceptParentInvite,
}: {
  invite: Invite;
  acceptTeacherInvite: ReturnType<typeof useAuth>['acceptTeacherInvite'];
  acceptParentInvite: ReturnType<typeof useAuth>['acceptParentInvite'];
}) {
  const isParent = invite.role === 'parent';
  const [form, setForm] = useState<AcceptFormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof AcceptFormState>(key: K) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const validate = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (isParent) {
        await acceptParentInvite({
          token: invite.token,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
        });
      } else {
        await acceptTeacherInvite({
          token: invite.token,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
        });
      }
      // AuthContext flips → role router sends the new user to
      // /home (parent) or /classroom (teacher). No explicit nav needed.
    } catch (err) {
      console.error('[InviteScreen] accept failed:', err);
      const code = (err as { code?: string } | null)?.code;
      if (code === 'auth/email-already-in-use') {
        setError(
          `An account already exists for ${invite.email}. Ask your daycare to revoke this invite, or contact support.`
        );
      } else if (err instanceof Error && err.message) {
        // acceptTeacherInvite throws plain Errors for invite-state issues
        // (revoked between page load and submit, expired, etc).
        setError(err.message);
      } else {
        setError(getFriendlyAuthError(err));
      }
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
              <Text className="text-4xl font-bold text-brand-600 dark:text-brand-400">
                KidsHub
              </Text>
              <Text className="text-surface-600 dark:text-surface-300 text-base mt-2 text-center">
                {isParent ? (
                  <>
                    You&apos;re invited to connect with{' '}
                    <Text className="font-semibold">
                      {invite.role === 'parent' && invite.childName
                        ? invite.childName
                        : 'your child'}
                    </Text>{' '}
                    at{' '}
                    <Text className="font-semibold">
                      {invite.invitedByName || 'KidsHub'}
                    </Text>
                    .
                  </>
                ) : (
                  <>
                    You&apos;re invited to join{' '}
                    <Text className="font-semibold">
                      {invite.invitedByName || 'a daycare'}
                    </Text>{' '}
                    as a teacher
                    {invite.role === 'teacher' && invite.classroomName
                      ? ` in ${invite.classroomName}`
                      : ''}
                    .
                  </>
                )}
              </Text>
            </View>

            <View className="bg-white dark:bg-surface-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <View className="mb-5 p-3 bg-surface-50 dark:bg-surface-900 rounded-xl flex-row items-center gap-3">
                <Mail size={18} color="#94a3b8" />
                <View className="flex-1 min-w-0">
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    Invited email
                  </Text>
                  <Text
                    className="text-sm font-semibold text-surface-900 dark:text-surface-50"
                    numberOfLines={1}>
                    {invite.email}
                  </Text>
                </View>
              </View>

              {error ? (
                <View
                  className="mb-5 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl"
                  accessibilityLiveRegion="polite">
                  <Text className="text-sm text-danger-700 dark:text-danger-300">
                    {error}
                  </Text>
                </View>
              ) : null}

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
                  Set a password
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

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityState={{ busy: submitting }}
                className={`flex-row items-center justify-center py-4 rounded-xl ${
                  submitting
                    ? 'bg-brand-300 dark:bg-brand-800'
                    : 'bg-brand-500 active:bg-brand-600'
                }`}>
                {submitting ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <>
                    <Text className="text-white text-base font-semibold mr-2">
                      Accept invite
                    </Text>
                    <ArrowRight size={18} color="white" />
                  </>
                )}
              </Pressable>

              <View className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-700 items-center">
                <Text className="text-xs text-surface-400 text-center">
                  By accepting, you&apos;re creating a {isParent ? 'parent' : 'teacher'} account on
                  KidsHub for {invite.email}.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
