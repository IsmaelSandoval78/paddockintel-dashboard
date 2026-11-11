import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase environment variables on the server.\n` +
      `Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ` +
      `in your Vercel project environment variables (Settings → Environment Variables).`
    );
  }
  return { url, key };
}

// Reads go through Next's data cache: every GET/HEAD request (each select, each count) is kept
// for `revalidate` seconds in the incremental cache (R2 on Cloudflare), so the many routes that
// render per request, and crawlers walking hundreds of URLs, stop sending the same public
// queries to Postgres over and over. On 2026-11-10 that volume (25,000-34,000 requests an hour)
// pushed the project past the Free plan's egress quota and Supabase restricted it, taking the
// home page down. Writes (POST/PATCH/DELETE) are never cached.
//
// Use createFreshClient() wherever a read must see the database as it is right now: routes
// that check state before writing, crons, sends and account actions.
export function createClient(revalidate = 300) {
  const { url, key } = credentials();
  const cachedFetch: typeof fetch = (input, init) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return fetch(input, init);
    return fetch(input, { ...init, next: { revalidate } });
  };
  return createSupabaseClient(url, key, { global: { fetch: cachedFetch } });
}

// Uncached: every read goes to Postgres.
export function createFreshClient() {
  const { url, key } = credentials();
  return createSupabaseClient(url, key);
}
