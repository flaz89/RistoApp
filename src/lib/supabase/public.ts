import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { supabaseAnonKey, supabaseUrl } from './env';

/**
 * Client for PUBLIC data read on the server.
 *
 * `server.ts` wires Supabase to the request cookies so a logged-in user's
 * session travels with the query. That is right for anything personal — and
 * wrong here. Touching cookies tells Next the response depends on who is
 * asking, which forces the page to be rebuilt on every single request.
 *
 * A restaurant page is identical for everyone and needs to be found by search
 * engines, so it should be rendered once and cached. Reading it without
 * cookies is what makes that possible. RLS still applies: the anon key only
 * ever sees `status = 'active'`.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
