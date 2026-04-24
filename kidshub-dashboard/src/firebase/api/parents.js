/**
 * parentsApi — owner-managed PARENT CONTACT ROSTER.
 *
 * Direct structural mirror of staffApi. A `parents/{id}` doc is the
 * dashboard's pre-user contact record for a parent — it exists before
 * the parent has a Firebase Auth account, and lives through the invite
 * lifecycle (none → invited → active) exactly like staff.
 *
 * Doc shape:
 *   {
 *     firstName:     string,
 *     lastName:      string,
 *     email:         string   (lowercased so the Firestore rule
 *                              `parents.email == request.auth.token.email`
 *                              matches during the parent-side self-link),
 *     phone?:        string,
 *     relationship?: string   (optional label shown on owner UI),
 *
 *     // Child linkage (multi — siblings share one parent record):
 *     childIds:      string[] (authoritative; always stamped on create),
 *     children?:     string[] (LEGACY: some seed/demo records still use
 *                              this name. We read both, always write
 *                              childIds on new records.),
 *
 *     daycareId:     string   (== inviter's uid; tenant key),
 *
 *     // Invite-to-app lifecycle (mirror of staff.appStatus / linkedUserId):
 *     appStatus:     'none' | 'invited' | 'active',
 *     linkedUserId:  string | null   (the users/{uid} of the parent once
 *                                     they accept the invite; stamped by
 *                                     the accept flow via a scoped rule),
 *
 *     emergencyContact?: boolean,
 *     authorizedPickup?: boolean,
 *     createdAt:     timestamp,
 *     updatedAt:     timestamp,
 *   }
 *
 * Why this mirrors staff so tightly:
 *   Owners asked for parent onboarding to feel exactly like teacher
 *   onboarding. Every field here has a direct staff analog: `classroom`
 *   → `childIds`, everything else identical. Keeping the shapes aligned
 *   means the `Parents` page is a near copy-paste of `Staff.jsx` with
 *   classrooms swapped for children, and the invite/accept handshake
 *   (rule + AuthContext) is one symmetric pattern instead of two.
 */
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '../config';

const COLLECTION = 'parents';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('parentsApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

/**
 * Legacy seeds stored children under the key `children` (an array of ids).
 * New records stamp `childIds`. For any downstream consumer that needs the
 * canonical list, go through this helper — it prefers `childIds` but falls
 * back to `children` so pre-migration demo data keeps rendering.
 */
export function parentChildIds(parent) {
  if (!parent) return [];
  if (Array.isArray(parent.childIds)) return parent.childIds;
  if (Array.isArray(parent.children)) return parent.children;
  return [];
}

export const parentsApi = {
  // Get all parents (tenant-scoped).
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error getting parents:', err);
      return [];
    }
  },

  // Get single parent by ID.
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting parent:', err);
      return null;
    }
  },

  /**
   * Parents linked to a specific child. Searches both the authoritative
   * `childIds` field AND the legacy `children` field so demo seeds keep
   * rendering while we transition records forward.
   *
   * Implemented as two queries + in-memory merge because Firestore has no
   * OR across array-contains on two different fields.
   */
  async getByChild(childId) {
    try {
      const daycareId = currentDaycareId();
      const [a, b] = await Promise.all([
        getDocs(
          query(
            collection(db, COLLECTION),
            where('daycareId', '==', daycareId),
            where('childIds', 'array-contains', childId)
          )
        ),
        getDocs(
          query(
            collection(db, COLLECTION),
            where('daycareId', '==', daycareId),
            where('children', 'array-contains', childId)
          )
        ),
      ]);
      const seen = new Set();
      const rows = [];
      [...a.docs, ...b.docs].forEach((d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        rows.push({ id: d.id, ...d.data() });
      });
      return rows;
    } catch (err) {
      console.error('Error getting parents by child:', err);
      return [];
    }
  },

  /**
   * Create a new parent contact record. Mirror of staffApi.create:
   *   - email lowercased so parents/rule `email == request.auth.token.email`
   *     matches during self-link on accept,
   *   - appStatus seeded to 'none' + linkedUserId null so downstream UI
   *     can render the Invite-to-app affordance without defensive defaults,
   *   - childIds always stamped as an array (defensive: UI may pass undef).
   */
  async create(parentData) {
    const childIds = Array.isArray(parentData.childIds)
      ? parentData.childIds.filter(Boolean)
      : Array.isArray(parentData.children)
        ? parentData.children.filter(Boolean)
        : [];
    const payload = {
      ...parentData,
      email: (parentData.email || '').trim().toLowerCase(),
      childIds,
      daycareId: currentDaycareId(),
      linkedUserId: null,
      appStatus: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Strip the legacy `children` field on new records so we converge on
    // a single source of truth going forward. Existing docs keep both
    // until an owner edits them.
    delete payload.children;
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  /**
   * Update a parent record. Email is lowercased for the same reason as
   * create. `childIds` array is normalized if present. We do NOT touch
   * appStatus / linkedUserId here — those are owned by the invite/accept
   * lifecycle (setAppStatusInvited / resetAppStatus, and the accept rule
   * branch).
   */
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (typeof data.email === 'string') {
      payload.email = data.email.trim().toLowerCase();
    }
    if (Array.isArray(data.childIds)) {
      payload.childIds = data.childIds.filter(Boolean);
    }
    // Owner UI should not be able to silently tamper with link state
    // via update(). Strip these defensively if a caller passes them.
    delete payload.appStatus;
    delete payload.linkedUserId;
    await updateDoc(docRef, payload);
    return { id, ...data };
  },

  /**
   * Link / unlink a single child on a parent record, in-place. Kept as
   * small, idempotent helpers so the ParentFormModal / ChildProfile page
   * don't need to read-modify-write the whole childIds array themselves.
   * Firestore arrayUnion / arrayRemove are atomic at the server.
   */
  async addChild(parentId, childId) {
    if (!parentId || !childId) return;
    await updateDoc(doc(db, COLLECTION, parentId), {
      childIds: arrayUnion(childId),
      updatedAt: serverTimestamp(),
    });
  },
  async removeChild(parentId, childId) {
    if (!parentId || !childId) return;
    await updateDoc(doc(db, COLLECTION, parentId), {
      childIds: arrayRemove(childId),
      updatedAt: serverTimestamp(),
    });
  },

  // Delete parent. Callers must gate via UI to block when appStatus='active'
  // (a linked user account exists) — same policy as staff.delete.
  async delete(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  /**
   * Invite-lifecycle helpers. Called by invitesApi.createParentInvite
   * after the invite doc lands, and by invitesApi.delete when the owner
   * revokes a pending parent invite. Mirror of staffApi's pair.
   *
   * setAppStatusInvited: flips the parent card to "Pending invite" badge.
   * resetAppStatus: returns the card to its pre-invite state (Invite-to-
   * app button reappears). Both are best-effort from the caller's POV;
   * the invite doc itself is the source of truth, this is a denormalized
   * convenience for the owner UI.
   */
  async setAppStatusInvited(id) {
    await updateDoc(doc(db, COLLECTION, id), {
      appStatus: 'invited',
      updatedAt: serverTimestamp(),
    });
  },
  async resetAppStatus(id) {
    await updateDoc(doc(db, COLLECTION, id), {
      appStatus: 'none',
      linkedUserId: null,
      updatedAt: serverTimestamp(),
    });
  },

  // Subscribe to real-time updates (tenant-scoped).
  subscribe(callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const parents = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
            const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
            return aName.localeCompare(bName);
          });
        callback(parents);
      },
      (error) => {
        console.error('Error subscribing to parents:', error);
        callback([]);
      }
    );
  },
};
