'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

// error.tsx must be a Client Component (Next.js requirement) -- it's the
// boundary that catches unhandled errors thrown while rendering anything
// under app/[locale]/, including Server Components upstream of it.
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] bg-bg flex items-center justify-center px-5 py-20">
      <div className="text-center max-w-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3 mb-5">
          {t('eyebrow')}
        </p>

        <p
          className="leading-none text-terracotta"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(4.5rem, 16vw, 8rem)' }}
        >
          !
        </p>

        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-2 mt-3 mb-7">
          {t('label')}
        </p>

        <p
          className="text-text-2 leading-relaxed mb-9"
          style={{ fontFamily: 'var(--pi-prose)', fontSize: '0.9375rem' }}
        >
          {t('body')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="font-mono text-[11px] uppercase tracking-[0.1em] border border-terracotta bg-terracotta px-5 py-2.5 text-bg hover:opacity-90 transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta focus-visible:outline-offset-2"
          >
            {t('retry')}
          </button>
          <Link
            href="/"
            className="inline-block font-mono text-[11px] uppercase tracking-[0.1em] border border-border px-5 py-2.5 text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta focus-visible:outline-offset-2"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </main>
  );
}
