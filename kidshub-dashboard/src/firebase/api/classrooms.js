import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config';

const COLLECTION = 'classrooms';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('classroomsApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

export const classroomsApi = {
  // Get all classrooms
  // Scoped by daycareId — required because Firestore rules gate list queries
  // via resource.data.daycareId. Unfiltered reads fail permission-denied.
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
      console.error('Error getting classrooms:', err);
      return [];
    }
  },

  // Get single classroom by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting classroom:', err);
      return null;
    }
  },

  // Create new classroom
  async create(classroomData) {
    const payload = {
      ...classroomData,
      daycareId: currentDaycareId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Update classroom
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Update current count
  async updateCount(id, count) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      currentCount: count,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete classroom
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Subscribe to real-time updates (scoped by daycareId — see getAll).
  subscribe(callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const classrooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('📦 Firebase Response - Classrooms:', classrooms);
        callback(classrooms);
      },
      (error) => {
        console.error('Error subscribing to classrooms:', error);
        callback([]);
      }
    );
  },

  // Subscribe to single classroom
  subscribeToClassroom(id, callback) {
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
        console.error('Error subscribing to classroom:', error);
        callback(null);
      }
    );
  },
};
