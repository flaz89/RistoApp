import './come-funziona.css';

/**
 * Sezione "come funziona" — 3 step affiancati. Montata da Pillars.tsx dentro
 * .pillars__blast una volta che logo+scritta hanno finito di scorrere via
 * (vedi showComeFunziona/tailProgress lì). Position:absolute e z-index sono
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
  { n: 'Step I', title: 'Trovi', icon: '/brand/occasione.svg', text: 'Apri la mappa e vedi cosa c’è di fresco intorno a te, adesso.' },
  { n: 'Step II', title: 'Ordini', icon: '/brand/negozio.svg', text: 'Scegli dal banco del negozio e paghi dal telefono, in un tocco.' },
  { n: 'Step III', title: 'Ritiri', icon: '/brand/tavolo.svg', text: 'Ti avvisano quando è pronto: passi, ritiri, sei già fuori.' },
];

export default function ComeFunziona() {
  return (
    <div className="come-funziona">
      {/* <h2 className="come-funziona__heading">Come funziona</h2> */}
      <ol className="come-funziona__steps">
        {STEPS.map((s, i) => (
          // --i: indice dello step, è quello che sfalsa il reveal in CSS.
          <li
            key={s.n}
            className="come-funziona__step"
            style={{ '--i': i } as React.CSSProperties}
          >
            <span className="come-funziona__step-n">{s.n}</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui (stessa scelta di Pillars.tsx) */}
            <img src={s.icon} alt="" aria-hidden="true" className="come-funziona__step-icon" />
            <h3 className="come-funziona__step-title">{s.title}</h3>
            <p className="come-funziona__step-text">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
