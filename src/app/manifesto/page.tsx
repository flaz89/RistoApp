import Link from 'next/link';

/**
 * Placeholder for the full brand Manifesto page (navbar "Manifesto" link and
 * the landing teaser both point here). The landing section only drops the
 * hook; the real story lives here once written.
 *
 * Ponytail: one static page, no logic, no CSS file — replace entirely, not
 * incrementally, when the real page ships. Same stopgap shape as /esplora.
 */
export default function Manifesto() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-page px-6 text-center text-ink">
      <span className="font-mono text-sm tracking-wide text-warm">{'// MANIFESTO'}</span>
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
        La storia di Curius, per esteso.
      </h1>
      <p className="max-w-md text-ink-2">
        Da Mercurio a oggi: perché esistiamo, cosa portiamo al quartiere e come.
        Questa pagina sta prendendo forma — torna a dare un&apos;occhiata tra un po&apos;.
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
