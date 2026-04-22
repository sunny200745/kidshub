/**
 * Firebase web SDK config for the kidshub Expo app.
 *
 * Architecture decision (locked in Phase 3 prep, see RESTRUCTURE_PLAN.md):
 *   - Firebase JS SDK over @react-native-firebase, so one code path serves
 *     web + iOS + Android. When push notifications become a priority,
 *     swap *only* the messaging layer to @react-native-firebase/messaging
 *     without touching the data layer.
 *
 * Auth persistence:
 *   - On web, getAuth() defaults to IndexedDB persistence — works out of box.
 *   - On native (iOS/Android), getAuth() warns about no persistence and
 *     defaults to in-memory (user gets logged out on app restart). Proper
 *     RN persistence requires initializeAuth() + getReactNativePersistence()
 *     + AsyncStorage. We're deferring that to p3-16 (mobile build config)
 *     since we're testing on web first; the warning is cosmetic and the auth
 *     flow itself works fine on RN.
 *
 * Env vars:
 *   - Expo exposes process.env.EXPO_PUBLIC_* to client code at build time.
 *   - The web API key is NOT a secret (it's HTTP-referrer-locked in GCP Console).
 *   - Same Firebase project as kidshub-dashboard and kidshub-landing.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

export const auth: Auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
