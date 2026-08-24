import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

/**
 * The row shape comes from the generated database types, not from a hand
 * written interface. If the SQL function changes and the types are
 * regenerated, every mismatch becomes a compile error instead of a surprise at
 * runtime.
 */
export type NearbyRestaurant =
  Database['public']['Functions']['nearby_restaurants']['Returns'][number];

/**
 * Ask the database for the restaurants around a point.
 *
 * This runs straight from the browser, which is safe here for two reasons that
 * both live in the database rather than in this file: RLS only exposes
 * `status = 'active'` restaurants, and the function clamps the radius and the
 * row count server side. Anyone can call it with any arguments; nobody can
 * make it expensive or make it reveal a draft.
 */
export async function fetchNearbyRestaurants(
  lat: number,
  lon: number,
  radiusM = 10_000,
  limit = 20,
): Promise<NearbyRestaurant[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('nearby_restaurants', {
    in_lat: lat,
    in_lon: lon,
    in_radius_m: radiusM,
    in_limit: limit,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
