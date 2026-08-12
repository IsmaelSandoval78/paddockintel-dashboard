'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

export interface BattleChartRound {
  round: number;
  raceName?: string;
}

export interface BattleChartSeries {
  id: number | string;
  label: string;
  points: number[]; // index-aligned with `rounds`
  color: string;
  dashed?: boolean; // stroke-dasharray — e.g. a second entrant of an already-drawn team
  emphasize?: boolean; // thicker stroke, drawn last (on top), gets the "leader" treatment
}

interface BattleChartProps {
  rounds: BattleChartRound[];
  series: BattleChartSeries[];
  motionOk: boolean;
  /** 'rich' — DrawSVG-on-scroll, end-of-line labels, hover-to-isolate (Drivers/Hub).
   *  'compact' — static render, mouse-move tooltip (Records). */
  variant?: 'rich' | 'compact';
  height?: number;
  ariaLabel: string;
}

const RICH_W = 1000;
const RICH_PAD_X = 6;
const RICH_PAD_TOP = 16;
const RICH_PAD_BOTTOM = 10;
const RICH_LABEL_GUTTER = 96;
const RICH_MIN_LABEL_GAP_PCT = 7.5;

const COMPACT_W = 900;
const COMPACT_PAD_L = 44;
const COMPACT_PAD_R = 12;
const COMPACT_PAD_T = 16;
const COMPACT_PAD_B = 28;

export function BattleChart({
  rounds,
  series,
  motionOk,
  variant = 'rich',
  height = 320,
  ariaLabel,
}: BattleChartProps) {
  return variant === 'compact'
    ? <CompactBattleChart rounds={rounds} series={series} height={height} ariaLabel={ariaLabel} />
    : <RichBattleChart rounds={rounds} series={series} motionOk={motionOk} height={height} ariaLabel={ariaLabel} />;
}

// ─── Rich — DrawSVG on scroll, end labels, hover-to-isolate ──────────────

function RichBattleChart({
  rounds,
  series,
  motionOk,
  height,
  ariaLabel,
}: Omit<BattleChartProps, 'variant'> & { height: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<BattleChartSeries['id'] | null>(null);

  const n = rounds.length;

  useEffect(() => {
    if (!motionOk || !rootRef.current || n < 2) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.battlechart-line',
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          duration: 1.5,
          stagger: 0.12,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
        },
      );
      // Dashed traces can't drawSVG (the plugin overrides stroke-dasharray) — fade instead
      gsap.from('.battlechart-line-dashed', {
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.7,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      gsap.from('.battlechart-endlabel', {
        autoAlpha: 0,
        x: -8,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 1.1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, n]);

  if (n < 2 || series.length < 2) return null;

  const maxPts = Math.max(...series.map((s) => s.points[n - 1]), 1);
  const innerW = RICH_W - RICH_PAD_X - RICH_LABEL_GUTTER;
  const innerH = height - RICH_PAD_TOP - RICH_PAD_BOTTOM;
  const x = (i: number) => RICH_PAD_X + (i / (n - 1)) * innerW;
  const y = (pts: number) => RICH_PAD_TOP + innerH - (pts / maxPts) * innerH;

  const coords = series.map((s) => ({
    ...s,
    d: s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' '),
    endX: x(n - 1),
    endY: y(s.points[n - 1]),
  }));

  // Emphasized series render last (on top), thicker — everything else keeps input order
  const drawOrder = [...coords].sort((a, b) => (a.emphasize ? 1 : 0) - (b.emphasize ? 1 : 0));

  // End labels: resolve vertical collisions in % space, top-down
  const labels = coords
    .map((c) => ({ ...c, topPct: (c.endY / height) * 100 }))
    .sort((a, b) => a.topPct - b.topPct);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].topPct - labels[i - 1].topPct < RICH_MIN_LABEL_GAP_PCT) {
      labels[i].topPct = labels[i - 1].topPct + RICH_MIN_LABEL_GAP_PCT;
    }
  }

  // Round ticks: sample up to 8, always first + last
  const maxTicks = Math.min(8, n);
  const tickIdxRaw: number[] = [];
  for (let ti = 0; ti < maxTicks; ti++) tickIdxRaw.push(Math.round((ti * (n - 1)) / (maxTicks - 1)));
  const ticks = [...new Set(tickIdxRaw)];

  // Horizontal reference lines at rounded point levels
  const gridStep = maxPts > 200 ? 100 : maxPts > 80 ? 50 : 25;
  const gridLevels: number[] = [];
  for (let lv = gridStep; lv < maxPts; lv += gridStep) gridLevels.push(lv);

  const dimmed = (id: BattleChartSeries['id']) => hoveredId !== null && hoveredId !== id;

  return (
    <div ref={rootRef} className="flex-1 min-w-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${RICH_W} ${height}`}
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: 'clamp(180px, 26vw, 300px)' }}
          role="img"
          aria-label={ariaLabel}
        >
          {gridLevels.map((lv) => (
            <line
              key={lv}
              x1={RICH_PAD_X}
              y1={y(lv)}
              x2={RICH_W - RICH_LABEL_GUTTER + 24}
              y2={y(lv)}
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={RICH_PAD_X}
            y1={y(0)}
            x2={RICH_W - RICH_LABEL_GUTTER + 24}
            y2={y(0)}
            stroke="var(--border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {drawOrder.map((p) => (
            <g key={p.id}>
              <path
                className={p.dashed ? 'battlechart-line-dashed' : 'battlechart-line'}
                d={p.d}
                stroke={p.color}
                strokeWidth={p.emphasize ? 2.5 : 1.75}
                strokeDasharray={p.dashed ? '7 5' : undefined}
                fill="none"
                vectorEffect="non-scaling-stroke"
                style={{ opacity: dimmed(p.id) ? 0.15 : 1, transition: 'opacity 150ms ease-out' }}
              />
              <path
                d={p.d}
                stroke="transparent"
                strokeWidth="16"
                fill="none"
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
              <circle
                cx={p.endX}
                cy={p.endY}
                r={3.5}
                fill={p.color}
                style={{ opacity: dimmed(p.id) ? 0.15 : 1, transition: 'opacity 150ms ease-out' }}
              />
            </g>
          ))}
        </svg>

        {/* End-of-line labels — HTML to avoid non-uniform SVG scaling */}
        {labels.map((p) => (
          <button
            key={p.id}
            type="button"
            className="battlechart-endlabel absolute font-mono text-[10px] tabular-nums uppercase tracking-[0.06em] cursor-pointer bg-transparent border-0 p-0 text-left"
            style={{
              left: `${((p.endX + 10) / RICH_W) * 100}%`,
              top: `${p.topPct}%`,
              transform: 'translateY(-50%)',
              color: p.color,
              opacity: dimmed(p.id) ? 0.25 : 1,
              transition: 'opacity 150ms ease-out',
            }}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(p.id)}
            onBlur={() => setHoveredId(null)}
          >
            {p.label}
            <span className="text-text-2 ml-1.5">{p.points[n - 1]}</span>
          </button>
        ))}
      </div>

      {/* Round ticks */}
      <div className="relative mt-1 h-4">
        {ticks.map((idx, ti) => {
          const leftPct = (x(idx) / RICH_W) * 100;
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
  );
}

// ─── Compact — static render, mouse-move tooltip ─────────────────────────

function CompactBattleChart({
  rounds,
  series,
  height,
  ariaLabel,
}: Omit<BattleChartProps, 'variant' | 'motionOk'> & { height: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const n = rounds.length;
  if (n === 0 || series.length === 0) return null;

  const innerW = COMPACT_W - COMPACT_PAD_L - COMPACT_PAD_R;
  const innerH = height - COMPACT_PAD_T - COMPACT_PAD_B;
  const maxPoints = Math.max(1, ...series.flatMap((s) => s.points));
  const x = (i: number) => COMPACT_PAD_L + (n <= 1 ? 0 : (innerW * i) / (n - 1));
  const y = (v: number) => COMPACT_PAD_T + innerH - (innerH * v) / maxPoints;

  const paths = series.map((s) => ({
    ...s,
    d: s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p)}`).join(' '),
  }));
  const drawOrder = [...paths].sort((a, b) => (a.emphasize ? 1 : 0) - (b.emphasize ? 1 : 0));
  const gridLines = [0.25, 0.5, 0.75].map((f) => COMPACT_PAD_T + innerH * (1 - f));

  const hoveredRound = hoverIdx !== null ? rounds[hoverIdx] : null;
  const tooltipLeft = hoverIdx !== null ? (x(hoverIdx) / COMPACT_W) * 100 : 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-3 font-mono text-[10px] uppercase tracking-[0.08em] flex-wrap">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5" style={{ color: s.emphasize ? 'var(--text-1)' : 'var(--text-2)' }}>
            <span className="inline-block w-2.5 h-0.5" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${COMPACT_W} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * COMPACT_W;
          const i = n <= 1 ? 0 : Math.round(((relX - COMPACT_PAD_L) / innerW) * (n - 1));
          setHoverIdx(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        {gridLines.map((gy, i) => (
          <line key={i} x1={COMPACT_PAD_L} x2={COMPACT_W - COMPACT_PAD_R} y1={gy} y2={gy} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        {drawOrder.map((p) => (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {hoverIdx !== null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={COMPACT_PAD_T} y2={COMPACT_PAD_T + innerH} stroke="var(--border)" strokeWidth="1" />
        )}
      </svg>

      {hoveredRound && (
        <div
          className="absolute pointer-events-none bg-surface border border-border px-3 py-2 font-mono text-[11px] whitespace-nowrap"
          style={{
            left: `${Math.min(88, Math.max(12, tooltipLeft))}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-text-2 uppercase tracking-[0.08em] mb-1">
            R{hoveredRound.round}{hoveredRound.raceName ? ` · ${hoveredRound.raceName}` : ''}
          </p>
          {series.map((s) => (
            <p key={s.id} style={{ color: s.color }}>{s.label}: {s.points[hoverIdx!]}</p>
          ))}
        </div>
      )}
    </div>
  );
}
