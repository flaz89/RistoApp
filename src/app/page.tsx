import Hero from '@/components/landing/Hero';
import LiveMap from '@/components/landing/LiveMap';

/**
 * Landing v2 — ha sostituito la v1 su questo branch. La v1 resta
 * raggiungibile su /v1 (spostata da qui, non linkata da nessuna nav) per
 * confronto o per riusarne pezzi (es. la geolocalizzazione).
 * Ancora incompleta: mancano i 3 pilastri, Come funziona, Manifesto, Footer.
 */
export default function LandingV2() {
  return (
    <main>
      <Hero />
      <LiveMap />
    </main>
  );
}
