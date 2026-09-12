import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
