'use client';

import { useEffect } from 'react';

// global-error.tsx replaces the ENTIRE root layout when an error escapes
// app/[locale]/error.tsx's boundary (e.g. an error in the root layout
// itself), so it must render its own <html>/<body> -- same reasoning as
// app/not-found.tsx. No next-intl context is available this high up the
// tree, so this stays English-only. Must be a Client Component and must
// render its own full document (Next.js requirement for global-error).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

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
              System Fault
            </p>
            <p
              style={{
                lineHeight: 1,
                color: '#C1502E',
                fontSize: 'clamp(4.5rem, 16vw, 8rem)',
                fontWeight: 900,
              }}
            >
              !
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
              Mechanical Retirement
            </p>
            <p style={{ color: '#6B5F4E', lineHeight: 1.6, marginBottom: '2.25rem', fontSize: '15px' }}>
              Something broke on our end mid-lap.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  border: '1px solid #C1502E',
                  background: '#C1502E',
                  padding: '0.625rem 1.25rem',
                  color: '#EDE3D0',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
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
                Back to the paddock
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
