import { formatDistance, formatSpend } from '@/lib/format';
import type { NearbyRestaurant } from '@/lib/restaurants/nearby';
import type { ViewMode } from '@/lib/ui/useViewMode';

/**
 * Stand-in for the cover photo the seed data does not have yet. A grid card
 * without an image is just a short paragraph in a box: the eye needs something
 * to land on before it reads. The initial is derived from the name, so two
 * restaurants never look identical.
 *
 * TODO: swap for next/image once cover_photo_url is populated — it needs the
 * width/height to reserve space and avoid the layout jumping.
 */
function CoverPlaceholder({ name }: { name: string }) {
  return (
    <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-line bg-gradient-to-br from-screen-1 to-screen-2">
      <span className="font-display text-3xl text-ink-3">{name.charAt(0)}</span>
    </div>
  );
}

export function RestaurantCard({
  restaurant,
  variant,
}: {
  restaurant: NearbyRestaurant;
  variant: ViewMode;
}) {
  const spend = formatSpend(restaurant.avg_spend_cents);
  const distance = formatDistance(restaurant.distance_m);

  if (variant === 'grid') {
    return (
      <article className="flex h-full flex-col rounded-2xl border border-line bg-screen-1 p-3 transition hover:border-accent/40">
        <CoverPlaceholder name={restaurant.name} />

        <h2 className="font-display mt-3 text-base font-bold leading-snug text-ink">
          {restaurant.name}
        </h2>

        {/* Pushed to the bottom so cards of different text length still line
            their footers up — a ragged bottom edge is what makes a grid look
            broken. */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-accent">{distance}</span>
          {spend && <span className="font-mono text-xs text-ink-3">{spend}</span>}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-line bg-screen-1 p-5 transition hover:border-accent/40">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-ink">{restaurant.name}</h2>
        <span className="shrink-0 font-mono text-xs text-accent">{distance}</span>
      </div>
      <p className="mt-1 text-sm text-ink-2">
        {restaurant.address_line}, {restaurant.city}
      </p>
      {spend && <p className="mt-3 font-mono text-xs text-ink-3">spesa media {spend}</p>}
    </article>
  );
}
