import { ImageResponse } from 'next/og';

// Site-wide default share image, set as og:image/twitter:image in app/layout.tsx. A route handler
// at a path with an extension instead of the app/opengraph-image.tsx file convention: that
// convention's URL (/opengraph-image?<hash>) 308s to /opengraph-image/ under trailingSlash, and
// paths with a dot skip both the trailing-slash redirect and the middleware matcher, so
// /og-image.png answers 200 directly. Outside /api/, which robots.txt disallows.
export const dynamic = 'force-static';

const size = { width: 1200, height: 630 };

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
          background: '#EDE3D0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontWeight: 900, fontSize: 180, letterSpacing: '-0.04em' }}>
          <span style={{ color: '#C1502E' }}>P</span>
          <span style={{ color: '#2B2620' }}>I</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: '0.08em',
            color: '#2B2620',
          }}
        >
          PADDOCKINTEL
        </div>
      </div>
    ),
    { ...size }
  );
}
