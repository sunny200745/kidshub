/**
 * Friendly user-facing copy for Firebase Auth error codes.
 *
 * Firebase throws errors like { code: 'auth/invalid-credential', message: ... }
 * but `message` leaks SDK noise (e.g. "Firebase: Error (auth/...).") which is
 * useless to a parent on a phone. We map known codes to plain English; for
 * unknown codes we return a generic fallback and log the raw error so it
 * still shows up in dev tools.
 */

export type FirebaseAuthErrorLike = {
  code?: string;
  message?: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/user-disabled': 'This account has been disabled. Contact your daycare for help.',
};

export function getFriendlyAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err || typeof err !== 'object') return fallback;
  const code = (err as FirebaseAuthErrorLike).code;
  if (code && code in AUTH_ERROR_MESSAGES) return AUTH_ERROR_MESSAGES[code];
  return fallback;
}
