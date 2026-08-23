import type { GeoPlace } from './types';

/**
 * SERVER-ONLY module: it is the single place that knows which third party
 * turns coordinates into a place name. Never import it from a client component
 * — if a provider key is added later it would leak into the browser bundle.
 *
 * Today we use BigDataCloud: free, no API key, generous limits, and it answers
 * with an already localized city / region / country. Replacing it means
 * rewriting `reverseGeocode` only; `GeoPlace` stays the same for everyone else.
 */
const PROVIDER_ENDPOINT = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

/** Do not let a slow provider hold one of our serverless instances hostage. */
const PROVIDER_TIMEOUT_MS = 4_000;

type ProviderResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryCode?: string;
  countryName?: string;
};

export class ProviderError extends Error {}

/**
 * Resolve coordinates to a place. Returns null when the provider answers but
 * has no locality for that point (open sea, desert), which is a legitimate
 * "not found" rather than a failure.
 *
 * @throws ProviderError when the provider is unreachable, slow or broken.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  language = 'it',
): Promise<GeoPlace | null> {
  const url = `${PROVIDER_ENDPOINT}?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      // We run our own cache in the route; skip Next's fetch cache so the two
      // do not disagree about how long a result stays fresh.
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ProviderError('reverse geocoding provider unreachable', { cause });
  }

  if (!response.ok) {
    throw new ProviderError(`reverse geocoding provider responded ${response.status}`);
  }

  const data = (await response.json()) as ProviderResponse;

  // Fall back through decreasing precision: some points have no city but do
  // belong to a town or, at worst, to a region.
  const city = data.city || data.locality || data.principalSubdivision || '';
  if (!city) return null;

  return {
    city,
    region: data.principalSubdivision || null,
    countryCode: data.countryCode ?? '',
    countryName: data.countryName ?? '',
    lat,
    lon,
  };
}
