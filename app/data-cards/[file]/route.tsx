import { ImageResponse } from 'next/og';
import { routing } from '@/lib/i18n/routing';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  allDataCards,
  cardCopyright,
  cardImageFile,
  formatCell,
  getDataCard,
  parseCardImageFile,
  type CardLocale,
  type DataCard,
  type DataCardTheme,
} from '@/lib/dataCards';
import { ANTON_ADVANCE } from '@/lib/antonMetrics';
import { WARM, Wordmark, fitSize, loadCardFonts } from '@/lib/cardImage';

// The 1600x900 PNG of a data card, drawn from the same content/data-cards/<slug>.json as its page,
// so the image posted on X and the table on /data/<slug>/ can't disagree. One file per card and
// locale (/data-cards/<slug>.png, .es.png, .pt.png), prerendered at build: only files listed by
// generateStaticParams exist, so the route can't be used to draw arbitrary text under the brand.
//
// Two layouts, both ported from the founder's card sources (Playwright-rendered HTML, 2026-10-21):
// - 'table': the house card. Wordmark masthead, Archivo Black headline, Lora dek, the data in
//   JetBrains Mono, in Warm Studio colours (DESIGN.md v5.0.0).
// - 'venue': the race-week poster (rodeo.html): frame, Anton headline in two colours, a strip of
//   years and the team tallies, in the host's palette. The dot pattern of the original is left out.
//
// next/og takes inline styles only: the Warm Studio colours and the fonts are shared with the Feed
// cards in lib/cardImage.tsx; the host ones are the light-ground flag colours listed in DESIGN.md
// ("Data cards"). Keep them in step with that file.
const PAPER = '#F1E9D8';
const POSTER_INK = '#141414';
const POSTER_MUTED = '#6B6455';
const HOST: Record<DataCardTheme, { ink: string; accent: string }> = {
  usa: { ink: '#0A2A5E', accent: '#BF0A30' },
  mexico: { ink: '#006847', accent: '#CE1126' },
  brazil: { ink: '#002776', accent: '#009C3B' },
  qatar: { ink: '#3A1426', accent: '#8A1538' },
  uae: { ink: '#00632A', accent: '#C8102E' },
};

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return allDataCards().flatMap((card) => routing.locales.map((locale) => ({ file: cardImageFile(card.slug, locale) })));
}

function siteLabel(locale: CardLocale): string {
  return `paddockintel.com${locale === 'en' ? '' : `/${locale}`}/data`;
}

// Largest Anton size (up to `max`) at which the widest of `lines` fits `width` on one line,
// measured with the font's own advance widths (uppercase, as rendered).
function antonFit(lines: string[], width: number, max: number, locale: CardLocale): number {
  const em = Math.max(...lines.map((l) => [...l.toLocaleUpperCase(locale)].reduce((sum, c) => sum + (ANTON_ADVANCE[c] ?? 0.5), 0)));
  return Math.min(max, Math.floor(width / Math.max(em, 1)));
}

function TableCard({ card, locale }: { card: DataCard; locale: CardLocale }) {
  const rowPad = card.rows.length > 4 ? 12 : 16;
  const headline = card.headline[locale];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: WARM.bg,
        color: WARM.text1,
        padding: '64px 90px',
        fontFamily: 'Lora',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: `3px solid ${WARM.text1}`,
          paddingBottom: 16,
        }}
      >
        <Wordmark size={30} dot={WARM.accent} />
        <div style={{ display: 'flex', fontSize: 22, color: WARM.text2 }}>{card.asOf[locale]}</div>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 32,
          fontFamily: 'Archivo Black',
          fontSize: fitSize(headline, 1420, 2, 0.6, 60),
          lineHeight: 1.0,
          letterSpacing: '-0.035em',
        }}
      >
        {headline}
      </div>
      <div style={{ display: 'flex', marginTop: 16, fontSize: 26, lineHeight: 1.4, color: WARM.text2, maxWidth: 1300 }}>
        {card.subtitle[locale]}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 26,
          background: WARM.surface,
          border: `1px solid ${WARM.border}`,
          borderRadius: 24,
          padding: '6px 28px 10px',
        }}
      >
        <div style={{ display: 'flex', padding: '14px 12px', borderBottom: `2px solid ${WARM.border}` }}>
          {card.columns.map((col, i) => (
            <div
              key={col.key}
              style={{
                display: 'flex',
                flex: i === 0 ? 1.5 : 1,
                justifyContent: col.numeric ? 'flex-end' : 'flex-start',
                fontFamily: 'JetBrains Mono',
                fontSize: 16,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: WARM.text2,
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
                borderBottom: r === card.rows.length - 1 ? 'none' : `1px solid ${WARM.borderSubtle}`,
                background: hi ? WARM.accentDim : 'transparent',
                borderRadius: hi ? 12 : 0,
                color: hi ? WARM.accent : WARM.text1,
              }}
            >
              {card.columns.map((col, i) => (
                <div
                  key={col.key}
                  style={{
                    display: 'flex',
                    flex: i === 0 ? 1.5 : 1,
                    justifyContent: col.numeric ? 'flex-end' : 'flex-start',
                    fontFamily: i === 0 ? 'Archivo Black' : 'JetBrains Mono',
                    fontSize: i === 0 ? 26 : col.kind ? 22 : 28,
                  }}
                >
                  {formatCell(row[col.key], col, locale)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          bottom: 40,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 16,
          color: WARM.text2,
        }}
      >
        <div style={{ display: 'flex' }}>{`${card.imageSource[locale]} ${cardCopyright(card)}.`}</div>
        <div style={{ display: 'flex', color: WARM.accent }}>{siteLabel(locale)}</div>
      </div>
    </div>
  );
}

function VenueCard({ card, locale }: { card: DataCard; locale: CardLocale }) {
  const v = card.venue!;
  const { ink, accent } = HOST[card.theme!];
  const fill = (text: string) => text.replace('{years}', v.years).replace('{races}', String(v.races));
  const line1 = v.line1[locale];
  const line2 = v.line2[locale];
  const last = v.strip.length - 1;
  const headSize = antonFit([line1, line2], 1440, 118, locale);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: PAPER,
        color: POSTER_INK,
        fontFamily: 'JetBrains Mono',
      }}
    >
      <div style={{ position: 'absolute', top: 30, left: 30, right: 30, bottom: 30, border: `6px solid ${ink}`, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 80, top: 62, fontSize: 24, letterSpacing: 6, color: ink, display: 'flex' }}>
        {fill(v.place[locale])}
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 104, height: 4, background: accent, display: 'flex' }} />
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 140,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Anton',
          lineHeight: 0.95,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', whiteSpace: 'nowrap', fontSize: headSize, color: ink }}>{line1}</div>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', fontSize: headSize, color: accent }}>{line2}</div>
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 430, display: 'flex', gap: 22 }}>
        {v.strip.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 270,
              borderTop: `10px solid ${i === last ? accent : ink}`,
              paddingTop: 14,
            }}
          >
            <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: 84, lineHeight: 1, color: i === last ? accent : ink }}>{item.label}</div>
            <div style={{ display: 'flex', fontSize: 24, marginTop: 8 }}>{item.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 80, top: 650, display: 'flex', gap: 46, alignItems: 'baseline' }}>
        {v.tallies.map((t) => (
          <div key={t.label} style={{ display: 'flex', fontFamily: 'Anton', fontSize: 60, color: ink }}>
            <span>{t.label}</span>
            <span style={{ color: accent, marginLeft: 16 }}>{t.value}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 58,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 18,
          color: POSTER_MUTED,
        }}
      >
        <div style={{ display: 'flex', maxWidth: 1100 }}>{`${fill(v.footnote[locale])} ${card.imageSource[locale]} ${cardCopyright(card)}.`}</div>
        <div style={{ display: 'flex', color: POSTER_INK }}>
          <Wordmark size={24} dot={accent} />
        </div>
      </div>
    </div>
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const parsed = parseCardImageFile(file);
  const card = parsed ? getDataCard(parsed.slug) : undefined;
  if (!parsed || !card) return new Response('Not found', { status: 404 });

  const origin = new URL(request.url).origin;
  const fonts = await loadCardFonts(origin);

  return new ImageResponse(
    card.layout === 'venue' ? <VenueCard card={card} locale={parsed.locale} /> : <TableCard card={card} locale={parsed.locale} />,
    { width: CARD_WIDTH, height: CARD_HEIGHT, fonts },
  );
}
