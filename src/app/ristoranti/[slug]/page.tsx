import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RestaurantLogo } from '@/components/restaurants/RestaurantLogo';
import { formatSpend } from '@/lib/format';
import { fetchRestaurantBySlug } from '@/lib/restaurants/detail';

/**
 * A SERVER component, unlike the list page.
 *
 * The list needs the browser: it cannot know where you are without asking you.
 * This page needs nothing from the browser — the restaurant is the same for
 * everyone — so it is rendered on the server. Two things follow: the visitor
 * gets finished HTML instead of a spinner, and a search engine can read the
 * page without running any JavaScript. For a product whose whole value is
 * being found nearby, that second one is not a detail.
 */

/**
 * `params` is a Promise since Next 15: the route parameters may not be known
 * until the request is actually being handled, so they are awaited.
 *
 * Declared by hand rather than with the generated `PageProps<'/ristoranti/[slug]'>`
 * helper: that union is produced by `next dev` / `next build`, so it does not
 * know about a route until the app has been run once — which would make a fresh
 * clone fail to typecheck.
 */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);

  if (!restaurant) return { title: 'Locale non trovato' };

  return {
    // The root layout turns this into "Nome · RistoApp".
    title: restaurant.name,
    description:
      restaurant.description ??
      `${restaurant.name} — ${restaurant.address_line}, ${restaurant.city}. Prenota il tuo tavolo.`,
  };
}

/** Sections whose data does not exist yet, drawn so they read as "coming", not "broken". */
function ComingSoon({ label, title, children }: { label: string; title: string; children: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-line p-6">
      <p className="font-mono text-[11px] text-ink-3">{label}</p>
      <h2 className="font-display mt-2 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-prose text-sm text-ink-2">{children}</p>
    </section>
  );
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);

  // notFound() renders the 404 page AND sends a real 404 status, which matters:
  // a "not found" page answering 200 gets indexed as a real page.
  if (!restaurant) notFound();

  const spend = formatSpend(restaurant.avg_spend_cents);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
      <Link
        href="/ristoranti"
        className="font-mono text-[11px] text-ink-3 transition hover:text-ink-2"
      >
        {'// torna ai locali vicini'}
      </Link>

      {/* --- Hero: cover band with the logo sitting across its edge --- */}
      <div className="mt-4">
        <div className="h-40 w-full rounded-2xl border border-line bg-gradient-to-br from-screen-1 to-screen-2 sm:h-56" />

        <div className="-mt-10 flex items-end gap-4 px-4 sm:px-6">
          <RestaurantLogo
            name={restaurant.name}
            url={restaurant.logo_url}
            className="h-20 w-20 sm:h-24 sm:w-24"
          />
          <div className="min-w-0 pb-1">
            <h1 className="font-display truncate text-2xl font-bold text-ink sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="truncate text-sm text-ink-2">
              {restaurant.address_line}, {restaurant.postal_code} {restaurant.city}
            </p>
          </div>
        </div>
      </div>

      {restaurant.description && (
        <p className="mt-6 max-w-prose text-ink-2">{restaurant.description}</p>
      )}

      {/* --- Facts we actually have --- */}
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        {spend && (
          <div>
            <dt className="font-mono text-[11px] text-ink-3">spesa media</dt>
            <dd className="text-ink">{spend}</dd>
          </div>
        )}
        <div>
          <dt className="font-mono text-[11px] text-ink-3">telefono</dt>
          <dd>
            <a href={`tel:${restaurant.phone}`} className="text-ink transition hover:text-accent">
              {restaurant.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] text-ink-3">email</dt>
          <dd>
            <a href={`mailto:${restaurant.email}`} className="text-ink transition hover:text-accent">
              {restaurant.email}
            </a>
          </dd>
        </div>
      </dl>

      {/* --- The booking action. Present but honest: there is nothing behind it yet. --- */}
      <section className="mt-8 rounded-2xl border border-line bg-screen-1 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Scegli il tuo tavolo</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-2">
          Qui arriverà la piantina del locale: vedrai la sala com&apos;è davvero e
          sceglierai il tavolo che preferisci, non solo un orario.
        </p>
        <button
          type="button"
          disabled
          className="mt-5 rounded-full bg-accent px-5 py-2.5 font-semibold text-page disabled:opacity-40"
        >
          Prenota — in arrivo
        </button>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ComingSoon label="// menu" title="Il menu del locale">
          Piatti, prezzi e allergeni, così ordini e paghi dal telefono senza
          aspettare il cameriere.
        </ComingSoon>

        <ComingSoon label="// foto" title="Le foto della sala">
          Le immagini caricate dal ristoratore, per capire l&apos;atmosfera prima
          di prenotare.
        </ComingSoon>
      </div>
    </main>
  );
}
