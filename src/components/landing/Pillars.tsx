'use client';

import { useEffect, useRef, useState } from 'react';
import './pillars.css';

type Building = { icon: string; left: string; w: string; dy?: number; shadow?: string };

type Pillar = {
  label: string;
  icon: string;
  text: string;
  heading: string;
  /** Questo pilastro "invade" lo schermo: mentre lo attraversi in scroll, il
   *  suo trattino nei dots (.pillars__dots) cresce da dov'è fino a coprire
   *  tutto il viewport — vedi .pillars__blast in pillars.css. */
  expand?: boolean;
};

/*
 * I 3 pilastri.
 */
const PILLARS: Pillar[] = [
  /* RIS-48: pivot POC, ristoranti in stand-by — pilastro nascosto per ora
   * (non solo badge "in arrivo"), vedi feature_backlog.md per quando torna.
  {
    label: '// RISTORANTI',
    icon: '/brand/tavolo.svg',
    text: "I tavoli si liberano di continuo. Curius te lo dice nell'istante in cui succede, nei locali vicino a te. Scegli e prenoti in un tocco.",
    heading: 'Prenota il tavolo appena liberato.',
  },
  */
  {
    label: '// NEGOZI',
    icon: '/brand/negozio.svg',
    text: 'Ordini dalle botteghe intorno a te e paghi dal telefono. Quando è pronto ti avvisano: passi, ritiri, sei già fuori.',
    heading: 'Salta la fila, ritira e vai.',
  },
  {
    label: '// OCCASIONI',
    icon: '/brand/occasione.svg',
    text: 'Offerte lampo, ultimi pezzi, promozioni che durano poche ore. Le vedi apparire sulla mappa e le prendi al volo.',
    heading: 'Prendila prima che sparisca.',
    expand: true,
  },
];

// Indice dell'unico pilastro con expand:true — calcolato una volta sola,
// non ad ogni frame di scroll dentro updateActive().
const EXPAND_IDX = PILLARS.findIndex((p) => p.expand);
// Frazione (0–1) del segmento di scroll del pilastro expand da tenere ferma
// prima che l'esplosione del dot inizi — tempo per leggere il pilastro.
const EXPAND_HOLD = 0.35;

/*
 * Skyline sul bordo superiore di Pillars — stessa meccanica della fascia di
 * nuvole in LiveMap (vedi BACK/FRONT in LiveMap.tsx e live-map.css): una
 * entry per edificio con posizione (X/Y)/scala/ombra scelte a mano, non generate.
 * Ogni SVG ha il suo viewBox nativo, quindi "w" è la larghezza scelta per
 * allinearle bene fra loro, non una misura reale. Valori di partenza da
 * aggiustare a occhio quando arrivano gli altri asset.
 */
const TOWN: Building[] = [
  { icon: '/icons/town/Casa1.svg', left: '-20px',  w: '130px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Villa.svg', left: '470px',  w: '165px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Cascina2.svg', left: '260px',  w: '150px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Cascina3.svg', left: '390px',  w: '120px', dy: 2, shadow: '0px -20px 4px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Colonnato.svg', left: '135px',  w: '175px', dy: 2, shadow: '-15px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Arco.svg',  left: '70px',  w: '90px', dy: 2, shadow: '0px -20px 4px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Casa1.svg', left: '620px', w: '110px', dy:2 , shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Casa2.svg',  left: '720px', w: '135px',dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Arco.svg',  left: '1280px',  w: '80px', dy: 2, shadow: '0px -20px 4px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Villa.svg', left: '1140px', w: '170px', dy:5, shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Torre.svg', left: '1090px', w: '90px', dy:5, shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Cascina4.svg', left: '970px', w: '170px', dy:2, shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Palazzo.svg', left: '830px', w: '170px', dy:5, shadow: '0px -20px 8px rgba(0,0,0,.3)' },
  { icon: '/icons/town/Casa1.svg', left: '1600px',  w: '120px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Cascina4.svg', left: '1480px',  w: '160px', dy: 2, shadow: '-18px -20px 4px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Cascina2.svg', left: '1350px',  w: '150px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
  { icon: '/icons/town/Cascina2.svg', left: '1700px',  w: '150px', dy: 2, shadow: '0px -20px 8px rgba(0,0,0,.30)' },
];

/**
 * Sezione 3 della landing v2: i 3 pilastri, con effetto "sticky scroll" —
 * la sezione resta agganciata in viewport mentre l'utente scrolla, e quello
 * scroll fa avanzare il pilastro mostrato invece che la pagina (vedi
 * commento su .pillars in pillars.css per i dettagli del meccanismo CSS).
 */
export default function Pillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const blastRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // ponytail: scroll listener con rAF throttle, niente IntersectionObserver
    // né libreria — la sezione ha un'unica altezza nota (N * 100dvh) da cui
    // ricavare la progressione con un calcolo diretto sul suo bounding rect.
    let ticking = false;
    const updateActive = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const raw = progress * PILLARS.length;
      const idx = Math.min(PILLARS.length - 1, Math.floor(raw));
      setActive(idx);

      // Progresso (0→1) dentro il segmento di scroll del pilastro attivo.
      // Guida .pillars__blast via CSS var direttamente sul DOM (niente stato
      // React: cambia ad ogni frame di scroll, un re-render qui sarebbe
      // sprecato).
      const blastEl = blastRef.current;
      const dotEl = EXPAND_IDX === -1 ? null : dotRefs.current[EXPAND_IDX];
      if (blastEl && dotEl) {
        const segmentProgress = Math.min(1, Math.max(0, raw - idx));
        // Le prime EXPAND_HOLD di scroll dentro il segmento restano ferme sul
        // pilastro normale (tempo per leggerlo) — solo dopo la soglia
        // l'esplosione parte, e si consuma nello scroll che resta.
        const expand = idx === EXPAND_IDX
          ? Math.min(1, Math.max(0, (segmentProgress - EXPAND_HOLD) / (1 - EXPAND_HOLD)))
          : 0;

        // Il pannello è sticky e fermo durante questo segmento di scroll,
        // quindi il rect del trattino è stabile — ma lo rimisuriamo ad ogni
        // tick (invece che una volta sola) così regge anche un resize/rotate
        // a metà animazione senza bisogno di un listener separato.
        const dotRect = dotEl.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Cresce mantenendo le proporzioni del dot (width/height/border-radius
        // scalati dallo STESSO fattore, non un clip/stretch indipendente per
        // lato) E scivola dal centro del dot verso il centro del viewport
        // mentre expand avanza — non solo scala da ferma. Il dot è in basso:
        // scalando da un centro fisso il lato lontano (in alto) resterebbe
        // scoperto fino quasi alla fine dell'animazione; far viaggiare anche
        // il centro rende la copertura dello schermo più omogenea.
        // width/height/top/left reali (non transform: scale) perché scalare
        // via transform un box minuscolo lo fa compositare a bassa
        // risoluzione e ingrandisce quel bitmap — bordi sgranati. Con box
        // reale il browser ridisegna il rettangolo arrotondato nitido ad
        // ogni frame, qualunque sia la dimensione.
        const dotCenterX = dotRect.left + dotRect.width / 2;
        const dotCenterY = dotRect.top + dotRect.height / 2;
        const targetCenterX = vw / 2;
        const targetCenterY = vh / 2;
        // Fattore di scala per coprire il viewport da CENTRATO (come
        // background-size:cover): più piccolo/naturale di quello servirebbe
        // scalando da un angolo, perché il centro nel frattempo si è mosso lì.
        const scaleMax = Math.max(vw / dotRect.width, vh / dotRect.height) * 1.02;
        const scale = 1 + (scaleMax - 1) * expand;
        const width = dotRect.width * scale;
        const height = dotRect.height * scale;
        const centerX = dotCenterX + (targetCenterX - dotCenterX) * expand;
        const centerY = dotCenterY + (targetCenterY - dotCenterY) * expand;

        blastEl.style.width = `${width}px`;
        blastEl.style.height = `${height}px`;
        blastEl.style.left = `${centerX - width / 2}px`;
        blastEl.style.top = `${centerY - height / 2}px`;
        blastEl.style.borderRadius = `${3 * scale}px`; /* stesso raggio-base di .pillars__dots span, scalato insieme al resto */
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const pillar = PILLARS[active];

  return (
    <section
      className="pillars"
      ref={sectionRef}
      style={{ height: `${PILLARS.length * 100}dvh` }}
    >
      {/* Trattino dei dots (index EXPAND_IDX) che cresce a coprire tutto il
          viewport — vedi .pillars__blast in pillars.css e la misura via
          dotRefs/blastRef qui sopra. Fixed e fuori da .pillars__stage così
          non è tagliato dall'overflow:hidden di .pillars__panel. Montato solo
          mentre OCCASIONI è il pilastro attivo: a expand:0 sta esatto sopra
          il suo dot (stesso accent-2 che avrebbe già .is-active lì), quindi
          nessuno scatto al mount — ma se restasse montato sempre coprirebbe
          quel dot anche con NEGOZI attivo, facendolo sembrare acceso. */}
      {active === EXPAND_IDX && (
        <div className="pillars__blast" ref={blastRef} aria-hidden="true" />
      )}

      <div className="pillars__town" aria-hidden="true">
        {TOWN.map((b, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui
          <img
            key={i}
            src={b.icon}
            alt=""
            className="pillars__house"
            style={{
              left: b.left,
              width: b.w,
              ...(b.dy ? { '--dy': `${b.dy}px` } : {}),
              ...(b.shadow ? { '--shadow': b.shadow } : {}),
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="pillars__stage">
        <div className="pillars__panel">
          {/* key={active}: rimonta il blocco ad ogni cambio pilastro, che è
              anche quello che innesca il fade-in via CSS (vedi pillars.css) */}
          <div className="pillars__pillar" key={active}>
            <span className="pillars__pillar-label">{pillar.label}</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui */}
            <img src={pillar.icon} alt="" aria-hidden="true" className="pillars__pillar-icon" />
            {/* non un <img>: background-image invece dell'elemento immagine,
                stessa tecnica già usata per Wall.svg qui sopra — l'asset
                (StrikeCream.svg) ha preserveAspectRatio="none" apposta, così
                background-size può stirarlo in modo non uniforme (vedi
                commento in pillars.css sul perché serve). */}
            <div aria-hidden="true" className="pillars__pillar-strike" />
            <p className="pillars__pillar-text">{pillar.text}</p>
          </div>
          <h2 className="pillars__pillar-heading" key={`h-${active}`}>
            {pillar.heading}
          </h2>

          <div className="pillars__dots" aria-hidden="true">
            {PILLARS.map((_, i) => (
              <span
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                className={i === active ? 'is-active' : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
