'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { getAlternateLocaleHref, goToAlternateLocale } from '@/lib/i18n/switchLocale';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // Content with a locale-specific slug (e.g. articles) declares the
    // correct URL via hreflang — use it when present, since swapping just
    // the locale prefix on the current path 404s for that content.
    const alternateHref = getAlternateLocaleHref(next);
    if (alternateHref) {
      goToAlternateLocale(next, alternateHref);
      return;
    }
    // Preserve current search params (e.g. ?c=6 for selected circuit)
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: next });
  }

  return (
    <div className="flex items-center gap-2">
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-2">
          {i > 0 && <span className="font-mono text-xs text-text-3">·</span>}
          <button
            onClick={() => switchLocale(loc)}
            disabled={locale === loc}
            className={[
              'font-mono text-[11px] tracking-[0.06em] uppercase bg-transparent border-none p-0 transition-colors duration-150',
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
  );
}
