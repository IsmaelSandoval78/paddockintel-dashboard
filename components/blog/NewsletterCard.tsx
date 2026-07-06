'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

export default function NewsletterCard() {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <aside className="my-10 border border-border-subtle bg-surface-raised px-6 py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-3 mb-2">
        PADDOCKINTEL DIGEST
      </p>
      <p className="font-display text-[clamp(1rem,2.2vw,1.3rem)] uppercase text-text-1 tracking-[-0.02em] leading-tight mb-4">
        F1 economics weekly, in your inbox.
      </p>

      {status === 'success' ? (
        <p className="font-mono text-[12px] text-green">
          {t('success')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-0">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            required
            className="flex-1 min-w-0 h-9 px-3 font-mono text-[12px] text-text-1 bg-bg border border-border-subtle border-r-0 placeholder:text-text-3 focus:outline-none focus:border-text-1 transition-colors duration-150"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-9 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-bg bg-text-1 border border-text-1 hover:bg-red hover:border-red transition-colors duration-150 disabled:opacity-50 shrink-0"
          >
            {status === 'loading' ? t('loading') : t('button')}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="font-mono text-[11px] text-red mt-2">{t('error')}</p>
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
    </aside>
  );
}
