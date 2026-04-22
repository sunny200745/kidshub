/**
 * usersApi — owner-side operations on parent user docs (p3-15).
 *
 * The only app-surface mutations on `users/{uid}` docs from the dashboard
 * are parent ↔ child linkage actions. The owner is not allowed to promote
 * users, change their roles, or edit profile fields — just associate a
 * parent with one of their children.
 *
 * Firestore rule this file relies on:
 *   allow update: if isOwner()
 *     && resource.data.role == 'parent'
 *     && request.resource.data.role == resource.data.role
 *     && request.resource.data.uid == resource.data.uid
 *     && request.resource.data.diff(resource.data)
 *          .affectedKeys().hasOnly(['childIds', 'daycareId', 'updatedAt']);
 *
 * Any other field change on a parent's users doc will be rejected server-side.
 *
 * The matching update on `children/{id}.parentIds` is batched here so the
 * two sides of the relationship stay consistent. Firestore batches are
 * atomic — if the rule rejects either write, the whole batch rolls back.
 */
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from '../config';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('usersApi: no authenticated user');
  }
  return uid;
}

export const usersApi = {
  /**
   * Fetch a single user doc. Owner-readable for parents in their tenant
   * (enforced by Firestore rules). Returns null if doc doesn't exist.
   */
  async getById(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /**
   * Link a parent user to one of the owner's children. Writes both sides of
   * the relationship atomically:
   *   - users/{parentUid}.childIds   ← arrayUnion(childId)
   *   - users/{parentUid}.daycareId  ← owner's daycareId (first link seeds this)
   *   - children/{childId}.parentIds ← arrayUnion(parentUid)
   *
   * Safe to call multiple times with the same args (arrayUnion is idempotent).
   */
  async linkParentToChild(parentUid, childId) {
    if (!parentUid || !childId) {
      throw new Error('usersApi.linkParentToChild: parentUid and childId required');
    }
    const daycareId = currentDaycareId();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', parentUid), {
      childIds: arrayUnion(childId),
      daycareId,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'children', childId), {
      parentIds: arrayUnion(parentUid),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  },

  /**
   * Reverse of linkParentToChild. Removes the child from the parent's
   * childIds and the parent from the child's parentIds. We do NOT clear
   * daycareId on the parent — they may still be linked to other children.
   */
  async unlinkParentFromChild(parentUid, childId) {
    if (!parentUid || !childId) {
      throw new Error('usersApi.unlinkParentFromChild: parentUid and childId required');
    }
    // Ensure we're authenticated before kicking off writes.
    currentDaycareId();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', parentUid), {
      childIds: arrayRemove(childId),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'children', childId), {
      parentIds: arrayRemove(parentUid),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  },
};
