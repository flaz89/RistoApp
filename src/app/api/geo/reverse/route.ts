import { NextResponse } from 'next/server';

import { ProviderError, reverseGeocode } from '@/lib/geo/reverse-geocode';
import type { GeoErrorBody } from '@/lib/geo/types';

/**
 * GET /api/geo/reverse?lat=45.464&lon=9.19
 *
 * Turns coordinates into a place name. The browser could call a public
 * geocoding service directly, but routing it through our own server keeps the
 * provider (and any future API key) hidden and means the day we change provider
 * no client has to change.
 *
 * No caching or rate limiting here yet, on purpose: the provider is free and
 * keyless, so there is no quota to protect and nothing worth caching per
 * serverless instance. Add both the day this endpoint gets a real key or real
 * traffic — not before.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 3 decimals is roughly 110 m — far more than naming a city needs, and it means
 * we never handle a user's exact position.
 */
const COORD_PRECISION = 3;

function fail(status: number, body: GeoErrorBody) {
  return NextResponse.json(body, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));

  // Never trust the client: validate before spending a call on the provider.
  const validCoordinates =
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

  if (!validCoordinates) {
    return fail(400, {
      error: 'invalid_coordinates',
      message: 'lat must be between -90 and 90, lon between -180 and 180',
    });
  }

  const roundedLat = Number(lat.toFixed(COORD_PRECISION));
  const roundedLon = Number(lon.toFixed(COORD_PRECISION));

  try {
    const place = await reverseGeocode(roundedLat, roundedLon);
    return place
      ? NextResponse.json(place)
      : fail(404, { error: 'not_found', message: 'no known locality at these coordinates' });
  } catch (error) {
    if (error instanceof ProviderError) {
      // Log server side, stay vague client side: provider internals are ours.
      console.error('[geo/reverse]', error.message);
      return fail(502, {
        error: 'provider_unavailable',
        message: 'could not resolve the position right now',
      });
    }
    throw error;
  }
}
