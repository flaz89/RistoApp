import Link from 'next/link';

import './hero.css';

/**
 * Hero della landing v2 (sezione 1).
 *
 * Animazione tutta in CSS (nessuna libreria): il proverbio "Chi tardi arriva,
 * male alloggia" si ribalta in "...meglio alloggia" — male sbarrato e sfumato,
 * meglio che scende dall'alto. La fascia di nuvole in fondo al pannello copre
 * la linea di base dell'arancione e fa da ponte verso la mappa (sezione 2),
 * da cui pioveranno i loghi delle categorie. Rispetta prefers-reduced-motion.
 */

type Cloud = { left: string; w: string; r: number; dy: number; shadow?: string };
// Fascia di nuvole sovrapposte, ognuna con la sua rotazione. `left` e `w` sono
// entrambi in px fissi: la fascia deve avere lo stesso aspetto su mobile e
// desktop, non riscalarsi con la viewport. `shadow` è opzionale (valore per
// drop-shadow, es. '0 7px 7px rgba(0,0,0,.16)'): se omesso usa l'ombra di default.
/*
 * Nuvole di sfondo: stessa logica in px fissi del layer davanti, ma sfalsate
 * negli spazi tra una nuvola e l'altra e alzate (dy negativo) così da spuntare
 * sopra la fascia. Colore piu' scuro + drift lento = profondita' senza parallasse
 * vera. Il primo elemento parte oltre il bordo sinistro perche' il drift
 * sposta l'intero layer e scoprirebbe l'angolo.
 */
const BACK: Cloud[] = [
  { left: '-60px', w: '250px', r: 200,  dy: 50 },
  { left: '30px',   w: '230px', r: 0,  dy: -60 },
  { left: '185px',  w: '245px', r: 175, dy: 60 },
  { left: '280px',  w: '235px', r: 185,  dy: -50 },
  { left: '480px',  w: '250px', r: 170, dy: 60 },
  { left: '530px',  w: '240px', r: -12, dy: -70 },
  { left: '790px',  w: '245px', r: -10,   dy: 30 },
  { left: '940px',  w: '235px', r: 172, dy: -40 },
  { left: '1085px', w: '250px', r: -170,  dy: 24 },
  { left: '1240px', w: '240px', r: 14,  dy: -76 },
  { left: '1395px', w: '245px', r: 170, dy: 40 },
  { left: '1450px', w: '235px', r: -10, dy: -72 },
  { left: '1705px', w: '250px', r: -6,   dy: 46 },
  { left: '1860px', w: '240px', r: 10, dy: -54 },
  { left: '2010px', w: '245px', r: -14, dy: -30 },
  { left: '2165px', w: '235px', r: 180,  dy: 50 },
  { left: '2320px', w: '250px', r: 170, dy: -54 },
];
/*
 * Nuvole in primo piano: tutto a posizione fissa in px, distribuite a mano
 * fino a ~2400px così da coprire anche i desktop larghi senza mai lasciare
 * spazi vuoti. Le percentuali non andrebbero bene: con nuvole a dimensione
 * fissa, un `left` in % allarga il passo insieme alla viewport e apre buchi
 * sui monitor grandi. La coda oltre il bordo su schermi stretti è tagliata
 * da `overflow-x: clip` su .hero__clouds (hero.css).
 */
const FRONT: Cloud[] = [
  { left: '-60px',  w: '280px', r: 200, dy: 6,   shadow: '0 -25px 5px rgba(0,0,0,.45)' },
  { left: '110px',  w: '260px', r: 170, dy: -10, shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '250px',  w: '280px', r: -15, dy: -20, shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '400px',  w: '270px', r: 190, dy: 2,   shadow: '-10px -20px 5px rgba(0,0,0,.40)' },
  { left: '555px',  w: '285px', r: 170, dy: -10, shadow: '0 -20px 5px rgba(0,0,0,.35)' },
  { left: '710px',  w: '255px', r: -20, dy: 8,   shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '860px',  w: '280px', r: 185, dy: -18, shadow: '-10px -20px 5px rgba(0,0,0,.45)' },
  { left: '1015px', w: '265px', r: 160, dy: 4,   shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '1150px', w: '280px', r: -20, dy: -50, shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '1320px', w: '270px', r: 195, dy: 6,   shadow: '0 -25px 5px rgba(0,0,0,.40)' }, //da fare
  { left: '1475px', w: '260px', r: 170, dy: -8, shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '1630px', w: '285px', r: -10, dy: -10,   shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '1780px', w: '275px', r: 170, dy: 10,  shadow: '0 -25px 5px rgba(0,0,0,.45)' },
  { left: '1935px', w: '260px', r: 150, dy: 20,   shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '2090px', w: '280px', r: -15, dy: -20, shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '2240px', w: '270px', r: 170, dy: 0,   shadow: '0 -25px 5px rgba(0,0,0,.40)' }
];

function clouds(list: Cloud[]) {
  return list.map((c, i) => (
    <span
      key={i}
      className="cloud"
      style={{
        left: c.left,
        width: c.w,
        '--r': `${c.r}deg`,
        '--dy': `${c.dy}px`,
        ...(c.shadow ? { '--shadow': c.shadow } : {}),
      } as React.CSSProperties}
    />
  ));
}

const SUB = [
  "L'occasione prima che sparisca.",
  'Il tavolo appena liberato.',
  'Il ritiro senza fila.',
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__bar">
        <Link href="/" className="hero__wm" aria-label="Curius">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark, next/image is overkill */}
          <img src="/logos/CuriusBrand_Logo.svg" alt="Curius" className="hero__wm-logo" />
        </Link>
        <Link href="/accedi" className="hero__signin">Sign In</Link>
      </div>

      <div className="hero__panel">
        <div className="hero__inner">
          <h1 className="hero__quote no select-none">
            &ldquo;Chi tardi arriva,{' '}
            <br></br>
            <span className="flip">
              <span className="flip__w flip__male" aria-hidden="true">
                male<span className="strike strike1" /><span className="strike strike2" />
              </span>
              <span className="flip__w flip__meglio">meglio</span>
            </span>{' '}
            <br></br>
            alloggia&rdquo;
          </h1>

          <Link href="/ristoranti" className="hero__cta">
            Curiosa
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>

          <p className="hero__sub">
            {SUB.map((t, i) => (
              <span key={i}>{t}{i < SUB.length - 1 ? <br /> : null}</span>
            ))}
          </p>
        </div>

        <div className="hero__clouds" aria-hidden="true">
          <div className="cl-layer cl-back">{clouds(BACK)}</div>
          <div className="cl-layer cl-front">{clouds(FRONT)}</div>
        </div>
      </div>
    </section>
  );
}
