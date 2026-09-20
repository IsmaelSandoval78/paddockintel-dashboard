'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

const destinations = [
  { key: 'drivers', href: '/drivers', index: '01' },
  { key: 'constructors', href: '/constructors', index: '02' },
  { key: 'circuits', href: '/circuits', index: '03' },
  { key: 'records', href: '/records', index: '04' },
  { key: 'rivalries', href: '/compare', index: '05' },
] as const;

export default function ExploreChapter() {
  const t = useTranslations('hub.home.livingArchive.exploreChapter');

  return (
    <section className="border-t border-border px-5 md:px-10 py-14 md:py-24">
      <div className="grid gap-7 border-b border-border pb-10 md:grid-cols-[1fr_2fr] md:items-end">
        <div>
          <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em]">
            06 / 06 · {t('eyebrow')}
          </p>
          <p className="mt-4 max-w-[29rem] font-prose text-sm md:text-base leading-relaxed text-text-2">
            {t('copy')}
          </p>
        </div>
        <h2
          className="uppercase leading-[0.86] text-[clamp(52px,10vw,150px)]"
          style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.05em' }}
        >
          {t('title')}
        </h2>
      </div>

      <div className="divide-y divide-border">
        {destinations.map((destination) => (
          <Link
            key={destination.key}
            href={destination.href}
            data-cursor
            className="group grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[5rem_1fr_auto] items-center gap-3 py-5 md:py-7"
          >
            <span className="font-mono text-[9px] text-text-3 tabular-nums">{destination.index}</span>
            <span
              className="uppercase leading-none text-[clamp(25px,4.4vw,66px)] transition-transform duration-300 group-hover:translate-x-3"
              style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.035em' }}
            >
              {t(`destinations.${destination.key}.title`)}
            </span>
            <span className="hidden font-prose text-xs text-text-2 md:block md:max-w-[18rem]">
              {t(`destinations.${destination.key}.copy`)}
            </span>
            <span className="font-mono text-lg text-terracotta md:hidden" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
