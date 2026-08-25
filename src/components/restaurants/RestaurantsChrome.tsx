'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { GeoPlace } from '@/lib/geo/types';
import type { ViewMode } from '@/lib/ui/useViewMode';

import { ViewToggle } from './ViewToggle';

export type Category = 'restaurants' | 'retail';

export type RadiusOption = { label: string; meters: number };

/**
 * The fixed top chrome of /ristoranti: brand, place, account, the
 * restaurants/retail switch, and the radius + view controls. It owns no data —
 * every value and setter comes from the page, which stays the single source of
 * truth (same discipline as the derived-state list below it).
 */
export function RestaurantsChrome({
  place,
  category,
  onCategoryChange,
  radii,
  radius,
  onRadiusChange,
  view,
  onViewChange,
}: {
  place: GeoPlace | null;
  category: Category;
  onCategoryChange: (next: Category) => void;
  radii: RadiusOption[];
  radius: number;
  onRadiusChange: (meters: number) => void;
  view: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}) {
  return (
    <header className="relative z-30 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Curius — home" className="text-accent transition hover:brightness-110">
          <AmphoraMark className="h-8 w-auto" />
        </Link>

        {place?.city && (
          <span className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            {place.countryCode ? `${place.city}, ${place.countryCode}` : place.city}
          </span>
        )}

        <AccountButton />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 pb-3 sm:px-6">
        <CategoryToggle category={category} onChange={onCategoryChange} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Raggio di ricerca">
            {radii.map((option) => {
              const active = option.meters === radius;
              return (
                <button
                  key={option.meters}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRadiusChange(option.meters)}
                  className={
                    active
                      ? 'rounded-full border border-accent bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-accent'
                      : 'rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-2 transition hover:border-ink-3 hover:text-ink'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <ViewToggle mode={view} onChange={onViewChange} />
        </div>
      </div>
    </header>
  );
}

/** The two-room switch. Retail is a real control here; its content is RIS-40. */
function CategoryToggle({
  category,
  onChange,
}: {
  category: Category;
  onChange: (next: Category) => void;
}) {
  return (
    <div
      className="flex w-max items-center gap-1 self-center rounded-full border border-line bg-screen-1 p-1"
      role="group"
      aria-label="Tipo di attività"
    >
      <CategoryButton
        active={category === 'restaurants'}
        label="Ristoranti"
        onClick={() => onChange('restaurants')}
        icon={<ForkKnifeIcon className="h-4 w-4" />}
      />
      <CategoryButton
        active={category === 'retail'}
        label="Botteghe"
        onClick={() => onChange('retail')}
        icon={<StoreIcon className="h-4 w-4" />}
      />
    </div>
  );
}

function CategoryButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? 'flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-sm font-medium text-accent'
          : 'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-ink-3 transition hover:text-ink-2'
      }
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * The single gate to the account area (there is no separate FAB). The area
 * itself is RIS-42; until then the button opens a short note rather than a
 * dead link, so the control still names a real action.
 */
function AccountButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Il tuo account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-screen-1 text-ink-2 transition hover:border-ink-3 hover:text-ink"
      >
        <PersonIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-60 rounded-2xl border border-line bg-screen-1 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <p className="font-display text-sm font-bold text-ink">La tua area</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            Prenotazioni, bonus, storico e preferiti vivranno qui. Ci stiamo
            lavorando.
          </p>
          <span className="mt-3 inline-block rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            In arrivo
          </span>
        </div>
      )}
    </div>
  );
}

/* --- Icons: drawn, one stroke system, no emoji or unicode glyphs. --- */

/** The Curius amphora, from the canonical logo SVG (viewBox 18×24). */
function AmphoraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.0875 4.9848C16.194 5.1271 15.6587 5.28724 15.3524 5.41427C15.2976 5.437 15.253 5.45803 15.2168 5.47588C15.2145 5.48914 15.2115 5.50361 15.2088 5.51901C15.1916 5.61803 15.1562 5.83651 15.1102 6.04399C15.1036 6.07377 15.0848 6.14552 15.154 6.37117C15.2374 6.64319 15.4143 7.02688 15.7689 7.64541C15.7806 7.65918 15.8105 7.69472 15.8724 7.75817C15.9513 7.83904 16.2799 8.1573 16.5305 8.44828C17.1889 9.21301 17.7524 10.2215 17.9507 11.7263C18.1837 13.4944 17.6053 15.4645 15.8958 16.9107C14.3192 18.2445 12.0376 18.9203 9.1605 18.9669V18.9712C9.10672 18.9712 9.05305 18.9692 8.99968 18.9687C8.94657 18.9691 8.89298 18.9712 8.83947 18.9712V18.9669C5.96259 18.9203 3.68133 18.2444 2.10476 16.9107C0.395308 15.4645 -0.183735 13.4944 0.0492234 11.7263C0.247546 10.2213 0.811609 9.21304 1.47011 8.44828C1.72054 8.15744 2.04848 7.83922 2.12756 7.75817C2.18691 7.69731 2.21714 7.66214 2.22984 7.64726C2.58522 7.02754 2.76249 6.64349 2.84601 6.37117C2.91521 6.14547 2.89636 6.07378 2.88976 6.04399C2.84379 5.83651 2.80835 5.61802 2.79117 5.51901C2.78853 5.5038 2.78488 5.48962 2.78254 5.4765C2.74645 5.45869 2.70223 5.43692 2.6476 5.41427C2.34127 5.28726 1.80637 5.12708 0.913091 4.9848L1.70671 0C3.86484 0.343725 5.5664 0.940409 6.64776 2.16028C7.21773 2.80326 7.48702 3.47596 7.63117 4.02234C7.6979 4.27528 7.73848 4.50722 7.76426 4.65576C7.7954 4.83519 7.80443 4.89151 7.81787 4.95214C8.28404 7.05574 7.37144 8.8338 6.58984 10.192C6.30183 10.6925 5.96074 11.0577 5.74138 11.2826C5.46559 11.5654 5.41095 11.6066 5.29466 11.7417C5.22709 11.8202 5.1947 11.8721 5.16835 11.929C5.14047 11.9893 5.08831 12.1234 5.05374 12.3856C5.02955 12.5692 5.05569 12.7956 5.3649 13.0572C5.74022 13.3746 6.7422 13.8972 8.99968 13.9211C11.2582 13.8973 12.2605 13.3746 12.6357 13.0572C12.9449 12.7956 12.9704 12.5692 12.9462 12.3856C12.9117 12.1235 12.8601 11.9893 12.8322 11.929C12.8059 11.872 12.773 11.8203 12.7053 11.7417C12.589 11.6066 12.5344 11.5655 12.2586 11.2826C12.0392 11.0577 11.6981 10.6925 11.4101 10.192C10.6285 8.83381 9.71594 7.05573 10.1821 4.95214C10.1955 4.89151 10.2046 4.83518 10.2357 4.65576C10.2615 4.50721 10.3027 4.27531 10.3694 4.02234C10.5136 3.476 10.7823 2.80321 11.3522 2.16028C12.4336 0.940417 14.1352 0.343726 16.2933 0L17.0875 4.9848Z" />
      <path d="M2.80924 21.8112C2.80924 20.7658 3.65671 19.9183 4.70211 19.9183H13.5355C14.5809 19.9183 15.4284 20.7658 15.4284 21.8112C15.4284 22.8566 14.5809 23.7041 13.5355 23.7041H4.70211C3.65671 23.7041 2.80924 22.8566 2.80924 21.8112Z" />
    </svg>
  );
}

function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3v7a2 2 0 0 0 2 2v9M8 3v6M4 3v6M18 3c-1.5 0-3 1.8-3 5s1.5 4 3 4v9" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 9.5 5.2 4h13.6L20 9.5M4 9.5h16M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M5 12v8h14v-8" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}
