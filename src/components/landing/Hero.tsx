import Link from 'next/link';

import './hero.css';

/**
 * Hero della landing v2 (sezione 1).
 *
 * Animazione tutta in CSS (nessuna libreria): il proverbio "Chi tardi arriva,
 * male alloggia" si ribalta in "...meglio alloggia" — male sbarrato e sfumato,
 * meglio che scende dall'alto. La fascia di nuvole che copre la linea di base
 * dell'arancione e i loghi che ci "piovono" in mezzo vivono nel componente
 * LiveMap (sezione 2), non qui: geometricamente sono ancorati al bordo
 * superiore di LiveMap con lo stesso offset negativo che prima partiva da
 * qui, quindi in pagina restano nello stesso punto — a cavallo del confine
 * fra le due sezioni — ma tutto il "meteo" (nuvole + loghi) è gestito in un
 * solo componente invece di spezzarlo fra due. Rispetta prefers-reduced-motion.
 */

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
      </div>
    </section>
  );
}
