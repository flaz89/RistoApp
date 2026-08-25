'use client';

import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import type { ViewMode } from '@/lib/ui/useViewMode';

import type { Category } from './RestaurantsChrome';
import { RestaurantCard } from './RestaurantCard';

/**
 * The scrollable content that lives inside the bottom sheet (mobile) and the
 * side column (desktop): the card list and every state it can be in. Both
 * shells render this same component, so a state never has two truths.
 *
 * There is no `isLoading` flag invented here — the page derives loading from
 * "no answer yet to the current query", and passes the result down. This
 * component only decides what to draw for the state it is handed.
 */
export function RestaurantList({
  category,
  restaurants,
  isLoading,
  hasFailed,
  onRetry,
  view,
  cityLabel,
  isWidestRadius,
  nextRadiusLabel,
  onWidenRadius,
  onHighlight,
  activeId,
}: {
  category: Category;
  restaurants: NearbyRestaurant[] | null;
  isLoading: boolean;
  hasFailed: boolean;
  onRetry: () => void;
  view: ViewMode;
  cityLabel: string;
  isWidestRadius: boolean;
  nextRadiusLabel: string | null;
  onWidenRadius: () => void;
  onHighlight?: (id: string | null) => void;
  activeId?: string | null;
}) {
  if (category === 'retail') {
    return (
      <Centered>
        <p className="font-display text-lg font-bold text-ink">Le botteghe arrivano presto</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
          Pasticcerie, gelaterie, panetterie. Ordini in avvicinamento, salti la
          fila e ritiri quello che hai già preso.
        </p>
        <span className="mt-4 inline-block rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
          In arrivo
        </span>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Carico i locali vicini">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <SkeletonCard />
          </li>
        ))}
      </ul>
    );
  }

  if (hasFailed) {
    return (
      <Centered>
        <p className="font-display text-lg font-bold text-ink">La ricerca non è riuscita</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
          Qualcosa è andato storto nel cercare i locali. Riprova, di solito basta.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-accent px-5 py-2.5 font-semibold text-page transition hover:brightness-110"
        >
          Riprova
        </button>
      </Centered>
    );
  }

  if (restaurants && restaurants.length === 0) {
    return (
      <Centered>
        {isWidestRadius ? (
          <>
            <p className="font-display text-lg font-bold text-ink">
              Non siamo ancora da queste parti
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
              Curius non ha ancora locali attivi intorno a {cityLabel}. Ci stiamo
              arrivando.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-bold text-ink">Nessun tavolo qui vicino</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
              Niente entro questo raggio da {cityLabel}. Prova ad allargare la
              ricerca.
            </p>
            {nextRadiusLabel && (
              <button
                type="button"
                onClick={onWidenRadius}
                className="mt-4 rounded-full bg-accent px-5 py-2.5 font-semibold text-page transition hover:brightness-110"
              >
                Cerca fino a {nextRadiusLabel}
              </button>
            )}
          </>
        )}
      </Centered>
    );
  }

  if (!restaurants) {
    // Position known, first query not fired yet: nothing to say, no error.
    return null;
  }

  return (
    <ul
      className={
        view === 'grid'
          ? 'grid grid-cols-2 gap-3'
          : 'flex flex-col gap-3'
      }
    >
      {restaurants.map((restaurant) => (
        <li
          key={restaurant.id}
          onMouseEnter={onHighlight ? () => onHighlight(restaurant.id) : undefined}
          onMouseLeave={onHighlight ? () => onHighlight(null) : undefined}
          className={
            activeId === restaurant.id
              ? 'scroll-mt-4 rounded-2xl ring-2 ring-accent/60'
              : 'scroll-mt-4'
          }
        >
          <RestaurantCard restaurant={restaurant} variant={view} />
        </li>
      ))}
    </ul>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-screen-1 p-5">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-4 w-2/5 animate-pulse rounded bg-screen-2" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-screen-2" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-screen-2" />
      </div>
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-screen-2" />
    </div>
  );
}
