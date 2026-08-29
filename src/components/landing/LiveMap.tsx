import './live-map.css';

/**
 * Posizioni fittizie dei pin (% rispetto al contenitore) — non sono locali
 * reali, solo per far vedere come la mappa "vivrà" di punti quando ci sarà
 * il consenso al tracciamento e i dati veri (vedi commento sotto).
 */
const PINS = [
  { top: '28%', left: '34%' },
  { top: '46%', left: '52%' },
  { top: '69%', left: '10%' },
  { top: '38%', left: '68%' },
  { top: '90%', left: '60%' },
  { top: '24%', left: '58%' },
  { top: '54%', left: '30%' },
  { top: '66%', left: '72%' },
];

/**
 * Sezione 2 della landing v2: Live Map. Per ora è una mappa statica (nessuna
 * chiamata di rete, nessun MapLibre/tile provider) — mostrare la mappa
 * dinamica con i pin richiede prima un sistema di cookie/tracking consent
 * che l'app non ha ancora. Quando ci sarà, questo ramo diventa condizionale
 * su quel consenso (dinamica se acconsentito, altrimenti questa statica).
 */
export default function LiveMap() {
  return (
    <section className="live-map">
      <div className="live-map__inner">
        {/* eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui */}
        <img src="/landing/live-map.jpg" alt="Mappa dei locali disponibili su Curius" className="live-map__img" />

        {/* Pin fittizi, decorativi: nessun dato reale dietro, quindi aria-hidden. */}
        {PINS.map((pos, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui
          <img
            key={i}
            src="/logos/Curius_Logo.svg"
            alt=""
            aria-hidden="true"
            className="live-map__pin"
            style={pos}
          />
        ))}
      </div>
    </section>
  );
}
