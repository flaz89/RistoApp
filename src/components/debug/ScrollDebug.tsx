'use client';

import { useEffect, useState } from 'react';

/**
 * DEBUG — da rimuovere. Contatore di scroll in alto a destra, per leggere a
 * che pixel cadono i vari eventi della landing (blast, slide, reveal degli
 * step) e tararne le costanti in Pillars.tsx.
 *
 * Mostra anche il valore in viewport (px / innerHeight): le costanti sono
 * espresse in dvh, quindi è quella la misura che serve per tradurre "l'ho
 * visto qui" in un numero da mettere nel codice.
 */
export default function ScrollDebug() {
  const [y, setY] = useState(0);
  const [vh, setVh] = useState(1);
  // Scroll entrato dentro .pillars e valore corrente di --cf: sono questi,
  // non scrollY, i numeri che corrispondono alle costanti nel codice.
  const [into, setInto] = useState(0);
  const [cf, setCf] = useState(0);

  useEffect(() => {
    const update = () => {
      setY(window.scrollY);
      setVh(window.innerHeight);
      const section = document.querySelector('.pillars');
      setInto(section ? Math.max(0, -section.getBoundingClientRect().top) : 0);
      const blast = document.querySelector<HTMLElement>('.pillars__blast');
      setCf(blast ? parseFloat(blast.style.getPropertyValue('--cf') || '0') : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', // fixed, non absolute: deve restare a video mentre si scrolla
        top: 6,
        right: 8,
        zIndex: 9999, // sopra .pillars__blast (z-index 10), che copre tutto lo schermo
        pointerEvents: 'none',
        font: '11px/1.2 ui-monospace, monospace',
        color: '#fff',
        background: 'rgba(0,0,0,.6)',
        padding: '3px 6px',
        borderRadius: 4,
      }}
    >
      {Math.round(y)}px · {(y / vh).toFixed(2)}vh
      <br />
      into {(into / vh).toFixed(2)}vh · cf {cf.toFixed(2)}
    </div>
  );
}
