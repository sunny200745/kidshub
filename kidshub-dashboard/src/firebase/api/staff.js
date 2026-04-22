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

const COLLECTION = 'staff';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('staffApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

export const staffApi = {
  // Get all staff (scoped by daycareId — Firestore rules require it).
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

  // Get staff by classroom (tenant-scoped).
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
      console.error('Error getting staff by classroom:', err);
      return [];
    }
  },

  // Get online staff (tenant-scoped).
  async getOnline() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
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

  // Create new staff. Option B: stamp app-linkage fields to null/'none'
  // so downstream UI can safely render "Invite to app" affordances without
  // defensive defaults at every read site. Email is lowercased so the
  // Firestore rule `staff.email == request.auth.token.email` (used when a
  // teacher accepts their invite and self-links the staff record) matches
  // — Firebase Auth always normalizes the token email to lowercase.
  async create(staffData) {
    const payload = {
      ...staffData,
      email: (staffData.email || '').trim().toLowerCase(),
      daycareId: currentDaycareId(),
      linkedUserId: null,
      appStatus: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Update staff. Email is lowercased (same reason as create).
  async update(id, data) {
    const docRef = doc(db, COLLECTION, id);
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (typeof data.email === 'string') {
      payload.email = data.email.trim().toLowerCase();
    }
    await updateDoc(docRef, payload);
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

  // Option B helpers for invite flow transitions.
  //
  // setAppStatusInvited: called right after invitesApi.create() succeeds so
  // the staff card flips to "Pending invite" badge.
  async setAppStatusInvited(id) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      appStatus: 'invited',
      updatedAt: serverTimestamp(),
    });
  },

  // resetAppStatus: called when an owner revokes a pending invite, so the
  // staff card returns to "Invite to app" state. Safe to call on any staff
  // record — a no-op if the staff was already 'none' or 'active'.
  async resetAppStatus(id) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      appStatus: 'none',
      linkedUserId: null,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete staff. Callers should gate via UI first to block when
  // linkedUserId is set (see Staff.jsx). Rules will allow the delete
  // unconditionally for the owner; the UX guard is dashboard-side.
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
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
