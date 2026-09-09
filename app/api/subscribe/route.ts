import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, locale } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const safeLocale = VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])
    ? (locale as string)
    : 'en';

  const supabase = createClient();
  const { error } = await supabase.from('subscribers').insert({
    email: email.toLowerCase().trim(),
    locale: safeLocale,
  });

  // Not httpOnly — same reasoning as the pi_box cookie (lib/follows), it's a
  // UX flag, not a secret. One year is generous but this is opt-in and cheap
  // to re-set; there's no session to expire. Read server-side in the article
  // page to decide whether to render past the registration wall.
  function withSubscribedCookie(res: NextResponse): NextResponse {
    res.cookies.set('pi_subscribed', '1', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  if (error) {
    // 23505 = unique_violation — already subscribed is a success state for the user
    if (error.code === '23505') {
      return withSubscribedCookie(NextResponse.json({ message: 'subscribed' }, { status: 200 }));
    }
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }

  return withSubscribedCookie(NextResponse.json({ message: 'subscribed' }, { status: 201 }));
}
