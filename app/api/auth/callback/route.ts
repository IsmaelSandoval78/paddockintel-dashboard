import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import { importMiBoxFollowsOnLogin } from '@/lib/follows/actions';
import { MI_BOX_COOKIE, parseMiBox, serializeMiBox } from '@/lib/miBox';

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
// dashboard step, not something this route can configure for itself. Both
// paddockintel.com and hub.paddockintel.com redirect their apex to a `www.`
// or bare host at the platform level in at least one case (confirmed:
// paddockintel.com -> www.paddockintel.com) — the allow-list entry needs to
// be a wildcard (`https://*.paddockintel.com/api/auth/callback`) to survive
// that, not just the exact bare-domain URLs. Site URL (a separate field in
// that same settings page) also needs to point at a real domain, not the
// project's original localhost default — confirmed twice now (6 sep, 8 sep)
// that fixing one field without the other still breaks the redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // One-time Mi Box -> account import, right after a real login
      // completes (never on every request — see importMiBoxFollowsOnLogin's
      // own guard against overwriting an account that already has follows).
      // The pi_box cookie rides along on this same request since it's the
      // same domain, so it can be read directly here without a client round
      // trip.
      const cookieStore = await cookies();
      const miBoxState = parseMiBox(cookieStore.get(MI_BOX_COOKIE)?.value);
      if (miBoxState.drivers.length > 0 || miBoxState.constructors.length > 0) {
        await importMiBoxFollowsOnLogin({ drivers: miBoxState.drivers, constructors: miBoxState.constructors });
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      // Clear the guest drivers/constructors now that they've been
      // considered for import — while signed in, FollowButton/
      // MiBoxIndicator read/write the account instead (lib/follows/
      // useFollows.ts), so leaving stale values here would only resurface
      // as "phantom" follows after a future sign-out. `number` (the
      // personal car-number flourish) is untouched — it was never part of
      // what the privacy policy discloses storing on an account (see
      // docs/advisors/EEAT-EXPERT.md), so it stays a guest-only cookie
      // value regardless of login state.
      response.cookies.set(
        MI_BOX_COOKIE,
        serializeMiBox({ ...miBoxState, drivers: [], constructors: [] }),
        { path: '/', maxAge: 31536000, sameSite: 'lax' }
      );
      return response;
    }
  }

  // No dedicated error page exists yet (no design for one) — redirect to
  // the destination with a query flag instead of a page that would 404,
  // so whatever login UI gets built later can decide how to surface this.
  return NextResponse.redirect(`${origin}${next}?auth_error=1`);
}
