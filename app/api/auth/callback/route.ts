import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';

// Lands both Google OAuth and email magic-link sign-ins (Supabase's default
// PKCE flow routes both through a `code` param to the same redirect target).
// This is the one point in the whole login flow that runs server-side and
// can set a real httpOnly session cookie — signInWithOAuth()/signInWithOtp()
// on the client only ever redirect the browser here or to an email link;
// they never receive or handle the session themselves.
//
// Register this exact path (`<site>/api/auth/callback`) in the Supabase
// dashboard under Authentication → URL Configuration → Redirect URLs, and as
// an authorized redirect URI on the Google OAuth client — that's a manual
// dashboard step, not something this route can configure for itself.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // TEMPORARY diagnostic logging — real exchangeCodeForSession() failure
    // reason wasn't visible anywhere (Vercel logs showed only the 307, no
    // error/warning). Never log the code itself (it's a live credential
    // until exchanged/expired); the error message and status are safe.
    console.error('exchangeCodeForSession failed:', error.message, error.status);
  } else {
    console.error('auth callback hit with no code param');
  }

  // No dedicated error page exists yet (no design for one) — redirect to
  // the destination with a query flag instead of a page that would 404,
  // so whatever login UI gets built later can decide how to surface this.
  return NextResponse.redirect(`${origin}${next}?auth_error=1`);
}
