/**
 * Live hooks for Sprint 5-7 paid features.
 *
 * Same pattern as `use-live-data.ts` — pull scoping fields off
 * `useAuth()`, subscribe, expose `{ data, loading, error }`. Kept in a
 * separate file so the original live-data hooks stay focused on core
 * parent/teacher data.
 *
 * All hooks are tenant-scoped AND feature-gated at the client — the
 * Firestore rules are the actual security boundary, but short-circuiting
 * the subscription when the feature is disabled avoids pointless
 * "insufficient permissions" noise in the console.
 */
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts';
import {
  activityTemplatesApi,
  attendanceApi,
  healthLogsApi,
  isoWeekStart,
  photosApi,
  screeningsApi,
  weeklyPlansApi,
} from '@/firebase/api';
import type {
  ActivityTemplate,
  Attendance,
  HealthLog,
  Photo,
  Screening,
  WeeklyPlan,
} from '@/firebase/types';
import { useFeature } from './use-feature';

type AsyncState<T> = { data: T; loading: boolean; error: Error | null };
function empty<T>(initial: T): AsyncState<T> {
  return { data: initial, loading: true, error: null };
}

// ─── Photo journal ───────────────────────────────────────────────────

/** Photos visible to the signed-in parent (tagged on any of their kids). */
export function useMyChildrenPhotos(childIds: string[]): AsyncState<Photo[]> {
  const { profile } = useAuth();
  const daycareId = profile?.daycareId as string | undefined;
  const feature = useFeature('photoJournal');
  const [state, setState] = useState<AsyncState<Photo[]>>(empty([]));
  const idsKey = useMemo(() => [...childIds].sort().join(','), [childIds]);

  useEffect(() => {
    if (!daycareId || childIds.length === 0 || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = photosApi.subscribeForChildren(
      childIds,
      daycareId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, daycareId, feature.enabled, feature.loading]);

  return state;
}

/** Photos in the teacher's classroom. */
export function useClassroomPhotos(): AsyncState<Photo[]> {
  const { profile, isTeacher } = useAuth();
  const classroomId = profile?.classroomId as string | undefined;
  const daycareId = profile?.daycareId as string | undefined;
  const feature = useFeature('photoJournal');
  const [state, setState] = useState<AsyncState<Photo[]>>(empty([]));

  useEffect(() => {
    if (!isTeacher || !classroomId || !daycareId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = photosApi.subscribeForClassroom(
      classroomId,
      daycareId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, daycareId, isTeacher, feature.enabled, feature.loading]);

  return state;
}

// ─── Staff clock-in ──────────────────────────────────────────────────

/** The teacher's current open shift (or null if not clocked in). */
export function useMyOpenShift(): AsyncState<Attendance | null> {
  const { profile, isTeacher } = useAuth();
  const uid = profile?.uid as string | undefined;
  const feature = useFeature('staffClockIn');
  const [state, setState] = useState<AsyncState<Attendance | null>>(empty(null));

  useEffect(() => {
    if (!isTeacher || !uid || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = attendanceApi.subscribeOpenShift(
      uid,
      (shift) => setState({ data: shift, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [uid, isTeacher, feature.enabled, feature.loading]);

  return state;
}

// ─── Health logs ─────────────────────────────────────────────────────

export function useChildHealthLogs(childId: string | null | undefined): AsyncState<HealthLog[]> {
  const feature = useFeature('healthReports');
  const [state, setState] = useState<AsyncState<HealthLog[]>>(empty([]));

  useEffect(() => {
    if (!childId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = healthLogsApi.subscribeForChild(
      childId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [childId, feature.enabled, feature.loading]);

  return state;
}

export function useClassroomHealthLogs(): AsyncState<HealthLog[]> {
  const { profile, isTeacher } = useAuth();
  const classroomId = profile?.classroomId as string | undefined;
  const daycareId = profile?.daycareId as string | undefined;
  const feature = useFeature('healthReports');
  const [state, setState] = useState<AsyncState<HealthLog[]>>(empty([]));

  useEffect(() => {
    if (!isTeacher || !classroomId || !daycareId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = healthLogsApi.subscribeForClassroom(
      classroomId,
      daycareId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, daycareId, isTeacher, feature.enabled, feature.loading]);

  return state;
}

// ─── Weekly planner ──────────────────────────────────────────────────

/**
 * The current week's plan for a given classroom. `weekStart` defaults to
 * the Monday of the current week.
 */
export function useClassroomWeeklyPlan(
  classroomId: string | null | undefined,
  weekStart: string = isoWeekStart(),
): AsyncState<WeeklyPlan | null> {
  const feature = useFeature('weeklyPlanner');
  const [state, setState] = useState<AsyncState<WeeklyPlan | null>>(empty(null));

  useEffect(() => {
    if (!classroomId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = weeklyPlansApi.subscribeForClassroomWeek(
      classroomId,
      weekStart,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, weekStart, feature.enabled, feature.loading]);

  return state;
}

// ─── Activity templates (curriculum library) ─────────────────────────

export function useActivityTemplates(): AsyncState<ActivityTemplate[]> {
  const { profile } = useAuth();
  const daycareId = profile?.daycareId as string | undefined;
  const feature = useFeature('activityPlanner');
  const [state, setState] = useState<AsyncState<ActivityTemplate[]>>(empty([]));

  useEffect(() => {
    if (!daycareId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = activityTemplatesApi.subscribeForDaycare(
      daycareId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [daycareId, feature.enabled, feature.loading]);

  return state;
}

// ─── Screenings ──────────────────────────────────────────────────────

export function useClassroomScreeningsForDate(
  date: string = new Date().toISOString().slice(0, 10),
): AsyncState<Screening[]> {
  const { profile, isTeacher } = useAuth();
  const classroomId = profile?.classroomId as string | undefined;
  const daycareId = profile?.daycareId as string | undefined;
  const feature = useFeature('morningScreenings');
  const [state, setState] = useState<AsyncState<Screening[]>>(empty([]));

  useEffect(() => {
    if (!isTeacher || !classroomId || !daycareId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = screeningsApi.subscribeForClassroomDate(
      classroomId,
      daycareId,
      date,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [classroomId, daycareId, isTeacher, date, feature.enabled, feature.loading]);

  return state;
}

export function useChildScreenings(childId: string | null | undefined): AsyncState<Screening[]> {
  const feature = useFeature('morningScreenings');
  const [state, setState] = useState<AsyncState<Screening[]>>(empty([]));

  useEffect(() => {
    if (!childId || feature.loading) return;
    if (!feature.enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = screeningsApi.subscribeForChild(
      childId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [childId, feature.enabled, feature.loading]);

  return state;
}
