/**
 * Firebase web SDK config for the kidshub Expo app.
 *
 * Architecture decision (locked in Phase 3 prep, see RESTRUCTURE_PLAN.md):
 *   - Firebase JS SDK over @react-native-firebase, so one code path serves
 *     web + iOS + Android. When push notifications become a priority,
 *     swap *only* the messaging layer to @react-native-firebase/messaging
 *     without touching the data layer.
 *
 * Auth persistence (why this file is a little weird):
 *   - On web, getAuth() auto-registers an Auth component with IndexedDB
 *     persistence. Done.
 *   - On iOS/Android, getAuth() throws "Component auth has not been
 *     registered yet" because the Firebase JS SDK doesn't ship a
 *     React-Native-aware Auth component by default. You MUST call
 *     initializeAuth(app, { persistence: getReactNativePersistence(...) })
 *     exactly once per app instance. After that, getAuth() works as
 *     normal and returns the same instance.
 *
 *   - Fast Refresh / hot reload makes this tricky: re-evaluating this
 *     module would call initializeAuth a second time, which throws
 *     "Firebase: Auth has already been initialized". We wrap it in
 *     try/catch and fall back to getAuth() when that happens.
 *
 *   - getReactNativePersistence isn't re-exported from the public
 *     'firebase/auth' TypeScript surface in v10 (it's marked internal)
 *     so we pull it via a runtime require to sidestep the type error.
 *     This is the documented pattern — see
 *     https://firebase.google.com/docs/auth/web/start#web-namespaced-api_3
 *     and the Expo docs' Firebase guide.
 *
 * Env vars:
 *   - Expo exposes process.env.EXPO_PUBLIC_* to client code at build time.
 *   - The web API key is NOT a secret (it's HTTP-referrer-locked in GCP
 *     Console for web, and for native is protected by app bundle ID +
 *     Play integrity / App Attest).
 *   - Same Firebase project as kidshub-dashboard and kidshub-landing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Hot reload safety: re-importing this module shouldn't try to initialize
// Firebase a second time (it'd throw). getApps() returns the registered list.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Create the Auth instance with the right persistence layer for the
 * current platform. See the module-level doc comment for the "why".
 */
function initAuthForPlatform(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // getReactNativePersistence is exported at runtime but not in the
    // public TS surface in firebase@10 — runtime-require to dodge the
    // type error without disabling typescript checks in this file.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth');
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (err) {
    // initializeAuth throws if it was already called on this app (happens
    // on Fast Refresh). In that case getAuth returns the already-configured
    // instance, so we silently recover.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already-initialized') || message.includes('already been initialized')) {
      return getAuth(app);
    }
    throw err;
  }
}

export const auth: Auth = initAuthForPlatform();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
