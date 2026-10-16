import { ImageResponse } from 'next/og';

// Default share image for the Hub (hub.paddockintel.com), set as og:image/twitter:image on Hub
// pages through lib/seo.ts. The magazine keeps app/og-image.png/route.tsx. Same reasoning as that
// route for the path: an extension skips the trailing-slash redirect and the middleware matcher,
// so /og-hub.png answers 200 directly. Colors are DESIGN.md v5.0.0 Warm Studio, the palette the
// Hub runs on (--bg, --text-1, --text-2, --accent); ImageResponse takes literal values, not CSS
// variables.
export const dynamic = 'force-static';

const size = { width: 1200, height: 630 };
const BG = '#EDE7E3';
const INK = '#12303A';
const MUTED = '#6E7C7E';
const ACCENT = '#1A6B78';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontWeight: 900, fontSize: 180, letterSpacing: '-0.04em' }}>
          <span style={{ color: ACCENT }}>P</span>
          <span style={{ color: INK }}>I</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, fontSize: 44, letterSpacing: '0.08em' }}>
          <span style={{ fontWeight: 700, color: INK }}>PADDOCKINTEL</span>
          <span
            style={{
              marginLeft: 20,
              padding: '6px 18px',
              borderRadius: 12,
              background: ACCENT,
              color: BG,
              fontWeight: 700,
            }}
          >
            HUB
          </span>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 30, letterSpacing: '0.04em', color: MUTED }}>
          hub.paddockintel.com
        </div>
      </div>
    ),
    { ...size }
  );
}
