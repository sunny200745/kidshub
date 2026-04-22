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

export const unstable_settings = {
  anchor: '(tabs)',
};

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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeBridge>
      </AuthProvider>
    </ThemeProvider>
  );
}
