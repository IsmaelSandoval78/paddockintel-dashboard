'use client';

import { useState, type PointerEvent } from 'react';

// Zentra's trend card (F): championship points after every round for the current top five.
// The leader is the emphasised line (warm, glow, area fill); the others keep their team colour,
// a second car of the same team dashed. End labels are nudged apart so close totals stay legible.

export type TrendSeries = { code: string; colour: string; dashed: boolean; points: number[] };

type Props = {
  title: string;
  sub: string;
  roundLabel: string; // "R{n}"
  tip: string; // "Round {n}"
  ariaLabel: string;
  source: string;
  rounds: number[];
  series: TrendSeries[]; // leader first
  className?: string;
};

const W = 620;
const H = 280;
const L = 40;
const R = 76;
const T = 14;
const B = 30;

export default function TitleTrend({ title, sub, roundLabel, tip, ariaLabel, source, rounds, series, className = '' }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  if (rounds.length < 2 || !series.length) return null;
  const n = rounds.length;
  const top = Math.max(...series.flatMap((s) => s.points));
  const step = top > 300 ? 100 : top > 120 ? 50 : 25;
  const ymax = Math.ceil(top / step) * step;
  const x = (i: number) => L + (i / (n - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / ymax) * (H - T - B);
  const ticks = Array.from({ length: ymax / step + 1 }, (_, i) => i * step);
  const roundTicks = [0, Math.round((n - 1) / 4), Math.round((n - 1) / 2), Math.round((3 * (n - 1)) / 4), n - 1];
  const [leader, ...rest] = series;
  const line = (s: TrendSeries) => s.points.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const ends = series
    .map((s) => ({ code: s.code, v: s.points[n - 1], y: y(s.points[n - 1]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 20) ends[i].y = ends[i - 1].y + 20;

  function onMove(e: PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const sx = ((e.clientX - box.left) * W) / box.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((sx - L) / (W - L - R)) * (n - 1)))));
  }

  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-trend-title">
      <div>
        <h2 id="dusk-trend-title" className="text-[17px] font-semibold m-0">{title}</h2>
        <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{sub}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="dusk-trend block w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="dusk-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F07A45" stopOpacity="0.28" />
            <stop offset="1" stopColor="#F07A45" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={`y-${v}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--dusk-line)" strokeDasharray={v ? '3 5' : undefined} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--dusk-muted)">{v}</text>
          </g>
        ))}
        {[...new Set(roundTicks)].map((i) => (
          <text key={`x-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--dusk-muted)">
            {roundLabel.replace('{n}', String(rounds[i]))}
          </text>
        ))}
        <path d={`M${x(0)},${y(0)} L${line(leader).split(' ').join(' L')} L${x(n - 1)},${y(0)} Z`} fill="url(#dusk-trend-fill)" />
        {[...rest].reverse().map((s) => (
          <polyline key={s.code} points={line(s)} fill="none" stroke={s.colour} strokeWidth="2" opacity="0.8" strokeDasharray={s.dashed ? '6 4' : undefined} strokeLinejoin="round" />
        ))}
        <polyline points={line(leader)} fill="none" stroke="var(--dusk-warm)" strokeWidth="3.2" strokeLinejoin="round" className="dusk-glow-warm" />
        {ends.map((e) => (
          <text key={`end-${e.code}`} x={W - R + 8} y={e.y + 4} fontSize="11" fontWeight={e.code === leader.code ? 500 : 400} fill={e.code === leader.code ? 'var(--dusk-ink)' : 'var(--dusk-ink-2)'}>
            {e.code} {e.v}
          </text>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgba(255,255,255,.3)" />
            <g transform={`translate(${Math.min(Math.max(x(hover), L + 120), W - R - 120)},${T + 6})`}>
              <rect x="-124" y="-4" width="248" height="38" rx="8" fill="rgba(14,13,18,.94)" stroke="var(--dusk-line)" />
              <text x="0" y="11" textAnchor="middle" fontSize="11" fill="var(--dusk-muted)">{tip.replace('{n}', String(rounds[hover]))}</text>
              <text x="0" y="26" textAnchor="middle" fontSize="11" fill="var(--dusk-ink)">
                {series.map((s) => `${s.code} ${s.points[hover]}`).join(' · ')}
              </text>
            </g>
          </g>
        )}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] mt-auto">{source}</p>
    </section>
  );
}
