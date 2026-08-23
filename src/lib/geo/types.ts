/**
 * Contract between the browser and our own geo endpoint.
 *
 * It is deliberately provider-agnostic: the UI must not know whether the
 * coordinates were resolved by BigDataCloud, Mapbox or Google. Swapping the
 * provider then means touching one server module, not the whole frontend.
 */
export type GeoPlace = {
  /** Human readable locality, e.g. "Milano". */
  city: string;
  /** First level administrative area, e.g. "Lombardia". Null when unknown. */
  region: string | null;
  /** ISO 3166-1 alpha-2 country code, e.g. "IT". */
  countryCode: string;
  /** Country name, localized, e.g. "Italia". */
  countryName: string;
  /** Coordinates actually used for the lookup (rounded, see the route). */
  lat: number;
  lon: number;
};

export type GeoErrorCode =
  | 'invalid_coordinates'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'not_found';

export type GeoErrorBody = {
  error: GeoErrorCode;
  message: string;
};
