import { ImageResponse } from 'next/og';
import { getFormatter, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { readFeaturedStats } from '@/lib/hookDeliver';
import { WARM, Wordmark, fitSize, loadCardFonts } from '@/lib/cardImage';

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

  // Taller canvases give the headline more lines and the stats more room; the width never changes.
  const tall = height >= 900;
  const pad = tall ? 72 : 56;
  const headSize = fitSize(headline, WIDTH - 2 * pad, tall ? 3 : 2, 0.62, tall ? 76 : 58);
  const valueSize = height === 1200 ? 64 : tall ? 54 : 44;
  const rowPad = height === 1200 ? 26 : tall ? 20 : 12;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: WARM.bg,
          color: WARM.text1,
          padding: `${pad - 8}px ${pad}px`,
          fontFamily: 'Lora',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: `3px solid ${WARM.text1}`,
            paddingBottom: 12,
          }}
        >
          <Wordmark size={26} dot={WARM.accent} />
          <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 17, letterSpacing: '0.08em', textTransform: 'uppercase', color: WARM.text2 }}>
            {`Feed · ${date}`}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: tall ? 40 : 26,
            fontFamily: 'Archivo Black',
            fontSize: headSize,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          {headline}
        </div>

        {stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: tall ? 40 : 24,
              background: WARM.surface,
              border: `1px solid ${WARM.border}`,
              borderRadius: 24,
              padding: '8px 24px',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 28,
                  padding: `${rowPad}px 12px`,
                  borderBottom: i === stats.length - 1 ? 'none' : `1px solid ${WARM.borderSubtle}`,
                  background: i === 0 ? WARM.accentDim : 'transparent',
                  borderRadius: i === 0 ? 12 : 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexShrink: 0,
                    minWidth: 300,
                    fontFamily: 'JetBrains Mono',
                    fontSize: valueSize,
                    color: i === 0 ? WARM.accent : WARM.text1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', fontFamily: 'Archivo Black', fontSize: 20, letterSpacing: '0.02em' }}>{s.label}</div>
                  {s.unit ? <div style={{ display: 'flex', marginTop: 4, fontSize: 19, color: WARM.text2 }}>{s.unit}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad,
            bottom: tall ? 40 : 28,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono',
            fontSize: 16,
            color: WARM.text2,
          }}
        >
          <div style={{ display: 'flex' }}>{t('originallyReportedBy', { source: item.source_name as string })}</div>
          <div style={{ display: 'flex', color: WARM.accent }}>{siteLabel(locale)}</div>
        </div>
      </div>
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
