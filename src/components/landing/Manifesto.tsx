import Link from 'next/link';

import './manifesto.css';

/**
 * Landing v2 — section 5, "Manifesto".
 *
 * A teaser, not the full statement: the navbar has a dedicated "Manifesto"
 * link that will lead to a full page (/manifesto) where the story is told
 * properly. Here we only drop the most evocative hook — the name's myth
 * (Mercurius, the messenger) — and a link onward.
 *
 * Overlay release: this section is opaque and sits at a higher z-index than
 * the OCCASIONI blast (position:fixed, z-index:10 in pillars.css). Coming
 * right after <Pillars/> in normal flow, it scrolls UP over the pinned blast
 * and covers it — that is how the blast overlay is "released" without ever
 * unmounting it. min-height:100dvh guarantees it fully covers the viewport
 * while in view, so no orange from the blast leaks through behind it.
 *
 * The "enters from the right" motion is pure CSS (animation-timeline: view(),
 * see manifesto.css) — no JS, no observer, so this stays a Server Component.
 * Where that feature is unsupported the section is simply static and visible.
 */
export default function Manifesto() {
  return (
    <section className="manifesto">
      <div className="manifesto__inner">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, next/image is overkill (same choice as Hero) */}
        <img
          src="/logos/Curius_Logo.svg"
          alt=""
          aria-hidden="true"
          className="manifesto__mark"
        />
        <div className="manifesto__text">
          {/* string, not a bare `// ...` text node: react/jsx-no-comment-textnodes */}
          <span className="manifesto__label">{'// MANIFESTO'}</span>
          <h2 className="manifesto__title">Curioso di natura.</h2>
          <p className="manifesto__body">
            Mercurio portava messaggi tra chi vende e chi cerca. Curius fa lo
            stesso, oggi: le botteghe intorno a te e quello che offrono,
            nell&apos;istante in cui succede — in un unico posto.
          </p>
          <Link href="/manifesto" className="manifesto__link">
            Il manifesto
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
