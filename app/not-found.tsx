// Root-level fallback — catches truly unmatched paths that never resolve into
// a [locale] segment. No next-intl context is available this high up the
// tree, so this stays English-only and uses a plain <a>, not next-intl's
// Link. The one nearly every real visitor hits is app/[locale]/not-found.tsx.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#EDE3D0' }}>
        <main
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 1.25rem',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div style={{ maxWidth: '28rem' }}>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#A69A82',
                marginBottom: '1.25rem',
              }}
            >
              Signal Lost
            </p>
            <p
              style={{
                lineHeight: 1,
                color: '#C1502E',
                fontSize: 'clamp(4.5rem, 16vw, 8rem)',
                fontWeight: 900,
              }}
            >
              404
            </p>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6B5F4E',
                margin: '0.75rem 0 1.75rem',
              }}
            >
              Did Not Finish
            </p>
            <p style={{ color: '#6B5F4E', lineHeight: 1.6, marginBottom: '2.25rem', fontSize: '15px' }}>
              This page retired before the checkered flag. It isn&apos;t on this track.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                fontFamily: 'monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: '1px solid #2B2620',
                padding: '0.625rem 1.25rem',
                color: '#2B2620',
                textDecoration: 'none',
              }}
            >
              Back to the paddock →
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
