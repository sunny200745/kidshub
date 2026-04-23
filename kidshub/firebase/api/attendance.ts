/**
 * Staff clock-in / attendance API (Sprint 6 / D4).
 *
 * Separate from `children/{id}.status`/`checkInTime` (which is the child
 * check-in/out audit). This collection is the *teacher's* timesheet.
 *
 * A teacher always has ≤1 open shift at a time. `openShiftForUser()`
 * scans `attendance where userId == uid && clockOutAt == null` and
 * returns the single open row (if any) so the UI can render "Clocked in
 * at 8:15 AM — Clock out" vs "Clock in".
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
import type { Attendance } from '../types';

const COLLECTION = 'attendance';

function snap2(snap: { id: string; data: () => Record<string, unknown> }): Attendance {
  return { id: snap.id, ...(snap.data() as Omit<Attendance, 'id'>) };
}

/** Start of today in ISO (00:00 local). */
function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const attendanceApi = {
  /**
   * The teacher's current open shift, if any. Emits `null` when the
   * teacher isn't clocked in.
   */
  subscribeOpenShift(
    userId: string,
    callback: (shift: Attendance | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('clockOutAt', '==', null),
      ),
      (snap) => {
        const open = snap.docs.map(snap2)[0] ?? null;
        callback(open);
      },
      (err) => {
        console.error('[attendanceApi.subscribeOpenShift]', err);
        onError?.(err);
      },
    );
  },

  /** Today's shifts for the whole daycare — owner timesheet view. */
  subscribeForDaycareToday(
    daycareId: string,
    callback: (shifts: Attendance[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('clockInAt', '>=', startOfTodayIso()),
      ),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => (a.clockInAt < b.clockInAt ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[attendanceApi.subscribeForDaycareToday]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /** All shifts for an owner's daycare, for weekly report CSV export. */
  subscribeForDaycareSince(
    daycareId: string,
    sinceIso: string,
    callback: (shifts: Attendance[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, COLLECTION),
        where('daycareId', '==', daycareId),
        where('clockInAt', '>=', sinceIso),
      ),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => (a.clockInAt < b.clockInAt ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[attendanceApi.subscribeForDaycareSince]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  async clockIn(input: {
    daycareId: string;
    userId: string;
    userName?: string;
    classroomId?: string | null;
    staffId?: string | null;
  }): Promise<Attendance> {
    const payload = {
      daycareId: input.daycareId,
      userId: input.userId,
      userName: input.userName ?? '',
      classroomId: input.classroomId ?? null,
      staffId: input.staffId ?? null,
      clockInAt: new Date().toISOString(),
      clockOutAt: null,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...(payload as Omit<Attendance, 'id'>) };
  },

  async clockOut(shiftId: string, startedAtIso: string, notes?: string): Promise<void> {
    const now = new Date();
    const started = new Date(startedAtIso);
    const minutesWorked = Math.max(
      1,
      Math.round((now.getTime() - started.getTime()) / 60000),
    );
    await updateDoc(doc(db, COLLECTION, shiftId), {
      clockOutAt: now.toISOString(),
      minutesWorked,
      notes: notes ?? '',
      updatedAt: now.toISOString(),
    });
  },
};
