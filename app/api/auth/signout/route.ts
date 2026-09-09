import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';

// The session cookie (Domain=.paddockintel.com) is httpOnly on purpose — see
// authCookieOptions.ts. That means it can only ever be cleared by a real
// server response with a matching Set-Cookie, never by client-side
// document.cookie. AuthWidget.tsx's client-side supabase.auth.signOut() does
// revoke the refresh token against the Auth API, but it can't touch the
// cookie itself — the still-valid access token JWT kept the user looking
// signed in until it naturally expired (up to ~1hr). This route is the part
// that actually clears it: createAuthServerClient() reads/writes cookies via
// next/headers inside a Route Handler (a mutable context, unlike a Server
// Component render), so signOut() here produces a real Set-Cookie that
// matches the domain/path the session cookie was originally set with.
export async function POST() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
