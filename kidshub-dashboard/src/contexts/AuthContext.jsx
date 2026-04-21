import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ROLES, isValidRole } from '../constants/roles';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
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
          // Security rules might reject the read until they're deployed
          // (Phase 3 p3-15). Fail closed: no profile, ProtectedRoute bounces.
          console.error('Failed to load user profile:', err);
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

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const rawRole = profile?.role ?? null;
  const role = isValidRole(rawRole) ? rawRole : null;

  const value = {
    user,
    profile,
    role,
    isOwner: role === ROLES.OWNER,
    isTeacher: role === ROLES.TEACHER,
    isParent: role === ROLES.PARENT,
    loading,
    login,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
