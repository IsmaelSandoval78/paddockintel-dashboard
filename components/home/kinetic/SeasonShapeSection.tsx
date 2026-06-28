'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { HomeSeasonShapeData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface SeasonShapeSectionProps {
  data: HomeSeasonShapeData;
  motionOk: boolean;
}

export default function SeasonShapeSection({ data, motionOk }: SeasonShapeSectionProps) {
  const t = useTranslations('hub.home');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.from('.ss-cell', {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('.ss-num').forEach((el) => {
        const target = Number(el.dataset.val ?? 0);
        const isFloat = el.dataset.float === '1';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate() {
            el.textContent = isFloat
              ? Math.round(obj.v) + '%'
              : String(Math.round(obj.v));
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  const cells = [
    {
      label: t('ssWinners').toUpperCase(),
      value: data.uniqueWinners,
      suffix: '',
      sub: `${t('ssWinnersSub')} ${data.totalRaces} ${t('ssRaces')}`.toUpperCase(),
      isFloat: false,
    },
    {
      label: t('ssPoleWin').toUpperCase(),
      value: data.poleToWinPct,
      suffix: '%',
      sub: t('ssPoleWinSub').toUpperCase(),
      isFloat: true,
    },
    {
      label: t('ssLeaderRounds').toUpperCase(),
      value: data.roundsLedByLeader,
      suffix: '',
      sub: data.leaderSurname.toUpperCase(),
      isFloat: false,
    },
  ];

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16">
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-8 md:mb-10">
        {t('ssTitle').toUpperCase()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
        {cells.map((c, i) => (
          <div
            key={i}
            className="ss-cell flex flex-col px-4 md:px-6 py-6 md:py-8"
            style={{ background: 'var(--bg)' }}
          >
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mb-4 leading-relaxed">
              {c.label}
            </span>
            <span
              className="ss-num tabular-nums leading-none"
              data-val={c.value}
              data-float={c.isFloat ? '1' : '0'}
              style={{
                fontFamily: 'var(--pi-display)',
                fontSize: 'clamp(48px, 8vw, 110px)',
                letterSpacing: '-0.04em',
                color: 'var(--text-1)',
              }}
            >
              {c.isFloat ? `${c.value}%` : c.value}
            </span>
            <span
              className="uppercase mt-4 leading-none font-mono text-[8px] text-text-3 tracking-[0.12em]"
            >
              {c.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
