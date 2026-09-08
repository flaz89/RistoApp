import Link from 'next/link';

/**
 * RIS-48 stopgap: the Hero/LiveMap CTAs used to point to /ristoranti, which
 * RIS-45 parked (dead route, 404 on the public landing). This route gives
 * them a real destination without pulling forward the actual "map + search +
 * business cards" browsing page (that's its own ticket, depends on RIS-53's
 * BusinessCard and the parked /ristoranti map+sheet pattern from RIS-38/39).
 *
 * Ponytail: one static page, no logic, no CSS file — replace entirely, not
 * incrementally, when the real page ships.
 */
export default function Esplora() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-6 text-center text-ink">
      <span className="font-mono text-sm tracking-wide text-warm">{'// ESPLORA'}</span>
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
        Stiamo preparando la mappa dei negozi.
      </h1>
      <p className="max-w-md text-ink-2">
        Presto qui trovi tutti i negozi vicino a te, con ricerca e mappa in tempo reale.
        Torna a dare un&apos;occhiata tra un po&apos;.
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-2 font-mono text-sm font-semibold uppercase tracking-wide text-page"
      >
        Torna alla home
      </Link>
    </main>
  );
}
