'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

// Same /api/subscribe flow (and the same consent/legal line) as components/blog/NewsletterCard.tsx,
// in the dusk band layout.
export default function NewsletterBand() {
  const t = useTranslations('homeDusk.newsletter');
  const tn = useTranslations('newsletter');
  const locale = useLocale();
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'errorInvalid'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      setStatus(res.ok ? 'success' : res.status === 400 ? 'errorInvalid' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="dusk-newsletter p-6 sm:p-8 flex flex-wrap gap-5 items-center justify-between">
      <div className="flex-[1_1_360px] min-w-0">
        <h2 className="dusk-display text-[1.6rem] sm:text-[1.9rem] leading-tight">{t('title')}</h2>
        <p className="mt-2 text-[16px] text-[#F1DFD6]">{t('body')}</p>
      </div>
      <div className="flex-[1_1_360px] min-w-0">
        {status === 'success' ? (
          <p className="dusk-mono text-[13px] text-white" role="status">
            {tn('success')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5">
            <label htmlFor={inputId} className="sr-only">
              {t('emailLabel')}
            </label>
            <input
              id={inputId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tn('placeholder')}
              required
              autoComplete="email"
              className="flex-[1_1_200px] min-w-0 min-h-[48px] px-4 rounded-full border border-white/35 bg-[rgba(13,14,18,0.45)] text-white text-[15px] placeholder:text-[#D9C9C1]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="dusk-pill min-h-[48px] border-0 text-[15px] cursor-pointer disabled:opacity-60"
            >
              {status === 'loading' ? tn('loading') : tn('button')}
            </button>
          </form>
        )}
        {(status === 'error' || status === 'errorInvalid') && (
          <p className="dusk-mono mt-2 text-[12px] text-white" role="alert">
            {status === 'errorInvalid' ? tn('errorInvalid') : tn('error')}
          </p>
        )}
        <p className="dusk-mono mt-3 text-[11px] text-[#E8D6CC]">
          {tn.rich('legal', {
            link: (chunks) => (
              <Link href="/privacy" className="underline hover:text-white">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </section>
  );
}
