// Supabase client for the BROWSER (Client Components).
// Uses the public anon key: safe to ship to the browser because Row Level
// Security decides what each request may actually read or write.
// Typed with <Database> so table and column names are autocompleted and typos
// are caught at compile time.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
