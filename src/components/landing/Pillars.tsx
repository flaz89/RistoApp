'use client';

import { useEffect, useRef, useState } from 'react';
import ComeFunziona from './ComeFunziona';
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
    text: 'Offerte lampo, promozioni che durano poche ore. Le vedi apparire sulla mappa e le prendi al volo.',
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
// A che punto dell'espansione (0–1) la scritta dentro il blast comincia a
// comparire: prima di così il box è ancora troppo piccolo per contenerla.
const REVEAL_AT = 0.85;
// dvh extra aggiunti in coda alla corsia normale (PILLARS.length*100dvh),
// dedicati SOLO allo slide-via di logo+scritta dopo che la digitazione è
// finita — non presi a prestito dal segmento dell'ultimo pilastro (che
// resterebbe più "nervoso", stesso scroll ripartito su una crescita del dot
// più compressa). Prima era una frazione del segmento (EXPAND_TAIL=0.2,
// ~90-150px reali): bastava un solo tick di rotellina per esaurirlo, quindi
// lo slide schizzava in fondo al minimo scroll. 60dvh è quasi mezza
// schermata di scroll dedicato — tarabile, non un valore magico.
const SLIDE_VH = 60;
// A che punto dello slide-via (0–1) ComeFunziona comincia a entrare. Non 1:
// logo e scritta sono già quasi trasparenti a metà slide (opacity =
// 1 - tailProgress), quindi aspettare la fine lasciava una schermata
// arancione vuota fra la loro sparizione e la salita del primo step. Con
// l'overlap le due cose si incrociano invece di susseguirsi.
const CF_START = 0.45;
// dvh in coda a TUTTO il resto, dedicati a ComeFunziona una volta rivelata.
// Senza questi la sezione forniva esattamente switchRunway + SLIDE_VH di
// scroll (altezza - i 100dvh che lo stage sticky si mangia), quindi
// tailProgress toccava 1 sull'ULTIMO pixel scrollabile della pagina:
// ComeFunziona compariva solo forzando in fondo (Safari) o mai, per un
// arrotondamento dvh/innerHeight (Firefox). Una schermata piena di corsia
// dopo il reveal la rende leggibile invece che un lampo sul bordo.
const REVEAL_VH = 100;

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
  const blastContentRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  // true quando il dot ha finito di coprire lo schermo: monta la scritta, e
  // il mount è ciò che fa partire l'animazione a macchina da scrivere (CSS).
  const [blastFull, setBlastFull] = useState(false);
  // true quando lo slide-via di logo+scritta è arrivato in fondo: monta
  // ComeFunziona sopra. Impostato ad ogni frame di scroll da tailProgress
  // (vedi sotto), non un evento — coerente con com'è guidato lo slide stesso.
  const [showComeFunziona, setShowComeFunziona] = useState(false);

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
      const stageHeight = window.innerHeight; // == 100dvh di .pillars__stage
      // Corsia di switching (hold+crescita del dot), ESCLUSO SLIDE_VH: la
      // sensibilità di come i pilastri si alternano e il dot cresce non
      // cambia rispetto a prima, l'extra è tutto e solo per lo slide dopo.
      const switchRunway = (PILLARS.length - 1) * stageHeight;
      if (switchRunway <= 0) return;
      const scrolledIntoSection = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolledIntoSection / switchRunway);
      const raw = progress * PILLARS.length;
      const idx = Math.min(PILLARS.length - 1, Math.floor(raw));
      setActive(idx);

      // Progresso (0→1) dentro il segmento di scroll del pilastro attivo.
      // Guida .pillars__blast via CSS var direttamente sul DOM (niente stato
      // React: cambia ad ogni frame di scroll, un re-render qui sarebbe
      // sprecato).
      const blastEl = blastRef.current;
      const dotEl = EXPAND_IDX === -1 ? null : dotRefs.current[EXPAND_IDX];

      const segmentProgress = Math.min(1, Math.max(0, raw - idx));
      // Le prime EXPAND_HOLD di scroll dentro il segmento restano ferme sul
      // pilastro normale (tempo per leggerlo) — dopo la soglia l'esplosione
      // si consuma nel resto del segmento, che ora è tutto suo (lo slide ha
      // il proprio budget dedicato, SLIDE_VH, non più preso da qui).
      const expand = idx === EXPAND_IDX
        ? Math.min(1, Math.max(0, (segmentProgress - EXPAND_HOLD) / (1 - EXPAND_HOLD)))
        : 0;
      // Calcolato FUORI dal guard qui sotto (non serve il DOM) così torna a
      // false anche quando il blast non è montato: è quello che fa ripartire
      // da capo la macchina da scrivere se si risale e si riscende.
      setBlastFull(expand >= 1);

      // Slide-via di logo+scritta: 0→1 nel budget dedicato SLIDE_VH, scroll
      // OLTRE switchRunway, guidato SOLO dallo scroll (lock rimosso): la
      // macchina da scrivere parte al montaggio (blastFull) e chi scrolla
      // veloce può tagliarla a metà — comportamento standard scroll-driven,
      // senza mai rubare lo scroll all'utente.
      const slideRunwayPx = (SLIDE_VH / 100) * stageHeight;
      const scrolledPastSwitch = Math.max(0, scrolledIntoSection - switchRunway);
      const tailProgress = idx === EXPAND_IDX
        ? Math.min(1, scrolledPastSwitch / slideRunwayPx)
        : 0;
      // Corsia di reveal dei 3 step di ComeFunziona: 0→1 sui REVEAL_VH che
      // restano DOPO lo slide. Esposta come CSS var sul blast (antenato di
      // .come-funziona) invece che come stato React: cambia ad ogni frame di
      // scroll, ed è il CSS a decidere quale step è già entrato — vedi
      // come-funziona.css. Stesso motivo di width/height qui sotto.
      const revealRunwayPx = (REVEAL_VH / 100) * stageHeight;
      const scrolledPastSlide = Math.max(0, scrolledPastSwitch - slideRunwayPx * CF_START);
      blastRef.current?.style.setProperty(
        '--cf',
        `${Math.min(1, scrolledPastSlide / revealRunwayPx)}`,
      );

      const blastContentEl = blastContentRef.current;
      if (blastContentEl) {
        // -100%, non di più: a -100% il box (alto quanto il viewport,
        // inset:0) è ESATTAMENTE fuori schermo — un valore maggiore lo
        // faceva sparire (visivamente, coi bordi già fuori e opacità quasi
        // a 0) BEN PRIMA che tailProgress arrivasse a 1, lasciando uno
        // scroll morto fra "non si vede più" e "compare ComeFunziona"
        // (che si sblocca solo a tailProgress===1). A -100% coincidono.
        blastContentEl.style.transform = `translateY(${tailProgress * -100}%)`;
        blastContentEl.style.opacity = `${1 - tailProgress}`;
      }
      // Stesso tailProgress, esposto come CSS var: la fascia di pattern
      // romano sale dal basso mentre logo+scritta escono dall'alto (vedi
      // .pillars__blast-pattern in pillars.css). Var e non stile diretto
      // perché qui l'unica cosa che cambia è una posizione, e il CSS sa già
      // tradurla nella sua altezza senza che il JS debba misurarla.
      blastRef.current?.style.setProperty('--tail', `${tailProgress}`);
      setShowComeFunziona(tailProgress >= CF_START);

      if (blastEl && dotEl) {
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
        // Opacità della scritta: 0 fino a REVEAL_AT, poi 0→1 sul tratto che
        // resta, così entra solo quando il box copre già quasi tutto.
        blastEl.style.setProperty(
          '--reveal',
          `${Math.min(1, Math.max(0, (expand - REVEAL_AT) / (1 - REVEAL_AT)))}`,
        );
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
      style={{ height: `${PILLARS.length * 100 + SLIDE_VH + REVEAL_VH}dvh` }}
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
        <div className="pillars__blast" ref={blastRef} aria-hidden="true">
          {/* Logo + scritta: transform/opacity impostati DIRETTAMENTE sul DOM
              da tailProgress nell'effetto qui sopra (stesso motivo di
              blastEl: cambiano ad ogni frame di scroll, un re-render qui
              sarebbe sprecato) — seguono lo scroll dell'utente frame
              per frame, avanti e indietro. */}
          {/* Fasce decorative ai bordi del viewport: entrano (dal basso e
              dall'alto) mentre la scritta se ne va. Fuori da
              .pillars__blast-content apposta — quello scorre via, queste
              devono restare. */}
          <div className="pillars__blast-pattern pillars__blast-pattern--top" />
          <div className="pillars__blast-pattern" />
          <div className="pillars__blast-content" ref={blastContentRef}>
            <div className="pillars__blast-logo" />
            {/* Montata solo a espansione completa: è il mount a far partire
                l'animazione a macchina da scrivere (vedi pillars.css). Se il
                testo cambia, aggiornare il conteggio degli step lì. */}
            {blastFull && (
              <p className="pillars__blast-title">
                <span className="pillars__blast-typed">
                  Come funziona?
                </span>
              </p>
            )}
          </div>
          {/* Montato solo a slide-via completato: layer assoluto sopra
              logo+scritta, stesso sfondo arancione del blast dietro — vedi
              come-funziona.css, non ha sfondo suo apposta. */}
          {showComeFunziona && <ComeFunziona />}
        </div>
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
