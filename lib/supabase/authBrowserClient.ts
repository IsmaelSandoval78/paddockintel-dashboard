'use client';

import { createBrowserClient } from '@supabase/ssr';
import { authBrowserCookieOptions } from './authCookieOptions';

// The client-side counterpart to lib/supabase/authServerClient.ts. Plain
// `@supabase/supabase-js` (see lib/supabase/client.ts, currently unused)
// stores a session in localStorage by default — createBrowserClient instead
// writes the session into cookies the server can read back.
//
// Uses authBrowserCookieOptions (httpOnly: false), not
// authServerCookieOptions — see the comment in authCookieOptions.ts for the
// full reasoning. Short version, confirmed in a real Chrome instance,
// 2026-09-06: when this client writes a cookie itself (the PKCE code
// verifier it sets before signInWithOtp()/signInWithOAuth() redirect, via
// `document.cookie = serialize(...)` in @supabase/ssr's cookies.js), a
// write containing `HttpOnly` is not silently downgraded — Chrome refuses
// to store the cookie at all. With httpOnly: true here, the verifier was
// never stored, exchangeCodeForSession() in app/api/auth/callback/route.ts
// had nothing to validate against, and sign-in failed outright. Do not
// change this back to true to try to harden it further; that specific
// value change is what broke the flow the first time.
export function createAuthBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: authBrowserCookieOptions }
  );
}
