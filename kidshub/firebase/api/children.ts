/**
 * children Firestore reads for the kidshub app.
 *
 * Note: kidshub teachers + parents only READ children docs. The check-in /
 * check-out write path (teacher) is the one exception — it lives in this
 * module too because it's a single-collection write that mirrors the
 * dashboard's `childrenApi.checkIn` / `checkOut`.
 *
 * Firestore rules (see repo-root firestore.rules) gate the reads:
 *   - parent: child.id ∈ user.childIds AND user.uid ∈ child.parentIds
 *   - teacher: child.classroom == user.classroomId AND inMyTenant(child)
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { Child } from '../types';

const COLLECTION = 'children';

function snapToChild(snap: { id: string; data: () => Record<string, unknown> }): Child {
  return { id: snap.id, ...(snap.data() as Omit<Child, 'id'>) };
}

export const childrenApi = {
  /**
   * Subscribe to children visible to a parent.
   *
   * Strategy: parent.childIds is small (1–3 typical), so use Firestore's
   * `documentId() in [...]` clause. We can't use `documentId()` directly
   * with `in` on the kidshub bundle without an extra import, so just
   * subscribe to the parent's whole tenant scoped by `parentIds
   * array-contains uid`. The rule already requires `uid ∈ parentIds` for
   * read, so this is the canonical query.
   */
  subscribeForParent(
    parentUid: string,
    callback: (children: Child[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTION),
      where('parentIds', 'array-contains', parentUid),
    );
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map(snapToChild)),
      (err) => {
        console.error('[childrenApi.subscribeForParent]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /**
   * Subscribe to children in a teacher's classroom.
   *
   * The dashboard writes the FK as `classroom` (legacy field name) — the
   * Firestore rule accepts either `classroomId` or `classroom`, and we
   * query the legacy field here because that's what's actually present
   * on existing docs. If/when the rename lands, this query swaps to
   * `classroomId` in lockstep with a backfill.
   */
  subscribeForClassroom(
    classroomId: string,
    daycareId: string,
    callback: (children: Child[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', daycareId),
      where('classroom', '==', classroomId),
    );
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map(snapToChild)),
      (err) => {
        console.error('[childrenApi.subscribeForClassroom]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /** Subscribe to a single child doc. */
  subscribeToChild(
    childId: string,
    callback: (child: Child | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(db, COLLECTION, childId),
      (snap) => callback(snap.exists() ? snapToChild(snap) : null),
      (err) => {
        console.error('[childrenApi.subscribeToChild]', err);
        onError?.(err);
        callback(null);
      },
    );
  },

  /**
   * Teacher check-in. Mirrors dashboard's childrenApi.checkIn with the
   * exact field names the security rule whitelists for the teacher
   * branch (status / checkInTime / lastCheckInBy / lastCheckInNotes /
   * updatedAt).
   */
  async checkIn(childId: string, droppedOffBy: string, notes = ''): Promise<void> {
    await updateDoc(doc(db, COLLECTION, childId), {
      status: 'checked-in',
      checkInTime: new Date().toISOString(),
      lastCheckInBy: droppedOffBy,
      lastCheckInNotes: notes,
      updatedAt: serverTimestamp(),
    });
  },

  /** Teacher check-out. Same field whitelist as checkIn. */
  async checkOut(childId: string, pickedUpBy: string, notes = ''): Promise<void> {
    await updateDoc(doc(db, COLLECTION, childId), {
      status: 'checked-out',
      checkOutTime: new Date().toISOString(),
      checkInTime: null,
      lastCheckOutBy: pickedUpBy,
      lastCheckOutNotes: notes,
      updatedAt: serverTimestamp(),
    });
  },
};
