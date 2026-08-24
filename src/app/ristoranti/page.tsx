'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { ViewToggle } from '@/components/restaurants/ViewToggle';
import { formatDistance } from '@/lib/format';
import { useGeolocation } from '@/lib/geo/useGeolocation';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import { fetchNearbyRestaurants } from '@/lib/restaurants/nearby';
import { useViewMode } from '@/lib/ui/useViewMode';

const RADII = [
  { label: '1 km', meters: 1_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
];

export default function RestaurantsPage() {
  const geo = useGeolocation();
  const [radius, setRadius] = useState(RADII[2].meters);
  const [view, setView] = useViewMode();

  const { status, coords } = geo;

  /**
   * One string identifies a search: where and how far. Storing the answer
   * together with the question it answers means "are we loading?" does not
   * need a state of its own — it is simply "we have no answer to THIS
   * question yet". One less variable to keep in sync, and a late reply to an
   * old question can never be mistaken for the current one.
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
  const isWidestRadius = radius === RADII[RADII.length - 1].meters;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl font-bold text-ink">
          Risto<span className="text-accent">•</span>App
        </Link>
        {status === 'ready' && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-2">
            {geo.place ? `${geo.place.city}, ${geo.place.countryCode}` : 'posizione attiva'}
          </span>
        )}
      </header>

      <h1 className="font-display mt-8 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Vicino a te
      </h1>

      {/* --- No position yet: ask for it, explaining why. --- */}
      {status !== 'ready' && (
        <section className="mt-6 max-w-xl rounded-2xl border border-line bg-screen-1 p-6">
          <p className="font-mono text-[11px] text-ink-3">{'// posizione'}</p>
          <p className="mt-3 text-ink-2">
            Per ordinare i locali dal più vicino ci serve sapere dove sei. Al
            server la posizione arriva arrotondata al quartiere.
          </p>
          <button
            type="button"
            disabled={status === 'locating'}
            onClick={() => geo.request()}
            className="mt-5 rounded-full bg-accent px-5 py-2.5 font-semibold text-page transition hover:brightness-110 disabled:opacity-60"
          >
            {status === 'locating' ? 'Ti sto cercando…' : 'Usa la mia posizione'}
          </button>
          {status === 'error' && (
            <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-[#C98C7A]">
              Non riusciamo a leggere la posizione. Controlla che sia consentita
              per questo sito nelle impostazioni del browser.
            </p>
          )}
        </section>
      )}

      {/* --- Position known: filters + results. --- */}
      {status === 'ready' && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink-3">{'// entro'}</span>
              {RADII.map((option) => (
                <button
                  key={option.meters}
                  type="button"
                  aria-pressed={option.meters === radius}
                  onClick={() => setRadius(option.meters)}
                  className={
                    option.meters === radius
                      ? 'rounded-full border border-accent bg-accent/10 px-3 py-1 text-sm text-accent'
                      : 'rounded-full border border-line px-3 py-1 text-sm text-ink-2 transition hover:text-ink'
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            <ViewToggle mode={view} onChange={setView} />
          </div>

          {isLoading && (
            <p className="mt-8 font-mono text-sm text-ink-3">Cerco intorno a {cityLabel}…</p>
          )}

          {hasFailed && (
            <p className="mt-8 font-mono text-sm text-[#C98C7A]">
              La ricerca non è riuscita. Riprova tra un momento.
            </p>
          )}

          {restaurants?.length === 0 && (
            <p className="mt-8 text-ink-2">
              {isWidestRadius
                ? `Non siamo ancora attivi intorno a ${cityLabel}. Ci stiamo lavorando.`
                : `Nessun locale entro ${formatDistance(radius)} da ${cityLabel}. Prova ad allargare il raggio.`}
            </p>
          )}

          {restaurants && restaurants.length > 0 && (
            /* One list, two layouts. The markup and the order stay identical —
               only the container changes — so switching view never reshuffles
               what the user was looking at. */
            <ul
              className={
                view === 'grid'
                  ? 'mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
                  : 'mt-6 flex flex-col gap-3'
              }
            >
              {restaurants.map((restaurant) => (
                <li key={restaurant.id}>
                  <RestaurantCard restaurant={restaurant} variant={view} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
