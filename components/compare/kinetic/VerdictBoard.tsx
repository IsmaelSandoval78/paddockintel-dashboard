'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';

gsap.registerPlugin(ScrollTrigger);

export type VerdictMetric = {
  label: string;
  a: number;
  b: number;
  aDisplay?: string;
  bDisplay?: string;
};

// Mirrored bars grow from the center axis; the winner of each metric keeps
// full-strength color and scores one point on the running tally up top.
export default function VerdictBoard({
  metrics,
  aLabel,
  bLabel,
  aColor,
  bColor,
  pairKey,
  motionOk,
  index,
}: {
  metrics: VerdictMetric[];
  aLabel: string;
  bLabel: string;
  aColor: string;
  bColor: string;
  pairKey: string;
  motionOk: boolean;
  index: string;
}) {
  const t = useTranslations('compare.verdict');
  const rootRef = useRef<HTMLElement>(null);

  let tallyA = 0;
  let tallyB = 0;
  for (const m of metrics) {
    if (m.a > m.b) tallyA++;
    else if (m.b > m.a) tallyB++;
  }

  useEffect(() => {
    if (!motionOk || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.verdict-bar-a', {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.9,
        stagger: 0.07,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      gsap.from('.verdict-bar-b', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.9,
        stagger: 0.07,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      gsap.utils.toArray<HTMLElement>('.verdict-tally').forEach((el) => {
        const target = Number(el.dataset.val ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate() { el.textContent = String(Math.round(obj.v)); },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, pairKey]);

  if (!metrics.length) return null;

  return (
    <section ref={rootRef} className="border-b border-border" aria-label={t('title')}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          {index} · {t('title')}
        </span>
        <InfoTooltip text={t('info')} />
      </div>

      {/* Running tally */}
      <div className="flex items-baseline justify-center gap-4 md:gap-6 px-5 pt-4 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: aColor }}>
          {aLabel}
        </span>
        <span
          className="verdict-tally tabular-nums leading-none"
          data-val={tallyA}
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(34px, 4.5vw, 60px)', letterSpacing: '-0.03em', color: aColor }}
        >
          {tallyA}
        </span>
        <span className="font-mono text-[14px] text-text-3">—</span>
        <span
          className="verdict-tally tabular-nums leading-none"
          data-val={tallyB}
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(34px, 4.5vw, 60px)', letterSpacing: '-0.03em', color: bColor }}
        >
          {tallyB}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: bColor }}>
          {bLabel}
        </span>
      </div>

      {/* Mirrored metric rows */}
      <div className="px-5 pb-6 pt-2">
        {metrics.map((m) => {
          const max = Math.max(m.a, m.b, 1);
          const aWins = m.a > m.b;
          const bWins = m.b > m.a;
          return (
            <div key={m.label} className="grid grid-cols-[1fr_120px_1fr] md:grid-cols-[1fr_144px_1fr] items-center h-11 border-b border-border-subtle last:border-b-0">
              {/* A: value + bar anchored to center */}
              <div className="flex items-center justify-end gap-3 min-w-0">
                <span
                  className={`font-mono text-[13px] tabular-nums shrink-0 ${aWins ? '' : 'text-text-2'}`}
                  style={aWins ? { color: aColor } : undefined}
                >
                  {m.aDisplay ?? m.a}
                </span>
                <div className="relative h-[3px] flex-1 max-w-[260px]">
                  <div
                    className="verdict-bar-a absolute right-0 top-0 bottom-0"
                    style={{
                      width: `${((m.a / max) * 100).toFixed(1)}%`,
                      background: aColor,
                      opacity: aWins ? 1 : 0.3,
                    }}
                  />
                </div>
              </div>

              <span className="font-mono text-[9px] md:text-[10px] text-text-3 uppercase tracking-[0.1em] text-center px-2 truncate">
                {m.label}
              </span>

              {/* B: bar anchored to center + value */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-[3px] flex-1 max-w-[260px]">
                  <div
                    className="verdict-bar-b absolute left-0 top-0 bottom-0"
                    style={{
                      width: `${((m.b / max) * 100).toFixed(1)}%`,
                      background: bColor,
                      opacity: bWins ? 1 : 0.3,
                    }}
                  />
                </div>
                <span
                  className={`font-mono text-[13px] tabular-nums shrink-0 ${bWins ? '' : 'text-text-2'}`}
                  style={bWins ? { color: bColor } : undefined}
                >
                  {m.bDisplay ?? m.b}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
