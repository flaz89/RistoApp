import Hero from '@/components/landing/Hero';
import LiveMap from '@/components/landing/LiveMap';
import Pillars from '@/components/landing/Pillars';

/**
 * Landing v2 — ha sostituito la v1 su questo branch. La v1 resta
 * raggiungibile su /v1 (spostata da qui, non linkata da nessuna nav) per
 * confronto o per riusarne pezzi (es. la geolocalizzazione).
 * Ancora incompleta: Pillars è solo scheletro (vedi Pillars.tsx), mancano
 * Come funziona, Manifesto, Footer.
 */
export default function LandingV2() {
  return (
    <main>
      <Hero />
      <LiveMap />
      <Pillars />
    </main>
  );
}
