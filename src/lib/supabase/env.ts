/**
 * Reading and validating the Supabase environment.
 *
 * `process.env.X!` lies twice: it silences the compiler about a value that
 * might be missing, and it happily accepts a value that is present but wrong.
 * A wrong URL does not fail here — it fails much later, deep inside the
 * client library, as "Invalid path specified in request URL", an error that
 * points at nothing and names no variable.
 *
 * Validating at the edge costs a few lines and turns a treasure hunt into a
 * sentence. This module is the only place allowed to read these variables.
 *
 * IMPORTANT: the variables are referenced STATICALLY below, never as
 * `process.env[name]`. Next.js inlines `process.env.NEXT_PUBLIC_*` into the
 * browser bundle at build time by textual substitution; a dynamic lookup finds
 * nothing at runtime, because there is no `process` in a browser to look into.
 */
const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RAW_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase keys are JWTs, and every JWT starts with this. */
const JWT_PREFIX = 'eyJ';

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value.trim();
}

/**
 * The project URL is the ORIGIN and nothing else: https://<ref>.supabase.co
 *
 * The Supabase dashboard also displays longer URLs ending in /rest/v1 or
 * /auth/v1. Those are endpoints, not the project URL: the client appends its
 * own path, so a URL that already carries one produces a doubled, invalid path.
 */
export function supabaseUrl(): string {
  const raw = required('NEXT_PUBLIC_SUPABASE_URL', RAW_URL);

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not a URL. Expected https://<ref>.supabase.co — ' +
        'check that the URL and the keys are not swapped.',
    );
  }

  if (parsed.pathname !== '/' || parsed.search) {
    // Warn rather than throw: the app stays usable, but the misconfiguration
    // is named out loud instead of surviving unnoticed.
    console.warn(
      `[supabase] NEXT_PUBLIC_SUPABASE_URL should be the project origin only. ` +
        `Ignoring "${parsed.pathname}${parsed.search}" — fix it in .env.local AND in the Vercel project settings.`,
    );
  }

  return parsed.origin;
}

export function supabaseAnonKey(): string {
  const key = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', RAW_ANON_KEY);

  if (!key.startsWith(JWT_PREFIX)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a Supabase key ' +
        '(they are JWTs and start with "eyJ"). The URL and the key may be swapped.',
    );
  }

  return key;
}
