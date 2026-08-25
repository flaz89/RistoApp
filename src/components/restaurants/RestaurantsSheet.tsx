'use client';

import { useCallback, useRef, useState } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

const ORDER: SheetSnap[] = ['peek', 'half', 'full'];
/** Height of each snap as a fraction of the viewport. */
const FRACTION: Record<SheetSnap, number> = { peek: 0.24, half: 0.55, full: 0.9 };
/** A pointer that barely moved is a tap, not a drag. */
const TAP_SLOP = 6;

/**
 * The list, as a sheet that rides over the map on mobile. Controlled: the page
 * owns `snap`, so the same truth drives the sheet and anything else that reacts
 * to how open it is. Drag the handle to resize; tap it to step open.
 *
 * Height is driven by the snap fraction with a transition, except mid-drag,
 * when a live pixel height follows the finger with the transition off.
 */
export function RestaurantsSheet({
  snap,
  onSnapChange,
  children,
}: {
  snap: SheetSnap;
  onSnapChange: (next: SheetSnap) => void;
  children: React.ReactNode;
}) {
  const [dragPx, setDragPx] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startPx: number; moved: number } | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const vh = window.innerHeight;
      drag.current = { startY: event.clientY, startPx: FRACTION[snap] * vh, moved: 0 };
      setDragPx(FRACTION[snap] * vh);
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [snap],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - event.clientY; // up = grow
    d.moved = Math.max(d.moved, Math.abs(dy));
    const vh = window.innerHeight;
    const next = Math.min(Math.max(d.startPx + dy, FRACTION.peek * vh * 0.6), FRACTION.full * vh);
    setDragPx(next);
  }, []);

  const onPointerUp = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;

    // A tap steps the sheet one stop more open, wrapping from full back to peek.
    if (d.moved < TAP_SLOP) {
      const i = ORDER.indexOf(snap);
      onSnapChange(ORDER[(i + 1) % ORDER.length]);
      setDragPx(null);
      return;
    }

    // A drag snaps to whichever stop the released height is closest to.
    const vh = window.innerHeight;
    const releasedPx = dragPx ?? FRACTION[snap] * vh;
    const nearest = ORDER.reduce((best, s) =>
      Math.abs(FRACTION[s] * vh - releasedPx) < Math.abs(FRACTION[best] * vh - releasedPx) ? s : best,
    );
    onSnapChange(nearest);
    setDragPx(null);
  }, [snap, dragPx, onSnapChange]);

  const height = dragPx != null ? `${dragPx}px` : `${FRACTION[snap] * 100}vh`;

  return (
    <section
      aria-label="Elenco locali"
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t border-line bg-page shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:hidden"
      style={{ height, transition: dragPx != null ? 'none' : 'height 300ms cubic-bezier(0.22,1,0.36,1)' }}
    >
      <button
        type="button"
        aria-label={snap === 'full' ? 'Riduci l’elenco' : 'Espandi l’elenco'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex w-full shrink-0 touch-none cursor-grab flex-col items-center pt-3 pb-2 active:cursor-grabbing"
      >
        <span className="h-1.5 w-11 rounded-full bg-ink-3/60" />
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {children}
      </div>
    </section>
  );
}
