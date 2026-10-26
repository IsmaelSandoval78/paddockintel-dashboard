'use client';

import { useState, type PointerEvent } from 'react';
import type { RaceTrace } from '@/lib/raceHighlights';

// Zentra's main chart card (D) in the pit-wall chart language: the winner's lead over P2 at the
// end of every lap, with the pit-stop cycles and VSC periods marked, and a second tab with the
// running order of the top finishers. Both drawn from the race's own lap timing
// (scripts/highlights/race_highlights.py); the gap tab only exists when the flag lap reproduced
// the official interval.

export type RaceStoryLabels = {
  title: string;
  subGap: string;
  subOrder: string;
  tabGap: string;
  tabOrder: string;
  tablist: string;
  summaryGap: string;
  summaryOrder: string;
  source: string;
  vsc: string;
  lap: string; // "L{lap}"
  pit: string; // "{driver} pits"
  pitVsc: string; // "{driver} pits under VSC"
  tip: string; // "Lap {lap} · {driver} +{gap}s"
  ariaGap: string;
  ariaOrder: string;
};

type Props = {
  trace: RaceTrace;
  labels: RaceStoryLabels;
  mover: { driver: string; peakLap: number; peakPos: number; note: string } | null;
  className?: string;
};

const W = 820;
const H = 300;
const L = 46;
const R = 72;
const T = 18;
const B = 34;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
// The winner can trail P2 for a few laps around the stops (Austin 2026: laps 25-31), so gaps are signed.
const signed = (v: number, digits: number) => `${v < 0 ? '\u2212' : '+'}${Math.abs(v).toFixed(digits)}`;

function runs(laps: number[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  [...laps].sort((a, b) => a - b).forEach((l) => {
    const last = out[out.length - 1];
    if (last && l === last[1] + 1) last[1] = l;
    else out.push([l, l]);
  });
  return out;
}

export default function RaceStoryCard({ trace, labels, mover, className = '' }: Props) {
  const gap = trace.gap;
  const [view, setView] = useState<'gap' | 'order'>(gap ? 'gap' : 'order');
  const [hover, setHover] = useState<number | null>(null);
  const n = trace.totalLaps;
  const x = (lap: number) => L + ((lap - 1) / (n - 1)) * (W - L - R);
  const vscRuns = runs(trace.vscLaps);
  const lapTicks = [1, ...[10, 20, 30, 40, 50, 60, 70].filter((l) => l < n - 4), n];

  const bands = (top: number, bottom: number) =>
    vscRuns.map(([a, b]) => (
      <g key={`vsc-${a}`}>
        <rect x={x(a) - 4} y={top} width={x(b) - x(a) + 8} height={bottom - top} fill="rgba(143,211,255,.10)" />
        <text x={(x(a) + x(b)) / 2} y={top + 12} textAnchor="middle" fontSize="10" fill="var(--dusk-ice)">{labels.vsc}</text>
      </g>
    ));
  const axis = lapTicks.map((l) => (
    <text key={`t-${l}`} x={x(l)} y={H - 10} textAnchor="middle" fontSize="10.5" fill="var(--dusk-muted)">
      {fill(labels.lap, { lap: l })}
    </text>
  ));

  function gapChart() {
    if (!gap) return null;
    const g = gap.seconds;
    const lo = Math.min(0, ...g);
    const hi = Math.max(0, ...g);
    const step = hi - lo <= 12 ? 2 : 10;
    const gmin = Math.floor(lo / step) * step;
    const gmax = Math.ceil(hi / step) * step;
    const y = (v: number) => T + ((gmax - v) / (gmax - gmin)) * (H - T - B);
    const pts = g.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`);
    const pitNotes = trace.drivers
      .filter((d) => d.driver === gap.leader || d.driver === gap.chaser)
      .flatMap((d) => d.pitLaps.map((lap) => ({ driver: d.driver, lap, leader: d.driver === gap.leader })))
      .filter((p) => p.lap >= 1 && p.lap <= n);
    const ticks = Array.from({ length: (gmax - gmin) / step + 1 }, (_, i) => gmin + i * step);

    function onMove(e: PointerEvent<SVGRectElement>) {
      const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
      if (!box) return;
      const sx = ((e.clientX - box.left) * W) / box.width;
      setHover(Math.max(1, Math.min(n, Math.round(((sx - L) / (W - L - R)) * (n - 1)) + 1)));
    }

    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.ariaGap} className="block w-full h-auto overflow-visible min-w-[640px] md:min-w-0">
        <defs>
          <linearGradient id="dusk-gap-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F07A45" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F07A45" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={`g-${v}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--dusk-line)" strokeDasharray={v ? '3 5' : undefined} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--dusk-muted)">{v ? `${signed(v, 0)}s` : '0'}</text>
          </g>
        ))}
        {bands(T, H - B)}
        <path d={`M${x(1)},${y(0)} L${pts.join(' L')} L${x(n)},${y(0)} Z`} fill="url(#dusk-gap-fill)" />
        <polyline points={pts.join(' ')} fill="none" stroke="var(--dusk-warm)" strokeWidth="2.5" strokeLinejoin="round" className="dusk-glow-warm" />
        {pitNotes.map((p) => {
          const v = g[p.lap - 1];
          const rising = p.lap < n && g[p.lap] > v;
          // A rising jump puts its label to the left, unless the line there is higher (an earlier
          // pit cycle): then it sits to the right of the peak the jump lands on.
          const clearLeft = g.slice(Math.max(0, p.lap - 9), p.lap - 1).every((w) => w < v - 3);
          const toPeak = rising && !clearLeft;
          const lx = toPeak ? x(p.lap + 1) + 8 : x(p.lap) + (rising ? -8 : 8);
          const ly = (toPeak ? y(g[p.lap]) : y(v)) - 12;
          const col = p.leader ? 'var(--dusk-warm)' : 'var(--dusk-ice)';
          return (
            <g key={`pit-${p.driver}-${p.lap}`}>
              <circle cx={x(p.lap)} cy={y(v)} r="4.5" fill={col} stroke="#0E0D12" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor={rising && !toPeak ? 'end' : 'start'} fontSize="11" fill={col}>
                {fill(trace.vscLaps.includes(p.lap) ? labels.pitVsc : labels.pit, { driver: p.driver })}
              </text>
            </g>
          );
        })}
        <circle cx={x(n)} cy={y(g[n - 1])} r="5" fill="var(--dusk-warm)" className="dusk-glow-warm" />
        <text x={x(n) + 10} y={y(g[n - 1]) + 4} fontSize="12" fontWeight="500" fill="var(--dusk-ink)">{signed(g[n - 1], 3)}s</text>
        {axis}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgba(255,255,255,.35)" />
            <circle cx={x(hover)} cy={y(g[hover - 1])} r="5" fill="#fff" />
            <g transform={`translate(${Math.min(Math.max(x(hover), L + 70), W - R - 70)},${Math.max(y(g[hover - 1]) - 18, T + 14)})`}>
              <rect x="-82" y="-16" width="164" height="24" rx="8" fill="rgba(14,13,18,.94)" stroke="var(--dusk-line)" />
              <text x="0" y="0" textAnchor="middle" fontSize="11.5" fill="var(--dusk-ink)">
                {fill(labels.tip, { lap: hover, driver: gap.leader, gap: signed(g[hover - 1], 3) })}
              </text>
            </g>
          </g>
        )}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
    );
  }

  function orderChart() {
    const drivers = trace.drivers;
    const count = drivers.length;
    const y = (p: number) => T + 6 + ((p - 1) / (count - 1)) * (H - T - B - 12);
    const seenTeam = new Set<string>();
    const leader = drivers[0]?.driver;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.ariaOrder} className="block w-full h-auto overflow-visible min-w-[640px] md:min-w-0">
        {bands(T - 4, H - B + 4)}
        {drivers.map((_, i) => (
          <text key={`p-${i}`} x={L - 10} y={y(i + 1) + 4} textAnchor="end" fontSize="10.5" fill="var(--dusk-muted)">P{i + 1}</text>
        ))}
        {drivers.map((d) => {
          const second = seenTeam.has(d.team);
          seenTeam.add(d.team);
          let path = '';
          let pen = false;
          d.positions.forEach((p, i) => {
            if (p === null || p > count) {
              pen = false;
              return;
            }
            path += `${pen ? ' L' : ' M'}${x(i + 1).toFixed(1)},${y(p).toFixed(1)}`;
            pen = true;
          });
          const focus = d.driver === leader || d.driver === mover?.driver;
          const last = d.positions[d.positions.length - 1];
          return (
            <g key={d.driver}>
              <path d={path} fill="none" stroke={d.teamColour ?? 'var(--dusk-muted)'} strokeWidth={focus ? 3.2 : 2} opacity={focus ? 1 : 0.5} strokeDasharray={second ? '6 4' : undefined} strokeLinejoin="round" />
              {last !== null && last <= count && (
                <text x={W - R + 10} y={y(last) + 4} fontSize="11.5" fontWeight={focus ? 500 : 400} fill={focus ? 'var(--dusk-ink)' : 'var(--dusk-ink-2)'}>{d.driver}</text>
              )}
            </g>
          );
        })}
        {mover && (
          <g>
            <circle cx={x(mover.peakLap)} cy={y(mover.peakPos)} r="5" fill={drivers.find((d) => d.driver === mover.driver)?.teamColour ?? 'var(--dusk-ink)'} stroke="#0E0D12" strokeWidth="2" />
            <text x={x(mover.peakLap) + (x(mover.peakLap) > W * 0.6 ? -8 : 8)} y={y(mover.peakPos) - 10} textAnchor={x(mover.peakLap) > W * 0.6 ? 'end' : 'start'} fontSize="11" fill="var(--dusk-ink)">{mover.note}</text>
          </g>
        )}
        {axis}
      </svg>
    );
  }

  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-story-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="dusk-story-title" className="text-[17px] font-semibold m-0">{labels.title}</h2>
          <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{view === 'gap' ? labels.subGap : labels.subOrder}</p>
        </div>
        {gap && (
          <div className="dusk-seg inline-flex p-[3px] rounded-full shrink-0" role="tablist" aria-label={labels.tablist}>
            {(['gap', 'order'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => {
                  setView(v);
                  setHover(null);
                }}
                className="border-0 bg-transparent px-3 py-1.5 rounded-full text-[12.5px] text-[color:var(--dusk-muted)] cursor-pointer whitespace-nowrap"
              >
                {v === 'gap' ? labels.tabGap : labels.tabOrder}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto md:overflow-visible">{view === 'gap' ? gapChart() : orderChart()}</div>
      <p className="text-[15px] leading-[1.5] text-[color:var(--dusk-ink-2)] max-w-[70ch]">{view === 'gap' ? labels.summaryGap : labels.summaryOrder}</p>
      <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)]">{labels.source}</p>
    </section>
  );
}
