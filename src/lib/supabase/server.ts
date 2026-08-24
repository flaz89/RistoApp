// Supabase client for the SERVER (Server Components, Route Handlers, Server
// Actions). Still the anon key + RLS, but wired to the request cookies so the
// user's auth session is carried through on the server side.
// Typed with <Database> for full autocomplete and compile-time safety.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Can throw when called from a Server Component (read-only cookies).
          // Safe to ignore: refreshing sessions happens in middleware instead.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
