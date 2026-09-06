'use client';

import { createBrowserClient } from '@supabase/ssr';

// The client-side counterpart to lib/supabase/authServerClient.ts. Plain
// `@supabase/supabase-js` (see lib/supabase/client.ts, currently unused)
// stores a session in localStorage by default — createBrowserClient instead
// writes the session into cookies the server can read back, which is what
// lets an httpOnly session cookie exist at all (a page can only set a
// *non*-httpOnly cookie from the browser; the real httpOnly flag gets
// applied when the server side of the handshake — the OAuth callback route,
// or middleware's session refresh — writes the Set-Cookie response header).
// Use this for supabase.auth.signInWithOAuth(...) / signInWithOtp(...) from
// any client component; never instantiate a plain createClient() for auth.
export function createAuthBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
