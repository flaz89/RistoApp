import Hero from '@/components/landing/Hero';
import LiveMap from '@/components/landing/LiveMap';

/**
 * Preview della landing v2. Vive a /v2 finché non è pronta a sostituire la v1
 * (che resta a /). Qui sotto si aggiungeranno, nell'ordine: Live Map, i 3
 * pilastri, Come funziona, Manifesto, Footer.
 */
export default function LandingV2() {
  return (
    <main>
      <Hero />
      <LiveMap />
    </main>
  );
}
