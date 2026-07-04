'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';
import type { CompareH2HData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

// The on-track truth: every race both drivers actually started, who beat whom.
export default function H2HDuel({
  h2h,
  aLabel,
  bLabel,
  aColor,
  bColor,
  pairKey,
  motionOk,
  index,
}: {
  h2h: CompareH2HData | null;
  aLabel: string;
  bLabel: string;
  aColor: string;
  bColor: string;
  pairKey: string;
  motionOk: boolean;
  index: string;
}) {
  const t = useTranslations('compare.h2h');
  const rootRef = useRef<HTMLElement>(null);
  const hasData = h2h !== null && h2h.shared_races > 0;

  useEffect(() => {
    if (!motionOk || !rootRef.current || !hasData) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.h2h-num').forEach((el) => {
        const target = Number(el.dataset.val ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate() { el.textContent = String(Math.round(obj.v)); },
        });
      });
      gsap.utils.toArray<HTMLElement>('.h2h-bar').forEach((el) => {
        gsap.fromTo(
          el,
          { width: '50%' },
          {
            width: el.dataset.pct + '%',
            duration: 1.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, pairKey, hasData]);

  if (h2h === null) return null;

  return (
    <section ref={rootRef} className="border-b border-border" aria-label={t('title')}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          {index} · {t('title')}
        </span>
        <InfoTooltip text={t('info')} />
        {hasData && (
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto tabular-nums">
            {t('meta', {
              races: h2h.shared_races,
              from: h2h.first_shared_year ?? 0,
              to: h2h.last_shared_year ?? 0,
            })}
          </span>
        )}
      </div>

      {!hasData ? (
        <p className="font-mono text-[12px] text-text-3 px-5 py-8">{t('never')}</p>
      ) : (
        <div className="px-5 pt-4 pb-7">
          {/* Race scoreboard */}
          <div className="flex items-center justify-center gap-5 md:gap-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] hidden md:block" style={{ color: aColor }}>
              {aLabel}
            </span>
            <span
              className="h2h-num tabular-nums leading-none"
              data-val={h2h.a_race_ahead}
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(48px, 8vw, 110px)', letterSpacing: '-0.04em', color: aColor }}
            >
              {h2h.a_race_ahead}
            </span>
            <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] text-center w-20">
              {t('finishedAhead')}
            </span>
            <span
              className="h2h-num tabular-nums leading-none"
              data-val={h2h.b_race_ahead}
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(48px, 8vw, 110px)', letterSpacing: '-0.04em', color: bColor }}
            >
              {h2h.b_race_ahead}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] hidden md:block" style={{ color: bColor }}>
              {bLabel}
            </span>
          </div>

          {/* Race split bar */}
          {h2h.a_race_ahead + h2h.b_race_ahead > 0 && (
            <div className="relative h-[3px] max-w-[720px] mx-auto mt-5">
              <div className="absolute inset-0" style={{ background: bColor, opacity: 0.35 }} />
              <div
                className="h2h-bar absolute left-0 top-0 bottom-0"
                data-pct={((h2h.a_race_ahead / (h2h.a_race_ahead + h2h.b_race_ahead)) * 100).toFixed(1)}
                style={{
                  width: `${((h2h.a_race_ahead / (h2h.a_race_ahead + h2h.b_race_ahead)) * 100).toFixed(1)}%`,
                  background: aColor,
                }}
              />
              <div className="absolute top-[-3px] bottom-[-3px] w-px left-1/2" style={{ background: 'var(--border)' }} />
            </div>
          )}

          {/* Qualifying line */}
          {h2h.quali_sessions > 0 && (
            <div className="flex items-baseline justify-center gap-3 mt-5">
              <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em]">
                {t('quali')}
              </span>
              <span className="font-mono text-[15px] tabular-nums" style={{ color: aColor }}>
                {h2h.a_quali_ahead}
              </span>
              <span className="font-mono text-[11px] text-text-3">—</span>
              <span className="font-mono text-[15px] tabular-nums" style={{ color: bColor }}>
                {h2h.b_quali_ahead}
              </span>
              <span className="font-mono text-[9px] text-text-3 tabular-nums">
                / {h2h.quali_sessions}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
