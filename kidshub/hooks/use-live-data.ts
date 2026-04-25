/**
 * React hooks that wrap the Firestore subscriptions in `@/firebase/api`.
 *
 * Why one file: every hook follows the same pattern — pull scoping
 * fields out of `useAuth().profile`, subscribe in an effect, expose
 * `{ data, loading, error }`. Co-locating them keeps the cross-cutting
 * concerns (loading/error shape, profile-derived scoping) consistent
 * and avoids 8 nearly-identical hook files.
 *
 * All hooks are tenant-scoped via the auth profile. Callers don't need
 * to (and should not) pass daycareId/classroomId/childIds directly —
 * the security rules already gate the read; hooks just match the rules.
 */
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts';
import {
  activitiesApi,
  announcementsApi,
  childrenApi,
  classroomsApi,
  messagesApi,
  staffApi,
} from '@/firebase/api';
import type {
  Activity,
  Announcement,
  Child,
  Classroom,
  Conversation,
  Message,
  Staff,
} from '@/firebase/types';

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: Error | null;
};

function emptyState<T>(initial: T): AsyncState<T> {
  return { data: initial, loading: true, error: null };
}

/**
 * All children visible to the signed-in parent.
 *
 * Returns `data: []` (NOT loading) once the auth profile is hydrated
 * but the parent has no childIds — that's a real "no children linked
 * yet" empty state, not a loading state.
 */
export function useMyChildren(): AsyncState<Child[]> {
  const { profile, isParent } = useAuth();
  const uid = profile?.uid;
  const [state, setState] = useState<AsyncState<Child[]>>(emptyState([]));

  useEffect(() => {
    if (!isParent || !uid) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = childrenApi.subscribeForParent(
      uid,
      (children) => setState({ data: children, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [uid, isParent]);

  return state;
}

/** Single child by id (live). */
export function useChild(childId: string | null | undefined): AsyncState<Child | null> {
  const [state, setState] = useState<AsyncState<Child | null>>(emptyState(null));

  useEffect(() => {
    if (!childId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = childrenApi.subscribeToChild(
      childId,
      (child) => setState({ data: child, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [childId]);

  return state;
}

/** Roster for the teacher's assigned classroom. */
export function useClassroomRoster(): AsyncState<Child[]> {
  const { profile, isTeacher } = useAuth();
  const classroomId = profile?.classroomId as string | undefined;
  const daycareId = profile?.daycareId as string | undefined;

  const [state, setState] = useState<AsyncState<Child[]>>(emptyState([]));

  useEffect(() => {
    if (!isTeacher || !classroomId || !daycareId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = childrenApi.subscribeForClassroom(
      classroomId,
      daycareId,
      (children) => setState({ data: children, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, daycareId, isTeacher]);

  return state;
}

/** A specific classroom doc (use for both parent and teacher views). */
export function useClassroom(
  classroomId: string | null | undefined,
): AsyncState<Classroom | null> {
  const [state, setState] = useState<AsyncState<Classroom | null>>(emptyState(null));

  useEffect(() => {
    if (!classroomId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = classroomsApi.subscribeToClassroom(
      classroomId,
      (classroom) => setState({ data: classroom, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId]);

  return state;
}

/** Today's activities for a list of children (typically the parent's kids). */
export function useTodaysActivitiesForChildren(
  childIds: string[],
): AsyncState<Activity[]> {
  const { profile } = useAuth();
  const daycareId = profile?.daycareId as string | undefined;
  const [state, setState] = useState<AsyncState<Activity[]>>(emptyState([]));

  // Stable string key so a new array reference with the same ids doesn't
  // re-trigger the subscription effect on every render.
  const idsKey = useMemo(() => [...childIds].sort().join(','), [childIds]);

  useEffect(() => {
    if (!daycareId || childIds.length === 0) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = activitiesApi.subscribeForChildren(
      childIds,
      daycareId,
      (activities) => setState({ data: activities, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, daycareId]);

  return state;
}

/** Today's activities for the teacher's classroom. */
export function useTodaysActivitiesForClassroom(): AsyncState<Activity[]> {
  const { profile, isTeacher } = useAuth();
  const classroomId = profile?.classroomId as string | undefined;
  const daycareId = profile?.daycareId as string | undefined;
  const [state, setState] = useState<AsyncState<Activity[]>>(emptyState([]));

  useEffect(() => {
    if (!isTeacher || !classroomId || !daycareId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = activitiesApi.subscribeForClassroom(
      classroomId,
      daycareId,
      (activities) => setState({ data: activities, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, daycareId, isTeacher]);

  return state;
}

/** Announcements for the user's daycare. */
export function useAnnouncements(): AsyncState<Announcement[]> {
  const { profile } = useAuth();
  const daycareId = profile?.daycareId as string | undefined;
  const [state, setState] = useState<AsyncState<Announcement[]>>(emptyState([]));

  useEffect(() => {
    if (!daycareId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = announcementsApi.subscribeForDaycare(
      daycareId,
      (announcements) => setState({ data: announcements, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [daycareId]);

  return state;
}

/**
 * All staff in the user's daycare. Used by teacher profile to derive
 * co-teachers. UI is responsible for filtering down to "my classroom".
 */
export function useStaffForDaycare(): AsyncState<Staff[]> {
  const { profile } = useAuth();
  const daycareId = profile?.daycareId as string | undefined;
  const [state, setState] = useState<AsyncState<Staff[]>>(emptyState([]));

  useEffect(() => {
    if (!daycareId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = staffApi.subscribeForDaycare(
      daycareId,
      (staff) => setState({ data: staff, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [daycareId]);

  return state;
}

// ─── Messages / conversations ─────────────────────────────────────────

/**
 * All messages the user can see. For parents: their own threads. For
 * teachers: every message in the daycare (UI filters down).
 */
export function useMyMessages(): AsyncState<Message[]> {
  const { profile, isParent, isTeacher } = useAuth();
  const uid = profile?.uid;
  const daycareId = profile?.daycareId as string | undefined;
  const [state, setState] = useState<AsyncState<Message[]>>(emptyState([]));

  useEffect(() => {
    if (isParent && uid && daycareId) {
      setState((s) => ({ ...s, loading: true, error: null }));
      const unsub = messagesApi.subscribeForParent(
        uid,
        daycareId,
        (msgs) => setState({ data: msgs, loading: false, error: null }),
        (error) => setState((s) => ({ ...s, loading: false, error })),
      );
      return unsub;
    }
    if (isTeacher && uid && daycareId) {
      setState((s) => ({ ...s, loading: true, error: null }));
      const unsub = messagesApi.subscribeForTeacher(
        uid,
        daycareId,
        (msgs) => setState({ data: msgs, loading: false, error: null }),
        (error) => setState((s) => ({ ...s, loading: false, error })),
      );
      return unsub;
    }
    setState({ data: [], loading: false, error: null });
    return undefined;
  }, [uid, daycareId, isParent, isTeacher]);

  return state;
}

/**
 * Per-child unread breakdown for the current user, plus a "no childId"
 * bucket and a total. Single derivation off `useMyMessages()` — we only
 * iterate the message list once and produce everything other unread
 * UIs need (banner, child-switcher dot, tab badge).
 *
 * Returns:
 *   - `byChild` : `Record<childId, count>` — only children with > 0 unread
 *                 appear. Use `byChild[id] ?? 0` for safe lookup.
 *   - `withoutChild` : count of unread messages with no `childId` set.
 *                       Rare but possible — center-wide announcements,
 *                       legacy data, etc.
 *   - `total` : sum of the above. Same number `useUnreadMessageCount`
 *               returns, exposed here so callers don't double-iterate.
 *
 * Why we count locally instead of subscribing to a counter document:
 *   - `useMyMessages()` is already live for both roles; tapping into
 *     its stream is free (no extra Firestore reads).
 *   - Marking a thread read inside `/messages` flips `m.read = true`
 *     in the next snapshot tick, so every UI surfaced from this hook
 *     drops to 0 atomically — no skew between badge, banner, and
 *     switcher dot.
 */
export function useUnreadByChild(): AsyncState<{
  byChild: Record<string, number>;
  withoutChild: number;
  total: number;
}> {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const messages = useMyMessages();

  const value = useMemo(() => {
    const empty = { byChild: {} as Record<string, number>, withoutChild: 0, total: 0 };
    if (!uid) return empty;
    const byChild: Record<string, number> = {};
    let withoutChild = 0;
    let total = 0;
    for (const m of messages.data) {
      if (m.recipientId !== uid || m.read) continue;
      total += 1;
      if (m.childId) {
        byChild[m.childId] = (byChild[m.childId] ?? 0) + 1;
      } else {
        withoutChild += 1;
      }
    }
    return { byChild, withoutChild, total };
  }, [messages.data, uid]);

  return { data: value, loading: messages.loading, error: messages.error };
}

/**
 * Total count of inbound unread messages for the current user.
 *
 * Powers the Messages tab-bar badge — that surface is global (one badge
 * for both kids), so the total is what we want there. For the parent
 * home banner / child switcher chip dots, use `useUnreadByChild()`
 * instead so the UI can attribute the count to the right child.
 *
 * Implemented as a thin wrapper over `useUnreadByChild()` so there's
 * one place that defines "what is unread" and one stream powering it.
 */
export function useUnreadMessageCount(): AsyncState<number> {
  const { data, loading, error } = useUnreadByChild();
  return { data: data.total, loading, error };
}

/**
 * Group messages into conversations (client-side derivation, see
 * messagesApi). `nameLookup` lets the caller resolve participant names
 * without a separate users-collection read — pass in a map built from
 * staff (for parents) or from children + staff (for teachers).
 */
export function useConversations(opts: {
  /**
   * uid of the *current* user. We use this to figure out which side of
   * the message they're on (sender vs recipient) and to compute the
   * "other party" id per thread.
   */
  selfUid: string | undefined;
  /** Resolves participant id → display name for the conversation header. */
  nameLookup?: Map<string, string>;
  /** Optional resolver for childId → child name. */
  childNameLookup?: Map<string, string>;
}): AsyncState<Conversation[]> {
  const { selfUid, nameLookup, childNameLookup } = opts;
  const messages = useMyMessages();

  const conversations = useMemo<Conversation[]>(() => {
    if (!selfUid || messages.data.length === 0) return [];
    const grouped = new Map<string, Message[]>();
    for (const m of messages.data) {
      const key = m.conversationId || `${[m.senderId, m.recipientId ?? ''].sort().join('|')}`;
      const list = grouped.get(key) ?? [];
      list.push(m);
      grouped.set(key, list);
    }
    return Array.from(grouped.entries())
      .map(([id, msgs]) => {
        const sorted = [...msgs].sort((a, b) =>
          a.timestamp < b.timestamp ? -1 : 1,
        );
        const last = sorted[sorted.length - 1];
        // Derive "other party" — the side of the conversation that isn't us.
        const sample = sorted.find((m) => m.senderId !== selfUid) ?? sorted[0];
        const otherPartyId =
          sample.senderId === selfUid
            ? sample.recipientId ?? ''
            : sample.senderId;
        const childId = sample.childId;
        return {
          id,
          otherPartyId,
          otherPartyName: nameLookup?.get(otherPartyId) ?? 'Unknown',
          childId,
          childName: childId ? childNameLookup?.get(childId) : undefined,
          lastMessage: last.content,
          lastTimestamp: last.timestamp,
          unreadCount: sorted.filter(
            (m) => m.recipientId === selfUid && !m.read,
          ).length,
          messages: sorted,
        } satisfies Conversation;
      })
      .sort((a, b) => (a.lastTimestamp < b.lastTimestamp ? 1 : -1));
  }, [messages.data, selfUid, nameLookup, childNameLookup]);

  return { data: conversations, loading: messages.loading, error: messages.error };
}
