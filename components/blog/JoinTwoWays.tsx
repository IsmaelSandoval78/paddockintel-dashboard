'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createAuthBrowserClient } from '@/lib/supabase/authBrowserClient';
import EmailCapture from '@/components/ui/EmailCapture';

// The two ways to join magazine-home already exist separately — EmailCapture
// (registration wall) and the Google path from AuthWidget. The full card
// still offers both. Compact mode is the masthead: newsletter only, so the
// page has one primary CTA above the fold. Google stays in the header
// Sign-in control (AuthWidget), which already runs the same OAuth redirect.
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

  // Compact mode — masthead placement: the newsletter is the only control.
  // Full width below md so the field isn't clipped; inline on the right from
  // md up. Legal text stays in the sitewide footer.
  if (compact) {
    return (
      <div className={`relative w-full min-w-0 md:w-auto md:shrink-0 ${className ?? ''}`}>
        <EmailCapture compact />
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
