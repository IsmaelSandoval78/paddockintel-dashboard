'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'errorInvalid';

export default function EmailCapture({ className, compact }: { className?: string; compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('newsletter');
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
      setStatus(res.ok ? 'success' : res.status === 400 ? 'errorInvalid' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className={`font-mono text-[11px] uppercase tracking-[0.1em] text-text-1 ${className ?? ''}`}>
        {t('success')}
      </p>
    );
  }

  if (compact) {
    return (
      <div className={`relative ${className ?? ''}`}>
        <form onSubmit={handleSubmit} className="soft-card flex items-center h-9 pl-4 pr-1.5 gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            required
            className="w-28 sm:w-40 bg-transparent font-mono text-[11px] text-text-1 placeholder:text-text-3 outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-sm bg-accent text-text-on-accent px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {status === 'loading' ? t('loading') : t('button')}
          </button>
        </form>
        {(status === 'error' || status === 'errorInvalid') && (
          <p className="absolute top-full left-0 mt-1 font-mono text-[10px] text-accent-2 whitespace-nowrap">
            {status === 'errorInvalid' ? t('errorInvalid') : t('error')}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex border border-border">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          required
          className="flex-1 bg-bg px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 outline-none min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta focus-visible:-outline-offset-2"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="border-l border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-1 hover:bg-terracotta hover:text-bg transition-colors duration-150 disabled:opacity-50 shrink-0"
        >
          {status === 'loading' ? t('loading') : t('button')}
        </button>
      </div>
      {(status === 'error' || status === 'errorInvalid') && (
        <p className="mt-1 font-mono text-[10px] text-terracotta">
          {status === 'errorInvalid' ? t('errorInvalid') : t('error')}
        </p>
      )}
      <p className="font-mono text-[10px] text-text-3 mt-2">
        {t.rich('legal', {
          link: (chunks) => (
            <Link href="/privacy" className="underline hover:text-text-1 transition-colors duration-150">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
