/**
 * AuthShell — shared themed chrome for every signed-out screen.
 *
 * Direction (per latest owner feedback):
 *   - Background: plain off-white (light grey). No brand gradient,
 *     no blurred color blobs.
 *   - Decoration: sticker-style cartoon dinosaurs and flowers
 *     scattered around the edges (handled by `<AuthDecorations />`).
 *     Reads like a pre-school flashcard wall, not a marketing page.
 *
 * Why this exists:
 *   The auth screens (/login, /forgot-password, /register) need one
 *   consistent surface so users moving between them feel they're in
 *   the same flow. AuthShell concentrates the shared chrome
 *   (background color, decoration layer, branded logo header,
 *   copyright footer, keyboard-aware scroll wrapper) so each screen
 *   only owns its own form card. Single source of truth for visual
 *   identity at the top of the funnel.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Off-white background (#FAFAFA)              │
 *   │   ┌──── sticker dinos + flowers ────┐       │
 *   │   │     scattered around edges       │       │
 *   │   │                                  │       │
 *   │   │       [LOGO]  KidsHub            │       │
 *   │   │       <subtitle prop>            │       │
 *   │   │                                  │       │
 *   │   │       ┌──────────────────────┐   │       │
 *   │   │       │  children (the card) │   │       │
 *   │   │       └──────────────────────┘   │       │
 *   │   │                                  │       │
 *   │   │       © 2026 KidsHub.            │       │
 *   │   └──────────────────────────────────┘       │
 *   └──────────────────────────────────────────────┘
 *
 * No props for the chrome — auth screens shouldn't have to think about
 * it. If we ever need a teacher-themed variant we'd take a `tone` prop
 * here, but every signed-out path today is parent-pink.
 */
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

const LOGO = require('@/assets/images/icon.png');

export function AuthShell({
  subtitle,
  children,
}: {
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* Sticker decoration layer — cartoon dinos + flowers
            scattered around the edges. Sits above the background
            color but below the scroll content (the ScrollView is the
            next sibling), so it never intercepts taps and stays
            behind the form card. Mirrors the dashboard's
            `<AnimatedAuthBackground />` so both surfaces share one
            playful visual language. */}
        <AuthDecorations />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled">
          <View className="px-6 py-10 items-center">
            <View className="w-full max-w-md">
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
