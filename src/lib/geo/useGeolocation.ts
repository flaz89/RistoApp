'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { GeoPlace } from './types';

export type GeoStatus = 'idle' | 'locating' | 'ready' | 'error';

export type GeoErrorReason =
  | 'unsupported'          // the browser has no Geolocation API (or no HTTPS)
  | 'permission_denied'    // the user said no
  | 'position_unavailable' // no GPS / no network fix
  | 'timeout';             // the fix took too long

export type GeolocationState = {
  status: GeoStatus;
  /** Precise coordinates, kept in the browser only (see `request`). */
  coords: { lat: number; lon: number } | null;
  /** Resolved place name; null when the position is known but unnamed. */
  place: GeoPlace | null;
  reason: GeoErrorReason | null;
};

/**
 * City-level accuracy is all this feature needs, so we ask for the cheap fix:
 * no high accuracy (skips GPS, saves battery and seconds) and a five minute
 * cached position is fine.
 */
const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

/** Same 3-decimal rounding the server applies: ~110 m, enough to name a city. */
const SENT_PRECISION = 3;

const IDLE_STATE: GeolocationState = {
  status: 'idle',
  coords: null,
  place: null,
  reason: null,
};

/**
 * Owns the whole "where am I" flow: ask the browser, then ask our own API for a
 * human readable name. The UI only reads `status` and renders text for it — it
 * never talks to the Geolocation API or to the endpoint directly.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(IDLE_STATE);

  // A late browser callback must not write into an unmounted component.
  const alive = useRef(true);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      inFlight.current?.abort();
    };
  }, []);

  const clear = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    setState(IDLE_STATE);
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ ...IDLE_STATE, status: 'error', reason: 'unsupported' });
      return;
    }

    setState({ ...IDLE_STATE, status: 'locating' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!alive.current) return;

        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        // The exact position never leaves the device: we send the rounded one.
        const lat = coords.lat.toFixed(SENT_PRECISION);
        const lon = coords.lon.toFixed(SENT_PRECISION);

        inFlight.current?.abort();
        const controller = new AbortController();
        inFlight.current = controller;

        let place: GeoPlace | null = null;
        try {
          const response = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`, {
            signal: controller.signal,
          });
          if (response.ok) place = (await response.json()) as GeoPlace;
        } catch {
          // Naming the place is a nicety. Knowing where the user is already
          // unlocks the map, so a failed lookup must not fail the whole flow.
        }

        if (!alive.current || controller.signal.aborted) return;
        setState({ status: 'ready', coords, place, reason: null });
      },
      (error) => {
        if (!alive.current) return;

        const reason: GeoErrorReason =
          error.code === error.PERMISSION_DENIED ? 'permission_denied'
          : error.code === error.TIMEOUT ? 'timeout'
          : 'position_unavailable';

        setState({ ...IDLE_STATE, status: 'error', reason });
      },
      POSITION_OPTIONS,
    );
  }, []);

  return { ...state, request, clear };
}
