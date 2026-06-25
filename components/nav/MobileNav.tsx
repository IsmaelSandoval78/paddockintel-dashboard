'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, Link, useRouter } from '@/lib/i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '@/lib/i18n/routing';

type NavKey = 'hub' | 'circuits' | 'drivers' | 'constructors' | 'compare';

const links: { key: NavKey; href: string }[] = [
  { key: 'hub',          href: '/' },
  { key: 'circuits',     href: '/circuits' },
  { key: 'drivers',      href: '/drivers' },
  { key: 'constructors', href: '/constructors' },
  { key: 'compare',      href: '/compare' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  function switchLocale(next: string) {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: next });
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="h-12 px-5 flex items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">PADDOCK</span>
          <span className="font-sans font-bold text-sm text-red">·</span>
          <span className="font-sans font-bold text-sm tracking-wider text-text-1">INTEL</span>
        </Link>

        {/* Hamburger — 3 straight lines, no border-radius */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex flex-col justify-center gap-[5px] w-8 h-8 bg-transparent border-0 p-0 cursor-pointer shrink-0"
        >
          <span className="block w-5 bg-text-1" style={{ height: '1.5px', borderRadius: 0 }} />
          <span className="block w-5 bg-text-1" style={{ height: '1.5px', borderRadius: 0 }} />
          <span className="block w-5 bg-text-1" style={{ height: '1.5px', borderRadius: 0 }} />
        </button>
      </div>

      {/* ── Dropdown ─────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border" style={{ borderRadius: 0 }}>
          {links.map(({ key, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={[
                  'flex items-center h-12 px-5 border-b border-border',
                  'font-mono text-[11px] uppercase tracking-[0.1em]',
                  isActive ? 'text-red bg-surface-raised' : 'text-text-2 bg-bg',
                ].join(' ')}
              >
                {t(key)}
              </Link>
            );
          })}

          {/* Vol/Rd + locale footer row */}
          <div className="h-12 px-5 flex items-center justify-between bg-bg">
            <span className="font-mono text-[11px] text-text-3 tracking-[0.04em]">
              Vol.01 · Rd.09 · 2026
            </span>
            <div className="flex items-center gap-2">
              {routing.locales.map((loc, i) => (
                <span key={loc} className="flex items-center gap-2">
                  {i > 0 && <span className="font-mono text-[11px] text-text-3">·</span>}
                  <button
                    onClick={() => switchLocale(loc)}
                    disabled={locale === loc}
                    className={[
                      'font-mono text-[11px] tracking-[0.06em] uppercase bg-transparent border-none p-0',
                      locale === loc
                        ? 'text-text-1 cursor-default'
                        : 'text-text-3 cursor-pointer hover:text-text-2',
                    ].join(' ')}
                  >
                    {loc.toUpperCase()}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
