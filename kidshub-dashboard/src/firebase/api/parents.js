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

export const parentsApi = {
  // Get all parents (tenant-scoped).
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
      console.error('Error getting parents:', err);
      return [];
    }
  },

  // Get single parent by ID
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

  // Get parents by child (tenant-scoped).
  async getByChild(childId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('children', 'array-contains', childId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting parents by child:', err);
      return [];
    }
  },

  // Create new parent
  async create(parentData) {
    const payload = {
      ...parentData,
      daycareId: currentDaycareId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Update parent
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Delete parent
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
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
        const parents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(parents);
      },
      (error) => {
        console.error('Error subscribing to parents:', error);
        callback([]);
      }
    );
  },
};
