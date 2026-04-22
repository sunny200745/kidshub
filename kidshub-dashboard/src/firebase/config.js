/**
 * Firebase web SDK config for the kidshub-dashboard owner portal.
 *
 * Mirror of kidshub/firebase/config.ts (Expo version) — same Firebase project
 * (kidhub-7a207), same collections, different env var prefix because Vite's
 * convention is VITE_* while Expo's is EXPO_PUBLIC_*.
 *
 * Env vars:
 *   - Vite inlines import.meta.env.VITE_* at build time.
 *   - The web API key is NOT a secret — it's HTTP-referrer-locked in GCP Console
 *     (getkidshub.com, *.getkidshub.com, *.vercel.app, localhost).
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Hot-reload safety: re-importing this module during HMR shouldn't try to
// initializeApp twice (it'd throw "Firebase App named '[DEFAULT]' already
// exists"). Mirrors the guard in kidshub/firebase/config.ts.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
