'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { GeoErrorReason } from '@/lib/geo/useGeolocation';
import { useGeolocation } from '@/lib/geo/useGeolocation';
import { LAND_PACKED } from '@/lib/landing/land-dots';
import './landing.css';

/**
 * Imperative handle the canvas effect hands back to the React tree.
 *
 * The map is a 60fps canvas animation: re-rendering it through React state on
 * every frame would be wasteful. So React owns *what is true* (are we located,
 * where) and pushes it into the canvas through these two calls, while the
 * canvas owns *how it is drawn*.
 */
type MapControls = {
  setLocated: (on: boolean) => void;
  setCenter: (lat: number, lon: number) => void;
};

const GEO_ERROR_TEXT: Record<GeoErrorReason, string> = {
  unsupported: 'Il tuo browser non supporta la geolocalizzazione.',
  insecure_context:
    'La geolocalizzazione richiede HTTPS. Apri il sito su https:// oppure su http://localhost.',
  // Once denied, the browser will never prompt again for this origin: the only
  // way back is the site settings, so the message has to say where they are.
  permission_denied:
    'Il browser ha memorizzato un rifiuto e non lo richiederà più. Riattiva la posizione per questo sito: Safari → Impostazioni → Siti web → Posizione; Chrome → icona nella barra indirizzi → Posizione.',
  blocked_by_system:
    'Il sito ha il permesso, ma il sistema lo blocca. Su macOS: Impostazioni di Sistema → Privacy e sicurezza → Localizzazione, e attiva il tuo browser.',
  position_unavailable: 'Non riusciamo a rilevare la posizione in questo momento.',
  timeout: 'Ci sta mettendo troppo. Riprova.',
};

function formatCoords(lat: number, lon: number, tail: string): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'O';
  const point = `${Math.abs(lat).toFixed(4)}° ${ns} · ${Math.abs(lon).toFixed(4)}° ${ew}`;
  return tail ? `${point} — ${tail}` : point;
}

export default function Home() {
  const controls = useRef<MapControls | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    let rafId = 0;

    const canvas = document.getElementById('map') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const CITIES = [
      { name: 'Milano', lon: 9.19, lat: 45.46, me: true },
      { name: 'Roma',   lon: 12.5, lat: 41.9 },
      { name: 'London', lon: -0.13, lat: 51.51 },
      { name: 'Paris',  lon: 2.35, lat: 48.86 },
      { name: 'New York', lon: -74.0, lat: 40.71 },
      { name: 'Tokyo',  lon: 139.7, lat: 35.68 },
    ];

    // Arcs (dotted connections) between some city indices
    const ARCS = [[2, 3], [2, 4], [0, 1], [0, 3], [4, 0]];

    let W = 0, H = 0, dpr = 1;
    let mapTop = 0, mapH = 0;
    // projection uses a cropped latitude band so poles don't waste space
    const LAT_TOP = 78, LAT_BOT = -56;

    function project(lon: number, lat: number) {
      const x = (lon + 180) / 360 * W;
      const y = mapTop + (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * mapH;
      return [x, y];
    }

    let landDots: number[][] = [];   // [x, y, glow]  glow = closeness to a service city (0..1)
    let localDots: number[][] = [];  // stylised local street-map for the located state
    function buildDots() {
      const GR = Math.max(40, W * 0.035);
      const cityPts = CITIES.map((c) => project(c.lon, c.lat));
      landDots = [];
      for (let i = 0; i < LAND_PACKED.length; i += 2) {
        const x = LAND_PACKED[i] / 1000 * W;
        const y = mapTop + LAND_PACKED[i + 1] / 1000 * mapH;
        let g = 0;
        for (const [cx, cy] of cityPts) {
          const d = Math.hypot(x - cx, y - cy);
          if (d < GR) g = Math.max(g, 1 - d / GR);
        }
        landDots.push([x, y, g]);
      }
      buildLocal();
    }

    // Dot-matrix "map of your area" for the located state: a jittered grid with a
    // river band and one avenue kept clear, all greyscale. Real map tiles will
    // replace it later; for now `localSeed` is derived from the actual
    // coordinates, so at least two different cities produce two different
    // street patterns instead of the same picture everywhere.
    let localSeed = 0;
    function buildLocal() {
      localDots = [];
      const gap = Math.max(11, W / 24);
      const cx = W / 2, cy = mapTop + mapH * 0.44;
      const s0 = localSeed;
      const seed = (a: number, b: number) => {
        const s = Math.sin(a * 91.7 + b * 47.3 + s0) * 4375.53;
        return s - Math.floor(s);
      };
      const riverPhase = s0 * 0.37;
      const avenueSlope = 0.35 + (Math.cos(s0 * 1.7) * 0.5 + 0.5) * 0.7;
      for (let gx = -gap; gx < W + gap; gx += gap) {
        for (let gy = mapTop - gap; gy < mapTop + mapH + gap; gy += gap) {
          const x = gx + (seed(gx, gy) - 0.5) * gap * 0.55;
          const y = gy + (seed(gy, gx) - 0.5) * gap * 0.55;
          if (Math.abs(y - (cy + Math.sin(x / 55 + riverPhase) * 30)) < 15) continue;   // river
          if (Math.abs((y - cy) - avenueSlope * (x - cx)) < 11) continue;               // avenue
          localDots.push([x, y, Math.hypot(x - cx, y - cy)]);
        }
      }
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mapTop = H * 0.10;
      mapH = H * 0.52;
      buildDots();
    }

    let located = false;
    let prog = 0;   // 0 = world, 1 = located; eased for a smooth zoom-in
    let t = 0;

    // --- FALLBACK: world map, service cities visible, nearby dots glow slowly ---
    function drawWorld(alpha: number) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;

      // faint graticule
      ctx.strokeStyle = 'rgba(120,150,140,0.05)';
      ctx.lineWidth = 1;
      for (let lat = LAT_TOP; lat >= LAT_BOT; lat -= 20) {
        const [, y] = project(0, lat);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 30) {
        const [x] = project(lon, 0);
        ctx.beginPath(); ctx.moveTo(x, mapTop); ctx.lineTo(x, mapTop + mapH); ctx.stroke();
      }

      // grey land base
      ctx.fillStyle = 'rgba(158,186,174,0.32)';
      for (const d of landDots) { ctx.beginPath(); ctx.arc(d[0], d[1], 1.0, 0, Math.PI * 2); ctx.fill(); }

      // green glow on dots near a service city — slow intermittence (~6s cycle)
      const slow = reduce ? 0.55 : (Math.sin(t * 0.016) * 0.5 + 0.5);
      for (const d of landDots) {
        const g = d[2];
        if (g > 0.03) {
          ctx.fillStyle = `rgba(43,232,142,${g * (0.2 + 0.62 * slow)})`;
          ctx.beginPath(); ctx.arc(d[0], d[1], 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }

      // dotted arcs between service cities
      ctx.save();
      ctx.setLineDash([1, 5]); ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(130,160,150,0.18)';
      for (const [a, b] of ARCS) {
        const p = project(CITIES[a].lon, CITIES[a].lat);
        const q = project(CITIES[b].lon, CITIES[b].lat);
        const mx = (p[0] + q[0]) / 2, my = Math.min(p[1], q[1]) - 26;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(mx, my, q[0], q[1]); ctx.stroke();
      }
      ctx.restore();

      // service-city markers — all clearly visible
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      for (const c of CITIES) {
        const [x, y] = project(c.lon, c.lat);
        ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(43,232,142,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 3.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(222,242,234,0.95)'; ctx.fill();
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(200,224,214,0.9)';
        ctx.fillText(c.name.toUpperCase(), x + 10, y);
        ctx.restore();
      }
      ctx.textBaseline = 'alphabetic';

      // scattered mono coordinate ticks for the techy feel
      ctx.fillStyle = 'rgba(120,150,140,0.28)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('00.1101', W * 0.12, mapTop + mapH * 0.22);
      ctx.fillText('01.10', W * 0.7, mapTop + mapH * 0.12);
      ctx.fillText('00.1', W * 0.62, mapTop + mapH * 0.75);

      ctx.restore();
    }

    // --- LOCATED: zoomed greyscale map of your area + "you are here" ---
    function drawLocal(alpha: number) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = W / 2, cy = mapTop + mapH * 0.44;

      for (const [x, y, dist] of localDots) {
        const edge = Math.max(0, 1 - dist / (W * 0.65));
        ctx.fillStyle = `rgba(162,190,178,${0.14 + 0.22 * edge})`;
        ctx.beginPath(); ctx.arc(x, y, 1.15, 0, Math.PI * 2); ctx.fill();
      }

      // center glow marker (pulsing) — soft halo that never hides the point
      const breathe = reduce ? 0.6 : (Math.sin(t * 0.05) * 0.5 + 0.5);
      const R = 32 + breathe * 10;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
      g.addColorStop(0, 'rgba(43,232,142,0.5)');
      g.addColorStop(0.5, 'rgba(43,232,142,0.16)');
      g.addColorStop(1, 'rgba(43,232,142,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      if (!reduce) for (let k = 0; k < 2; k++) {
        const ph = ((t * 0.01) + k * 0.5) % 1;
        ctx.beginPath(); ctx.arc(cx, cy, 10 + ph * 40, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(43,232,142,${0.45 * (1 - ph)})`; ctx.lineWidth = 1.4; ctx.stroke();
      }

      // crosshair + tracking point
      ctx.strokeStyle = 'rgba(43,232,142,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy); ctx.lineTo(cx - 7, cy);
      ctx.moveTo(cx + 7, cy); ctx.lineTo(cx + 17, cy);
      ctx.moveTo(cx, cy - 17); ctx.lineTo(cx, cy - 7);
      ctx.moveTo(cx, cy + 7); ctx.lineTo(cx, cy + 17);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(43,232,142,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 4.4, 0, Math.PI * 2); ctx.fillStyle = '#4CF0A2'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 1.7, 0, Math.PI * 2); ctx.fillStyle = '#EAFFF4'; ctx.fill();

      ctx.restore();
    }

    function draw() {
      t += 1;
      const target = located ? 1 : 0;
      prog += (target - prog) * 0.08;
      if (Math.abs(target - prog) < 0.002) prog = target;

      ctx.clearRect(0, 0, W, H);
      drawWorld(1 - prog);
      drawLocal(prog);

      rafId = requestAnimationFrame(draw);
    }

    controls.current = {
      setLocated: (on: boolean) => { located = on; },
      setCenter: (lat: number, lon: number) => {
        localSeed = lat * 137.7 + lon * 91.3;
        buildLocal();
      },
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.current = null;
    };
  }, []);

  // React state -> canvas. This is the only bridge between the two worlds.
  useEffect(() => {
    if (geo.coords) controls.current?.setCenter(geo.coords.lat, geo.coords.lon);
    controls.current?.setLocated(geo.status === 'ready');
  }, [geo.status, geo.coords]);

  const located = geo.status === 'ready';
  const locating = geo.status === 'locating';

  /**
   * The "priming" dialog: our own explanation, shown before the browser's.
   *
   * The two dialogs are not equivalent. Ours costs nothing when refused — we
   * can ask again tomorrow. The browser's can be spent exactly once per
   * origin: a single reflexive "no" and the site can never prompt again, only
   * send the user hunting through settings. So we let ours filter, and release
   * the browser prompt only to someone who has already said yes to us.
   */
  const [priming, setPriming] = useState(false);
  const allowButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!priming) return;
    allowButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPriming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [priming]);

  const handleLocateClick = useCallback(() => {
    if (located) {
      geo.clear();
      return;
    }
    // 'unknown' means the Permissions API stayed silent; treat it as 'prompt',
    // because assuming we still have our one shot is the cautious guess.
    if (geo.permission === 'prompt' || geo.permission === 'unknown') {
      setPriming(true);
      return;
    }
    // Granted: no prompt will appear. Denied: the call fails instantly and the
    // hook produces the message that explains where to re-enable it.
    geo.request();
  }, [located, geo]);

  const chipText =
    locating ? 'RILEVO…'
    : located && geo.place ? `${geo.place.city.toUpperCase()}${geo.place.countryCode ? `, ${geo.place.countryCode}` : ''}`
    : located ? 'POSIZIONE ATTIVA'
    : 'POSIZIONE OFF';

  const buttonLabel =
    locating ? 'Ti sto cercando…'
    : located ? 'Posizione attiva'
    : geo.permission === 'denied' ? 'Posizione bloccata'
    : 'Usa la mia posizione';

  const placeName = geo.place?.city ?? 'Sei qui';
  const coordsLine = geo.coords
    ? formatCoords(
        geo.coords.lat,
        geo.coords.lon,
        [geo.place?.region, geo.place?.countryCode].filter(Boolean).join(', '),
      )
    : '';

  return (
    <>
      <div className="stage">
        <div className="screen">
          <canvas id="map" aria-hidden="true"></canvas>
          <div className="veil"></div>

          <div className="ui">
            <div className="top">
              <div className="wordmark">Risto<span className="dot">•</span>App</div>
              <div className={located ? 'chip live' : 'chip'}>
                <span className="led"></span>
                <span>{chipText}</span>
              </div>
            </div>

            <div className="spacer"></div>

            <div className={located ? 'locate show' : 'locate'}>
              <span className="label">{'// sei a'}</span>
              <span className="place">{placeName}</span>
              <span className="sub">{coordsLine}</span>
            </div>

            <div className="panel">
              <h1>Un tavolo, <span className="hl">anche all&apos;ultimo minuto.</span></h1>
              <p className="lede">Scegli il tavolo che ti piace sulla piantina del locale, prenoti in un tocco e paghi dal telefono. I ristoranti migliori, vicino a te.</p>
              <div className="actions">
                {/*
                  The primary CTA deliberately does NOT ask for location: a
                  permission prompt must follow a gesture that declares it,
                  otherwise a reflexive refusal burns the one prompt this origin
                  gets. TODO: wire it to the restaurant list once that page exists.
                */}
                <button className="cta" type="button">
                  Trova un tavolo
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <button
                  className="ghost"
                  type="button"
                  disabled={locating}
                  onClick={handleLocateClick}
                >
                  <svg className="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>
                  <span>{buttonLabel}</span>
                </button>
              </div>
              <p className="geoerr" role="status" aria-live="polite">
                {geo.status === 'error' && geo.reason ? GEO_ERROR_TEXT[geo.reason] : ''}
              </p>
            </div>

          </div>

          {priming && (
            <div className="primer" role="dialog" aria-modal="true" aria-labelledby="primerTitle">
              <div className="primer-card">
                <span className="label">{'// posizione'}</span>
                <h2 id="primerTitle">Ti facciamo vedere i tavoli liberi vicino a te</h2>
                <p>
                  Serve solo a ordinare i ristoranti per distanza. Al nostro server la
                  posizione arriva arrotondata al quartiere, e non la conserviamo.
                </p>
                <div className="primer-actions">
                  <button
                    className="cta"
                    type="button"
                    ref={allowButton}
                    onClick={() => { setPriming(false); geo.request(); }}
                  >
                    Va bene, chiedi pure
                  </button>
                  <button className="ghost" type="button" onClick={() => setPriming(false)}>
                    Non ora
                  </button>
                </div>
                <p className="primer-note">
                  Subito dopo sarà il browser a chiederti conferma. Puoi dire di no in
                  entrambi i casi: l&apos;app continua a funzionare.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
