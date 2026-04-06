import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION = 'announcements';

export const announcementsApi = {
  // Get all announcements
  async getAll(limitCount = 20) {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
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
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...announcementData,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...announcementData };
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

  // Subscribe to announcements
  subscribe(callback, limitCount = 10) {
    return onSnapshot(
      collection(db, COLLECTION),
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
