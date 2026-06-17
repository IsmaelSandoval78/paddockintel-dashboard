'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamColor } from './teamColors';
import type { HomeStreaksData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface StreaksSectionProps {
  data: HomeStreaksData | null;
  motionOk: boolean;
}

export default function StreaksSection({ data, motionOk }: StreaksSectionProps) {
  const t = useTranslations('hub.home');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOk || !data) return;
    const ctx = gsap.context(() => {
      gsap.from('.streak-cell', {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
      });

      gsap.utils.toArray<HTMLElement>('.streak-num').forEach((el) => {
        const target = Number(el.dataset.val ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate() { el.textContent = String(Math.round(obj.v)); },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, data]);

  if (!data) return null;

  const cells: Array<{ label: string; sub: string; value: number; color?: string; active: boolean }> = [];

  if (data.driverActive) {
    cells.push({
      label: `${t('streakDrivers').toUpperCase()} · ${t('streakActive').toUpperCase()}`,
      sub: data.driverActive.surname.toUpperCase(),
      value: data.driverActive.streak,
      color: teamColor(data.driverActive.constructor_ref),
      active: true,
    });
  }
  if (data.constructorActive) {
    cells.push({
      label: `${t('streakConstructors').toUpperCase()} · ${t('streakActive').toUpperCase()}`,
      sub: data.constructorActive.name.toUpperCase(),
      value: data.constructorActive.streak,
      color: teamColor(data.constructorActive.constructor_ref),
      active: true,
    });
  }
  if (data.driverAllTime) {
    cells.push({
      label: `${t('streakDrivers').toUpperCase()} · ${t('streakAllTime').toUpperCase()}`,
      sub: `${data.driverAllTime.surname.toUpperCase()} · ${data.driverAllTime.year}`,
      value: data.driverAllTime.streak,
      active: false,
    });
  }
  if (data.constructorAllTime) {
    cells.push({
      label: `${t('streakConstructors').toUpperCase()} · ${t('streakAllTime').toUpperCase()}`,
      sub: `${data.constructorAllTime.name.toUpperCase()} · ${data.constructorAllTime.year}`,
      value: data.constructorAllTime.streak,
      active: false,
    });
  }

  if (cells.length === 0) return null;

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16">
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-8 md:mb-10">
        {t('streaks').toUpperCase()}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
        {cells.map((c, i) => (
          <div key={i} className="streak-cell flex flex-col px-4 md:px-6 py-6 md:py-8" style={{ background: 'var(--bg)' }}>
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mb-4 leading-relaxed">
              {c.label}
            </span>
            <span
              className="streak-num tabular-nums leading-none"
              data-val={c.value}
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(48px, 8vw, 110px)',
                letterSpacing: '-0.04em',
                color:         c.active ? (c.color ?? 'var(--text-1)') : 'var(--text-1)',
              }}
            >
              {c.value}
            </span>
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.12em] mt-2">
              {t('streakConsecutive').toUpperCase()}
            </span>
            <span
              className="uppercase mt-4 leading-none truncate"
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(13px, 1.6vw, 18px)', letterSpacing: '-0.01em' }}
            >
              {c.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
