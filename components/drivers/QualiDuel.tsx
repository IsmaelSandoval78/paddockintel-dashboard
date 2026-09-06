'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamColor } from '@/components/home/kinetic/teamColors';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';
import type { QualiDuelPair } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

function formatGap(ms: number): string {
  return `Δ ${(Math.abs(ms) / 1000).toFixed(3)}s`;
}

export default function QualiDuel({
  duels,
  motionOk,
}: {
  duels: QualiDuelPair[];
  motionOk: boolean;
}) {
  const t = useTranslations('drivers.duel');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOk || !rootRef.current || !duels.length) return;
    const ctx = gsap.context(() => {
      // The split starts even and opens to the real score — the gap opening, in quali trim
      gsap.utils.toArray<HTMLElement>('.duel-bar-a').forEach((el) => {
        gsap.fromTo(
          el,
          { width: '50%' },
          {
            width: el.dataset.pct + '%',
            duration: 1.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          }
        );
      });
      gsap.from('.duel-row', {
        y: 16,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 88%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, duels.length]);

  if (!duels.length) return null;

  return (
    <section ref={rootRef} className="border-t border-border" aria-label={t('title')}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          03 · {t('title')}
        </span>
        <InfoTooltip text={t('info')} />
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto hidden md:block">
          {t('note')}
        </span>
      </div>

      <div>
        {duels.map((d) => {
          const color = teamColor(d.constructor_ref);
          const total = d.a.score + d.b.score;
          const aPct = (d.a.score / total) * 100;
          const gapMs = d.avg_gap_ms;
          const fasterCode =
            gapMs === null
              ? null
              : gapMs >= 0
                ? (d.a.code ?? d.a.surname.slice(0, 3).toUpperCase())
                : (d.b.code ?? d.b.surname.slice(0, 3).toUpperCase());
          return (
            <div key={d.constructor_id} className="duel-row px-5 py-3 border-b border-border-subtle last:border-b-0">
              {/* Top line: team + avg gap */}
              <div className="flex items-baseline mb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color }}>
                  {d.constructor_name}
                </span>
                {gapMs !== null && (
                  <span
                    className="font-mono text-[10px] tabular-nums ml-auto"
                    style={{ color: 'var(--terracotta)' }}
                    title={t('gapTitle')}
                  >
                    {fasterCode} {formatGap(gapMs)}
                  </span>
                )}
              </div>

              {/* Duel line: name — score — bar — score — name */}
              <div className="flex items-center gap-3 md:gap-4">
                <span
                  className="uppercase text-[13px] leading-none w-24 md:w-36 truncate"
                  style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.01em', color: 'var(--text-1)' }}
                >
                  {d.a.surname}
                </span>
                <span
                  className="tabular-nums text-[18px] leading-none w-7 text-right shrink-0"
                  style={{ fontFamily: 'var(--pi-display)', color: d.a.score >= d.b.score ? 'var(--text-1)' : 'var(--text-3)' }}
                >
                  {d.a.score}
                </span>

                <div className="relative flex-1 h-[3px]">
                  {/* Full track reads dimmed; driver A's share paints at full strength */}
                  <div className="absolute inset-0" style={{ background: color, opacity: 0.25 }} />
                  <div
                    className="duel-bar-a absolute top-0 bottom-0 left-0"
                    data-pct={aPct.toFixed(1)}
                    style={{ width: `${aPct.toFixed(1)}%`, background: color }}
                  />
                  {/* Split notch */}
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-px"
                    style={{ left: '50%', background: 'var(--border)' }}
                  />
                </div>

                <span
                  className="tabular-nums text-[18px] leading-none w-7 shrink-0"
                  style={{ fontFamily: 'var(--pi-display)', color: d.b.score >= d.a.score ? 'var(--text-1)' : 'var(--text-3)' }}
                >
                  {d.b.score}
                </span>
                <span
                  className="uppercase text-[13px] leading-none w-24 md:w-36 truncate text-right"
                  style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.01em', color: 'var(--text-1)' }}
                >
                  {d.b.surname}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
