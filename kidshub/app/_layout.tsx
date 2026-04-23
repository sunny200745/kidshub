import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { ComingSoonWeb } from '@/components/coming-soon-web';
import { ENABLE_WEB_APP } from '@/constants/flags';
import { AuthProvider, ThemeProvider, useTheme } from '@/contexts';

// Bridges our ThemeContext.effective ('light' | 'dark') into React Navigation's
// theme provider so header / tab / stack chrome flip with user preference.
// Has to live INSIDE <ThemeProvider>, so we factor it out to keep RootLayout flat.
function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { effective } = useTheme();
  return (
    <NavigationThemeProvider value={effective === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  // B1 (PRODUCT_PLAN Sprint 1): on web, if the web app is disabled via the
  // runtime flag, short-circuit to a "get the mobile app" splash. Rendered
  // without any Auth / Theme providers because it's a fully static page —
  // keeps the bundle's web entry fast and avoids Firebase init on web
  // when we explicitly DON'T want web users in the app.
  //
  // Override: set EXPO_PUBLIC_ENABLE_WEB_APP=true to re-enable web at
  // build time. See kidshub/constants/flags.ts.
  if (Platform.OS === 'web' && !ENABLE_WEB_APP) {
    return <ComingSoonWeb />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationThemeBridge>
          {/*
            File-based routing under app/:
              /                 app/index.tsx              — role router (Redirects to the right group)
              /unauthorized     app/unauthorized.tsx       — wrong-role landing
              /login etc.       app/(auth)/*.tsx           — signed-out-only screens
              /invite/{token}   app/invite/[token].tsx     — teacher invite acceptance (open route)
              /home             app/(parent)/home.tsx      — parent's landing
              /classroom        app/(teacher)/classroom.tsx — teacher's landing

            The Stack here is just the container; each group has its own
            layout (Stack for (auth), Tabs for (parent)/(teacher)). The
            invite route lives outside any group so it's reachable by both
            anonymous teachers (the common case) and signed-in users (who
            see a "sign out to continue" card).
          */}
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </NavigationThemeBridge>
      </AuthProvider>
    </ThemeProvider>
  );
}
