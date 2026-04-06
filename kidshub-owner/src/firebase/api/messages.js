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
import { db } from '../config';

const COLLECTION = 'messages';

export const messagesApi = {
  // Get all messages
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
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

  // Get messages by conversation
  async getByConversation(conversationId) {
    try {
      const q = query(
        collection(db, COLLECTION),
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

  // Get messages by child
  async getByChild(childId) {
    try {
      const q = query(
        collection(db, COLLECTION),
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

  // Get unread messages count
  async getUnreadCount() {
    try {
      const q = query(
        collection(db, COLLECTION),
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
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...messageData,
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...messageData };
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

  // Mark all messages in conversation as read
  async markConversationAsRead(conversationId) {
    const q = query(
      collection(db, COLLECTION),
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

  // Subscribe to conversation
  subscribeToConversation(conversationId, callback) {
    const q = query(
      collection(db, COLLECTION),
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

  // Subscribe to all messages (for conversation list)
  subscribe(callback) {
    return onSnapshot(
      collection(db, COLLECTION),
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
