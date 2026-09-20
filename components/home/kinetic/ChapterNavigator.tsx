'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const chapters = [
  { id: 'lights-out', key: 'lightsOut' },
  { id: 'last-chapter', key: 'lastChapter' },
  { id: 'next-on-calendar', key: 'nextCalendar' },
  { id: 'season-in-motion', key: 'seasonMotion' },
  { id: 'enter-the-archive', key: 'enterArchive' },
  { id: 'explore-the-archive', key: 'explore' },
] as const;

export default function ChapterNavigator() {
  const t = useTranslations('hub.home.livingArchive');
  const [active, setActive] = useState<string>(chapters[0].id);

  useEffect(() => {
    const sections = chapters
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.35] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:flex flex-col items-end gap-3 px-2 py-3"
      style={{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}
      aria-label={t('navigatorLabel')}
    >
      {chapters.map((chapter, index) => {
        const isActive = active === chapter.id;
        return (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className="group flex items-center gap-3 font-mono uppercase tracking-[0.12em]"
            style={{ color: isActive ? 'var(--terracotta)' : 'var(--text-2)' }}
            aria-current={isActive ? 'location' : undefined}
          >
            <span
              className={`overflow-hidden whitespace-nowrap text-[9px] transition-all duration-300 ${
                isActive ? 'max-w-36 opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100'
              }`}
            >
              {t(`chapters.${chapter.key}`)}
            </span>
            <span className="text-[9px] tabular-nums">0{index + 1}</span>
            <span
              className="block h-px transition-all duration-300"
              style={{
                width: isActive ? '2rem' : '0.75rem',
                background: isActive ? 'var(--terracotta)' : 'var(--border-subtle)',
              }}
            />
          </a>
        );
      })}
    </nav>
  );
}
