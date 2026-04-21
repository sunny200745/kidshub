import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION = 'activities';

export const activitiesApi = {
  // Get all activities
  async getAll(limitCount = 100) {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
      const activities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limitCount);
    } catch (err) {
      console.error('Error getting activities:', err);
      return [];
    }
  },

  // Get activities for today
  async getToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const querySnapshot = await getDocs(collection(db, COLLECTION));
      const activities = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((a) => new Date(a.timestamp) >= today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return activities;
    } catch (err) {
      console.error('Error getting today activities:', err);
      return [];
    }
  },

  // Get activities by child
  async getByChild(childId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('childId', '==', childId)
      );
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('Error getting child activities:', err);
      return [];
    }
  },

  // Get activities by type
  async getByType(type) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('type', '==', type)
      );
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('Error getting activities by type:', err);
      return [];
    }
  },

  // Create new activity
  async create(activityData) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...activityData,
      timestamp: activityData.timestamp || new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...activityData };
  },

  // Log check-in activity
  async logCheckIn(childId, staffId, droppedOffBy, notes = '') {
    return this.create({
      childId,
      staffId,
      type: 'checkin',
      notes: notes || 'Arrived at daycare',
      details: { droppedOffBy },
    });
  },

  // Log check-out activity
  async logCheckOut(childId, staffId, pickedUpBy, notes = '') {
    return this.create({
      childId,
      staffId,
      type: 'checkout',
      notes: notes || 'Left daycare',
      details: { pickedUpBy },
    });
  },

  // Update activity
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  },

  // Delete activity
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Subscribe to today's activities
  subscribeToToday(callback) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const activities = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((a) => new Date(a.timestamp) >= today)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        callback(activities);
      },
      (error) => {
        console.error('Error subscribing to activities:', error);
        callback([]);
      }
    );
  },

  // Subscribe to child activities
  subscribeToChild(childId, callback) {
    const q = query(
      collection(db, COLLECTION),
      where('childId', '==', childId)
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const activities = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50);
        callback(activities);
      },
      (error) => {
        console.error('Error subscribing to child activities:', error);
        callback([]);
      }
    );
  },
};
