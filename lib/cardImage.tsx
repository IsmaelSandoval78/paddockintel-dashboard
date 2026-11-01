import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Shared by the server-rendered card images (next/og): the data cards (app/data-cards/[file]), and
// the Feed item and article scorecards (app/api/og/feed/..., app/api/og/article/...).
//
// next/og takes inline styles only, so the colours are restated here as hex values: they mirror
// globals.css :root (DESIGN.md v5.0.0, Warm Studio). Keep them in step with that file.
export const WARM = {
  bg: '#EDE7E3',
  surface: '#FFFFFF',
  border: '#DFD8D2',
  borderSubtle: '#E7E1DB',
  text1: '#12303A',
  text2: '#6E7C7E',
  accent: '#1A6B78',
  accentDim: '#DDEEF0',
};

// Fonts (SIL OFL, licences next to the files in public/fonts/cards/).
export const FONT_FILES = {
  Anton: 'Anton-Regular.ttf',
  'Archivo Black': 'ArchivoBlack-Regular.ttf',
  'JetBrains Mono': 'JetBrainsMono-Regular.ttf',
  Lora: 'Lora-Regular.ttf',
} as const;

// Read from disk when a PNG is prerendered at build; on the Cloudflare Worker, where there is no
// filesystem, fetched from the site's own static assets.
async function loadFont(file: string, origin: string): Promise<ArrayBuffer> {
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'fonts', 'cards', file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    const res = await fetch(new URL(`/fonts/cards/${file}`, origin));
    if (!res.ok) throw new Error(`font ${file}: HTTP ${res.status}`);
    return res.arrayBuffer();
  }
}

/** All card fonts, in the shape ImageResponse takes. */
export function loadCardFonts(origin: string) {
  return Promise.all(
    Object.entries(FONT_FILES).map(async ([name, f]) => ({ name, data: await loadFont(f, origin), weight: 400 as const, style: 'normal' as const })),
  );
}

export function Wordmark({ size, dot }: { size: number; dot: string }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'Archivo Black', fontSize: size }}>
      <span>PADDOCK</span>
      <span style={{ color: dot }}>·</span>
      <span>INTEL</span>
    </div>
  );
}

// Headline size that keeps `lines` lines for a font whose average glyph is `em` wide.
export function fitSize(text: string, width: number, lines: number, em: number, max: number): number {
  return Math.min(max, Math.floor((width * lines) / Math.max(1, text.length * em)));
}

export type ScoreStat = { value: string; label: string; unit?: string | null };

// The scorecard: the data cards' house layout for one story (Wordmark masthead with a kicker,
// Archivo Black headline, up to three stats in JetBrains Mono, a footer line), used for the Feed
// item and article images. 1200 wide; taller canvases (900, 1200) give the headline a third line
// and the stats more room.
export function ScoreCard({
  height,
  kicker,
  headline,
  stats,
  footerLeft,
  footerRight,
}: {
  height: number;
  kicker: string;
  headline: string;
  stats: ScoreStat[];
  footerLeft: string;
  footerRight: string;
}) {
  const tall = height >= 900;
  const square = height >= 1200;
  const pad = tall ? 72 : 56;
  const headSize = fitSize(headline, 1200 - 2 * pad, tall ? 3 : 2, 0.62, tall ? 76 : 58);
  // One fixed-width value column so the labels line up; a long value ("350kW to 0") shrinks to fit it
  // (JetBrains Mono glyphs are 0.6em wide).
  const valueCol = tall ? 400 : 340;
  const longest = Math.max(1, ...stats.map((s) => [...s.value].length));
  const valueSize = Math.min(square ? 72 : tall ? 58 : 46, Math.floor(valueCol / (longest * 0.6)));
  const rowPad = square ? 30 : tall ? 22 : height < 675 ? 10 : 14;
  const labelSize = square ? 24 : tall ? 22 : 20;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: WARM.bg,
        color: WARM.text1,
        padding: `${pad - 8}px ${pad}px ${tall ? 40 : 28}px`,
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
          {kicker}
        </div>
      </div>
      {/* Headline and stats share the space between masthead and footer, centred in it. */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            marginTop: tall ? 24 : 16,
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
                    width: valueCol,
                    fontFamily: 'JetBrains Mono',
                    fontSize: valueSize,
                    color: i === 0 ? WARM.accent : WARM.text1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', fontFamily: 'Archivo Black', fontSize: labelSize, letterSpacing: '0.02em' }}>{s.label}</div>
                  {s.unit ? <div style={{ display: 'flex', marginTop: 4, fontSize: labelSize - 1, color: WARM.text2 }}>{s.unit}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 16,
          color: WARM.text2,
        }}
      >
        <div style={{ display: 'flex' }}>{footerLeft}</div>
        <div style={{ display: 'flex', color: WARM.accent }}>{footerRight}</div>
      </div>
    </div>
  );
}
