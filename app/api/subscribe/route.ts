import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createClient } from '@/lib/supabase/server';
import WelcomeEmail, { type WelcomeEmailLocale } from '@/emails/WelcomeEmail';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;

// Locale-prefix rule matches lib/i18n/routing.ts: 'en' drops its path
// prefix site-wide, 'es'/'pt' keep theirs.
function localizedPath(locale: WelcomeEmailLocale, path: string): string {
  return locale === 'en' ? path : `/${locale}${path}`;
}

async function sendWelcomeEmail(email: string, locale: WelcomeEmailLocale): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL ?? 'info@paddockintel.com';
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paddockintel.com';

  const html = await render(
    WelcomeEmail({
      locale,
      archiveUrl: `${SITE}${localizedPath(locale, '/weekly/')}`,
      aboutUrl: `${SITE}${localizedPath(locale, '/about')}`,
      unsubscribeUrl: `${SITE}/api/unsubscribe?email=${encodeURIComponent(email)}`,
    })
  );

  const subjectByLocale: Record<WelcomeEmailLocale, string> = {
    en: 'Welcome to the PaddockIntel Digest',
    es: 'Bienvenido al Digest de PaddockIntel',
    pt: 'Bem-vindo ao Digest da PaddockIntel',
  };

  await resend.emails.send({
    from: `PaddockIntel Digest <${FROM}>`,
    to: email,
    subject: subjectByLocale[locale],
    html,
  });
}

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
    ? (locale as WelcomeEmailLocale)
    : 'en';
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createClient();
  const { error } = await supabase.from('subscribers').insert({
    email: normalizedEmail,
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
    // 23505 = unique_violation — already subscribed is a success state for the
    // user, but NOT a new subscription, so no welcome email here — sending one
    // every time someone re-submits an already-subscribed address would be a
    // real spam vector, not a welcome.
    if (error.code === '23505') {
      return withSubscribedCookie(NextResponse.json({ message: 'subscribed' }, { status: 200 }));
    }
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }

  // Best-effort: a Resend outage or bad API key should never turn a real,
  // successful subscription into an error response to the reader — they're
  // already in `subscribers` at this point. Failure here is invisible to the
  // reader on purpose; it would need real Cloudflare/Vercel function logs to
  // notice, same visibility gap already true of every other Resend call in
  // this project.
  try {
    await sendWelcomeEmail(normalizedEmail, safeLocale);
  } catch {
    // Swallowed on purpose — see comment above.
  }

  return withSubscribedCookie(NextResponse.json({ message: 'subscribed' }, { status: 201 }));
}
