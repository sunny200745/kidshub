/**
 * messages Firestore reads + writes for the kidshub app.
 *
 * Conversations are not modeled as separate Firestore docs (intentional
 * — see RESTRUCTURE_PLAN). Instead we group `messages` by their
 * `conversationId` field client-side. The dashboard uses the same
 * convention.
 *
 * Read scope:
 *   - Parent: messages where senderId == uid OR recipientId == uid
 *     (the parent only ever participates in their own conversations).
 *     Firestore rules enforce this.
 *   - Teacher: messages within their daycare. Filtering down to "my
 *     conversations" is done client-side because teachers may be
 *     copied on multiple parent threads.
 */
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { Message } from '../types';

const COLLECTION = 'messages';

function snapToMessage(snap: { id: string; data: () => Record<string, unknown> }): Message {
  return { id: snap.id, ...(snap.data() as Omit<Message, 'id'>) };
}

export const messagesApi = {
  /**
   * Subscribe to all messages for a parent. We run two queries
   * (sender + recipient) and merge client-side because Firestore can't
   * `OR` across fields without an aggregate index.
   *
   * Both queries MUST include a `daycareId == profile.daycareId`
   * equality filter. The firestore rules for messages require
   * `inMyTenant(resource.data)` on the participant branch, and
   * Firestore's list-query evaluator can only prove that constraint
   * when the client filter explicitly pins daycareId. Without it, the
   * whole query is rejected with `permission-denied` at query time,
   * even though individual participant reads would succeed. This is
   * the same class of issue that bit the children-read rule.
   */
  subscribeForParent(
    parentUid: string,
    daycareId: string,
    callback: (messages: Message[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const buckets: { sent: Message[]; received: Message[] } = { sent: [], received: [] };

    const emit = () => {
      const dedup = new Map<string, Message>();
      [...buckets.sent, ...buckets.received].forEach((m) => dedup.set(m.id, m));
      const merged = Array.from(dedup.values()).sort((a, b) =>
        a.timestamp < b.timestamp ? -1 : 1,
      );
      callback(merged);
    };

    const unsubSent = onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('senderId', '==', parentUid),
      ),
      (snap) => {
        buckets.sent = snap.docs.map(snapToMessage);
        emit();
      },
      (err) => {
        console.error('[messagesApi.subscribeForParent sent]', err);
        onError?.(err);
      },
    );
    const unsubRecv = onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('recipientId', '==', parentUid),
      ),
      (snap) => {
        buckets.received = snap.docs.map(snapToMessage);
        emit();
      },
      (err) => {
        console.error('[messagesApi.subscribeForParent recv]', err);
        onError?.(err);
      },
    );

    return () => {
      unsubSent();
      unsubRecv();
    };
  },

  /**
   * Subscribe to all messages in a teacher's daycare. Teacher rules
   * allow read on any message in their tenant; UI filters to "threads I
   * participate in" by checking senderId/recipientId == teacher.uid OR
   * staff threads for their classroom.
   */
  subscribeForDaycare(
    daycareId: string,
    callback: (messages: Message[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('daycareId', '==', daycareId)),
      (snap) => {
        const list = snap.docs
          .map(snapToMessage)
          .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
        callback(list);
      },
      (err) => {
        console.error('[messagesApi.subscribeForDaycare]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /**
   * Send a message. Caller decides senderType + recipientId. Stamps
   * `timestamp` and `read=false` to match the dashboard's contract.
   */
  async send(input: {
    conversationId: string;
    senderId: string;
    senderType: 'parent' | 'staff';
    recipientId?: string;
    childId?: string;
    content: string;
    daycareId: string;
  }): Promise<Message> {
    const payload = {
      ...input,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...(payload as Omit<Message, 'id'>) };
  },

  /** Mark a single message as read. */
  async markAsRead(messageId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, messageId), {
      read: true,
      readAt: new Date().toISOString(),
    });
  },

  /**
   * Staff-side archive: flip `archivedByStaff` on a single message.
   *
   * Called on the *latest* message in a thread from the teacher messages
   * UI. Firestore rules restrict this write to staff participants in
   * the same tenant (see `firestore.rules` → /messages update path).
   * Unarchiving is the same call with `archived = false`.
   */
  async setStaffArchived(messageId: string, archived: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTION, messageId), {
      archivedByStaff: archived,
      staffArchivedAt: archived ? new Date().toISOString() : null,
    });
  },
};
