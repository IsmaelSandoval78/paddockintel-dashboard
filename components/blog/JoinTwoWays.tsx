'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createAuthBrowserClient } from '@/lib/supabase/authBrowserClient';
import EmailCapture from '@/components/ui/EmailCapture';

// The two ways to join magazine-home already exist separately — EmailCapture
// (registration wall) and the Google path from AuthWidget — this just puts
// them side by side, matching the "join two ways" pattern from AI Weekly's
// home. Google button has its own small handler rather than reusing
// AuthWidget directly: that component is built as a nav dropdown trigger,
// not an always-open inline block, and the two use sites don't share enough
// to justify extracting a shared button yet.
export default function JoinTwoWays({ className }: { className?: string }) {
  const t = useTranslations('magazine.join');
  const tAuth = useTranslations('auth');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  async function handleGoogle() {
    setStatus('sending');
    const supabase = createAuthBrowserClient();
    const next = window.location.pathname + window.location.search;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setStatus('error');
  }

  return (
    <div className={`border border-border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border ${className ?? ''}`}>
      <div className="p-5">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-1">{t('emailTitle')}</p>
        <p className="text-[13px] text-text-2 mb-4">{t('emailSub')}</p>
        <EmailCapture />
      </div>
      <div className="p-5 flex flex-col">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-1">{t('accountTitle')}</p>
        <p className="text-[13px] text-text-2 mb-4">{t('accountSub')}</p>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={status === 'sending'}
          className="w-full border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-1 hover:bg-terracotta hover:text-bg hover:border-terracotta transition-colors duration-150 disabled:opacity-50"
        >
          {status === 'sending' ? tAuth('sending') : tAuth('google')}
        </button>
        {status === 'error' && <p className="mt-2 font-mono text-[10px] text-terracotta">{tAuth('error')}</p>}
        <p className="font-mono text-[10px] text-text-3 mt-auto pt-4">
          {tAuth.rich('legal', {
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
