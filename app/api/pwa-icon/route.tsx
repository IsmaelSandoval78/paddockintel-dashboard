import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

// Generates the PWA install/home-screen icon at whatever size manifest.ts
// asks for (192 and 512 are the two sizes Chrome/Android actually require
// for installability). Same "PI" mark as app/icon.tsx (the 32px browser-tab
// favicon), just scaled up -- kept as a separate route because next/og
// can't parameterize the file-convention icon.tsx by query string.
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const sizeParam = Number(request.nextUrl.searchParams.get('size'));
  const size = [192, 512].includes(sizeParam) ? sizeParam : 512;

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
          fontSize: size * 0.6875,
          letterSpacing: '-0.03em',
        }}
      >
        <span style={{ color: '#C1502E' }}>P</span>
        <span style={{ color: '#2B2620' }}>I</span>
      </div>
    ),
    { width: size, height: size }
  );
}
