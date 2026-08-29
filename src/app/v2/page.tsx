import Hero from '@/components/landing/Hero';

/**
 * Preview della landing v2. Vive a /v2 finché non è pronta a sostituire la v1
 * (che resta a /). Qui sotto si aggiungeranno, nell'ordine: Live Map, i 3
 * pilastri, Come funziona, Manifesto, Footer.
 */
export default function LandingV2() {
  return (
    <main>
      <Hero />
      {/* Sezione 2 — Live Map (segnaposto): qui le nuvole "consegnano" i loghi. */}
      <section
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-ink-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          letterSpacing: '0.1em',
          background: '#2E2B28', // stesso inchiostro di --hero-ink (hero.css), scoped a .hero e non visibile qui
        }}
      >
        {'// sezione 2 — mappa live'}
      </section>
    </main>
  );
}
