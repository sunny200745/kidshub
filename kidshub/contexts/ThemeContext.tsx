/**
 * ThemeContext — user-facing theme preference layered on top of the OS's
 * system color scheme.
 *
 * Three preference states:
 *   'system' (default) — follow OS setting (useColorScheme from react-native)
 *   'light'            — force light regardless of OS
 *   'dark'             — force dark regardless of OS
 *
 * Exposes:
 *   preference          current user pick (system | light | dark)
 *   setPreference(p)    update the pick
 *   effective           the actual theme to render ('light' | 'dark')
 *
 * Persistence: in-memory only for now (choice resets on cold start). Adding
 * AsyncStorage persistence is a polish item — tracked loosely under p3-6
 * follow-up; will land the same time we add AsyncStorage for Firebase auth
 * RN persistence in p3-16 (one install serves both).
 */
import React, { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  effective: EffectiveTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  const effective = useMemo<EffectiveTheme>(() => {
    if (preference === 'light' || preference === 'dark') return preference;
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [preference, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, setPreference, effective }),
    [preference, effective]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
