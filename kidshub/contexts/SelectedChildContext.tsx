/**
 * SelectedChildContext — single source of truth for "which of my kids is the
 * parent currently looking at?" across every tab in the (parent) group.
 *
 * Background:
 *   Every parent screen (home / activity / schedule / messages / photos /
 *   profile) used to do `useMyChildren()[0]` and silently ignore siblings.
 *   Multi-sibling families (~30%+ of daycare parents) saw exactly one child
 *   in the app even when both were correctly linked in Firestore — a real,
 *   non-obvious bug because the data layer worked fine; only the
 *   presentation layer collapsed N children to 1.
 *
 *   This context fixes that by lifting the "selected child" out of any one
 *   screen and into the (parent) group layout. The ChildSwitcher chip
 *   strip lets the parent pick one; every screen reads `selectedChild` /
 *   `selectedChildId` from here instead of poking at the array.
 *
 * Lifecycle:
 *   - Subscribes to `useMyChildren()` (live Firestore parentIds query).
 *   - Tracks `selectedChildId` in local state, defaulting to children[0].
 *   - On hydration / children update, validates the saved selection still
 *     exists in the children list. If a child was removed (rare) or this
 *     is a fresh load, falls back to children[0].
 *   - Persists `selectedChildId` to AsyncStorage keyed by parent uid so
 *     it survives app reload AND a different parent on the same device
 *     doesn't pick up the previous parent's selection.
 *
 * Why a context (not just useState in a custom hook):
 *   - Multiple sibling tabs need the same selection; a per-screen useState
 *     would reset every time the parent switches tabs.
 *   - The ChildSwitcher needs to write while screens read — separating
 *     producer/consumer cleanly is what Context exists for.
 *
 * Why scoped to the (parent) group (not AuthProvider):
 *   - Teachers and owners don't have child lists; mounting at root would
 *     uselessly subscribe to `useMyChildren` for them (which already
 *     short-circuits when !isParent, but the extra effect run is wasteful).
 *   - Lives at (parent)/_layout.tsx so the moment a parent leaves the
 *     parent tab group (e.g. logs out, role bounces them), the context
 *     and its subscription unmount.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './AuthContext';
import type { Child } from '@/firebase/types';
import { useMyChildren } from '@/hooks';

const STORAGE_KEY_PREFIX = 'kidshub.parent.selectedChildId.';

function storageKeyFor(uid: string | undefined): string | null {
  return uid ? `${STORAGE_KEY_PREFIX}${uid}` : null;
}

export type SelectedChildContextValue = {
  /** All children visible to the signed-in parent (live). */
  children: Child[];
  /** The currently selected child, or null if the list is empty. */
  selectedChild: Child | null;
  /** id of the currently selected child, or null. */
  selectedChildId: string | null;
  /** True while children are loading OR the persisted selection is hydrating. */
  loading: boolean;
  /** Most recent error from the children subscription. */
  error: Error | null;
  /**
   * Switch the active child. No-op if `id` isn't one of the parent's children
   * — guards against stale ids leaking in from saved state or deep links.
   */
  setSelectedChildId: (id: string) => void;
};

const SelectedChildContext = createContext<SelectedChildContextValue | null>(null);

export function useSelectedChild(): SelectedChildContextValue {
  const ctx = useContext(SelectedChildContext);
  if (!ctx) {
    throw new Error(
      'useSelectedChild must be used within a SelectedChildProvider (mounted in (parent)/_layout.tsx)',
    );
  }
  return ctx;
}

export function SelectedChildProvider({ children: subtree }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { data: children, loading: childrenLoading, error } = useMyChildren();

  // We separate selection state from "did we hydrate from AsyncStorage yet"
  // so we don't briefly select children[0], then visibly snap to the saved
  // selection a tick later. While hydrating === true we report loading=true
  // upstream even if children have arrived.
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  // Track which uid we last hydrated for so a logout → different login
  // re-runs the AsyncStorage read against the new key.
  const hydratedForUid = useRef<string | null>(null);

  // Step 1: load the persisted selection for this parent uid (if any).
  useEffect(() => {
    if (!uid) {
      // Anon or non-parent: nothing to hydrate. Reset state in case a
      // previous parent was signed in on this device.
      setSelectedChildIdState(null);
      setHydrating(false);
      hydratedForUid.current = null;
      return;
    }
    if (hydratedForUid.current === uid) return; // already hydrated for this uid

    let cancelled = false;
    setHydrating(true);
    const key = storageKeyFor(uid)!;
    AsyncStorage.getItem(key)
      .then((saved) => {
        if (cancelled) return;
        setSelectedChildIdState(saved || null);
      })
      .catch((err) => {
        // Non-fatal: fall back to "no selection" (children[0] kicks in below).
        console.warn('[SelectedChildContext] AsyncStorage.getItem failed:', err);
        if (!cancelled) setSelectedChildIdState(null);
      })
      .finally(() => {
        if (!cancelled) {
          setHydrating(false);
          hydratedForUid.current = uid;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Step 2: once children + hydration both settle, normalize the selection.
  // Three cases:
  //   - selectedChildId points at a real child  → keep it.
  //   - selectedChildId is null but children exist → default to children[0].
  //   - selectedChildId points at a child no longer in the list (e.g. they
  //     were unlinked, or saved id is stale across daycares) → reset to
  //     children[0]. This is also the migration path for the very first
  //     run after this feature ships.
  useEffect(() => {
    if (childrenLoading || hydrating) return;
    if (children.length === 0) {
      if (selectedChildId !== null) setSelectedChildIdState(null);
      return;
    }
    const stillExists = selectedChildId
      ? children.some((c) => c.id === selectedChildId)
      : false;
    if (!stillExists) {
      setSelectedChildIdState(children[0].id);
    }
  }, [children, childrenLoading, hydrating, selectedChildId]);

  const setSelectedChildId = useCallback(
    (id: string) => {
      // Reject ids that aren't in our children list — defends against stale
      // deep links and prevents the screens below from showing data for a
      // child the rules would block reads on anyway.
      if (!children.some((c) => c.id === id)) return;
      setSelectedChildIdState(id);
      const key = storageKeyFor(uid);
      if (key) {
        AsyncStorage.setItem(key, id).catch((err) => {
          // Non-fatal: in-memory state is updated either way; we just lose
          // the selection on next reload.
          console.warn('[SelectedChildContext] AsyncStorage.setItem failed:', err);
        });
      }
    },
    [children, uid],
  );

  const selectedChild = useMemo<Child | null>(() => {
    if (!selectedChildId) return null;
    return children.find((c) => c.id === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  const value = useMemo<SelectedChildContextValue>(
    () => ({
      children,
      selectedChild,
      selectedChildId,
      loading: childrenLoading || hydrating,
      error,
      setSelectedChildId,
    }),
    [children, selectedChild, selectedChildId, childrenLoading, hydrating, error, setSelectedChildId],
  );

  return <SelectedChildContext.Provider value={value}>{subtree}</SelectedChildContext.Provider>;
}
