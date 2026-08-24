'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useGeolocation } from '@/lib/geo/useGeolocation';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import { fetchNearbyRestaurants } from '@/lib/restaurants/nearby';

const RADII = [
  { label: '1 km', meters: 1_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
];

/** Below a kilometre people think in metres, above it in kilometres. */
function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km`;
}

/**
 * Money is stored in integer cents and only ever divided at the edge, for a
 * human to read. Doing the division earlier is how rounding errors get into
 * a total.
 */
function formatSpend(cents: number | null): string | null {
  if (!cents) return null;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function RestaurantsPage() {
  const geo = useGeolocation();
  const [radius, setRadius] = useState(RADII[2].meters);

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

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl font-bold text-ink">
          Risto<span className="text-accent">•</span>App
        </Link>
        {geo.status === 'ready' && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-2">
            {geo.place ? `${geo.place.city}, ${geo.place.countryCode}` : 'posizione attiva'}
          </span>
        )}
      </header>

      <h1 className="font-display mt-8 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Vicino a te
      </h1>

      {/* --- No position yet: ask for it, explaining why. --- */}
      {geo.status !== 'ready' && (
        <section className="mt-6 rounded-2xl border border-line bg-screen-1 p-6">
          <p className="font-mono text-[11px] text-ink-3">{'// posizione'}</p>
          <p className="mt-3 text-ink-2">
            Per ordinare i locali dal più vicino ci serve sapere dove sei. Al
            server la posizione arriva arrotondata al quartiere.
          </p>
          <button
            type="button"
            disabled={geo.status === 'locating'}
            onClick={() => geo.request()}
            className="mt-5 rounded-full bg-accent px-5 py-2.5 font-semibold text-page transition hover:brightness-110 disabled:opacity-60"
          >
            {geo.status === 'locating' ? 'Ti sto cercando…' : 'Usa la mia posizione'}
          </button>
          {geo.status === 'error' && (
            <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-[#C98C7A]">
              Non riusciamo a leggere la posizione. Controlla che sia consentita
              per questo sito nelle impostazioni del browser.
            </p>
          )}
        </section>
      )}

      {/* --- Position known: radius picker + results. --- */}
      {geo.status === 'ready' && (
        <>
          <div className="mt-5 flex items-center gap-2">
            <span className="font-mono text-[11px] text-ink-3">{'// entro'}</span>
            {RADII.map((option) => (
              <button
                key={option.meters}
                type="button"
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
              Nessun locale entro {formatDistance(radius)} da {cityLabel}. Prova ad
              allargare il raggio.
            </p>
          )}

          {restaurants && restaurants.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3">
              {restaurants.map((restaurant) => {
                const spend = formatSpend(restaurant.avg_spend_cents);
                return (
                  <li key={restaurant.id}>
                    <article className="rounded-2xl border border-line bg-screen-1 p-5 transition hover:border-accent/40">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="font-display text-lg font-bold text-ink">
                          {restaurant.name}
                        </h2>
                        <span className="shrink-0 font-mono text-xs text-accent">
                          {formatDistance(restaurant.distance_m)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-2">
                        {restaurant.address_line}, {restaurant.city}
                      </p>
                      {spend && (
                        <p className="mt-3 font-mono text-xs text-ink-3">
                          spesa media {spend}
                        </p>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
