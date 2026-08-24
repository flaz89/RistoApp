// Supabase client for the BROWSER (Client Components).
// Uses the public anon key: safe to ship to the browser because Row Level
// Security decides what each request may actually read or write.
// Typed with <Database> so table and column names are autocompleted and typos
// are caught at compile time.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
  );
}
