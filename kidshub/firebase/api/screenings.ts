/**
 * Morning screenings API (Sprint 7 / D8).
 *
 * One doc per (child, date) pair — UI ensures the teacher doesn't log
 * two screenings for the same drop-off. Parents can digitally
 * acknowledge their child's screening via `acknowledge()`.
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
import type { Screening } from '../types';

const COLLECTION = 'screenings';

function snap2(snap: { id: string; data: () => Record<string, unknown> }): Screening {
  return { id: snap.id, ...(snap.data() as Omit<Screening, 'id'>) };
}

export const screeningsApi = {
  subscribeForClassroomDate(
    classroomId: string,
    daycareId: string,
    date: string,
    callback: (screenings: Screening[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('classroomId', '==', classroomId),
        where('date', '==', date),
      ),
      (snap) => {
        const list = snap.docs.map(snap2);
        callback(list);
      },
      (err) => {
        console.error('[screeningsApi.subscribeForClassroomDate]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  subscribeForChild(
    childId: string,
    callback: (screenings: Screening[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('childId', '==', childId)),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[screeningsApi.subscribeForChild]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  async create(input: Omit<Screening, 'id' | 'timestamp'> & { timestamp?: string }): Promise<Screening> {
    const payload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...(payload as Omit<Screening, 'id'>) };
  },

  async acknowledge(screeningId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, screeningId), {
      parentAcknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    });
  },
};
