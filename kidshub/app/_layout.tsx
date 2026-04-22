import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationThemeBridge>
          {/*
            File-based routing under app/:
              /                 app/index.tsx          — role router (Redirects to the right group)
              /unauthorized     app/unauthorized.tsx   — wrong-role landing
              /login etc.       app/(auth)/*.tsx       — signed-out-only screens
              /home             app/(parent)/home.tsx  — parent's landing
              /classroom        app/(teacher)/classroom.tsx — teacher's landing

            The Stack here is just the container; each group has its own
            layout (Stack for (auth), Tabs for (parent)/(teacher)).
          */}
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </NavigationThemeBridge>
      </AuthProvider>
    </ThemeProvider>
  );
}
