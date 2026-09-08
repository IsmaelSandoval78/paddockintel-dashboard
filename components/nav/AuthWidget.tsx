'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { createAuthBrowserClient } from '@/lib/supabase/authBrowserClient';

export type AuthUser = { email: string; name: string | null };

type Status = 'idle' | 'sendingGoogle' | 'sendingLink' | 'linkSent' | 'error';

function initialsOf(user: AuthUser): string {
  const source = (user.name?.trim() || user.email.replace(/@.*/, ''));
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : '';
  return (first + second).toUpperCase() || '?';
}

// Both signInWithOAuth (Google) and signInWithOtp (magic link) redirect back
// through the single server-side callback (app/api/auth/callback/route.ts),
// which needs a `next` path to return the user to where they clicked
// sign-in — read live from the browser rather than next-intl's
// locale-stripped usePathname(), since this only needs a real URL string.
function buildRedirectUrl(): string {
  const next = window.location.pathname + window.location.search;
  return `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
}

export default function AuthWidget({
  user,
  variant = 'desktop',
}: {
  user: AuthUser | null;
  variant?: 'desktop' | 'mobile';
}) {
  const t = useTranslations('auth');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // app/api/auth/callback/route.ts appends ?auth_error=1 to `next` when
  // exchangeCodeForSession() fails (expired/reused code, provider error) —
  // there's no dedicated error page (no design for one yet), so this is the
  // one place that surfaces it. window.location.search, not useSearchParams()
  // from next/navigation — that hook forces the whole route into dynamic
  // rendering unless wrapped in Suspense, and Navbar renders on every page.
  useEffect(() => {
    // Reading window.location on mount, same pattern as lib/useMiBox.ts's
    // ready-flag read: this can't be known during SSR/first render, only
    // after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.search.includes('auth_error=1')) setStatus('error');
  }, []);

  useEffect(() => {
    if (!open || variant !== 'desktop') return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, variant]);

  async function handleGoogle() {
    setStatus('sendingGoogle');
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: buildRedirectUrl() },
    });
    if (error) setStatus('error');
    // On success the browser navigates away to Google — no further state change needed here.
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sendingLink');
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: buildRedirectUrl() },
    });
    setStatus(error ? 'error' : 'linkSent');
  }

  async function handleSignOut() {
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    // Full reload, not router.refresh(): Navbar reads the user server-side
    // from the session cookie on every request, and a reload is the
    // simplest way to guarantee that re-read happens with the now-cleared
    // cookie, matching how the login redirect itself already works.
    window.location.reload();
  }

  const isDesktop = variant === 'desktop';

  const triggerClass = isDesktop
    ? 'font-mono text-[11px] tabular-nums border border-border px-2 py-0.5 text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150'
    : 'flex items-center h-12 px-5 border-b border-border font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 bg-bg w-full text-left';

  const panelClass = isDesktop
    ? 'absolute right-0 top-full mt-2 w-72 bg-surface border border-border z-50'
    : 'w-full bg-surface border-b border-border';

  return (
    <div ref={rootRef} className={isDesktop ? 'relative shrink-0' : 'w-full'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-cursor
        className={triggerClass}
        aria-expanded={open}
      >
        {user ? initialsOf(user) : t('signIn')}
      </button>

      {open && (
        <div className={panelClass} style={{ boxShadow: 'none' }}>
          <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] px-3 py-2 border-b border-border-subtle">
            {user ? t('signedInAs') : t('title')}
          </p>

          {user ? (
            <div className="px-3 py-3">
              <p className="font-mono text-[11px] text-text-1 truncate mb-3">
                {user.name ?? user.email}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3 hover:text-terracotta transition-colors duration-150"
              >
                {t('signOut')}
              </button>
            </div>
          ) : status === 'linkSent' ? (
            <p className="font-mono text-[11px] text-text-1 px-3 py-4">{t('linkSent')}</p>
          ) : (
            <div className="px-3 py-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={status === 'sendingGoogle'}
                className="w-full border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-1 hover:bg-terracotta hover:text-bg hover:border-terracotta transition-colors duration-150 disabled:opacity-50"
              >
                {status === 'sendingGoogle' ? t('sending') : t('google')}
              </button>

              <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em] text-center my-2">
                {t('or')}
              </p>

              <form onSubmit={handleMagicLink} className="flex border border-border">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  className="flex-1 bg-bg px-2 py-1.5 font-mono text-[12px] text-text-1 placeholder:text-text-3 outline-none min-w-0"
                />
                <button
                  type="submit"
                  disabled={status === 'sendingLink'}
                  className="border-l border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-text-1 hover:bg-terracotta hover:text-bg transition-colors duration-150 disabled:opacity-50 shrink-0"
                >
                  {status === 'sendingLink' ? t('sending') : t('sendLink')}
                </button>
              </form>

              {status === 'error' && (
                <p className="mt-2 font-mono text-[10px] text-terracotta">{t('error')}</p>
              )}

              <p className="font-mono text-[10px] text-text-3 mt-3">
                {t.rich('legal', {
                  link: (chunks) => (
                    <Link
                      href="/privacy"
                      className="underline hover:text-text-1 transition-colors duration-150"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
