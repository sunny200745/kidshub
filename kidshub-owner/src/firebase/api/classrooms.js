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

const COLLECTION = 'classrooms';

export const classroomsApi = {
  // Get all classrooms
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
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
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...classroomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...classroomData };
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

  // Subscribe to real-time updates
  subscribe(callback) {
    return onSnapshot(
      collection(db, COLLECTION),
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
