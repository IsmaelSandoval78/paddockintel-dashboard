import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
