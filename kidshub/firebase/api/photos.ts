/**
 * Photo journal reads + writes (Sprint 5 / D1).
 *
 * Pro-and-up feature; both client-side (`useFeature('photoJournal')`)
 * and server-side (rules `planAllows('photoJournal')`) gate creates.
 *
 * Storage layout:
 *   daycares/{daycareId}/photos/{yyyy-mm-dd}/{uuid}-{filename}
 *
 * `uploadPhotoBlob()` handles the Storage write + metadata write in two
 * steps (deliberately not a transaction — if the metadata write fails,
 * the Storage blob is orphaned, cleaned up by a weekly sweep in Track F).
 * Returns the created Photo doc.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage';

import { db, storage } from '../config';
import type { Photo } from '../types';

const COLLECTION = 'photos';

function snapToPhoto(snap: { id: string; data: () => Record<string, unknown> }): Photo {
  return { id: snap.id, ...(snap.data() as Omit<Photo, 'id'>) };
}

function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Simple uuid-ish for storage paths (no collision risk at demo scale). */
function shortId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type UploadPhotoInput = {
  daycareId: string;
  classroomId: string;
  uploadedBy: string;
  uploadedByName?: string;
  childIds: string[];
  caption?: string;
  /** Either a File (web) or a Blob from expo-image-manipulator. */
  blob: Blob;
  /** Used to stamp a sensible storage filename. */
  filename?: string;
  /** Optional progress (0–1) callback for large uploads. */
  onProgress?: (pct: number) => void;
};

export const photosApi = {
  /** Live list of photos for a classroom (teacher view). */
  subscribeForClassroom(
    classroomId: string,
    daycareId: string,
    callback: (photos: Photo[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTION),
      where('daycareId', '==', daycareId),
      where('classroomId', '==', classroomId),
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map(snapToPhoto)
          .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        callback(list);
      },
      (err) => {
        console.error('[photosApi.subscribeForClassroom]', err);
        onError?.(err);
        callback([]);
      },
    );
  },

  /**
   * Photos that tag any of the given child ids (parent view). Splits into
   * batches of 10 to respect Firestore's `array-contains-any` cap.
   */
  subscribeForChildren(
    childIds: string[],
    daycareId: string,
    callback: (photos: Photo[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    if (childIds.length === 0) {
      callback([]);
      return () => undefined;
    }
    const chunks: string[][] = [];
    for (let i = 0; i < childIds.length; i += 10) {
      chunks.push(childIds.slice(i, i + 10));
    }
    const buckets: Photo[][] = chunks.map(() => []);
    const unsubs = chunks.map((chunk, idx) =>
      onSnapshot(
        query(
          collection(db, COLLECTION),
          where('daycareId', '==', daycareId),
          where('childIds', 'array-contains-any', chunk),
        ),
        (snap) => {
          buckets[idx] = snap.docs.map(snapToPhoto);
          const seen = new Set<string>();
          const merged = buckets
            .flat()
            .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
            .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
          callback(merged);
        },
        (err) => {
          console.error('[photosApi.subscribeForChildren]', err);
          onError?.(err);
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
  },

  /**
   * Upload a Blob to Firebase Storage + write the accompanying Photo
   * doc. Returns the new doc. Progress is reported via `onProgress`
   * when available (resumable uploads); otherwise falls back to a
   * single `uploadBytes` call.
   */
  async uploadBlob(input: UploadPhotoInput): Promise<Photo> {
    const filename = input.filename ?? `photo-${Date.now()}.jpg`;
    const path = `daycares/${input.daycareId}/photos/${dateKey()}/${shortId()}-${filename}`;
    const sref = ref(storage, path);

    let imageUrl: string;
    if (input.onProgress && typeof uploadBytesResumable === 'function') {
      const task = uploadBytesResumable(sref, input.blob);
      await new Promise<void>((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => {
            if (snap.totalBytes > 0) {
              input.onProgress!(snap.bytesTransferred / snap.totalBytes);
            }
          },
          reject,
          () => resolve(),
        );
      });
      imageUrl = await getDownloadURL(task.snapshot.ref);
    } else {
      const snap = await uploadBytes(sref, input.blob);
      imageUrl = await getDownloadURL(snap.ref);
    }

    const payload = {
      daycareId: input.daycareId,
      classroomId: input.classroomId,
      uploadedBy: input.uploadedBy,
      uploadedByName: input.uploadedByName ?? '',
      childIds: input.childIds,
      caption: input.caption ?? '',
      imageUrl,
      thumbnailUrl: imageUrl,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...(payload as Omit<Photo, 'id'>) };
  },

  /**
   * Metadata-only create — used by dashboards that have already uploaded
   * the image elsewhere (or for the seed-data path in demos).
   */
  async createFromUrl(
    input: Omit<Photo, 'id' | 'timestamp'> & { timestamp?: string },
  ): Promise<Photo> {
    const payload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return { id: docRef.id, ...(payload as Omit<Photo, 'id'>) };
  },

  async updateCaption(photoId: string, caption: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, photoId), {
      caption,
      updatedAt: new Date().toISOString(),
    });
  },

  async remove(photoId: string, storagePath?: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, photoId));
    if (storagePath) {
      try {
        await deleteObject(ref(storage, storagePath));
      } catch (err) {
        // Storage delete is best-effort — metadata delete is authoritative.
        console.warn('[photosApi.remove] storage delete failed:', err);
      }
    }
  },
};
