import './live-map.css';

/*
 * Posizioni fittizie dei pin (% rispetto al contenitore) — non sono locali
 * reali, solo per far vedere come la mappa "vivrà" di punti quando ci sarà
 * il consenso al tracciamento e i dati veri.
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

type Cloud = { left: string; w: string; r: number; dy: number; shadow?: string };
/*
 * Nuvole di sfondo e di primo piano: stesse identiche liste/geometria di
 * quando vivevano in Hero.tsx (vedi git blame se serve la storia). Il layer
 * non è più dentro la Hero ma il punto sullo schermo in cui appare non
 * cambia: qui parte dal bordo superiore di questo componente con lo stesso
 * offset negativo che prima partiva dal bordo inferiore del pannello Hero —
 * i due bordi coincidono, quindi visivamente è lo stesso identico posto.
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
  { left: '1320px', w: '270px', r: 195, dy: 6,   shadow: '0 -25px 5px rgba(0,0,0,.40)' },
  { left: '1475px', w: '260px', r: 170, dy: -8, shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '1630px', w: '285px', r: -10, dy: -10,   shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '1780px', w: '275px', r: 170, dy: 10,  shadow: '0 -25px 5px rgba(0,0,0,.45)' },
  { left: '1935px', w: '260px', r: 150, dy: 20,   shadow: '0 -30px 5px rgba(0,0,0,.35)' },
  { left: '2090px', w: '280px', r: -15, dy: -20, shadow: '0 20px 5px rgba(0,0,0,.35)' },
  { left: '2240px', w: '270px', r: 170, dy: 0,   shadow: '0 -25px 5px rgba(0,0,0,.40)' },
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

/*
 * Loghi placeholder che "piovono" fra le due nuvole (icone generiche, non i
 * loghi delle categorie vere — quelli arriveranno con i dati reali). Left,
 * dimensione, ritardo e durata sono scelti a mano per un effetto di pioggia
 * non troppo regolare, non generati proceduralmente: sono solo 9 elementi,
 * non vale la pena introdurre randomizzazione per così pochi valori.
 */
const ICONS = [
  '/icons/utensils.svg',
  '/icons/ice-cream.svg',
  '/icons/fish.svg',
  '/icons/croissant.svg',
  '/icons/coffee.svg',
  '/icons/beef.svg',
];
type Drop = { icon: string; left: string; size: string; delay: string; duration: string };
const DROPS: Drop[] = [
  { icon: ICONS[0], left: '8%',  size: '22px', delay: '0s',   duration: '6s' },
  { icon: ICONS[1], left: '20%', size: '26px', delay: '1.2s', duration: '7s' },
  { icon: ICONS[2], left: '33%', size: '24px', delay: '2.4s', duration: '6.5s' },
  { icon: ICONS[3], left: '47%', size: '20px', delay: '0.6s', duration: '7.5s' },
  { icon: ICONS[4], left: '60%', size: '25px', delay: '3s',   duration: '6s' },
  { icon: ICONS[5], left: '73%', size: '23px', delay: '1.8s', duration: '7s' },
  { icon: ICONS[0], left: '85%', size: '21px', delay: '4s',   duration: '6.8s' },
  { icon: ICONS[2], left: '15%', size: '24px', delay: '5s',   duration: '7.2s' },
  { icon: ICONS[4], left: '55%', size: '22px', delay: '2s',   duration: '6.4s' },
];

/**
 * Sezione 2 della landing v2: Live Map. Mappa statica (nessuna chiamata di
 * rete, nessun MapLibre/tile provider) — mostrare la mappa dinamica con i
 * pin richiede prima un sistema di cookie/tracking consent che l'app non ha
 * ancora. Quando ci sarà, questo ramo diventa condizionale su quel consenso
 * (dinamica se acconsentito, altrimenti questa statica).
 *
 * La fascia di nuvole della Hero e i loghi placeholder che ci "piovono" in
 * mezzo vivono qui (non nella Hero, vedi Hero.tsx): back, loghi e front
 * sono tre elementi allo stesso livello con z-index 1/2/3, così i loghi
 * passano visivamente dietro la nuvola davanti — se fossero divisi fra due
 * componenti diversi non potrebbero condividere un unico contesto di
 * stacking e l'effetto "sandwich" non sarebbe ottenibile in CSS puro.
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

      <div aria-hidden="true">
        <div className="cl-back">{clouds(BACK)}</div>

        <div className="live-map__logos">
          {DROPS.map((d, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- static asset, next/image è overkill qui
            <img
              key={i}
              src={d.icon}
              alt=""
              className="live-map__drop"
              style={{
                left: d.left,
                '--drop-size': d.size,
                '--drop-delay': d.delay,
                '--drop-duration': d.duration,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="cl-front">{clouds(FRONT)}</div>
      </div>
    </section>
  );
}
