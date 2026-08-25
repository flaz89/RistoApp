'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RestaurantList } from '@/components/restaurants/RestaurantList';
import { RestaurantsChrome, type Category } from '@/components/restaurants/RestaurantsChrome';
import { RestaurantsSheet, type SheetSnap } from '@/components/restaurants/RestaurantsSheet';
import { useGeolocation } from '@/lib/geo/useGeolocation';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import { fetchNearbyRestaurants } from '@/lib/restaurants/nearby';
import { useViewMode } from '@/lib/ui/useViewMode';

// MapLibre touches `window` on import, so it must never run on the server.
// ssr:false keeps it a browser-only component; the fallback is the bare ground.
const RestaurantsMap = dynamic(
  () => import('@/components/restaurants/RestaurantsMap').then((m) => m.RestaurantsMap),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-page" /> },
);

const RADII = [
  { label: '1 km', meters: 1_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
];

export default function RestaurantsPage() {
  const geo = useGeolocation();
  const [radius, setRadius] = useState(RADII[2].meters);
  const [view, setView] = useViewMode();
  const [category, setCategory] = useState<Category>('restaurants');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');

  const { status, coords } = geo;

  /**
   * One string identifies a search: where and how far. Storing the answer
   * together with the question it answers means "are we loading?" does not
   * need a state of its own — it is simply "we have no answer to THIS
   * question yet". A late reply to an old question can never be mistaken for
   * the current one.
   */
  const query = coords ? `${coords.lat},${coords.lon},${radius}` : null;

  const [answer, setAnswer] = useState<{ query: string; rows: NearbyRestaurant[] } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !coords || !query) return;

    let cancelled = false;

    fetchNearbyRestaurants(coords.lat, coords.lon, radius)
      .then((rows) => { if (!cancelled) setAnswer({ query, rows }); })
      .catch((error) => {
        if (cancelled) return;
        console.error('[restaurants]', error);
        setFailed(query);
      });

    return () => { cancelled = true; };
  }, [status, coords, radius, query]);

  const restaurants = answer?.query === query ? answer.rows : null;
  const hasFailed = failed === query;
  const isLoading = status === 'ready' && restaurants === null && !hasFailed;

  const cityLabel = geo.place?.city ?? 'la tua posizione';
  const widestIndex = RADII.length - 1;
  const currentIndex = RADII.findIndex((r) => r.meters === radius);
  const isWidestRadius = currentIndex === widestIndex;
  const nextRadiusLabel = isWidestRadius ? null : RADII[currentIndex + 1].label;

  // Changing what is searched invalidates which pin was open.
  function changeRadius(meters: number) {
    setActivePin(null);
    setRadius(meters);
  }
  function widenRadius() {
    if (!isWidestRadius) changeRadius(RADII[currentIndex + 1].meters);
  }
  function changeCategory(next: Category) {
    setActivePin(null);
    setCategory(next);
  }
  function retry() {
    // Re-fire the current query by clearing its failed mark; the effect re-runs.
    setFailed(null);
  }

  // --- Position not known yet: ask for it before showing any map. ---
  if (status !== 'ready') {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          {'// dove sei'}
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-ink">
          Un tavolo, vicino a te
        </h1>
        <p className="mt-3 text-ink-2">
          Per mostrarti i locali dal più vicino ci serve la tua posizione. Al
          server arriva arrotondata al quartiere, mai esatta.
        </p>
        <button
          type="button"
          disabled={status === 'locating'}
          onClick={() => geo.request()}
          className="mt-6 w-max rounded-full bg-accent px-5 py-2.5 font-semibold text-page transition hover:brightness-110 disabled:opacity-60"
        >
          {status === 'locating' ? 'Ti sto cercando…' : 'Usa la mia posizione'}
        </button>
        {status === 'error' && (
          <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-[#E0916F]">
            Non riusciamo a leggere la posizione. Controlla che sia consentita
            per questo sito nelle impostazioni del browser.
          </p>
        )}
        <Link href="/" className="mt-8 font-mono text-[11px] uppercase tracking-wider text-ink-3 transition hover:text-ink-2">
          ← Torna alla home
        </Link>
      </main>
    );
  }

  // --- Position known: the layered surface. ---
  return (
    <div className="fixed inset-0 flex flex-col bg-page">
      <RestaurantsChrome
        place={geo.place}
        category={category}
        onCategoryChange={changeCategory}
        radii={RADII}
        radius={radius}
        onRadiusChange={changeRadius}
        view={view}
        onViewChange={setView}
      />

      <div className="relative flex-1 overflow-hidden">
        {coords && (
          <RestaurantsMap
            userCoords={coords}
            restaurants={restaurants}
            category={category}
            activeId={activePin}
            onActivePin={setActivePin}
          />
        )}

        {/* Desktop: a fixed list column on the right, over the map. */}
        <aside className="absolute inset-y-0 right-0 z-20 hidden w-[380px] overflow-y-auto border-l border-line bg-page/95 px-4 py-5 backdrop-blur-md sm:block">
          <RestaurantList
            category={category}
            restaurants={restaurants}
            isLoading={isLoading}
            hasFailed={hasFailed}
            onRetry={retry}
            view={view}
            cityLabel={cityLabel}
            isWidestRadius={isWidestRadius}
            nextRadiusLabel={nextRadiusLabel}
            onWidenRadius={widenRadius}
            onHighlight={setActivePin}
            activeId={activePin}
          />
        </aside>

        {/* Mobile: the same list as a bottom sheet over the map. */}
        <RestaurantsSheet snap={snap} onSnapChange={setSnap}>
          <RestaurantList
            category={category}
            restaurants={restaurants}
            isLoading={isLoading}
            hasFailed={hasFailed}
            onRetry={retry}
            view={view}
            cityLabel={cityLabel}
            isWidestRadius={isWidestRadius}
            nextRadiusLabel={nextRadiusLabel}
            onWidenRadius={widenRadius}
            activeId={activePin}
          />
        </RestaurantsSheet>
      </div>
    </div>
  );
}
