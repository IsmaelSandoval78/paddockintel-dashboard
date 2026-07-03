'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { teamColor } from '@/components/home/kinetic/teamColors';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';
import type { DriversBattleData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const VIEW_W = 1000;
const VIEW_H = 320;
const PAD_X = 6;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;
const LABEL_GUTTER = 96; // right space inside the viewBox reserved for end-of-line labels
const MIN_LABEL_GAP_PCT = 7.5; // min vertical distance between end labels, in % of chart height

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
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { rounds, series } = data;
  const n = rounds.length;

  useEffect(() => {
    if (!motionOk || !rootRef.current || n < 2) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.battle-line',
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          duration: 1.5,
          stagger: 0.12,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
        }
      );
      // Dashed traces can't drawSVG (the plugin overrides stroke-dasharray) — fade instead
      gsap.from('.battle-line-dashed', {
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.7,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      gsap.from('.battle-endlabel', {
        autoAlpha: 0,
        x: -8,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 1.1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      if (gapRef.current) {
        const el = gapRef.current;
        const target = Number(el.dataset.val ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate() {
            el.textContent = `+${Math.round(obj.v)}`;
          },
        });
      }
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, n]);

  if (n < 2 || series.length < 2) return null;

  const leader = series[0];
  const p2 = series[1];
  const leaderPts = leader.points[n - 1];
  const p2Pts = p2.points[n - 1];
  const gap = leaderPts - p2Pts;
  const maxPts = Math.max(...series.map((s) => s.points[n - 1]), 1);

  const innerW = VIEW_W - PAD_X - LABEL_GUTTER;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (i / (n - 1)) * innerW;
  const y = (pts: number) => PAD_TOP + innerH - (pts / maxPts) * innerH;

  // Second driver of the same team gets a dashed line — same color, distinct trace
  const seenTeams = new Set<string>();
  const paths = series.map((s) => {
    const dashed = seenTeams.has(s.constructor_ref);
    seenTeams.add(s.constructor_ref);
    return {
      ...s,
      d: s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' '),
      endX: x(n - 1),
      endY: y(s.points[n - 1]),
      color: teamColor(s.constructor_ref),
      dashed,
    };
  });

  // End labels: resolve vertical collisions in % space, top-down
  const labels = paths
    .map((p) => ({ ...p, topPct: (p.endY / VIEW_H) * 100 }))
    .sort((a, b) => a.topPct - b.topPct);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].topPct - labels[i - 1].topPct < MIN_LABEL_GAP_PCT) {
      labels[i].topPct = labels[i - 1].topPct + MIN_LABEL_GAP_PCT;
    }
  }

  // Round ticks: sample up to 8, always first + last
  const tickIdx: number[] = [];
  const maxTicks = Math.min(8, n);
  for (let ti = 0; ti < maxTicks; ti++) tickIdx.push(Math.round((ti * (n - 1)) / (maxTicks - 1)));
  const ticks = [...new Set(tickIdx)];

  // Horizontal reference lines at rounded point levels
  const gridStep = maxPts > 200 ? 100 : maxPts > 80 ? 50 : 25;
  const gridLevels: number[] = [];
  for (let lv = gridStep; lv < maxPts; lv += gridStep) gridLevels.push(lv);

  const dimmed = (id: number) => hoveredId !== null && hoveredId !== id;
  const lastRound = rounds[n - 1];

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
                color: 'var(--red)',
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

        {/* Chart */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
              className="w-full block"
              style={{ height: 'clamp(180px, 26vw, 300px)' }}
              role="img"
              aria-label={t('chartAria', { count: series.length })}
            >
              {/* Point-level reference lines */}
              {gridLevels.map((lv) => (
                <line
                  key={lv}
                  x1={PAD_X}
                  y1={y(lv)}
                  x2={VIEW_W - LABEL_GUTTER + 24}
                  y2={y(lv)}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="2 6"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* Baseline */}
              <line
                x1={PAD_X}
                y1={y(0)}
                x2={VIEW_W - LABEL_GUTTER + 24}
                y2={y(0)}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />

              {/* Series lines — leader drawn last, on top */}
              {[...paths].reverse().map((p, ri) => {
                const isLeader = ri === paths.length - 1;
                return (
                  <g key={p.driver_id}>
                    <path
                      className={p.dashed ? 'battle-line-dashed' : 'battle-line'}
                      d={p.d}
                      stroke={p.color}
                      strokeWidth={isLeader ? 2.5 : 1.75}
                      strokeDasharray={p.dashed ? '7 5' : undefined}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      style={{
                        opacity: dimmed(p.driver_id) ? 0.15 : 1,
                        transition: 'opacity 150ms ease-out',
                      }}
                    />
                    {/* Invisible wide hit area for hover */}
                    <path
                      d={p.d}
                      stroke="transparent"
                      strokeWidth="16"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      onMouseEnter={() => setHoveredId(p.driver_id)}
                      onMouseLeave={() => setHoveredId(null)}
                    />
                    <circle
                      cx={p.endX}
                      cy={p.endY}
                      r={3.5}
                      fill={p.color}
                      style={{
                        opacity: dimmed(p.driver_id) ? 0.15 : 1,
                        transition: 'opacity 150ms ease-out',
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* End-of-line labels — HTML to avoid non-uniform SVG scaling */}
            {labels.map((p) => (
              <button
                key={p.driver_id}
                type="button"
                className="battle-endlabel absolute font-mono text-[10px] tabular-nums uppercase tracking-[0.06em] cursor-pointer bg-transparent border-0 p-0 text-left"
                style={{
                  left: `${((p.endX + 10) / VIEW_W) * 100}%`,
                  top: `${p.topPct}%`,
                  transform: 'translateY(-50%)',
                  color: p.color,
                  opacity: dimmed(p.driver_id) ? 0.25 : 1,
                  transition: 'opacity 150ms ease-out',
                }}
                onMouseEnter={() => setHoveredId(p.driver_id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(p.driver_id)}
                onBlur={() => setHoveredId(null)}
              >
                {p.code ?? p.surname.slice(0, 3).toUpperCase()}
                <span className="text-text-2 ml-1.5">{p.points[n - 1]}</span>
              </button>
            ))}
          </div>

          {/* Round ticks */}
          <div className="relative mt-1 h-4">
            {ticks.map((idx, ti) => {
              const leftPct = (x(idx) / VIEW_W) * 100;
              const anchor: React.CSSProperties =
                ti === 0
                  ? { left: `${leftPct}%` }
                  : ti === ticks.length - 1
                    ? { left: `${leftPct}%`, transform: 'translateX(-100%)' }
                    : { left: `${leftPct}%`, transform: 'translateX(-50%)' };
              return (
                <span
                  key={rounds[idx].round}
                  className="font-mono text-[9px] text-text-3 tabular-nums absolute top-0 uppercase"
                  style={anchor}
                >
                  R{rounds[idx].round}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
