'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';

gsap.registerPlugin(ScrollTrigger);

export default function ArchiveThreshold({ year, motionOk }: { year: number; motionOk: boolean }) {
  const t = useTranslations('hub.home.livingArchive.archive');
  const rootRef = useRef<HTMLElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionOk || !yearRef.current) return;
    const counter = { year };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        year: 1950,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 72%',
          end: 'bottom 42%',
          scrub: 0.8,
        },
        onUpdate: () => {
          if (yearRef.current) yearRef.current.textContent = String(Math.round(counter.year));
        },
      });
      gsap.fromTo(lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'right',
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 72%', end: 'bottom 42%', scrub: 0.8 },
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, year]);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden min-h-[78svh] px-5 md:px-10 py-14 md:py-20 flex flex-col justify-between"
      style={{ background: 'var(--navy)', color: 'var(--text-on-accent)' }}
    >
      <div className="flex items-center justify-between font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-text-2-on-accent">
        <span>05 / 06 · {t('eyebrow')}</span>
        <span>{t('range', { year })}</span>
      </div>

      <div className="relative my-14">
        <p className="font-prose text-sm md:text-base text-text-2-on-accent max-w-[34rem] leading-relaxed">
          {t('copy')}
        </p>
        <div className="mt-7 flex items-end gap-3 md:gap-6">
          <span
            ref={yearRef}
            className="block tabular-nums leading-[0.78] text-[clamp(96px,25vw,360px)]"
            style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.07em' }}
          >
            {motionOk ? year : 1950}
          </span>
          <span className="mb-2 md:mb-5 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-text-2-on-accent">
            {t('origin')}
          </span>
        </div>
        <div ref={lineRef} className="mt-7 h-px bg-terracotta" />
      </div>

      <div className="flex flex-col gap-5 border-t border-border-on-accent pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="uppercase leading-[0.9] text-[clamp(34px,6vw,82px)]"
            style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.04em' }}
          >
            {t('title')}
          </h2>
          <p className="mt-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-text-2-on-accent">
            {t('support', { seasons: year - 1949 })}
          </p>
        </div>
        <Link
          href="/archive"
          data-cursor
          className="group inline-flex items-center justify-between gap-8 border border-border-on-accent px-5 py-4 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors hover:border-terracotta hover:bg-terracotta"
        >
          {t('cta')}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}
