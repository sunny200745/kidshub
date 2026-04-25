/**
 * /register — invite-required explainer.
 *
 * KidsHub is NOT self-signup. Every account (parent or teacher) is created
 * by the daycare owner via the dashboard and delivered as an invite link
 * (/invite/<token>). That keeps every user tied to a real daycare + child
 * with a valid daycareId, prevents orphan auth accounts, and matches how
 * Brightwheel/Procare/HiMama work.
 *
 * This file used to be a two-step parent self-signup form. We kept the
 * route so stale bookmarks / links don't 404 — instead they land here and
 * learn how to get access.
 *
 * Visual chrome (gradient + blobs + logo header + footer) lives in
 * <AuthShell />, matching /login and /forgot-password so the auth flow
 * reads as one unified surface.
 *
 * Account creation happens in:
 *   - app/invite/[token].tsx  (invite accept screen)
 *   - contexts/AuthContext:   acceptParentInvite / acceptTeacherInvite
 */
import { Link } from 'expo-router';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth';

export default function RegisterScreen() {
  return (
    <AuthShell subtitle="Invite required">
      <View
        className="bg-white/95 dark:bg-surface-800/95 rounded-3xl p-6 sm:p-8 border border-brand-100/60 dark:border-surface-700"
        style={{
          shadowColor: '#FF2D8A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
          elevation: 8,
        }}>
        <View className="items-center mb-5">
          <View className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 items-center justify-center mb-3">
            <ShieldCheck size={28} color="#ec4899" />
          </View>
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-50 text-center">
            Access is by invite only
          </Text>
          <Text className="text-sm text-surface-600 dark:text-surface-300 text-center mt-2">
            Your daycare creates your KidsHub account and sends you a personal invite link.
            Open that link to set your password and get started.
          </Text>
        </View>

        <View className="gap-3 mt-6">
          <View className="flex-row items-start gap-3 bg-surface-50 dark:bg-surface-900 rounded-xl p-4">
            <View className="w-7 h-7 rounded-full bg-brand-500 items-center justify-center mt-0.5">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                Ask your daycare to invite you
              </Text>
              <Text className="text-xs text-surface-600 dark:text-surface-300 mt-1">
                Parents: your child&apos;s center adds you from your child&apos;s profile.{' '}
                Teachers: your owner invites you from the Staff page.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3 bg-surface-50 dark:bg-surface-900 rounded-xl p-4">
            <View className="w-7 h-7 rounded-full bg-brand-500 items-center justify-center mt-0.5">
              <Text className="text-white text-xs font-bold">2</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                Check your email
              </Text>
              <Text className="text-xs text-surface-600 dark:text-surface-300 mt-1">
                You&apos;ll get a link that looks like{' '}
                <Text className="font-mono text-[11px]">/invite/&lt;token&gt;</Text>.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3 bg-surface-50 dark:bg-surface-900 rounded-xl p-4">
            <View className="w-7 h-7 rounded-full bg-brand-500 items-center justify-center mt-0.5">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                Open the link, set your password
              </Text>
              <Text className="text-xs text-surface-600 dark:text-surface-300 mt-1">
                That takes 30 seconds and puts you straight into the app.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mt-6 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
          <Mail size={16} color="#ec4899" />
          <Text className="text-xs text-surface-700 dark:text-surface-200 flex-1">
            Can&apos;t find your invite? Check spam, then message your daycare directly.
          </Text>
        </View>

        <Link href="/login" asChild>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 mt-6 py-3 rounded-xl border border-surface-200 dark:border-surface-700">
            <ArrowLeft size={16} color="#64748b" />
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-200">
              Back to sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
