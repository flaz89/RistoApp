/**
 * The restaurant's mark, with a fallback that never looks broken.
 *
 * Most places will have no logo for a long time, so the empty state is not an
 * edge case here — it is the common one. A missing image must therefore look
 * like a deliberate monogram, not like a picture that failed to load.
 *
 * Plain <img> rather than next/image, deliberately: our placeholders are SVG,
 * and next/image refuses to optimise SVG unless the whole app opts in with
 * `dangerouslyAllowSVG` — a flag that would become genuinely dangerous the day
 * restaurateurs upload their own files, because an SVG can carry script.
 * TODO when uploads land: accept raster only (PNG/JPG/WebP), add the storage
 * host to images.remotePatterns, and switch to next/image.
 */
export function RestaurantLogo({
  name,
  url,
  className = 'h-14 w-14',
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  const base = `${className} shrink-0 overflow-hidden rounded-xl border border-line`;

  if (!url) {
    return (
      <div className={`${base} grid place-items-center bg-screen-2`} aria-hidden="true">
        <span className="font-display text-lg font-bold text-ink-3">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the note above
    <img
      src={url}
      alt={`Logo di ${name}`}
      className={`${base} bg-screen-2 object-cover`}
      loading="lazy"
    />
  );
}
