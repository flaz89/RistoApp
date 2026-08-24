import type { Database } from '@/lib/supabase/database.types';
import { createPublicClient } from '@/lib/supabase/public';

type RestaurantRow = Database['public']['Tables']['restaurants']['Row'];

/**
 * Only the columns the page renders. Selecting '*' would ship Stripe account
 * ids and commission rates to anyone reading the page source: RLS decides
 * which ROWS you may see, never which COLUMNS.
 */
export type RestaurantDetail = Pick<
  RestaurantRow,
  | 'id' | 'name' | 'slug' | 'description'
  | 'phone' | 'email'
  | 'address_line' | 'city' | 'postal_code'
  | 'cover_photo_url' | 'logo_url' | 'avg_spend_cents'
  | 'latitude' | 'longitude'
>;

const COLUMNS =
  'id, name, slug, description, phone, email, address_line, city, postal_code, cover_photo_url, logo_url, avg_spend_cents, latitude, longitude';

/**
 * Returns null when there is no such restaurant — including when it exists but
 * is not active, because RLS makes those two cases indistinguishable from out
 * here. That is the point: a draft restaurant should not be discoverable by
 * guessing its address.
 */
export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantDetail | null> {
  const supabase = createPublicClient();

  // maybeSingle, not single: "not found" is a normal answer for a URL someone
  // typed, not an exception.
  const { data, error } = await supabase
    .from('restaurants')
    .select(COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
