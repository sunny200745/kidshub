/**
 * AuthShell — shared chrome for every signed-out screen
 * (/login, /forgot-password, /register).
 *
 * Direction (per latest owner feedback): match the dashboard's mobile
 * / tablet auth treatment — same "+" pattern, same brand-pink + accent-
 * purple soft blobs, same six floating sticker characters — but on a
 * LIGHT base color so the parent / staff app stays bright and friendly.
 * The full decoration recipe is in `<AuthDecorations />`; this shell
 * just composes the chrome around it.
 *
 * Why this exists:
 *   The auth screens need one consistent surface so users moving
 *   between them feel they're in the same flow. AuthShell concentrates
 *   the shared chrome (background color, decoration layer, branded
 *   logo header, audience pill, copyright footer, keyboard-aware
 *   scroll wrapper) so each screen only owns its own form card.
 *   Single source of truth for visual identity at the top of the
 *   funnel.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Off-white background (#FAFAFA)              │
 *   │   .  +  .  +  .  +  .  +  .  +  .  +  .  +   │  <-- "+" pattern
 *   │  ◌ floating sticker dinos + flowers ◌        │  <-- AuthDecorations
 *   │   .  +  .  +  .  +  .  +  .  +  .  +  .  +   │
 *   │                                              │
 *   │       [LOGO]  KidsHub                        │
 *   │       (Parent & Teacher Portal)              │
 *   │       <subtitle prop>                        │
 *   │                                              │
 *   │       ┌──────────────────────┐               │
 *   │       │  children (the card) │               │
 *   │       └──────────────────────┘               │
 *   │                                              │
 *   │       © 2026 KidsHub.                        │
 *   └──────────────────────────────────────────────┘
 *
 * The "Parent & Teacher Portal" pill mirrors the "Owner Portal" pill
 * on the dashboard auth screens — same visual treatment (light brand-
 * pink fill, brand-pink border + text), different copy. Two reasons
 * for it on this surface:
 *   1. Anti-misdirect: this app is the SHARED entry point for parents
 *      and teachers/staff. New users sometimes land here looking for
 *      the owner dashboard (and vice-versa). A visible audience badge
 *      tells them in one glance "yes, this is the right portal" or
 *      "no, you want the other one (app.getkidshub.com)".
 *   2. Brand parity with the dashboard: owners switching between the
 *      two products see the same chip-style audience marker on both
 *      auth screens, so they feel like one product family rather than
 *      two unrelated apps.
 *
 * No props for the chrome — auth screens shouldn't have to think about
 * it. If we ever need a dark-mode-tuned tone or a teacher-themed
 * variant we'd take a `tone` prop here, but every signed-out path
 * today uses identical chrome.
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
        {/* Decoration layer sits BEHIND the ScrollView (rendered first,
            absolute-positioned). The form card scrolls in front of a
            fixed sticker scene — characters stay anchored to the
            viewport corners while the form itself scrolls on small
            screens. `pointer-events: none` inside AuthDecorations
            ensures it never steals taps from the form. */}
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
                {/* Audience pill — see comment at the top of this file
                    for the full rationale. Light brand-pink fill +
                    brand-pink border/text mirrors the "Owner Portal"
                    chip on the dashboard auth screens; the only thing
                    that changes is the copy ("Parent & Teacher Portal"
                    here vs "Owner Portal" there). Sized small so it
                    reads as a label, not a CTA. */}
                <View className="mt-3 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 dark:bg-brand-900/30 dark:border-brand-800/60">
                  <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">
                    Parent & Teacher Portal
                  </Text>
                </View>
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
