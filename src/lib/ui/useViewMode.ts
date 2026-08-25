'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ViewMode = 'list' | 'grid';

const STORAGE_KEY = 'ristoapp:view-mode';
const DEFAULT_MODE: ViewMode = 'list';

/**
 * A user preference kept in the browser, read the way React wants external
 * state to be read.
 *
 * The naive version — `useState` seeded from localStorage — breaks here,
 * because this page is rendered on the server too, where there is no
 * localStorage: the server produces one HTML and the browser a different first
 * render, and React calls that a hydration mismatch. `useSyncExternalStore`
 * exists for exactly this: a snapshot for the browser, a separate one for the
 * server. The preference then applies right after hydration.
 *
 * Reading localStorage is wrapped in try/catch: in a private window, or with
 * site data blocked, merely touching it throws, and a preference must never be
 * able to break the page.
 */
const listeners = new Set<() => void>();
let snapshot: ViewMode | null = null;

function readStorage(): ViewMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'grid' || stored === 'list' ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** No cross-tab sync: a subscribe that only tracks in-page changes is enough. */
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => { listeners.delete(onChange); };
}

/** Cached because React may ask for the snapshot several times per render. */
function getSnapshot(): ViewMode {
  if (snapshot === null) snapshot = readStorage();
  return snapshot;
}

/** What the server renders. Everyone gets the same HTML; the choice arrives after. */
function getServerSnapshot(): ViewMode {
  return DEFAULT_MODE;
}

export function useViewMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: ViewMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference not persisted; it still applies for this visit.
    }
    snapshot = next;
    listeners.forEach((listener) => listener());
  }, []);

  return [mode, setMode] as const;
}
