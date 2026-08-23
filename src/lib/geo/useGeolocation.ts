'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { GeoPlace } from './types';

export type GeoStatus = 'idle' | 'locating' | 'ready' | 'error';

export type GeoErrorReason =
  | 'unsupported'          // the browser has no Geolocation API at all
  | 'insecure_context'     // served over plain http on a non-localhost origin
  | 'permission_denied'    // the user said no to THIS site
  | 'blocked_by_system'    // the site is allowed, something above the browser is not
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
 * Tell apart the two very different things that both surface as
 * PERMISSION_DENIED.
 *
 * The browser only reports its own answer, but it is not the only gatekeeper:
 * on macOS and Windows the OS has a location switch per application, and when
 * that one is off the browser is refused before it can even ask us. From the
 * page both look identical — except that the Permissions API still reports the
 * *site* permission as 'granted'. Site granted + denied result therefore means
 * the block sits above the browser, and telling the user to fiddle with site
 * settings would send them chasing the wrong switch.
 */
async function classifyDenial(): Promise<GeoErrorReason> {
  try {
    // Not supported in every browser (Safari historically did not expose it),
    // hence the try/catch rather than a feature test.
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state === 'granted') return 'blocked_by_system';
  } catch {
    // Unknown: fall back to the safe, more common explanation.
  }
  return 'permission_denied';
}

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

  const fail = useCallback((reason: GeoErrorReason) => {
    if (!alive.current) return;
    setState({ ...IDLE_STATE, status: 'error', reason });
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fail('unsupported');
      return;
    }

    /**
     * Geolocation is a "powerful feature": browsers only expose it in a secure
     * context. https:// and http://localhost qualify; http://192.168.x.x (the
     * dev server opened from another device on the LAN) does not, and the
     * refusal looks exactly like a denied permission.
     */
    if (!window.isSecureContext) {
      fail('insecure_context');
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
      async (error) => {
        // The browser's own wording is the only clue about what really refused
        // us, and it never reaches the UI — keep it in the console for us.
        console.warn('[geo] getCurrentPosition failed', error.code, error.message);

        if (error.code === error.PERMISSION_DENIED) {
          fail(await classifyDenial());
          return;
        }
        fail(error.code === error.TIMEOUT ? 'timeout' : 'position_unavailable');
      },
      POSITION_OPTIONS,
    );
  }, [fail]);

  return { ...state, request, clear };
}
