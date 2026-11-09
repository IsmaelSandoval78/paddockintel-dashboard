import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/auth/getCurrentAuthUser';
import { getFollowedRefs } from '@/lib/follows/actions';

// The signed-in user and their follows, for lib/auth/AuthContext.tsx. Pages no
// longer read the session on the server so they can be served from the ISR
// cache; the browser asks here instead, after the page has painted. Never
// cached: the answer belongs to the caller's own session cookie. Without a
// session cookie getUser() returns null without a round trip to Supabase, so
// the anonymous majority costs one cheap Worker call and no database query.
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentAuthUser();
  const follows = user ? await getFollowedRefs() : { drivers: [], constructors: [] };
  // Registered through the article gate (pi_subscribed, set by /api/subscribe) or signed in:
  // either one opens paywalled articles (ArticlePaywallGate sends the reader to the twin page).
  const subscribed = (await cookies()).get('pi_subscribed')?.value === '1' || user !== null;
  return NextResponse.json(
    { user, follows, subscribed },
    { headers: { 'cache-control': 'private, no-store, max-age=0' } },
  );
}
