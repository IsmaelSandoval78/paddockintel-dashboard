'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function EmailCapture({ className }: { className?: string }) {
  const locale = useLocale();
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
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className={`font-mono text-[11px] uppercase tracking-[0.1em] text-text-1 ${className ?? ''}`}>
        ✓ Subscribed
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex border border-border">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-bg px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 outline-none min-w-0"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="border-l border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-1 hover:bg-red hover:text-bg transition-colors duration-150 disabled:opacity-50 shrink-0"
        >
          {status === 'loading' ? '…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-1 font-mono text-[10px] text-red">Try again</p>
      )}
    </form>
  );
}
