import { NextResponse } from 'next/server';

import { ProviderError, reverseGeocode } from '@/lib/geo/reverse-geocode';
import type { GeoErrorBody, GeoPlace } from '@/lib/geo/types';

/**
 * GET /api/geo/reverse?lat=45.464&lon=9.19
 *
 * Turns coordinates into a place name. The browser could call a public
 * geocoding service directly, but routing it through our own server buys three
 * things: the provider (and any future API key) stays hidden, we can cache and
 * throttle the traffic, and the day we change provider no client has to change.
 */

export const runtime = 'nodejs';
// Every request depends on its query string, so there is nothing to prerender.
export const dynamic = 'force-dynamic';

/**
 * 3 decimals is roughly 110 m. That is far more precision than naming a city
 * needs, and rounding does double duty: it turns many nearby users into one
 * cache key, and it means we never store a user's exact position.
 */
const COORD_PRECISION = 3;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // city names do not move
const CACHE_MAX_ENTRIES = 500;

/**
 * In-memory cache. Note the honest limitation: on Vercel each serverless
 * instance has its own copy and it dies with the instance. It is a cheap way to
 * absorb bursts (a user tapping the button repeatedly), NOT a durable cache.
 * If this ever needs to be shared across instances, move it to Redis/Upstash.
 */
const cache = new Map<string, { expiresAt: number; value: GeoPlace | null }>();

/**
 * Fixed-window rate limit, same per-instance caveat as the cache. It exists so
 * that an open endpoint on our domain cannot be turned into a free proxy that
 * burns through the provider's quota in our name.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const hits = new Map<string, { windowStart: number; count: number }>();

function clientKey(request: Request): string {
  // Vercel sets x-forwarded-for; the first entry is the real client.
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(key, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

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

  if (isRateLimited(clientKey(request))) {
    return fail(429, {
      error: 'rate_limited',
      message: 'too many lookups, try again in a minute',
    });
  }

  const roundedLat = Number(lat.toFixed(COORD_PRECISION));
  const roundedLon = Number(lon.toFixed(COORD_PRECISION));
  const cacheKey = `${roundedLat},${roundedLon}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
      ? NextResponse.json(cached.value)
      : fail(404, { error: 'not_found', message: 'no known locality at these coordinates' });
  }

  let place: GeoPlace | null;
  try {
    place = await reverseGeocode(roundedLat, roundedLon);
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

  // Map preserves insertion order, so the first key is the oldest one.
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: place });

  return place
    ? NextResponse.json(place)
    : fail(404, { error: 'not_found', message: 'no known locality at these coordinates' });
}
