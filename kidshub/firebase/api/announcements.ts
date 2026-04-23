/**
 * announcement reads for the kidshub app.
 *
 * Both parents and teachers see the same announcement feed for their
 * tenant — the audience filter (parents-only vs all) is applied
 * client-side so we don't need separate Firestore queries per role.
 */
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { Announcement } from '../types';

const COLLECTION = 'announcements';

function snapToAnnouncement(snap: { id: string; data: () => Record<string, unknown> }): Announcement {
  return { id: snap.id, ...(snap.data() as Omit<Announcement, 'id'>) };
}

export const announcementsApi = {
  subscribeForDaycare(
    daycareId: string,
    callback: (announcements: Announcement[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('daycareId', '==', daycareId)),
      (snap) => {
        const list = snap.docs
          .map(snapToAnnouncement)
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[announcementsApi.subscribeForDaycare]', err);
        onError?.(err);
        callback([]);
      },
    );
  },
};
