/**
 * classroom Firestore reads for the kidshub app.
 *
 * Both teachers and parents need to read classroom metadata (name,
 * color, age range) for the classroom they're attached to. Parents in
 * particular benefit from "your child's classroom is the Sunshine
 * Room" rather than the bare classroom id.
 */
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { db } from '../config';
import type { Classroom } from '../types';

const COLLECTION = 'classrooms';

export const classroomsApi = {
  /** Subscribe to a single classroom doc. */
  subscribeToClassroom(
    classroomId: string,
    callback: (classroom: Classroom | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(db, COLLECTION, classroomId),
      (snap) =>
        callback(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Classroom, 'id'>) }) : null),
      (err) => {
        console.error('[classroomsApi.subscribeToClassroom]', err);
        onError?.(err);
        callback(null);
      },
    );
  },
};
