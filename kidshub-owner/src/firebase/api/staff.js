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

const COLLECTION = 'staff';

export const staffApi = {
  // Get all staff
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting staff:', err);
      return [];
    }
  },

  // Get single staff by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting staff member:', err);
      return null;
    }
  },

  // Get staff by classroom
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
      console.error('Error getting staff by classroom:', err);
      return [];
    }
  },

  // Get online staff
  async getOnline() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('status', '==', 'online')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error getting online staff:', err);
      return [];
    }
  },

  // Create new staff
  async create(staffData) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...staffData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...staffData };
  },

  // Update staff
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Update staff status
  async updateStatus(id, status) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete staff
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Subscribe to real-time updates
  subscribe(callback) {
    return onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const staff = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('📦 Firebase Response - Staff:', staff);
        callback(staff);
      },
      (error) => {
        console.error('Error subscribing to staff:', error);
        callback([]);
      }
    );
  },
};
