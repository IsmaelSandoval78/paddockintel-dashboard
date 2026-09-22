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
export default function JoinTwoWays({ className, compact }: { className?: string; compact?: boolean }) {
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

  // Compact mode — hero-bar placement: both join paths shrink to inline pill
  // controls next to the headline, no cards, no legal text (still linked from
  // the sitewide footer). The full card layout below stays the default for
  // any other placement.
  if (compact) {
    return (
      <div className={`relative flex items-center gap-2 shrink-0 ${className ?? ''}`}>
        <EmailCapture compact />
        <button
          type="button"
          onClick={handleGoogle}
          disabled={status === 'sending'}
          className="soft-card h-9 px-4 font-sans text-[11px] font-semibold text-text-1 hover:text-accent transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'sending' ? tAuth('sending') : tAuth('google')}
        </button>
        {status === 'error' && (
          <p className="absolute top-full right-0 mt-1 font-mono text-[10px] text-accent-2 whitespace-nowrap">
            {tAuth('error')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className ?? ''}`}>
      <div className="soft-card soft-card-interactive p-6">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-1">{t('emailTitle')}</p>
        <p className="text-[13px] text-text-2 mb-4">{t('emailSub')}</p>
        <EmailCapture />
      </div>
      <div className="soft-card soft-card-interactive p-6 flex flex-col">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-1">{t('accountTitle')}</p>
        <p className="text-[13px] text-text-2 mb-4">{t('accountSub')}</p>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={status === 'sending'}
          className="w-full rounded-sm border border-border px-3 py-2.5 font-sans text-[13px] font-medium text-text-1 hover:bg-accent hover:text-text-on-accent hover:border-accent transition-colors duration-150 disabled:opacity-50"
        >
          {status === 'sending' ? tAuth('sending') : tAuth('google')}
        </button>
        {status === 'error' && <p className="mt-2 font-mono text-[10px] text-accent-2">{tAuth('error')}</p>}
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
