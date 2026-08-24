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
 * localStorage. The server would produce one HTML and the browser a different
 * first render, and React calls that a hydration mismatch.
 *
 * `useSyncExternalStore` is built exactly for this: it takes a snapshot for the
 * browser and a separate one for the server, so the two sides are honest with
 * each other. The preference then applies right after hydration.
 *
 * Reading localStorage is also wrapped in try/catch throughout: in a private
 * window, or with site data blocked, merely touching it throws. A preference
 * is a convenience — it must never be able to break the page.
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

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  // 'storage' fires when ANOTHER tab writes the key: two tabs open on the site
  // stay in agreement instead of drifting apart.
  const onStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    onChange();
  };
  window.addEventListener('storage', onStorageEvent);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorageEvent);
  };
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
