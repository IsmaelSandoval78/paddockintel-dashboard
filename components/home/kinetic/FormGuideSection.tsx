'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamColor } from './teamColors';
import type { HomeFormGuideData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface FormGuideSectionProps {
  data: HomeFormGuideData;
  motionOk: boolean;
}

export default function FormGuideSection({ data, motionOk }: FormGuideSectionProps) {
  const t = useTranslations('hub.home');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.from('.fg-cell', {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('.fg-num').forEach((el) => {
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
  }, [motionOk]);

  if (!data.podiumStreak && !data.fastestLapStreak) return null;

  const cells: Array<{ label: string; sub: string; value: number; color: string }> = [];

  if (data.podiumStreak) {
    cells.push({
      label: `${t('fgPodiums')} · ${t('streakActive').toUpperCase()}`,
      sub: data.podiumStreak.surname.toUpperCase(),
      value: data.podiumStreak.streak,
      color: teamColor(data.podiumStreak.constructor_ref),
    });
  }
  if (data.fastestLapStreak) {
    cells.push({
      label: `${t('fgFastestLaps')} · ${t('streakActive').toUpperCase()}`,
      sub: data.fastestLapStreak.surname.toUpperCase(),
      value: data.fastestLapStreak.streak,
      color: teamColor(data.fastestLapStreak.constructor_ref),
    });
  }

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16">
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-8 md:mb-10">
        {t('fgTitle').toUpperCase()}
      </p>

      <div
        className="grid gap-px"
        style={{
          background: 'var(--border)',
          gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            className="fg-cell flex flex-col px-4 md:px-6 py-6 md:py-8"
            style={{ background: 'var(--bg)' }}
          >
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mb-4 leading-relaxed">
              {c.label}
            </span>
            <span
              className="fg-num tabular-nums leading-none"
              data-val={c.value}
              style={{
                fontFamily: 'var(--pi-display)',
                fontSize: 'clamp(48px, 8vw, 110px)',
                letterSpacing: '-0.04em',
                color: c.color,
              }}
            >
              {c.value}
            </span>
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.12em] mt-2">
              {t('fgConsecutive').toUpperCase()}
            </span>
            <span
              className="uppercase mt-4 leading-none truncate"
              style={{
                fontFamily: 'var(--pi-display)',
                fontSize: 'clamp(13px, 1.6vw, 18px)',
                letterSpacing: '-0.01em',
              }}
            >
              {c.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
