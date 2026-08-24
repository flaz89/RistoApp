/** Below a kilometre people think in metres, above it in kilometres. */
export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km`;
}

/**
 * Money is stored as integer cents and divided only here, at the very edge,
 * for a human to read. Dividing earlier is how rounding errors get into totals.
 */
export function formatSpend(cents: number | null): string | null {
  if (!cents) return null;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
