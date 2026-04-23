/**
 * centers Firestore reads for the kidshub (teacher/parent) app.
 *
 * Read-only from this app. The center doc is owned + mutated by the owner
 * through kidshub-dashboard; kidshub only needs to read the plan/demoMode
 * fields so useEntitlements() can gate paid features on the teacher/parent
 * side.
 *
 * Firestore rule (firestore.rules, centers/{ownerId}):
 *   - read allowed if the requester is a teacher/parent whose users doc
 *     has daycareId === ownerId (same tenant)
 *   - write is owner-only (not surfaced here)
 *
 * Subscribe vs. one-shot:
 *   We expose only a live subscription. The plan / demoMode state can
 *   change while the teacher is mid-session (e.g., owner flips demoMode
 *   during a demo) — UI needs to react live, same as every other
 *   subscription in this app.
 */
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { db } from '../config';

export type Center = {
  id: string;
  ownerId?: string;
  name?: string;
  plan?: 'trial' | 'starter' | 'pro' | 'premium';
  trialEndsAt?: { toMillis: () => number; toDate: () => Date } | null;
  demoMode?: boolean;
  [key: string]: unknown;
};

export const centersApi = {
  subscribeByDaycare(
    daycareId: string,
    callback: (center: Center | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const ref = doc(db, 'centers', daycareId);
    return onSnapshot(
      ref,
      (snap) => {
        callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Center) : null);
      },
      (err) => {
        console.error('[centersApi.subscribeByDaycare] snapshot failed:', err);
        if (onError) onError(err);
      },
    );
  },
};
