import './come-funziona.css';

/**
 * Sezione "come funziona" — 3 step affiancati. Montata da Pillars.tsx dentro
 * .pillars__blast una volta che logo+scritta hanno finito di scorrere via
 * (vedi showComeFunziona/tailProgress lì). Position (fixed) e z-index sono
 * suoi (non imposti dal chiamante, vedi come-funziona.css) così la sezione
 * resta autonoma per quando in futuro uscirà dal blast per una sezione
 * vera propria.
 *
 * Gli step entrano sfalsati seguendo lo scroll: Pillars espone la CSS var
 * --cf (0→1) sul blast, il resto lo fa il CSS — niente stato React né
 * observer qui dentro, il componente resta senza logica.
 *
 * Placeholder: copy reale ancora mancante (vive nella product memory
 * locale, non in questo repo — vedi product_flows.md).
 */
// Icone: placeholder pescati dalle brand SVG già in public/brand — sono
// monocromatiche crema (#EDD7B8), quindi si posano sull'arancio del blast
// senza bisogno della tecnica mask+background usata per il logo bicolore
// (vedi .pillars__blast-logo in pillars.css). Da sostituire con le icone
// vere dei tre passi quando arrivano.
const STEPS = [
  { n: 'I', title: 'Trova', icon: '/brand/trova.svg', sub: '"Vedi cosa c\'è, adesso."', text: 'La mappa del quartiere si aggiorna in tempo reale: cosa è pronto, cosa sta per finire, a due passi da te.' },
  { n: 'II', title: 'Scegli', icon: '/brand/scegli.svg', sub: '"Un tocco, è tuo."', text: 'Pre-ordina dal fornaio o prendi al volo un\'occasione dal fruttivendolo. Paghi dal telefono, niente fila alla cassa.' },
  { n: 'III', title: 'Vivi', icon: '/brand/vivi.svg', sub: '"Passa, ritira, vai."', text: 'Ti avvisano quando è pronto: entri, esci, il quartiere lo vivi invece di aspettarlo.' },
];

export default function ComeFunziona() {
  return (
    <div className="come-funziona">
      {/* <h2 className="come-funziona__heading">Come funziona</h2> */}
      {/* Medaglioni della guida verticale (solo mobile, vedi come-funziona.css):
          sono fuori dalle card perché le card si muovono e questi no — un
          .come-funziona__step-n dentro la card seguirebbe la sua transform
          invece di restare sulla linea. aria-hidden: orientamento visivo, i
          numerali restano leggibili nell'<ol> degli step qui sotto. */}
      <ol className="come-funziona__rail" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="come-funziona__step-n come-funziona__rail-n"
            style={{ '--i': i } as React.CSSProperties}
          >
            {s.n}
          </li>
        ))}
      </ol>
      <ol className="come-funziona__steps">
        {STEPS.map((s, i) => (
          // --i: indice dello step, è quello che sfalsa il reveal in CSS.
          <li
            key={s.n}
            className="come-funziona__step"
            style={{ '--i': i } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui (stessa scelta di Pillars.tsx) */}
            <img src={s.icon} alt="" aria-hidden="true" className="come-funziona__step-icon" />
            {/* After the icon, not before: on desktop this is the medallion
                sitting on the timeline, which runs between icons and titles
                (the rail itself is drawn by .come-funziona__steps in CSS). */}
            <span className="come-funziona__step-n">{s.n}</span>
            <h3 className="come-funziona__step-title">{s.title}</h3>
            <p className="come-funziona__step-sub">{s.sub}</p>
            <p className="come-funziona__step-text">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
