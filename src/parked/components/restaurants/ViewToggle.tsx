'use client';

import type { ViewMode } from '@/lib/ui/useViewMode';

const OPTIONS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: 'list',
    label: 'Vista elenco',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    ),
  },
  {
    mode: 'grid',
    label: 'Vista griglia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="h-4 w-4">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

/**
 * Two buttons rather than one that toggles: with a single button the label has
 * to describe either the current state or the next one, and every user reads
 * it the other way round. Two buttons, one visibly pressed, say what is true
 * and what is available at the same time.
 */
export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line p-1" role="group" aria-label="Visualizzazione">
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            // aria-pressed is what tells a screen reader which of the two is
            // the current view; colour alone says nothing to someone not
            // looking at it.
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.mode)}
            className={
              active
                ? 'rounded-full bg-accent/15 p-2 text-accent'
                : 'rounded-full p-2 text-ink-3 transition hover:text-ink-2'
            }
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
