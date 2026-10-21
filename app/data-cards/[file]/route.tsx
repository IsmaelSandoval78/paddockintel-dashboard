import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  LICENSE_NAME,
  allDataCards,
  cardImageFile,
  formatCell,
  getDataCard,
  parseCardImageFile,
} from '@/lib/dataCards';

// The 1600x900 PNG of a data card, drawn from the same content/data-cards/<slug>.json as its page,
// so the image posted on X and the table on /data/<slug>/ can't disagree. One file per card and
// locale (/data-cards/<slug>.png, .es.png, .pt.png), prerendered at build: only files listed by
// generateStaticParams exist, so the route can't be used to draw arbitrary text under the brand.
//
// next/og takes inline styles only, so the Warm Studio tokens (DESIGN.md v5.0.0, globals.css :root)
// are restated here as hex values; keep them in step with globals.css.
const BG = '#EDE7E3';
const SURFACE = '#FFFFFF';
const BORDER = '#DFD8D2';
const BORDER_SUBTLE = '#E7E1DB';
const TEXT_1 = '#12303A';
const TEXT_2 = '#6E7C7E';
const TEXT_3 = '#9CACAF';
const ACCENT = '#1A6B78';
const ACCENT_DIM = '#DDEEF0';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return allDataCards().flatMap((card) => routing.locales.map((locale) => ({ file: cardImageFile(card.slug, locale) })));
}

function hosts(urls: string[]): string {
  return [...new Set(urls.map((u) => new URL(u).hostname.replace(/^www\./, '')))].join(' · ');
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const parsed = parseCardImageFile(file);
  const card = parsed ? getDataCard(parsed.slug) : undefined;
  if (!parsed || !card) return new Response('Not found', { status: 404 });
  const { locale } = parsed;
  const t = await getTranslations({ locale, namespace: 'dataCards' });

  const rowCount = card.rows.length;
  const rowPad = rowCount > 4 ? 12 : 16;
  const firstFlex = 1.5;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BG,
          padding: '56px 72px 48px',
          fontFamily: 'sans-serif',
          color: TEXT_1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 700, letterSpacing: '0.16em', color: ACCENT }}>
            PADDOCKINTEL · DATA
          </div>
          <div style={{ display: 'flex', fontSize: 20, color: TEXT_2 }}>{card.asOf[locale]}</div>
        </div>

        <div style={{ display: 'flex', marginTop: 22, fontSize: 48, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
          {card.headline[locale]}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 24, lineHeight: 1.3, color: TEXT_2 }}>{card.subtitle[locale]}</div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 28,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 24,
            padding: '6px 28px 10px',
          }}
        >
          <div style={{ display: 'flex', padding: '16px 12px', borderBottom: `2px solid ${BORDER}` }}>
            {card.columns.map((col, i) => (
              <div
                key={col.key}
                style={{
                  display: 'flex',
                  flex: i === 0 ? firstFlex : 1,
                  justifyContent: col.numeric ? 'flex-end' : 'flex-start',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: TEXT_2,
                }}
              >
                {col.label[locale]}
              </div>
            ))}
          </div>
          {card.rows.map((row, r) => {
            const hi = r === card.highlightRow;
            return (
              <div
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: `${rowPad}px 12px`,
                  borderBottom: r === rowCount - 1 ? 'none' : `1px solid ${BORDER_SUBTLE}`,
                  background: hi ? ACCENT_DIM : 'transparent',
                  borderRadius: hi ? 12 : 0,
                }}
              >
                {card.columns.map((col, i) => (
                  <div
                    key={col.key}
                    style={{
                      display: 'flex',
                      flex: i === 0 ? firstFlex : 1,
                      justifyContent: col.numeric ? 'flex-end' : 'flex-start',
                      fontSize: col.kind ? 26 : 32,
                      fontWeight: i === 0 || hi ? 700 : 400,
                      color: hi ? ACCENT : TEXT_1,
                    }}
                  >
                    {formatCell(row[col.key], col, locale)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 18, color: TEXT_3 }}>
          <div style={{ display: 'flex' }}>
            {`${t('imageSource')}: ${hosts(card.sources.map((s) => s.url))} · ${LICENSE_NAME}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', color: TEXT_1 }}>
            <span style={{ color: ACCENT }}>P</span>
            <span>I</span>
            <span style={{ marginLeft: 14, fontSize: 20, color: ACCENT }}>{`paddockintel.com${locale === 'en' ? '' : `/${locale}`}/data`}</span>
          </div>
        </div>
      </div>
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT },
  );
}
