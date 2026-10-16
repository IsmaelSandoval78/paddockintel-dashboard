import { ImageResponse } from 'next/og';

// Favicon, declared in app/layout.tsx's metadata. A route handler at a path with an extension
// rather than the app/icon.tsx convention: that convention's URL (/icon?<hash>) 308s to /icon/
// under trailingSlash, a redirect on every page view; /icon.png answers 200 directly.
export const dynamic = 'force-static';

const size = { width: 32, height: 32 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EDE3D0',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.03em',
        }}
      >
        <span style={{ color: '#C1502E' }}>P</span>
        <span style={{ color: '#2B2620' }}>I</span>
      </div>
    ),
    { ...size }
  );
}
