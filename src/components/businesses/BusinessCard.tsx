import Link from 'next/link';

import { formatDistance, formatSpend } from '@/lib/format';
import type { ViewMode } from '@/lib/ui/useViewMode';

import { BusinessLogo } from './BusinessLogo';

/**
 * Hand-written for now — `nearby_businesses` (migration 0008) isn't reflected
 * in `database.types.ts` yet (`supabase gen types` hasn't been re-run this
 * session). Swap this for the generated
 * `Database['public']['Functions']['nearby_businesses']['Returns'][number]`
 * once that regen happens — same pattern the parked `NearbyRestaurant` type
 * still uses in `src/parked/lib/restaurants/nearby.ts`.
 */
export type NearbyBusiness = {
  slug: string;
  name: string;
  logo_url: string | null;
  avg_spend_cents: number | null;
  distance_m: number;
  address_line: string;
  city: string;
};

export type BusinessType = 'shop';

/**
 * Generalized `card v2` (RIS-45) — the restaurant-only original is frozen at
 * `src/parked/components/restaurants/RestaurantCard.tsx`, unchanged.
 *
 * ponytail: `businessType` only has a `'shop'` branch today (the union in the
 * ticket's "switch with one branch") — no caller wires this up yet, browsing
 * shops is a later ticket. Widen the union and branch inside (href shape,
 * a badge, whatever differs) if a second business type shows up.
 */
export function BusinessCard({
  business,
  businessType,
  variant,
}: {
  business: NearbyBusiness;
  businessType: BusinessType;
  variant: ViewMode;
}) {
  const spend = formatSpend(business.avg_spend_cents);
  const distance = formatDistance(business.distance_m);
  const href = businessType === 'shop' ? `/negozi/${business.slug}` : '#';

  if (variant === 'grid') {
    return (
      <Link href={href} className="block h-full">
        <article className="flex h-full flex-col rounded-2xl border border-line bg-screen-1 p-3 transition hover:border-accent/40">
          <BusinessLogo
            name={business.name}
            url={business.logo_url}
            className="aspect-[4/3] h-auto w-full"
          />

          <h2 className="font-display mt-3 text-base font-bold leading-snug text-ink">
            {business.name}
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
          <h2 className="font-display truncate text-lg font-bold text-ink">{business.name}</h2>
          <p className="mt-1 truncate text-sm text-ink-2">
            {business.address_line}, {business.city}
          </p>
          {spend && <p className="mt-3 font-mono text-xs text-ink-3">spesa media {spend}</p>}
        </div>

        <BusinessLogo name={business.name} url={business.logo_url} />

        <span className="w-16 shrink-0 text-right font-mono text-xs text-accent">{distance}</span>
      </article>
    </Link>
  );
}
