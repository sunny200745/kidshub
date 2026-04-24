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
import { staffApi } from './staff';
import { parentsApi, parentChildIds } from './parents';
import { emailApi } from './email';

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
    staffId,
    classroomId,
    classroomName,
    invitedBy,
    invitedByName,
    daycareId,
  }) {
    if (!email || !staffId || !classroomId || !invitedBy) {
      throw new Error(
        'invitesApi.create: email, staffId, classroomId, and invitedBy are required.'
      );
    }

    const token = generateInviteToken();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + INVITE_TTL_MS));

    const payload = {
      email: email.trim().toLowerCase(),
      role: 'teacher',
      staffId,
      classroomId,
      classroomName: classroomName || '',
      daycareId: daycareId || invitedBy,
      invitedBy,
      invitedByName: invitedByName || '',
      createdAt: serverTimestamp(),
      expiresAt,
    };

    await setDoc(doc(db, COLLECTION, token), payload);

    // Flip the staff card's app-status badge. Best-effort: if the update
    // fails (e.g. stale client), the invite still exists and the accept
    // flow will heal by setting appStatus='active' directly.
    try {
      await staffApi.setAppStatusInvited(staffId);
    } catch (err) {
      console.warn('[invitesApi.create] could not flip staff.appStatus to invited:', err);
    }

    // Fire off the "Activate your account" email. Best-effort — if Resend
    // is down or the endpoint is misconfigured, the invite still exists
    // and the owner can fall back to copying the URL manually. We log but
    // never throw so the owner's happy path stays unblocked.
    let emailSent = false;
    let emailError = null;
    try {
      await emailApi.sendInvite(token);
      emailSent = true;
    } catch (err) {
      emailError = err;
      console.warn('[invitesApi.create] invite email delivery failed:', err);
    }

    return { token, ...payload, expiresAt: expiresAt.toDate(), emailSent, emailError };
  },

  /**
   * Create a new parent invite. Direct mirror of create() above for parents,
   * with the same Option B linkage to a pre-existing roster record.
   *
   * The parent accepts via /invite/{token} in kidshub, which:
   *   1. creates users/{uid} with role='parent' + linkedParentId=parentId
   *      (when parentId is present) + childIds populated from the parent
   *      record's childIds[] (so siblings are linked in one pass);
   *   2. arrayUnions uid into each child's parentIds;
   *   3. flips parents/{parentId}.appStatus='active' + linkedUserId=uid.
   *
   * `parentId` is optional for backwards compatibility with the legacy
   * ChildProfile "Invite parent to app" path (which still uses childId
   * only). When absent, the kidshub accept flow falls back to the
   * single-child legacy path. New invites issued from the Parents page
   * always pass parentId.
   *
   * @param {object} input
   * @param {string}  input.email          — parent's email; lowercased + trimmed
   * @param {string}  input.childId        — REQUIRED, primary child for the
   *                                         accept-screen banner ("invited to
   *                                         connect with {childName}")
   * @param {string}  [input.parentId]     — pre-existing parents/{id} record id
   *                                         (Option B). When present, accept
   *                                         flow links ALL siblings on the
   *                                         parent record; when absent, just
   *                                         the single childId is linked.
   * @param {string}  [input.childName]    — denormalized label, shown to parent
   * @param {string}  input.invitedBy      — owner's uid (must equal request.auth.uid)
   * @param {string}  [input.invitedByName]— denormalized label, shown to parent
   * @param {string}  [input.daycareId]    — defaults to invitedBy
   */
  async createParentInvite({
    email,
    childId,
    parentId,
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

    // Build the payload conditionally — Firestore stores `undefined` as a
    // missing field, but explicitly omitting parentId from the object
    // makes the intent obvious to anyone reading invite docs in the
    // console. When parentId IS passed, it lands as a plain string so
    // the rule comment ("parentId — OPTIONAL string") matches reality.
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
    if (typeof parentId === 'string' && parentId.length > 0) {
      payload.parentId = parentId;

      // Denormalize the parent record's childIds onto the invite doc so the
      // accept flow can link ALL siblings in one pass without needing a
      // post-auth read on parents/{parentId} (the parents-read rule scopes
      // to records already linked to the requester's uid, which is null
      // until self-link completes — chicken-and-egg).
      //
      // Pre-read is best-effort: if it fails (transient permission, deleted
      // record), we still create the invite with just `childId` and the
      // accept flow falls back to single-child linking.
      try {
        const parentRecord = await parentsApi.getById(parentId);
        const siblingIds = parentChildIds(parentRecord);
        // Always include the primary childId (defends against a record that
        // was edited to remove the child between invite click and create).
        const merged = Array.from(new Set([childId, ...siblingIds]));
        if (merged.length > 0) {
          payload.childIds = merged;
        }
      } catch (err) {
        console.warn(
          '[invitesApi.createParentInvite] could not denormalize parent.childIds onto invite:',
          err
        );
      }
    }

    await setDoc(doc(db, COLLECTION, token), payload);

    // Mirror of the staff path in create(): if this invite is anchored to
    // a parents/{id} roster record, flip its app-status badge to "Pending
    // invite". Best-effort — if the update fails (stale client, deleted
    // record, transient permission), the invite still exists and the
    // accept flow will heal by setting appStatus='active' directly via
    // its own Firestore-rule-allowed self-link branch.
    if (payload.parentId) {
      try {
        await parentsApi.setAppStatusInvited(payload.parentId);
      } catch (err) {
        console.warn(
          '[invitesApi.createParentInvite] could not flip parents.appStatus to invited:',
          err
        );
      }
    }

    // Best-effort invite email (see create() above for rationale).
    let emailSent = false;
    let emailError = null;
    try {
      await emailApi.sendInvite(token);
      emailSent = true;
    } catch (err) {
      emailError = err;
      console.warn('[invitesApi.createParentInvite] invite email delivery failed:', err);
    }

    return { token, ...payload, expiresAt: expiresAt.toDate(), emailSent, emailError };
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
   *
   * Option B (teacher + parent): pre-read the invite to find any roster
   * record it points at (staffId for teachers, parentId for parents) and
   * reset that record's appStatus back to 'none' AFTER the delete lands,
   * so the "Invite to app" affordance returns on the owner UI. Pre-read
   * is a separate getDoc rather than waiting for the snapshot listener
   * to fire because the listener may run AFTER the deleteDoc completes.
   *
   * Failure modes are intentionally non-fatal:
   *   - Pre-read fails  → log + skip the reset; owner can manually flip
   *                       the badge by re-inviting (creates new invite,
   *                       which calls setAppStatusInvited).
   *   - Reset fails     → invite IS gone (the important bit), the owner
   *                       just sees a stale "Pending invite" badge until
   *                       they refresh or re-invite.
   */
  async delete(token) {
    if (!token) throw new Error('invitesApi.delete: token is required.');

    let staffIdToReset = null;
    let parentIdToReset = null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, token));
      const data = snap.exists() ? snap.data() : null;
      if (data?.role === 'teacher' && typeof data.staffId === 'string') {
        staffIdToReset = data.staffId;
      }
      if (data?.role === 'parent' && typeof data.parentId === 'string') {
        parentIdToReset = data.parentId;
      }
    } catch (err) {
      console.warn('[invitesApi.delete] pre-read failed:', err);
    }

    await deleteDoc(doc(db, COLLECTION, token));

    if (staffIdToReset) {
      try {
        await staffApi.resetAppStatus(staffIdToReset);
      } catch (err) {
        console.warn('[invitesApi.delete] could not reset staff.appStatus:', err);
      }
    }
    if (parentIdToReset) {
      try {
        await parentsApi.resetAppStatus(parentIdToReset);
      } catch (err) {
        console.warn('[invitesApi.delete] could not reset parents.appStatus:', err);
      }
    }
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
