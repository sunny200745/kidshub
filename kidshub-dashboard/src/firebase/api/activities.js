import {
  collection,
  doc,
  getDoc,
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
import { auth, db } from '../config';

const COLLECTION = 'activities';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('activitiesApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

/**
 * Derive the classroomId for a new activity. Teachers' Firestore rule grants
 * read access to activities where `classroomId == userClassroom()`, so every
 * new activity MUST carry this field. If the caller already provided it,
 * use as-is. Otherwise, look it up from the child's doc (one extra read).
 */
async function resolveClassroomId(activityData) {
  if (activityData.classroomId) return activityData.classroomId;
  if (!activityData.childId) {
    throw new Error('activitiesApi.create: childId is required to derive classroomId');
  }
  const childSnap = await getDoc(doc(db, 'children', activityData.childId));
  if (!childSnap.exists()) {
    throw new Error(`activitiesApi.create: child ${activityData.childId} not found`);
  }
  const child = childSnap.data();
  // Children use `classroom` as the FK field name today (pre-rename). Accept
  // either to keep this forward-compatible with the planned rename.
  const classroomId = child.classroomId || child.classroom;
  if (!classroomId) {
    throw new Error(`activitiesApi.create: child ${activityData.childId} has no classroom`);
  }
  return classroomId;
}

export const activitiesApi = {
  // Get all activities (tenant-scoped).
  async getAll(limitCount = 100) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
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

  // Get activities for today (tenant-scoped).
  async getToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
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

  // Get activities by child (tenant-scoped).
  async getByChild(childId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
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

  // Get activities by type (tenant-scoped).
  async getByType(type) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
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
    const classroomId = await resolveClassroomId(activityData);
    const payload = {
      ...activityData,
      classroomId,
      daycareId: currentDaycareId(),
      timestamp: activityData.timestamp || new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
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

  // Subscribe to today's activities (tenant-scoped).
  subscribeToToday(callback) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
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

  // Subscribe to child activities (tenant-scoped).
  subscribeToChild(childId, callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId()),
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
