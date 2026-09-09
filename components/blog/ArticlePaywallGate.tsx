'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { Link } from '@/lib/i18n/navigation';

type Status = 'idle' | 'loading' | 'success' | 'error';

// Free registration wall: reader gives an email (POST /api/subscribe, which
// sets the pi_subscribed cookie on success), then router.refresh() re-runs
// the article page's server component — it reads the now-present cookie and
// renders past the cut this time. No client-side content to reveal/hide;
// the gated markdown was never sent to the browser in the first place.
export default function ArticlePaywallGate() {
  const t = useTranslations('articlePaywall');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (res.ok) {
        setStatus('success');
        router.refresh();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="relative mt-2 mb-10 pt-16 border-t border-border-subtle">
      {/* Fade suggesting there's more above, purely decorative — no gated
          content actually lives in the DOM above this. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="border border-border bg-surface-raised px-6 py-8 text-center max-w-md mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-3 mb-2">
          {t('kicker')}
        </p>
        <p className="font-display text-[clamp(1.1rem,2.4vw,1.4rem)] uppercase text-text-1 tracking-[-0.02em] leading-tight mb-2">
          {t('headline')}
        </p>
        <p className="font-prose text-sm text-text-2 mb-5">
          {t('body')}
        </p>

        {status === 'success' ? (
          <p className="font-mono text-[12px] text-green">{t('success')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-0 text-left">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              required
              className="flex-1 min-w-0 h-10 px-3 font-mono text-[13px] text-text-1 bg-bg border border-border border-r-0 placeholder:text-text-3 focus:outline-none focus:border-terracotta transition-colors duration-150"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="h-10 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-bg bg-text-1 border border-text-1 hover:bg-terracotta hover:border-terracotta transition-colors duration-150 disabled:opacity-50 shrink-0"
            >
              {status === 'loading' ? t('loading') : t('button')}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="font-mono text-[11px] text-terracotta mt-2">{t('error')}</p>
        )}

        <p className="font-mono text-[10px] text-text-3 mt-4">
          {t.rich('legal', {
            link: (chunks) => (
              <Link href="/privacy" className="underline hover:text-text-1 transition-colors duration-150">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
