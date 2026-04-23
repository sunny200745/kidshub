/**
 * Curriculum library API (Sprint 7 / D7).
 *
 * Reusable activity templates — teachers (and owners) can create their
 * own, and reference them from the weekly planner. A seed set shipped
 * with the app (tenantless, `ownerId = 'system'`) is stamped into each
 * daycare the first time they open the library.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../config';
import type { ActivityTemplate } from '../types';

const COLLECTION = 'activityTemplates';

function snap2(snap: { id: string; data: () => Record<string, unknown> }): ActivityTemplate {
  return { id: snap.id, ...(snap.data() as Omit<ActivityTemplate, 'id'>) };
}

export const activityTemplatesApi = {
  subscribeForDaycare(
    daycareId: string,
    callback: (templates: ActivityTemplate[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, COLLECTION), where('daycareId', '==', daycareId)),
      (snap) => {
        const list = snap.docs
          .map(snap2)
          .sort((a, b) => a.title.localeCompare(b.title));
        callback(list);
      },
      (err) => {
        console.error('[activityTemplatesApi.subscribeForDaycare]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  async create(input: Omit<ActivityTemplate, 'id' | 'createdAt'>): Promise<ActivityTemplate> {
    // Firestore accepts serverTimestamp() sentinels, but the typed domain
    // model uses string for createdAt. Cast via unknown to keep the public
    // API strict without forcing every consumer to deal with FieldValue.
    const payload = {
      ...input,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    const returned = {
      id: ref.id,
      ...input,
      createdAt: new Date().toISOString(),
    } as ActivityTemplate;
    return returned;
  },

  async update(templateId: string, patch: Partial<Omit<ActivityTemplate, 'id' | 'daycareId' | 'ownerId'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, templateId), {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },

  async remove(templateId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, templateId));
  },
};
