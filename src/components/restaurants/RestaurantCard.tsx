import Link from 'next/link';

import { formatDistance, formatSpend } from '@/lib/format';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import type { ViewMode } from '@/lib/ui/useViewMode';

import { RestaurantLogo } from './RestaurantLogo';

export function RestaurantCard({
  restaurant,
  variant,
}: {
  restaurant: NearbyRestaurant;
  variant: ViewMode;
}) {
  const spend = formatSpend(restaurant.avg_spend_cents);
  const distance = formatDistance(restaurant.distance_m);
  const href = `/ristoranti/${restaurant.slug}`;

  if (variant === 'grid') {
    return (
      <Link href={href} className="block h-full">
        <article className="flex h-full flex-col rounded-2xl border border-line bg-screen-1 p-3 transition hover:border-accent/40">
          <RestaurantLogo
            name={restaurant.name}
            url={restaurant.logo_url}
            className="aspect-[4/3] h-auto w-full"
          />

          <h2 className="font-display mt-3 text-base font-bold leading-snug text-ink">
            {restaurant.name}
          </h2>

          {/* Pushed to the bottom so cards of different text length still line
              their footers up — a ragged bottom edge is what makes a grid look
              broken. */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="font-mono text-xs text-accent">{distance}</span>
            {spend && <span className="font-mono text-xs text-ink-3">{spend}</span>}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <article className="flex items-center gap-4 rounded-2xl border border-line bg-screen-1 p-5 transition hover:border-accent/40">
        {/* min-w-0 lets a long name truncate instead of shoving the logo and
            the distance off the card: a flex child refuses to shrink below its
            content unless it is told it may. */}
        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-lg font-bold text-ink">{restaurant.name}</h2>
          <p className="mt-1 truncate text-sm text-ink-2">
            {restaurant.address_line}, {restaurant.city}
          </p>
          {spend && <p className="mt-3 font-mono text-xs text-ink-3">spesa media {spend}</p>}
        </div>

        <RestaurantLogo name={restaurant.name} url={restaurant.logo_url} />

        <span className="w-16 shrink-0 text-right font-mono text-xs text-accent">{distance}</span>
      </article>
    </Link>
  );
}
