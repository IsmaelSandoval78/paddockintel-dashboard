import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale');

  if (!secret || secret !== process.env.DRAFT_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const safeLocale = VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])
    ? (locale as string)
    : 'en';

  (await draftMode()).enable();

  const path = safeLocale === 'en' ? `/${slug}/` : `/${safeLocale}/${slug}/`;
  return NextResponse.redirect(new URL(path, req.url));
}
