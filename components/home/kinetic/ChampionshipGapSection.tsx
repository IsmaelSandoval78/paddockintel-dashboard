'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamColor } from './teamColors';
import { BattleChart, type BattleChartRound, type BattleChartSeries } from '@/components/ui/BattleChart';
import type { HomeChampionshipGapData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface ChampionshipGapSectionProps {
  data: HomeChampionshipGapData;
  motionOk: boolean;
}

function GapPanel({
  label,
  p1Name,
  p1Ref,
  p1Pts,
  p2Name,
  p2Ref,
  p2Pts,
  gap,
  motionOk,
  chart,
}: {
  label: string;
  p1Name: string;
  p1Ref: string;
  p1Pts: number;
  p2Name: string;
  p2Ref: string;
  p2Pts: number;
  gap: number;
  motionOk: boolean;
  chart: { rounds: BattleChartRound[]; series: BattleChartSeries[] } | null;
}) {
  const t = useTranslations('hub.home');
  const gapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!motionOk || !gapRef.current) return;
    const el = gapRef.current;
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: gap,
        duration: 1.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate() { el.textContent = `+${Math.round(obj.v)}`; },
      });
    });
    return () => ctx.revert();
  }, [motionOk, gap]);

  const p1Color = teamColor(p1Ref);
  const p2Color = teamColor(p2Ref);

  return (
    <div className="cg-panel flex flex-col px-4 md:px-6 py-6 md:py-8" style={{ background: 'var(--bg)' }}>
      <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-6">
        {label}
      </span>

      {/* P1 row */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em]">P1</span>
        <span
          className="uppercase leading-none truncate flex-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(18px, 2.4vw, 28px)', letterSpacing: '-0.02em', color: p1Color }}
        >
          {p1Name}
        </span>
        <span
          className="tabular-nums font-mono text-[13px] md:text-[15px] text-text-1"
          style={{ color: 'var(--text-1)' }}
        >
          {p1Pts} {t('csPts').toUpperCase()}
        </span>
      </div>

      {/* Gap */}
      <div className="flex items-center gap-3 py-4 my-2 border-t border-b border-border-subtle">
        <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em]">
          {t('csGap').toUpperCase()}
        </span>
        <span
          ref={gapRef}
          className="tabular-nums leading-none"
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            letterSpacing: '-0.04em',
            color: 'var(--terracotta)',
          }}
        >
          +{gap}
        </span>
        <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.1em] self-end pb-1">
          {t('csPts').toUpperCase()}
        </span>
      </div>

      {/* P2 row */}
      <div className="flex items-baseline gap-3 mt-1">
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em]">P2</span>
        <span
          className="uppercase leading-none truncate flex-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(18px, 2.4vw, 28px)', letterSpacing: '-0.02em', color: p2Color }}
        >
          {p2Name}
        </span>
        <span className="tabular-nums font-mono text-[13px] md:text-[15px]" style={{ color: 'var(--text-2)' }}>
          {p2Pts} {t('csPts').toUpperCase()}
        </span>
      </div>

      {chart && (
        <div className="mt-6 pt-5 border-t border-border-subtle">
          <BattleChart
            variant="compact"
            motionOk={motionOk}
            rounds={chart.rounds}
            series={chart.series}
            height={180}
            ariaLabel={`${label}: ${p1Name} vs ${p2Name} points by round`}
          />
        </div>
      )}
    </div>
  );
}

export default function ChampionshipGapSection({ data, motionOk }: ChampionshipGapSectionProps) {
  const t = useTranslations('hub.home');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.from('.cg-panel', {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  if (!data.driver && !data.constructor) return null;

  const chartRounds: BattleChartRound[] = data.history.rounds.map((r) => ({ round: r.round }));

  const driverChart = data.history.driverSeries
    ? {
        rounds: chartRounds,
        series: data.history.driverSeries.map((s, i) => ({
          id: s.driver_id,
          label: s.code ?? s.surname.slice(0, 3).toUpperCase(),
          points: s.points,
          color: teamColor(s.constructor_ref),
          emphasize: i === 0,
        })),
      }
    : null;

  const constructorChart = data.history.constructorSeries
    ? {
        rounds: chartRounds,
        series: data.history.constructorSeries.map((s, i) => ({
          id: s.constructor_id,
          label: s.name,
          points: s.points,
          color: teamColor(s.constructor_ref),
          emphasize: i === 0,
        })),
      }
    : null;

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16">
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-8 md:mb-10">
        {t('csTitle').toUpperCase()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
        {data.driver && (
          <GapPanel
            label={t('csDrivers').toUpperCase()}
            p1Name={data.driver.p1.surname}
            p1Ref={data.driver.p1.constructor_ref}
            p1Pts={data.driver.p1.points}
            p2Name={data.driver.p2.surname}
            p2Ref={data.driver.p2.constructor_ref}
            p2Pts={data.driver.p2.points}
            gap={data.driver.gap}
            motionOk={motionOk}
            chart={driverChart}
          />
        )}
        {data.constructor && (
          <GapPanel
            label={t('csConstructors').toUpperCase()}
            p1Name={data.constructor.p1.name}
            p1Ref={data.constructor.p1.constructor_ref}
            p1Pts={data.constructor.p1.points}
            p2Name={data.constructor.p2.name}
            p2Ref={data.constructor.p2.constructor_ref}
            p2Pts={data.constructor.p2.points}
            gap={data.constructor.gap}
            motionOk={motionOk}
            chart={constructorChart}
          />
        )}
      </div>
    </section>
  );
}
