import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkSearchRateLimit } from '@/lib/search/rateLimit';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;
type Locale = (typeof VALID_LOCALES)[number];

// Matches the `regconfig` picked per-row in the search_vector generated
// column (see the migration) so query terms are stemmed the same way.
const TS_CONFIG: Record<Locale, string> = { en: 'english', es: 'spanish', pt: 'portuguese' };

export type SearchResult = {
  slug: string;
  title: string;
  meta_description: string | null;
  published_at: string;
};

function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!checkSearchRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const localeParam = searchParams.get('locale') ?? 'en';
  const locale: Locale = (VALID_LOCALES as readonly string[]).includes(localeParam)
    ? (localeParam as Locale)
    : 'en';

  // Below 2 chars, `websearch_to_tsquery` mostly matches noise; above 100,
  // it's not a real query — treat both as empty rather than hitting Postgres.
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, meta_description, published_at')
    .eq('locale', locale)
    .eq('status', 'published')
    .textSearch('search_vector', q, { type: 'websearch', config: TS_CONFIG[locale] })
    .order('published_at', { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  return NextResponse.json({ results: (data ?? []) as SearchResult[] });
}
