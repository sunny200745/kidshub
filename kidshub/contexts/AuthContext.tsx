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
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  type Unsubscribe,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import React, { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { ROLES, type Role, isValidRole } from '@/constants/roles';
import { auth, db } from '@/firebase/config';

/**
 * Input shape for parent self-registration. Teachers do NOT self-register —
 * they're invited by an owner from the dashboard (p3-14), which seeds the
 * users/{uid} doc server-side with role:'teacher' + daycareId.
 */
export type ParentRegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

/**
 * Input shape for the teacher invite-acceptance flow (p3-14). The email
 * comes from the invite doc and is NOT collected from the form (teacher
 * must register with the email the owner invited).
 */
export type AcceptTeacherInviteInput = {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
};

/**
 * Input shape for the parent invite-acceptance flow (p3-20). Mirrors
 * AcceptTeacherInviteInput; the invite-doc-provided email is used on
 * registration (not the form) for the same security reason.
 */
export type AcceptParentInviteInput = {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
};

type InviteTimestamp = { toMillis: () => number; toDate: () => Date } | null;

/**
 * Shape of a role='teacher' invites/{token} doc.
 * Mirror of kidshub-dashboard/src/firebase/api/invites.js.
 */
export type TeacherInvite = {
  token: string;
  email: string;
  role: 'teacher';
  classroomId: string;
  classroomName?: string;
  /**
   * Option B: pointer back to the dashboard's staff roster record. Required
   * on all new teacher invites issued from the dashboard. May be absent on
   * legacy (pre-Option-B) invites still sitting in Firestore.
   */
  staffId?: string;
  daycareId: string;
  invitedBy: string;
  invitedByName?: string;
  expiresAt?: InviteTimestamp;
  createdAt?: InviteTimestamp;
};

/**
 * Shape of a role='parent' invites/{token} doc (p3-20). Child-scoped instead
 * of classroom-scoped — the parent is linked to a specific child on accept.
 */
export type ParentInvite = {
  token: string;
  email: string;
  role: 'parent';
  childId: string;
  childName?: string;
  daycareId: string;
  invitedBy: string;
  invitedByName?: string;
  expiresAt?: InviteTimestamp;
  createdAt?: InviteTimestamp;
};

/** Discriminated union of all invite flavours the accept screen handles. */
export type Invite = TeacherInvite | ParentInvite;

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
  registerParent: (input: ParentRegisterInput) => Promise<FirebaseUser>;
  /** Legacy alias for fetchInvite, retained so existing teacher-only callers keep compiling. */
  fetchTeacherInvite: (token: string) => Promise<TeacherInvite | null>;
  /** p3-20: fetches ANY invite (teacher or parent). Prefer this going forward. */
  fetchInvite: (token: string) => Promise<Invite | null>;
  acceptTeacherInvite: (input: AcceptTeacherInviteInput) => Promise<FirebaseUser>;
  acceptParentInvite: (input: AcceptParentInviteInput) => Promise<FirebaseUser>;
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
  // True while a registration is mid-flight (between createUserWithEmailAndPassword
  // resolving and our setDoc(users/{uid}) completing). During this window the
  // profile snapshot will fire with no doc, which would otherwise make role=null
  // and bounce the user to /unauthorized. Holding `loading=true` keeps the role
  // router on its splash screen until the profile doc actually exists.
  const [registering, setRegistering] = useState(false);

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

      // Flip loading=true the moment we know there IS a signed-in user but
      // we haven't read their profile yet. Without this, after a login the
      // order is:
      //   1. onAuthStateChanged fires → setUser(fbUser) → isAuthenticated=true
      //   2. BUT loading=false (carried over from the previous anon state)
      //   3. RoleRouter evaluates: !loading && isAuthenticated && role=null
      //      → Redirect to /unauthorized (one-frame flash)
      //   4. ~50ms later profile snapshot fires → role='parent' → self-heal
      //      bounces back to / → role router redirects to /home
      // With loading=true here, step 3 renders RouteSplash instead and the
      // user only sees the correct destination.
      setUser(fbUser);
      setProfile(null);
      setLoading(true);

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

  /**
   * Parent self-registration flow:
   *   1. createUserWithEmailAndPassword — Firebase Auth account
   *   2. updateProfile                  — set displayName for nicer UX
   *   3. setDoc(users/{uid})            — role:'parent' + profile fields
   *
   * The users/{uid} write MUST happen with the user signed in (not via Admin
   * SDK) so Firestore rules can require request.auth.uid == userId. The
   * onAuthStateChanged subscription will then pick up the new doc and the
   * role router (app/index.tsx) will redirect to /home.
   *
   * Orphan-recovery path: if the auth account was created on a previous
   * attempt but the users/{uid} setDoc failed (e.g. because the Firestore
   * rules for parent self-signup hadn't been deployed yet), Firebase will
   * throw 'auth/email-already-in-use' on retry. In that case we sign the
   * user in with the same credentials and write the missing profile doc.
   * This is safe because the orphan-recovery branch still requires the
   * caller to know the existing password — they can't claim someone else's
   * orphan.
   *
   * Cleaning up orphan auth accounts where the password is forgotten is a
   * Cloud Function / Admin SDK job (tracked alongside p3-14).
   */
  const registerParent = async (input: ParentRegisterInput) => {
    const { firstName, lastName, email, password, phone } = input;

    // Hold AuthContext.loading=true through the whole flow so the role router
    // doesn't briefly see role=null between createUser and setDoc completing.
    setRegistering(true);
    setLoading(true);

    try {
      let fbUser: FirebaseUser;
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        fbUser = credential.user;
        await updateProfile(fbUser, {
          displayName: `${firstName.trim()} ${lastName.trim()}`,
        });
      } catch (err: unknown) {
        const code = (err as { code?: string } | null)?.code;
        if (code !== 'auth/email-already-in-use') {
          throw err;
        }
        // Auth account already exists. If the caller knows the password, this
        // is almost certainly an orphan from a prior failed registration
        // (likely a Firestore-rules rejection on the users/{uid} write). Sign
        // in and heal the missing profile doc below. If the password is wrong,
        // signInWithEmailAndPassword will throw 'auth/wrong-password' which
        // bubbles up to the form unchanged.
        const credential = await signInWithEmailAndPassword(auth, email, password);
        fbUser = credential.user;
        // Best-effort displayName backfill — ignore failures because some auth
        // configurations forbid it post-creation.
        try {
          await updateProfile(fbUser, {
            displayName: `${firstName.trim()} ${lastName.trim()}`,
          });
        } catch {
          // intentionally swallowed — displayName is cosmetic
        }
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role: ROLES.PARENT,
        childIds: [],
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return fbUser;
    } finally {
      // Release the loading hold. The profile snapshot listener will be the
      // one that flips loading=false (with the new doc populated). If it's
      // already fired with the freshly-written doc by now, this is a no-op.
      setRegistering(false);
    }
  };

  /**
   * Fetch an invite doc by token (teacher OR parent — p3-20). Returns null
   * if the token doesn't resolve to an invite (deleted/invalid). Firestore
   * rules allow open read on invites/{token} because the token IS the
   * unguessable capability.
   *
   * Used by /invite/[token] to render either the accept form or a "this
   * invite is no longer valid" screen. Expiry is checked client-side here
   * via expiresAt — see the rationale in firestore.rules.
   */
  const fetchInvite = async (token: string): Promise<Invite | null> => {
    if (!token) return null;
    const snap = await getDoc(doc(db, 'invites', token));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<Invite, 'token'>;
    return { token: snap.id, ...data } as Invite;
  };

  /**
   * Back-compat shim — narrows fetchInvite() to teacher invites only so
   * existing callers (the teacher-only accept screen, tests, etc.) keep
   * their stricter TeacherInvite return type. New callers should use
   * fetchInvite() directly.
   */
  const fetchTeacherInvite = async (token: string): Promise<TeacherInvite | null> => {
    const result = await fetchInvite(token);
    if (!result || result.role !== 'teacher') return null;
    return result;
  };

  /**
   * Teacher invite acceptance flow:
   *   1. Re-fetch invite (defensive — protects against UI showing a stale
   *      invite that was revoked between page load and submit).
   *   2. createUserWithEmailAndPassword(invite.email, password). The email
   *      MUST come from the invite, not from any form field — the Firestore
   *      rule for users/{uid} create with role='teacher' compares
   *      request.auth.token.email (set by Firebase Auth from the registered
   *      email) against the invite's email field.
   *   3. setDoc(users/{uid}, { role:'teacher', inviteToken: token, ... }).
   *      The Firestore rule walks the inviteToken back to the invite doc and
   *      verifies email + role match.
   *   4. deleteDoc(invites/{token}). Allowed by rule for the invitee email.
   *      Best-effort — if it fails (e.g. permission timing), the invite just
   *      lingers and the owner can revoke it manually. Doesn't block success.
   *
   * Like registerParent, we hold AuthContext.loading=true through the whole
   * flow so the role router never briefly sees role=null.
   *
   * Edge cases (caller should surface friendly messages):
   *   - 'auth/email-already-in-use'  — teacher already has an account.
   *     We do NOT auto-merge here (security risk: someone with a parent
   *     account on this email shouldn't get auto-promoted to teacher).
   *     The owner needs to revoke + reissue, or the teacher needs a
   *     different email.
   *   - invite expired                — caller should check expiresAt and
   *     not even submit. We re-check defensively below for completeness.
   */
  const acceptTeacherInvite = async (
    input: AcceptTeacherInviteInput
  ): Promise<FirebaseUser> => {
    const { token, firstName, lastName, password } = input;

    setRegistering(true);
    setLoading(true);

    try {
      const invite = await fetchTeacherInvite(token);
      if (!invite) {
        throw new Error(
          'This invite link is no longer valid. Ask your daycare for a new one.'
        );
      }
      if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
        throw new Error(
          'This invite has expired. Ask your daycare to send you a new one.'
        );
      }

      const credential = await createUserWithEmailAndPassword(auth, invite.email, password);
      const fbUser = credential.user;

      await updateProfile(fbUser, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // Option B: if the invite points at a staff roster record, stamp
      // linkedStaffId on the users doc so the two collections are joined
      // going forward. Firestore rule for teacher-create enforces this
      // matches invite.staffId.
      const userDocPayload: Record<string, unknown> = {
        uid: fbUser.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: invite.email,
        role: ROLES.TEACHER,
        classroomId: invite.classroomId,
        daycareId: invite.daycareId,
        inviteToken: token,
        invitedBy: invite.invitedBy,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (invite.staffId) {
        userDocPayload.linkedStaffId = invite.staffId;
      }

      await setDoc(doc(db, 'users', fbUser.uid), userDocPayload);

      // Option B: flip the staff roster record to appStatus='active' and
      // stamp linkedUserId. Allowed by the staff update rule's teacher
      // branch — scoped to this user's own record via email match. Best
      // effort: if the staff record was deleted between invite create and
      // accept, the teacher still has a working app account; the owner
      // can reconcile by re-adding the staff entry (unusual path).
      if (invite.staffId) {
        try {
          await updateDoc(doc(db, 'staff', invite.staffId), {
            linkedUserId: fbUser.uid,
            appStatus: 'active',
            updatedAt: serverTimestamp(),
          });
        } catch (staffErr) {
          console.warn(
            '[AuthContext] could not link staff record on accept:',
            staffErr
          );
        }
      }

      // Best-effort cleanup. Failure here is non-fatal — the invite just
      // shows up as "consumed but not deleted" in the dashboard, and the
      // owner can revoke it manually. The token can't be re-used anyway
      // because the email is now registered.
      try {
        await deleteDoc(doc(db, 'invites', token));
      } catch (deleteErr) {
        console.warn('[AuthContext] failed to delete consumed invite:', deleteErr);
      }

      return fbUser;
    } finally {
      setRegistering(false);
    }
  };

  /**
   * Parent invite acceptance flow (p3-20). Shape parallels
   * acceptTeacherInvite, with two extra steps at the end:
   *
   *   1. Re-fetch invite (defensive — protects against a revoke between
   *      page load and submit).
   *   2. createUserWithEmailAndPassword(invite.email, password) — email comes
   *      from the invite so the Firestore rule for users create with
   *      role='parent'+inviteToken can compare request.auth.token.email.
   *   3. setDoc(users/{uid}, { role:'parent', childIds:[invite.childId],
   *      daycareId: invite.daycareId, inviteToken: token, ... }). The rule
   *      walks the inviteToken back to the invite doc and verifies the
   *      email + role + daycareId + childId match.
   *   4. updateDoc(children/{invite.childId}, { parentIds: arrayUnion(uid) }).
   *      The rule (p3-20 `isParent()` branch on children.update) allows this
   *      because the parent's users doc already has childId in childIds
   *      (set in step 3), and they're only adding themselves.
   *   5. deleteDoc(invites/{token}). Allowed by rule for the invitee email.
   *      Best-effort — non-fatal if it fails.
   *
   * Edge cases (caller should surface friendly messages):
   *   - 'auth/email-already-in-use' — parent already has a Firebase Auth
   *     account on this email. We do NOT auto-merge: a dormant self-signup
   *     parent shouldn't get auto-linked to this daycare without explicit
   *     consent. The owner can revoke + reissue to a different email, or
   *     the parent uses a different email.
   *   - child not in invite's tenant: blocked by the setDoc rule check.
   *   - parentIds update fails: non-fatal, we still return the user but
   *     the parent's child read won't unlock until the owner re-runs
   *     linkParentToChild manually. We surface a warning console log.
   */
  const acceptParentInvite = async (
    input: AcceptParentInviteInput
  ): Promise<FirebaseUser> => {
    const { token, firstName, lastName, password, phone } = input;

    setRegistering(true);
    setLoading(true);

    try {
      const invite = await fetchInvite(token);
      if (!invite) {
        throw new Error(
          'This invite link is no longer valid. Ask your daycare for a new one.'
        );
      }
      if (invite.role !== 'parent') {
        throw new Error('This invite is not a parent invite.');
      }
      if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
        throw new Error(
          'This invite has expired. Ask your daycare to send you a new one.'
        );
      }

      const credential = await createUserWithEmailAndPassword(auth, invite.email, password);
      const fbUser = credential.user;

      await updateProfile(fbUser, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: invite.email,
        phone: phone?.trim() || null,
        role: ROLES.PARENT,
        childIds: [invite.childId],
        daycareId: invite.daycareId,
        inviteToken: token,
        invitedBy: invite.invitedBy,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add self to children/{childId}.parentIds so the child-read rule
      // unlocks (rule: `uid in parentIds` AND `childId in userChildIds()`).
      try {
        await updateDoc(doc(db, 'children', invite.childId), {
          parentIds: arrayUnion(fbUser.uid),
          updatedAt: serverTimestamp(),
        });
      } catch (linkErr) {
        console.warn(
          '[AuthContext] failed to arrayUnion parent into child.parentIds:',
          linkErr
        );
      }

      try {
        await deleteDoc(doc(db, 'invites', token));
      } catch (deleteErr) {
        console.warn('[AuthContext] failed to delete consumed parent invite:', deleteErr);
      }

      return fbUser;
    } finally {
      setRegistering(false);
    }
  };

  const rawRole = profile?.role ?? null;
  const role = isValidRole(rawRole) ? rawRole : null;

  // `registering` masks loading=true even after the snapshot listener flips it
  // to false (which can happen mid-registration if the snapshot fires before
  // setDoc resolves). Without this mask, the role router would see role=null
  // and bounce the new user to /unauthorized for ~50ms.
  const effectiveLoading = loading || registering;

  const value: AuthContextValue = {
    user,
    profile,
    role,
    isAuthenticated: !!user,
    isOwner: role === ROLES.OWNER,
    isTeacher: role === ROLES.TEACHER,
    isParent: role === ROLES.PARENT,
    loading: effectiveLoading,
    login,
    logout,
    resetPassword,
    registerParent,
    fetchTeacherInvite,
    fetchInvite,
    acceptTeacherInvite,
    acceptParentInvite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
