import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config';

const COLLECTION = 'messages';

function currentDaycareId() {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('messagesApi: no authenticated user — cannot stamp daycareId');
  }
  return uid;
}

export const messagesApi = {
  // Get all messages (tenant-scoped).
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId())
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('Error getting messages:', err);
      return [];
    }
  },

  // Get messages by conversation (tenant-scoped).
  async getByConversation(conversationId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('conversationId', '==', conversationId)
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (err) {
      console.error('Error getting conversation messages:', err);
      return [];
    }
  },

  // Get messages by child (tenant-scoped).
  async getByChild(childId) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('childId', '==', childId)
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (err) {
      console.error('Error getting child messages:', err);
      return [];
    }
  },

  // Get unread messages count (tenant-scoped).
  async getUnreadCount() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', currentDaycareId()),
        where('read', '==', false),
        where('senderType', '==', 'parent')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  },

  // Create new message
  async create(messageData) {
    const payload = {
      ...messageData,
      daycareId: messageData.daycareId || currentDaycareId(),
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...payload };
  },

  // Send message from staff
  async sendFromStaff(staffId, parentId, childId, conversationId, content) {
    return this.create({
      senderId: staffId,
      senderType: 'staff',
      recipientId: parentId,
      childId,
      conversationId,
      content,
      read: true,
    });
  },

  // Mark message as read
  async markAsRead(id) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  },

  // Mark all messages in conversation as read (tenant-scoped read, then writes).
  async markConversationAsRead(conversationId) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId()),
      where('conversationId', '==', conversationId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const updates = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true, readAt: serverTimestamp() })
    );
    await Promise.all(updates);
  },

  // Delete message
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Subscribe to conversation (tenant-scoped).
  subscribeToConversation(conversationId, callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId()),
      where('conversationId', '==', conversationId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        callback(messages);
      },
      (error) => {
        console.error('Error subscribing to conversation:', error);
        callback([]);
      }
    );
  },

  // Subscribe to all messages for conversation list (tenant-scoped).
  subscribe(callback) {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', currentDaycareId())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        callback(messages);
      },
      (error) => {
        console.error('Error subscribing to messages:', error);
        callback([]);
      }
    );
  },
};
