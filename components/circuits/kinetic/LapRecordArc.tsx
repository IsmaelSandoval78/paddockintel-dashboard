'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

export type LapRecordPoint = {
  year: number;
  time: string;
  ms: number;
  forename: string;
  surname: string;
};

const VIEW_W = 1000;
const VIEW_H = 200;
const PAD_X = 24;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

// Lap times getting faster across decades — drawn like a flying lap, but the lap is history.
// Lower ms is "better" so the line climbs toward the top as the record falls.
export default function LapRecordArc({ data }: { data: LapRecordPoint[] }) {
  const t = useTranslations('circuitDetail.lapRecord');
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const minMs = Math.min(...data.map((d) => d.ms));
  const maxMs = Math.max(...data.map((d) => d.ms));
  const range = maxMs - minMs || 1;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const innerW = VIEW_W - PAD_X * 2;
  const baselineY = PAD_TOP + innerH;

  const coords = data.map((d, i) => {
    const x = data.length > 1 ? PAD_X + (i / (data.length - 1)) * innerW : PAD_X + innerW / 2;
    const fraction = (maxMs - d.ms) / range; // 1 = fastest (top), 0 = slowest (bottom)
    const y = PAD_TOP + innerH - fraction * innerH;
    return { x, y, ...d };
  });

  const pathD = coords.length
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    : '';

  // Closed area fill
  const areaD = coords.length >= 2
    ? `${pathD} L ${coords[coords.length - 1].x.toFixed(1)},${baselineY} L ${coords[0].x.toFixed(1)},${baselineY} Z`
    : '';

  // Record-break indices — every point that set a new all-time low at that moment
  const recordBreakSet = new Set<number>();
  let runningMin = Infinity;
  for (let i = 0; i < coords.length; i++) {
    if (coords[i].ms < runningMin) {
      runningMin = coords[i].ms;
      recordBreakSet.add(i);
    }
  }

  // Year tick positions — up to 6 evenly sampled, always include first + last
  const tickIndices: number[] = [];
  if (coords.length > 1) {
    const maxTicks = Math.min(6, coords.length);
    const step = (coords.length - 1) / (maxTicks - 1);
    for (let ti = 0; ti < maxTicks; ti++) {
      tickIndices.push(Math.round(ti * step));
    }
    // deduplicate
    const seen = new Set<number>();
    tickIndices.splice(0, tickIndices.length, ...tickIndices.filter((v) => !seen.has(v) && seen.add(v)));
  }

  useEffect(() => {
    if (!motionOk || !pathRef.current || !wrapRef.current || !pathD) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(pathRef.current,
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'power2.inOut',
          duration: 1.1,
          scrollTrigger: { trigger: wrapRef.current, start: 'top 85%', once: true },
        },
      );
      if (areaRef.current) {
        gsap.fromTo(areaRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.9,
            ease: 'power2.out',
            delay: 0.2,
            scrollTrigger: { trigger: wrapRef.current, start: 'top 85%', once: true },
          },
        );
      }
    }, wrapRef);
    return () => ctx.revert();
  }, [motionOk, pathD]);

  if (!coords.length) return null;

  const recordIdx = coords.reduce((best, c, i) => (c.ms < coords[best].ms ? i : best), 0);
  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;
  const readout = hovered ?? coords[recordIdx];
  const readoutIdx = hoverIndex ?? recordIdx;
  const isReadoutRecord = readoutIdx === recordIdx;
  const isReadoutRecordBreak = recordBreakSet.has(readoutIdx);

  return (
    <div ref={wrapRef} className="w-full">
      {/* Readout strip */}
      <div className="flex items-baseline gap-3 mb-2 h-5">
        <span className="font-mono text-[11px] text-text-1 tabular-nums">{readout.year}</span>
        <span
          className="font-mono text-[13px] tabular-nums"
          style={{ color: isReadoutRecord ? 'var(--terracotta)' : 'var(--text-2)' }}
        >
          {readout.time}
        </span>
        <span className="text-[11px] text-text-2">{readout.forename[0]}. {readout.surname}</span>
        {isReadoutRecordBreak && (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--terracotta)' }}>
            {isReadoutRecord ? t('allTime') : t('newRecord')}
          </span>
        )}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: 'clamp(140px, 18vw, 200px)' }}
        role="img"
        aria-label={`Lap record evolution, ${coords[0].year}–${coords[coords.length - 1].year}`}
      >
        <defs>
          <linearGradient id="arc-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text-2)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--text-2)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={PAD_X} y1={baselineY}
          x2={VIEW_W - PAD_X} y2={baselineY}
          stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke"
        />

        {/* Area fill */}
        {areaD && (
          <path
            ref={areaRef}
            d={areaD}
            fill="url(#arc-area-grad)"
            stroke="none"
            style={motionOk ? { opacity: 0 } : { opacity: 1 }}
          />
        )}

        {/* Ghost line */}
        <path
          d={pathD}
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />

        {/* Animated main line */}
        <path
          ref={pathRef}
          d={pathD}
          stroke="var(--text-1)"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {coords.map((c, i) => {
          const isAbsRecord = i === recordIdx;
          const isRecordBreak = recordBreakSet.has(i);
          const isHovered = hoverIndex === i;
          const r = isAbsRecord || isHovered ? 4.5 : isRecordBreak ? 3 : 2;
          return (
            <circle
              key={c.year}
              cx={c.x}
              cy={c.y}
              r={r}
              fill={isRecordBreak ? 'var(--terracotta)' : 'var(--text-2)'}
              opacity={isAbsRecord || isHovered ? 1 : isRecordBreak ? 0.75 : 0.45}
              tabIndex={0}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            />
          );
        })}
      </svg>

      {/* Year tick labels — rendered as positioned divs to avoid SVG text distortion */}
      {tickIndices.length > 0 && (
        <div className="relative mt-1" style={{ height: '16px' }}>
          {tickIndices.map((idx, ti) => {
            const c = coords[idx];
            // x as percentage of the full viewBox width
            const leftPct = (c.x / VIEW_W) * 100;
            const anchor: React.CSSProperties = ti === 0
              ? { left: `${leftPct}%`, transform: 'none' }
              : ti === tickIndices.length - 1
              ? { right: `${100 - leftPct}%`, transform: 'none' }
              : { left: `${leftPct}%`, transform: 'translateX(-50%)' };
            return (
              <span
                key={c.year}
                className="font-mono text-[10px] text-text-3 tabular-nums absolute top-0"
                style={anchor}
              >
                {c.year}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
