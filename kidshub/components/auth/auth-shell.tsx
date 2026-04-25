/**
 * AuthShell — shared themed chrome for every signed-out screen.
 *
 * Why this exists:
 *   The auth screens (/login, /forgot-password, /register) used to be
 *   white card on a flat surface-50 background — which works fine on
 *   the dashboard hero pages but reads as "default scaffolding" on the
 *   parent/teacher app, where every authenticated screen has soft
 *   gradients, brand chips and rounded card stacks. Dropping a
 *   freshly-signed-in parent from a wash of pink onto a white card
 *   on grey was the most obvious "this app is unfinished" moment.
 *
 *   AuthShell concentrates the shared chrome (gradient background,
 *   decorative color blobs, branded logo header, copyright footer,
 *   keyboard-aware scroll wrapper) so each screen only owns its own
 *   form card. Single source of truth for visual identity at the
 *   top of the funnel.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Pink-purple gradient + soft blurred blobs   │
 *   │                                              │
 *   │       [LOGO]  KidsHub                        │
 *   │       <subtitle prop>                        │
 *   │                                              │
 *   │       ┌──────────────────────┐               │
 *   │       │  children (the card) │               │
 *   │       └──────────────────────┘               │
 *   │                                              │
 *   │       © 2026 KidsHub. All rights reserved.   │
 *   └──────────────────────────────────────────────┘
 *
 * Background composition:
 *   - LinearGradient (brand-50 → white → accent-50): the soft "parent
 *     app" wash that matches the home-screen hero family.
 *   - 3 decorative color blobs (brand-300 / accent-300 / brand-200) at
 *     fixed corner positions. On web we apply CSS filter: blur(...) for
 *     the genuine "soft glow" effect; on native the blur prop is
 *     unavailable so we fall back to lower opacity, which reads as a
 *     soft color wash without needing expo-blur (which has its own
 *     iOS/Android constraints).
 *
 * No props for the gradient/blob layer — auth screens shouldn't have
 * to think about the chrome. If we ever need a teacher-themed variant
 * (teal instead of pink) we'd take a `tone` prop here, but every
 * signed-out path today is parent-pink.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AuthDecorations } from './auth-decorations';
import { PlayfulMascots } from './playful-mascots';

const LOGO = require('@/assets/images/icon.png');

export function AuthShell({
  subtitle,
  children,
}: {
  subtitle?: string;
  children: ReactNode;
}) {
  // CSS blur radius only takes effect on web (RN-web maps the `filter`
  // style to the underlying CSS property). On native we set it to
  // undefined and rely on opacity to do the visual work. We split this
  // out so the per-blob style objects stay readable.
  const blur = Platform.OS === 'web' ? { filter: 'blur(80px)' as const } : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {/* Base gradient — soft brand-50 → near-white → accent-50.
            Acts as the "page color" so the rest of the chrome sits
            on something that already feels like the parent app. */}
        <LinearGradient
          colors={['#FFF0F7', '#FFFFFF', '#F5F3FF']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Decorative blobs — purely visual; pointerEvents='none' so
            they never intercept taps on the form below. We render
            three: top-right (pink), bottom-left (purple), and a small
            mid-left highlight, mirroring the gradient blob recipe used
            on the dashboard's desktop hero so brand identity stays
            cohesive across surfaces. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -120,
            right: -100,
            width: 360,
            height: 360,
            borderRadius: 360,
            backgroundColor: '#FF94C8',
            opacity: Platform.OS === 'web' ? 0.55 : 0.18,
            ...(blur ?? {}),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -140,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            backgroundColor: '#C4B5FD',
            opacity: Platform.OS === 'web' ? 0.5 : 0.16,
            ...(blur ?? {}),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '38%',
            left: -60,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: '#FFC2DF',
            opacity: Platform.OS === 'web' ? 0.45 : 0.14,
            ...(blur ?? {}),
          }}
        />

        {/* Animated decoration layer — twinkling stars, floating
            hearts, drifting sparkles + flowers, slow-floating clouds.
            Sits above the blobs but below the scroll content (the
            ScrollView is the next sibling), so it never intercepts
            taps and never obscures the form. Mirrors the dashboard's
            <AnimatedAuthBackground /> so both surfaces share one
            playful visual language. */}
        <AuthDecorations />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled">
          <View className="px-6 py-10 items-center">
            <View className="w-full max-w-md">
              {/* Mascot row — friendly cartoon scene above the logo.
                  Anchors the page emotionally before the user even
                  reads the form. Wraps gracefully on the narrowest
                  devices. */}
              <PlayfulMascots />

              {/* Logo header — a real logo image (not just a wordmark)
                  so the page has a proper graphic anchor. The chip-
                  style background + shadow matches the loading splash
                  and the in-app role badge so the brand mark feels
                  like one consistent element across surfaces. */}
              <View className="items-center mb-8">
                <View
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 22,
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF2D8A',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 24,
                    elevation: 6,
                    marginBottom: 16,
                  }}>
                  <Image
                    source={LOGO}
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                    accessibilityIgnoresInvertColors
                    accessibilityLabel="KidsHub"
                  />
                </View>
                <Text className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                  KidsHub
                </Text>
                {subtitle ? (
                  <Text className="text-surface-600 dark:text-surface-300 text-base mt-2 text-center">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {children}

              <Text className="text-center text-xs text-surface-500 dark:text-surface-400 mt-6">
                © {new Date().getFullYear()} KidsHub. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
