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

const COLLECTION = 'announcements';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('announcementsApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

export const announcementsApi = {
  // Get all announcements (tenant-scoped).
  async getAll(limitCount = 20) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
      const announcements = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return announcements
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limitCount);
    } catch (err) {
      console.error('Error getting announcements:', err);
      return [];
    }
  },

  // Get single announcement by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting announcement:', err);
      return null;
    }
  },

  // Create new announcement
  async create(announcementData) {
    const payload = {
      ...announcementData,
      daycareId: currentDaycareId(),
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Update announcement
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Delete announcement
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Subscribe to announcements (tenant-scoped).
  subscribe(callback, limitCount = 10) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const announcements = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limitCount);
        callback(announcements);
      },
      (error) => {
        console.error('Error subscribing to announcements:', error);
        callback([]);
      }
    );
  },
};
