/**
 * AuthContext — single source of truth for the current Firebase user,
 * their user profile (users/{uid} doc), and their role.
 *
 * Shape mirrors kidshub-dashboard/src/contexts/AuthContext.jsx, adapted to
 * TypeScript and this app's allowed-roles list (parent + teacher, NOT owner).
 *
 * Two subscriptions chained:
 *   1. onAuthStateChanged(auth)       — Firebase auth state (user login/logout)
 *   2. onSnapshot(users/{fbUser.uid}) — live user profile + role
 *
 * Profile read can fail if Firestore security rules reject the read before
 * they're deployed (see firestore.rules at monorepo root, tightened in p2-5b
 * and expanded in p3-15). We fail closed: profile=null → role=null →
 * ProtectedRoute (p3-13) bounces to /unauthorized.
 */
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { type Unsubscribe, doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { ROLES, type Role, isValidRole } from '@/constants/roles';
import { auth, db } from '@/firebase/config';

/**
 * Shape of the users/{uid} Firestore doc as consumed by this app. Additional
 * fields (displayName, photoURL, childIds, classroomIds, etc.) will land here
 * as we wire role-scoped queries in p3-15. Keep it an index signature so new
 * fields don't require context changes.
 */
export type UserProfile = {
  uid: string;
  role?: string;
  [key: string]: unknown;
};

export type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isTeacher: boolean;
  isParent: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      // Every auth state change should tear down the *previous* profile
      // subscription; otherwise a second login re-uses the first user's stream.
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(fbUser);
      const profileRef = doc(db, 'users', fbUser.uid);
      unsubProfile = onSnapshot(
        profileRef,
        (snap) => {
          setProfile(snap.exists() ? { uid: fbUser.uid, ...snap.data() } : null);
          setLoading(false);
        },
        (err) => {
          console.error('[AuthContext] profile snapshot failed:', err);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const rawRole = profile?.role ?? null;
  const role = isValidRole(rawRole) ? rawRole : null;

  const value: AuthContextValue = {
    user,
    profile,
    role,
    isAuthenticated: !!user,
    isOwner: role === ROLES.OWNER,
    isTeacher: role === ROLES.TEACHER,
    isParent: role === ROLES.PARENT,
    loading,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
