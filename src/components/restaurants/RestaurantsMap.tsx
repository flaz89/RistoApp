'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LngLatBounds,
  Map as MaplibreMap,
  Marker,
  type LngLatLike,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { formatDistance, formatSpend } from '@/lib/format';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';

import type { Category } from './RestaurantsChrome';
import { RestaurantLogo } from './RestaurantLogo';

/**
 * MapLibre with MapTiler tiles, or a neutral ground when no key is set yet.
 * The whole point of the screen: your position, and the restaurants around it,
 * as pins you can tap. Restaurant markers are React nodes rendered through a
 * portal into MapLibre's own marker elements, so they stay Tailwind-styled and
 * MapLibre keeps them pinned to their coordinates through every pan and zoom.
 */

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
// A muted, low-chroma style so the orange pins are the only warm thing on it.
// Swap for another grayscale MapTiler style (e.g. 'toner-v2') if you prefer.
const MAPTILER_STYLE = 'dataviz-dark';

// Used until a key is added: a single warm-charcoal fill, no tiles. Pins still
// render at their coordinates, so the screen is coherent, just tile-less.
const BLANK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'ground', type: 'background', paint: { 'background-color': '#0E0C0A' } }],
};

const STYLE: string | StyleSpecification = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/${MAPTILER_STYLE}/style.json?key=${MAPTILER_KEY}`
  : BLANK_STYLE;

// The marker anchor points MapLibre supports, typed locally so we do not depend
// on the exact name the library exports for it.
type MarkerAnchor =
  | 'center' | 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// A shared zero offset: a fresh [0,0] each render would make every marker's
// effect re-run and recreate the marker, dropping it and re-adding it per frame.
const ZERO_OFFSET: [number, number] = [0, 0];

export function RestaurantsMap({
  userCoords,
  restaurants,
  category,
  activeId,
  onActivePin,
}: {
  userCoords: { lat: number; lon: number };
  restaurants: NearbyRestaurant[] | null;
  category: Category;
  activeId: string | null;
  onActivePin: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MaplibreMap | null>(null);

  // Restaurants only carry pins in the restaurants category; retail clears them.
  // Only rows with finite coordinates become pins: MapLibre throws on NaN, and a
  // row can be missing them (e.g. before migration 0005 is applied). The list
  // still shows every restaurant — coordinates are a map concern only.
  // Memoized so its identity is stable — otherwise the fit effect below would
  // re-run every render on a fresh array.
  const pins = useMemo(
    () =>
      category === 'restaurants'
        ? (restaurants ?? []).filter(
            (r) => Number.isFinite(r.longitude) && Number.isFinite(r.latitude),
          )
        : [],
    [category, restaurants],
  );

  // If rows arrive without coordinates, say so once: it almost always means the
  // RPC is still returning the pre-0005 shape (migration not applied, or the
  // PostgREST schema cache is stale).
  useEffect(() => {
    if (category !== 'restaurants' || !restaurants) return;
    const missing = restaurants.filter(
      (r) => !Number.isFinite(r.longitude) || !Number.isFinite(r.latitude),
    ).length;
    if (missing > 0) {
      console.warn(
        `[map] ${missing}/${restaurants.length} ristoranti senza coordinate: la migrazione 0005 è applicata e lo schema PostgREST ricaricato?`,
      );
    }
  }, [category, restaurants]);

  const active = useMemo(
    () => pins.find((r) => r.id === activeId) ?? null,
    [pins, activeId],
  );

  // Init once. The initial centre is the user; later moves are the fit effect.
  useEffect(() => {
    if (!containerRef.current) return;
    const center: [number, number] =
      Number.isFinite(userCoords.lon) && Number.isFinite(userCoords.lat)
        ? [userCoords.lon, userCoords.lat]
        : [7.6869, 45.0703]; // Torino, only if coordinates are somehow invalid
    const m = new MaplibreMap({
      container: containerRef.current,
      style: STYLE,
      center,
      zoom: 13,
      attributionControl: { compact: true },
      // Keep it a map, not a flight simulator: no pitch/rotate on a list screen.
      pitchWithRotate: false,
      dragRotate: false,
    });
    m.on('load', () => setMap(m));
    return () => {
      m.remove();
      setMap(null);
    };
    // Init is intentionally one-shot; recentring lives in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Frame the data: fit to user + pins, or just recentre on the user when there
  // is nothing to frame. Extra bottom padding leaves room for the sheet.
  useEffect(() => {
    if (!map) return;
    if (!Number.isFinite(userCoords.lon) || !Number.isFinite(userCoords.lat)) return;
    const userLngLat: LngLatLike = [userCoords.lon, userCoords.lat];

    if (pins.length === 0) {
      map.easeTo({ center: userLngLat, zoom: 13, duration: 400 });
      return;
    }

    const bounds = new LngLatBounds(userLngLat, userLngLat);
    pins.forEach((r) => bounds.extend([r.longitude, r.latitude]));
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 220, left: 48, right: 48 },
      maxZoom: 15,
      duration: 500,
    });
  }, [map, pins, userCoords.lat, userCoords.lon]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />

      {map && (
        <MapMarker map={map} lngLat={[userCoords.lon, userCoords.lat]}>
          <UserPin />
        </MapMarker>
      )}

      {map &&
        pins.map((r) => (
          <MapMarker key={r.id} map={map} lngLat={[r.longitude, r.latitude]}>
            <RestaurantPin
              name={r.name}
              active={r.id === activeId}
              onClick={() => onActivePin(r.id === activeId ? null : r.id)}
            />
          </MapMarker>
        ))}

      {map && active && (
        <MapMarker
          map={map}
          lngLat={[active.longitude, active.latitude]}
          anchor="bottom"
          offset={[0, -30]}
        >
          <MiniCard restaurant={active} onClose={() => onActivePin(null)} />
        </MapMarker>
      )}
    </div>
  );
}

/**
 * One MapLibre marker whose element is an empty div we own, with React portaled
 * into it. MapLibre moves the div; React fills it. Recreated only when the
 * coordinates or anchoring change.
 */
function MapMarker({
  map,
  lngLat,
  anchor = 'center',
  offset = ZERO_OFFSET,
  children,
}: {
  map: MaplibreMap;
  lngLat: [number, number];
  anchor?: MarkerAnchor;
  offset?: [number, number];
  children: React.ReactNode;
}) {
  const [el] = useState(() => {
    const node = document.createElement('div');
    node.style.willChange = 'transform';
    return node;
  });
  const [lng, lat] = lngLat;
  const [ox, oy] = offset;

  useEffect(() => {
    const marker = new Marker({ element: el, anchor, offset: [ox, oy] })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
    // Primitives in the deps, not the array literal, so a marker is created once
    // and only moved when its actual coordinates or anchoring change.
  }, [map, el, lng, lat, anchor, ox, oy]);

  return createPortal(children, el);
}

function UserPin() {
  return (
    <div className="relative grid h-4 w-4 place-items-center" aria-label="La tua posizione">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/50 motion-reduce:hidden" />
      <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-page bg-accent shadow-[0_0_12px_rgba(246,119,0,0.7)]" />
    </div>
  );
}

function RestaurantPin({
  name,
  active,
  onClick,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-pressed={active}
      className="group grid place-items-center"
    >
      <span
        className={
          active
            ? 'block h-4 w-4 rounded-full border-2 border-page bg-accent-2 shadow-[0_0_16px_rgba(246,119,0,0.85)] transition [transform:scale(1.35)]'
            : 'block h-3.5 w-3.5 rounded-full border-2 border-page bg-accent-2 shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition group-hover:[transform:scale(1.2)]'
        }
      />
    </button>
  );
}

function MiniCard({
  restaurant,
  onClose,
}: {
  restaurant: NearbyRestaurant;
  onClose: () => void;
}) {
  const spend = formatSpend(restaurant.avg_spend_cents);
  const distance = formatDistance(restaurant.distance_m);

  return (
    <div className="w-60 rounded-2xl border border-line bg-screen-1/95 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="flex items-start gap-3">
        <RestaurantLogo name={restaurant.name} url={restaurant.logo_url} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold leading-snug text-ink">
            {restaurant.name}
          </p>
          <p className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-accent">
            {distance}
            {spend && <span className="text-ink-3">· {spend}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="-mr-1 -mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-3 transition hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <Link
        href={`/ristoranti/${restaurant.slug}`}
        className="mt-3 block rounded-full bg-accent px-4 py-2 text-center text-[13px] font-semibold text-page transition hover:brightness-110"
      >
        Vedi il locale
      </Link>
    </div>
  );
}
