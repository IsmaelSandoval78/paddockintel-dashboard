'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamColor } from '@/components/home/kinetic/teamColors';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';
import { BattleChart } from '@/components/ui/BattleChart';
import type { DriversBattleData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

export default function ChampionshipBattle({
  data,
  motionOk,
}: {
  data: DriversBattleData;
  motionOk: boolean;
}) {
  const t = useTranslations('drivers.battle');
  const rootRef = useRef<HTMLElement>(null);
  const gapRef = useRef<HTMLSpanElement>(null);

  const { rounds, series } = data;
  const n = rounds.length;

  useEffect(() => {
    if (!motionOk || !gapRef.current) return;
    const el = gapRef.current;
    const target = Number(el.dataset.val ?? 0);
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: target,
        duration: 1.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate() { el.textContent = `+${Math.round(obj.v)}`; },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  if (n < 2 || series.length < 2) return null;

  const leader = series[0];
  const p2 = series[1];
  const leaderPts = leader.points[n - 1];
  const p2Pts = p2.points[n - 1];
  const gap = leaderPts - p2Pts;
  const lastRound = rounds[n - 1];

  // Second driver of the same team gets a dashed line — same color, distinct trace
  const seenTeams = new Set<string>();
  const chartSeries = series.map((s, i) => {
    const dashed = seenTeams.has(s.constructor_ref);
    seenTeams.add(s.constructor_ref);
    return {
      id: s.driver_id,
      label: s.code ?? s.surname.slice(0, 3).toUpperCase(),
      points: s.points,
      color: teamColor(s.constructor_ref),
      dashed,
      emphasize: i === 0,
    };
  });

  return (
    <section ref={rootRef} className="border-b border-border" aria-label={t('title')}>
      {/* Section header — project grammar */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          01 · {t('title')}
        </span>
        <InfoTooltip text={t('info')} />
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto">
          {t('after', { race: lastRound.race_name, round: lastRound.round })}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-10 px-5 pb-6 pt-4">
        {/* Gap block */}
        <div className="flex flex-col shrink-0 md:w-[26%] md:min-w-[220px]">
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] mb-2">
            P1
          </span>
          <span
            className="uppercase leading-none truncate"
            style={{
              fontFamily: 'var(--pi-display)',
              fontSize: 'clamp(22px, 2.6vw, 34px)',
              letterSpacing: '-0.02em',
              color: teamColor(leader.constructor_ref),
            }}
          >
            {leader.surname}
          </span>
          <span className="font-mono text-[11px] text-text-2 tabular-nums mt-1">
            {leaderPts} {t('pts')}
          </span>

          <div className="flex items-end gap-2 py-3 my-3 border-t border-b border-border-subtle">
            <span
              ref={gapRef}
              data-val={gap}
              className="tabular-nums leading-none"
              style={{
                fontFamily: 'var(--pi-display)',
                fontSize: 'clamp(44px, 6vw, 84px)',
                letterSpacing: '-0.04em',
                color: 'var(--terracotta)',
              }}
            >
              +{gap}
            </span>
            <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em] pb-1.5">
              {t('gapToP2')}
            </span>
          </div>

          <span className="font-mono text-[11px] text-text-2 tabular-nums truncate">
            P2 · <span className="uppercase" style={{ color: teamColor(p2.constructor_ref) }}>{p2.surname}</span> · {p2Pts} {t('pts')}
          </span>
        </div>

        <BattleChart
          rounds={rounds}
          series={chartSeries}
          motionOk={motionOk}
          variant="rich"
          ariaLabel={t('chartAria', { count: series.length })}
        />
      </div>
    </section>
  );
}
