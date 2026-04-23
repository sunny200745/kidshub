/**
 * Health log API (Sprint 7 / D5).
 *
 * Compliance-adjacent log for symptoms, medication administration, and
 * incidents. Separate collection from `activities` so retention policy,
 * owner-only reports, and parent surfacing can be controlled
 * independently.
 */
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { HealthLog } from '../types';

const COLLECTION = 'healthLogs';

function snap2(snap: { id: string; data: () => Record<string, unknown> }): HealthLog {
  return { id: snap.id, ...(snap.data() as Omit<HealthLog, 'id'>) };
}

export const healthLogsApi = {
  subscribeForClassroom(
    classroomId: string,
    daycareId: string,
    callback: (logs: HealthLog[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('classroomId', '==', classroomId),
      ),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[healthLogsApi.subscribeForClassroom]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  subscribeForChild(
    childId: string,
    callback: (logs: HealthLog[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('childId', '==', childId)),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[healthLogsApi.subscribeForChild]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  async create(input: Omit<HealthLog, 'id' | 'timestamp'> & { timestamp?: string }): Promise<HealthLog> {
    const payload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...(payload as Omit<HealthLog, 'id'>) };
  },
};
