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
import { db } from '../config';

const COLLECTION = 'children';

export const childrenApi = {
  // Get all children
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
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

  // Get children by classroom
  async getByClassroom(classroomId) {
    try {
      const q = query(
        collection(db, COLLECTION),
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

  // Get checked-in children
  async getCheckedIn() {
    try {
      const q = query(
        collection(db, COLLECTION),
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
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...childData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...childData };
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

  // Subscribe to real-time updates
  subscribe(callback) {
    return onSnapshot(
      collection(db, COLLECTION),
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
