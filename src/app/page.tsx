import Hero from '@/components/landing/Hero';
import LiveMap from '@/components/landing/LiveMap';
import Pillars from '@/components/landing/Pillars';
import Manifesto from '@/components/landing/Manifesto';

/**
 * Landing v2 — ha sostituito la v1 su questo branch. La v1 resta
 * raggiungibile su /v1 (spostata da qui, non linkata da nessuna nav) per
 * confronto o per riusarne pezzi (es. la geolocalizzazione).
 * "Come funziona" è montata dentro Pillars (nel blast di OCCASIONI); il
 * Manifesto la segue e scorre sopra il blast. Manca ancora il Footer (sez. 6).
 */
export default function LandingV2() {
  return (
    <main>
      <Hero />
      <LiveMap />
      <Pillars />
      <Manifesto />
    </main>
  );
}
