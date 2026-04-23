/**
 * Activity log reads + writes for the kidshub app.
 *
 * Read patterns:
 *   - Parent's home + activity timeline: today's activities for *their*
 *     child(ren). Implemented as a `childId in [...]` query bounded to
 *     the parent's childIds (max 30 ids per `in` clause — fine for now).
 *   - Teacher's classroom activities: today's activities scoped by
 *     classroomId.
 *
 * Write patterns:
 *   - Teacher logs an activity from /(teacher)/activities. Mirrors
 *     `dashboard activitiesApi.create` field-for-field so the same docs
 *     render correctly in both UIs.
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
import type { Activity } from '../types';

const COLLECTION = 'activities';

function snapToActivity(snap: { id: string; data: () => Record<string, unknown> }): Activity {
  return { id: snap.id, ...(snap.data() as Omit<Activity, 'id'>) };
}

/** Returns ISO start-of-today in local time. */
function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const activitiesApi = {
  /**
   * Subscribe to today's activities for a specific list of children.
   * Use this on the parent home/activity screens. Splits queries when
   * there are >10 child ids (Firestore `in` limit).
   */
  subscribeForChildren(
    childIds: string[],
    daycareId: string,
    callback: (activities: Activity[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    if (childIds.length === 0) {
      callback([]);
      return () => undefined;
    }

    // Firestore `in` clause caps at 30 values in current SDK, but we keep
    // batches at 10 for safety + better tail latency.
    const chunks: string[][] = [];
    for (let i = 0; i < childIds.length; i += 10) {
      chunks.push(childIds.slice(i, i + 10));
    }

    const since = startOfTodayIso();
    const buckets: Activity[][] = chunks.map(() => []);
    const unsubs = chunks.map((chunk, idx) => {
      const q = query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('childId', 'in', chunk),
        where('timestamp', '>=', since),
      );
      return onSnapshot(
        q,
        (snap) => {
          buckets[idx] = snap.docs.map(snapToActivity);
          const merged = buckets
            .flat()
            .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
          callback(merged);
        },
        (err) => {
          console.error('[activitiesApi.subscribeForChildren]', err);
          onError?.(err);
        },
      );
    });

    return () => unsubs.forEach((u) => u());
  },

  /** Subscribe to today's activities for a teacher's classroom. */
  subscribeForClassroom(
    classroomId: string,
    daycareId: string,
    callback: (activities: Activity[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const since = startOfTodayIso();
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', daycareId),
      where('classroomId', '==', classroomId),
      where('timestamp', '>=', since),
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map(snapToActivity)
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[activitiesApi.subscribeForClassroom]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /**
   * Teacher logs a new activity. Caller is responsible for resolving
   * the classroomId from the child (or passing the teacher's own
   * classroomId for class-wide activities).
   */
  async create(input: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }): Promise<Activity> {
    const payload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...(payload as Omit<Activity, 'id'>) };
  },
};
