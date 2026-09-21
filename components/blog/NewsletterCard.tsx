'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

export default function NewsletterCard() {
  const t = useTranslations('newsletter');
  const locale = useLocale();
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
    <aside className="my-10 glass-panel p-8 relative overflow-hidden">
      <div className="mesh-glow absolute inset-0 pointer-events-none" aria-hidden />
      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-3 mb-2">
          {t('kicker')}
        </p>
        <p className="font-sans font-semibold text-text-1 tracking-[-0.01em] leading-tight mb-4" style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)' }}>
          {t('headline')}
        </p>

        {status === 'success' ? (
          <p className="font-mono text-[12px] text-green">
            {t('success')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              required
              className="flex-1 min-w-0 h-10 px-3.5 rounded-sm font-sans text-[13px] text-text-1 bg-surface border border-border placeholder:text-text-3 focus:outline-none focus:border-accent transition-colors duration-150"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="h-10 px-5 rounded-sm font-sans text-[13px] font-medium text-text-on-accent bg-accent hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 shrink-0"
            >
              {status === 'loading' ? t('loading') : t('button')}
            </button>
          </form>
        )}

        {(status === 'error' || status === 'errorInvalid') && (
          <p className="font-mono text-[11px] text-accent mt-2">
            {status === 'errorInvalid' ? t('errorInvalid') : t('error')}
          </p>
        )}

        <p className="font-mono text-[10px] text-text-3 mt-3">
          {t.rich('legal', {
            link: (chunks) => (
              <Link href="/privacy" className="underline hover:text-text-1 transition-colors duration-150">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </aside>
  );
}
