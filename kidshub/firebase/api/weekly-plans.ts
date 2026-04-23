/**
 * Weekly planner API (Sprint 7 / D6).
 *
 * One doc per (classroom, weekStartDate) pair. Teachers edit, parents
 * read-only (for the classrooms containing their child). Owner edits
 * any plan in tenant.
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { WeeklyPlan, WeeklyPlanItem } from '../types';

const COLLECTION = 'weeklyPlans';

function snap2(snap: { id: string; data: () => Record<string, unknown> }): WeeklyPlan {
  return { id: snap.id, ...(snap.data() as Omit<WeeklyPlan, 'id'>) };
}

/** Canonical ISO week-start (Monday) as `YYYY-MM-DD`. */
export function isoWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = Sunday. Shift so Monday = 0.
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export const weeklyPlansApi = {
  subscribeForClassroomWeek(
    classroomId: string,
    weekStart: string,
    callback: (plan: WeeklyPlan | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('classroomId', '==', classroomId),
        where('weekStartDate', '==', weekStart),
      ),
      (snap) => {
        const plan = snap.docs.map(snap2)[0] ?? null;
        callback(plan);
      },
      (err) => {
        console.error('[weeklyPlansApi.subscribeForClassroomWeek]', err);
        onError?.(err);
      },
    );
  },

  /**
   * Write a plan. Deterministic doc id keeps updates idempotent —
   * no risk of two teachers accidentally creating parallel plans for
   * the same week.
   */
  async upsert(input: {
    daycareId: string;
    classroomId: string;
    weekStartDate: string;
    items: WeeklyPlanItem[];
    updatedBy: string;
  }): Promise<void> {
    const id = `${input.classroomId}_${input.weekStartDate}`;
    await setDoc(
      doc(db, COLLECTION, id),
      {
        daycareId: input.daycareId,
        classroomId: input.classroomId,
        weekStartDate: input.weekStartDate,
        items: input.items,
        updatedBy: input.updatedBy,
        updatedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  },
};
