import { ImageResponse } from 'next/og';
import { getFormatter, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/lib/i18n/routing';
import { ScoreCard, loadCardFonts } from '@/lib/cardImage';

// Per-article image, auto-generated from the article's own real `stats` (EDITORIAL.md already
// requires these on every article) -- no per-article manual image work, no stock photography.
// The same scorecard as the Feed items (lib/cardImage.tsx): Wordmark masthead, the title in
// Archivo Black, up to three stats in JetBrains Mono, Warm Studio.
//
// This is a plain Route Handler, not the app/[locale]/(blog)/[slug]/
// opengraph-image.tsx file convention -- that convention appends an
// unpredictable content hash to the URL for any *dynamic* image inside a
// param'd segment (confirmed via `next build`: it resolved to
// /[locale]/[slug]/opengraph-image-1o9wtw, not .../opengraph-image), which
// breaks a JSON-LD `image` field that has to be a fixed, known URL. A route
// handler's URL is exactly what we write here -- no surprises.
//
// Sizes: 1200x630 by default, the link-unfurl ratio Twitter/Facebook expect for og:image; and
// ?ratio=16x9, 4x3 or 1x1, the ratios Google lists for an article image, all 1200 wide.
// ?square=1 stays as an alias of 1x1 for any old link to it.

const RATIOS = { og: 630, '16x9': 675, '4x3': 900, '1x1': 1200 } as const;
type Ratio = keyof typeof RATIOS;

type Stat = { value: string; label: string; unit?: string };

function siteLabel(locale: string): string {
  return `paddockintel.com${locale === 'en' ? '' : `/${locale}`}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const url = new URL(request.url);
  const ratioParam = url.searchParams.get('square') === '1' ? '1x1' : url.searchParams.get('ratio') ?? 'og';
  if (!(routing.locales as readonly string[]).includes(locale) || !(ratioParam in RATIOS)) {
    return new Response('Not found', { status: 404 });
  }
  const height = RATIOS[ratioParam as Ratio];

  const { data: article } = await createClient()
    .from('articles')
    .select('title, stats, sources, published_at')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!article) return new Response('Not found', { status: 404 });

  const stats = ((article.stats as Stat[] | null) ?? []).slice(0, 3);
  const sourceCount = Array.isArray(article.sources) ? article.sources.length : 0;

  const [t, format, fonts] = await Promise.all([
    getTranslations({ locale, namespace: 'articleDusk' }),
    getFormatter({ locale }),
    loadCardFonts(url.origin),
  ]);
  const date = article.published_at
    ? format.dateTime(new Date(article.published_at as string), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';

  return new ImageResponse(
    (
      <ScoreCard
        height={height}
        kicker={date}
        headline={article.title as string}
        stats={stats}
        footerLeft={sourceCount > 0 ? `${t('sourcesTitle')}: ${sourceCount}` : ''}
        footerRight={siteLabel(locale)}
      />
    ),
    {
      width: 1200,
      height,
      fonts,
      // An updated article can change its stats: a day at the edge instead of next/og's one-year default.
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}
