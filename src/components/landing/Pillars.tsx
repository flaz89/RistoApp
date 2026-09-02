import './pillars.css';

type Building = { icon: string; left: string; w: string; dy?: number; shadow?: string };

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
 * Sezione 3 della landing v2: i 3 pilastri. Per ora solo lo scheletro
 * dell'effetto di scroll (vedi il commento in cima a pillars.css) — nessun
 * contenuto vero ancora, arriva in un giro successivo.
 */
export default function Pillars() {
  return (
    <section className="pillars">
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

      <div className="pillars__panel">
        <h2 className="pillars__title">I PILASTRI</h2>
      </div>
    </section>
  );
}
