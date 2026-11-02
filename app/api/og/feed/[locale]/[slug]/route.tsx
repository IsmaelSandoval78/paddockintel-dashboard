import { ImageResponse } from 'next/og';
import { getFormatter, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { readFeaturedStats } from '@/lib/hookDeliver';
import { ScoreCard, loadCardFonts } from '@/lib/cardImage';

// The image of a Feed item: a scorecard in the data cards' house style (Wordmark masthead, Archivo
// Black headline, the item's own stats in JetBrains Mono, Warm Studio), drawn from the published
// row only, so it can't show a number the page doesn't. It is the item's og/twitter image and the
// NewsArticle `image`, which Google needs for a story to show with a picture in Top stories and
// News: one URL per aspect ratio Google lists (16:9 default, 4:3, 1:1), every one 1200px wide.
// A plain Route Handler for the same reason as /api/og/article: a fixed URL for the JSON-LD.
// Feed is EN/ES only (EDITORIAL.md), so other locales answer 404.

const RATIOS = { '16x9': 675, '4x3': 900, '1x1': 1200 } as const;
type Ratio = keyof typeof RATIOS;
const WIDTH = 1200;
const LOCALES = new Set(['en', 'es']);

function siteLabel(locale: string): string {
  return `paddockintel.com${locale === 'en' ? '' : `/${locale}`}/feed`;
}

export async function GET(request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const url = new URL(request.url);
  const ratioParam = url.searchParams.get('ratio') ?? '16x9';
  if (!LOCALES.has(locale) || !(ratioParam in RATIOS)) return new Response('Not found', { status: 404 });
  const height = RATIOS[ratioParam as Ratio];

  const { data: item } = await createClient()
    .from('digest_items')
    .select('source_name, headline, headline_es, stats, published_at, digest_issues!inner(status, series)')
    .eq('slug', slug)
    .eq('digest_issues.status', 'published')
    .eq('digest_issues.series', 'newsletter')
    .single();
  if (!item) return new Response('Not found', { status: 404 });

  const isEs = locale === 'es';
  const headline = isEs ? (item.headline_es as string | null) ?? (item.headline as string) : (item.headline as string);
  const stats = readFeaturedStats(item.stats)
    .slice(0, 3)
    .map((s) => ({ value: s.value, label: isEs ? s.label_es ?? s.label : s.label, unit: isEs ? s.unit_es ?? s.unit : s.unit }));

  const [t, format, fonts] = await Promise.all([
    getTranslations({ locale, namespace: 'feed' }),
    getFormatter({ locale }),
    loadCardFonts(url.origin),
  ]);
  const date = format.dateTime(new Date(item.published_at as string), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return new ImageResponse(
    (
      <ScoreCard
        height={height}
        kicker={`Feed · ${date}`}
        headline={headline}
        stats={stats}
        footerLeft={t('originallyReportedBy', { source: item.source_name as string })}
        footerRight={siteLabel(locale)}
      />
    ),
    {
      width: WIDTH,
      height,
      fonts,
      // A re-ingested item can change its stats: a day at the edge instead of next/og's one-year default.
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}
