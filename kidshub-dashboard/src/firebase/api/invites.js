/**
 * invitesApi — owner-issued invites for teachers (p3-14) and parents (p3-20).
 *
 * Data model (see firestore.rules `match /invites/{token}`):
 *   invites/{token} {
 *     email          string  — locked, invitee must register w/ exactly this
 *     role           'teacher' | 'parent'
 *     daycareId      string  (= inviter's uid; enforced by rule)
 *     invitedBy      string  (= owner's uid; required by Firestore rule)
 *     invitedByName  string  (denormalized for the kidshub accept screen)
 *
 *     // teacher invites
 *     classroomId    string  (required when role='teacher')
 *     classroomName  string  (denormalized label for accept screen)
 *
 *     // parent invites
 *     childId        string  (required when role='parent')
 *     childName      string  (denormalized label for accept screen)
 *
 *     createdAt      timestamp (serverTimestamp)
 *     expiresAt      timestamp (Date object, createdAt + 7 days)
 *   }
 *
 * The doc ID is the URL-unguessable token itself (crypto.randomUUID()).
 * Rules allow open read by anyone who has the token, so the kidshub
 * /invite/[token] route can fetch it without the invitee being signed in.
 *
 * NOTE: invitedBy is enforced by the security rule (must equal request.auth.uid),
 * so callers MUST pass it explicitly — we don't infer it here, because this
 * file has no AuthContext access. See InviteTeacherModal / InviteParentModal
 * for the wire-up.
 */
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '../config';

const COLLECTION = 'invites';

/** 7 days in milliseconds — invite TTL. */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cryptographically strong, URL-safe token. Used as the invites doc ID and
 * as the `/invite/{token}` URL slug in kidshub.
 *
 * crypto.randomUUID() is available in all evergreen browsers (Chrome 92+,
 * Firefox 95+, Safari 15.4+) and matches the dashboard's browser support
 * matrix. ~122 bits of entropy is more than enough for an unguessable URL
 * capability.
 */
export function generateInviteToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: random bytes hex-encoded. Should never run in practice.
  const bytes = new Uint8Array(16);
  (crypto || globalThis.crypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const invitesApi = {
  /**
   * Create a new teacher invite. Returns the persisted invite (including the
   * token, which the caller will paste into a URL like
   * `https://app.getkidshub.com/invite/{token}`).
   *
   * @param {object} input
   * @param {string} input.email           — teacher's email; lowercased + trimmed
   * @param {string} input.classroomId     — required
   * @param {string} input.classroomName   — denormalized label, shown to teacher
   * @param {string} input.invitedBy       — owner's uid (must equal request.auth.uid)
   * @param {string} input.invitedByName   — denormalized label, shown to teacher
   * @param {string} [input.daycareId]     — defaults to invitedBy (1 owner = 1 daycare in pilot)
   */
  async create({
    email,
    classroomId,
    classroomName,
    invitedBy,
    invitedByName,
    daycareId,
  }) {
    if (!email || !classroomId || !invitedBy) {
      throw new Error('invitesApi.create: email, classroomId, and invitedBy are required.');
    }

    const token = generateInviteToken();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + INVITE_TTL_MS));

    const payload = {
      email: email.trim().toLowerCase(),
      role: 'teacher',
      classroomId,
      classroomName: classroomName || '',
      daycareId: daycareId || invitedBy,
      invitedBy,
      invitedByName: invitedByName || '',
      createdAt: serverTimestamp(),
      expiresAt,
    };

    await setDoc(doc(db, COLLECTION, token), payload);

    return { token, ...payload, expiresAt: expiresAt.toDate() };
  },

  /**
   * Create a new parent invite (p3-20). Parallels create() above but scoped
   * to a specific child instead of a classroom. The parent accepts via
   * /invite/{token} in kidshub, which stamps childIds=[childId] + daycareId
   * on their users/{uid} doc and arrayUnions their uid into the child's
   * parentIds.
   *
   * @param {object} input
   * @param {string} input.email          — parent's email; lowercased + trimmed
   * @param {string} input.childId        — required
   * @param {string} input.childName      — denormalized label, shown to parent
   * @param {string} input.invitedBy      — owner's uid (must equal request.auth.uid)
   * @param {string} input.invitedByName  — denormalized label, shown to parent
   * @param {string} [input.daycareId]    — defaults to invitedBy
   */
  async createParentInvite({
    email,
    childId,
    childName,
    invitedBy,
    invitedByName,
    daycareId,
  }) {
    if (!email || !childId || !invitedBy) {
      throw new Error('invitesApi.createParentInvite: email, childId, and invitedBy are required.');
    }

    const token = generateInviteToken();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + INVITE_TTL_MS));

    const payload = {
      email: email.trim().toLowerCase(),
      role: 'parent',
      childId,
      childName: childName || '',
      daycareId: daycareId || invitedBy,
      invitedBy,
      invitedByName: invitedByName || '',
      createdAt: serverTimestamp(),
      expiresAt,
    };

    await setDoc(doc(db, COLLECTION, token), payload);

    return { token, ...payload, expiresAt: expiresAt.toDate() };
  },

  /**
   * Fetch an invite by its token. Returns null if not found.
   * Rules allow this without authentication — the token is the capability.
   */
  async getByToken(token) {
    if (!token) return null;
    const snap = await getDoc(doc(db, COLLECTION, token));
    if (!snap.exists()) return null;
    return { token: snap.id, ...snap.data() };
  },

  /**
   * Revoke (delete) a pending invite. The Firestore rule allows deletion by
   * the inviter (for revoke) or by the invitee email (for consume-on-accept).
   */
  async delete(token) {
    if (!token) throw new Error('invitesApi.delete: token is required.');
    await deleteDoc(doc(db, COLLECTION, token));
  },

  /**
   * Real-time subscription to all pending invites for a given owner. The
   * dashboard Staff page renders this as a "Pending invites" section so the
   * owner can copy URLs / revoke without page reload.
   *
   * @param {string} ownerUid    — request.auth.uid of the dashboard user
   * @param {(invites: object[]) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribeForOwner(ownerUid, callback) {
    if (!ownerUid) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION), where('invitedBy', '==', ownerUid));
    return onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs
          .map((d) => ({ token: d.id, ...d.data() }))
          .sort((a, b) => {
            // Newest first. createdAt may be null for the first frame after
            // create() while serverTimestamp resolves; treat null as "now".
            const aMs = a.createdAt?.toMillis?.() ?? Date.now();
            const bMs = b.createdAt?.toMillis?.() ?? Date.now();
            return bMs - aMs;
          });
        callback(invites);
      },
      (error) => {
        console.error('Error subscribing to invites:', error);
        callback([]);
      }
    );
  },

  /**
   * Real-time subscription to pending parent invites for a specific child.
   * Used by the ChildProfile page to show "Pending invites" alongside
   * linked parents.
   *
   * @param {string} childId
   * @param {(invites: object[]) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribeForChild(childId, callback) {
    if (!childId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, COLLECTION),
      where('role', '==', 'parent'),
      where('childId', '==', childId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs
          .map((d) => ({ token: d.id, ...d.data() }))
          .sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() ?? Date.now();
            const bMs = b.createdAt?.toMillis?.() ?? Date.now();
            return bMs - aMs;
          });
        callback(invites);
      },
      (error) => {
        console.error('Error subscribing to child invites:', error);
        callback([]);
      }
    );
  },
};
