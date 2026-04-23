/**
 * staff Firestore reads for the kidshub app.
 *
 * Used on the teacher profile screen to render the "co-teachers" list:
 * subscribe to all staff in the teacher's daycare, then UI filters by
 * the same classroomId as the logged-in teacher.
 */
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { Staff } from '../types';

const COLLECTION = 'staff';

function snapToStaff(snap: { id: string; data: () => Record<string, unknown> }): Staff {
  return { id: snap.id, ...(snap.data() as Omit<Staff, 'id'>) };
}

export const staffApi = {
  subscribeForDaycare(
    daycareId: string,
    callback: (staff: Staff[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('daycareId', '==', daycareId)),
      (snap) => callback(snap.docs.map(snapToStaff)),
      (err) => {
        console.error('[staffApi.subscribeForDaycare]', err);
        onError?.(err);
        callback([]);
      },
    );
  },
};
