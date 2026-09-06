import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { authServerCookieOptions } from './authCookieOptions';

// The ONLY Supabase client allowed to touch user_profiles or any *_follows
// table. Uses the Anon key + the caller's own session cookie (never the
// Service Role key), so every query runs as that user's real Postgres role
// and Row Level Security actually applies — auth.uid() inside a policy only
// resolves correctly when the request is authenticated this way.
//
// lib/supabase/server.ts is a different, unrelated client: it always uses
// SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely. Reusing it here
// would silently defeat every policy in supabase/migrations/20260906120000_
// user_accounts.sql. Do not import it into any code path that reads or
// writes account data.
//
// Call this fresh inside each Server Component / Route Handler / Server
// Action that needs it — it reads the current request's cookies via
// next/headers, so it can't be created once and cached at module scope.
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authServerCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, where cookies() is
            // read-only — a session refresh triggered mid-render can't
            // write back here. Harmless as long as middleware (or a Route
            // Handler on the next navigation) also calls getUser() and
            // persists the refreshed session; a component-only render
            // never needs to set a cookie itself.
          }
        },
      },
    }
  );
}
