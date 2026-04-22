import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../config';

const COLLECTION = 'children';

function currentDaycareId() {
  // In the dashboard, the signed-in user is always the owner, so their uid
  // IS the daycareId (1 owner = 1 daycare in our data model). If this ever
  // changes (e.g. a second owner joining an existing daycare as a co-admin),
  // the rule for setting daycareId will move to reading users/{uid}.daycareId.
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('childrenApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

export const childrenApi = {
  // Get all children (scoped by daycareId — Firestore rules require it).
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting children:', err);
      return [];
    }
  },

  // Get single child by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting child:', err);
      return null;
    }
  },

  // Get children by classroom (tenant-scoped).
  async getByClassroom(classroomId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('classroom', '==', classroomId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting children by classroom:', err);
      return [];
    }
  },

  // Get checked-in children (tenant-scoped).
  async getCheckedIn() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('status', '==', 'checked-in')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting checked-in children:', err);
      return [];
    }
  },

  // Create new child
  async create(childData) {
    const daycareId = currentDaycareId();
    const payload = {
      ...childData,
      daycareId,
      // parentIds is the array used by Firestore rules to gate parent reads
      // (a parent sees a child iff childId ∈ userChildIds AND they are in
      // the child's parentIds). Always initialize even if empty — owners link
      // parents via usersApi.linkParentToChild later.
      parentIds: Array.isArray(childData.parentIds) ? childData.parentIds : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Update child
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Check in child
  async checkIn(id, droppedOffBy, notes = '') {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      status: 'checked-in',
      checkInTime: new Date().toISOString(),
      lastCheckInBy: droppedOffBy,
      lastCheckInNotes: notes,
      updatedAt: serverTimestamp(),
    });
  },

  // Check out child
  async checkOut(id, pickedUpBy, notes = '') {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      status: 'checked-out',
      checkOutTime: new Date().toISOString(),
      checkInTime: null,
      lastCheckOutBy: pickedUpBy,
      lastCheckOutNotes: notes,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete child
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  /**
   * Delete a child along with their dependent log data (activities, messages).
   * Batched in groups of 400 to stay under Firestore's 500-op batch limit.
   *
   * We deliberately do NOT cascade into parent users — unlink is a manual
   * owner action via the ChildProfile Contacts tab. This method will throw
   * if the child still has parentIds linked; the UI blocks the delete
   * before calling this, but we guard here too for safety.
   */
  async deleteWithDependents(id) {
    if (!id) throw new Error('childrenApi.deleteWithDependents: id required');
    const daycareId = currentDaycareId();

    const childSnap = await getDoc(doc(db, COLLECTION, id));
    if (!childSnap.exists()) return;
    const child = childSnap.data();
    if (Array.isArray(child.parentIds) && child.parentIds.length > 0) {
      throw new Error(
        `Cannot delete child while ${child.parentIds.length} parent(s) are still linked. Unlink them first.`
      );
    }

    // Collect dependent docs (tenant-scoped so rules accept the list queries).
    const [activitiesSnap, messagesSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'activities'),
        where('daycareId', '==', daycareId),
        where('childId', '==', id),
      )),
      getDocs(query(
        collection(db, 'messages'),
        where('daycareId', '==', daycareId),
        where('childId', '==', id),
      )),
    ]);

    const allRefs = [
      ...activitiesSnap.docs.map((d) => d.ref),
      ...messagesSnap.docs.map((d) => d.ref),
      doc(db, COLLECTION, id),
    ];

    // Chunk into batches of up to 400 writes.
    const CHUNK = 400;
    for (let i = 0; i < allRefs.length; i += CHUNK) {
      const batch = writeBatch(db);
      allRefs.slice(i, i + CHUNK).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  },

  // Subscribe to real-time updates (scoped by daycareId).
  subscribe(callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const children = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('📦 Firebase Response - Children:', children);
        callback(children);
      },
      (error) => {
        console.error('Error subscribing to children:', error);
        callback([]);
      }
    );
  },

  // Subscribe to single child
  subscribeToChild(id, callback) {
    return onSnapshot(
      doc(db, COLLECTION, id),
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to child:', error);
        callback(null);
      }
    );
  },
};
