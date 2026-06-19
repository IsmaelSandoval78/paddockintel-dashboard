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
const PAD_TOP = 28;
const PAD_BOTTOM = 20;

// Lap times getting faster across decades — drawn like a flying lap, but the lap is history.
// Lower ms is "better" so the line climbs toward the top as the record falls.
export default function LapRecordArc({ data }: { data: LapRecordPoint[] }) {
  const t = useTranslations('circuitDetail.lapRecord');
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
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

  const coords = data.map((d, i) => {
    const x = data.length > 1 ? PAD_X + (i / (data.length - 1)) * innerW : PAD_X + innerW / 2;
    const fraction = (maxMs - d.ms) / range; // 1 = fastest (top), 0 = slowest (bottom)
    const y = PAD_TOP + innerH - fraction * innerH;
    return { x, y, ...d };
  });

  const pathD = coords.length
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    : '';

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
    }, wrapRef);
    return () => ctx.revert();
  }, [motionOk, pathD]);

  if (!coords.length) return null;

  const recordIdx = coords.reduce((best, c, i) => (c.ms < coords[best].ms ? i : best), 0);
  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;
  const readout = hovered ?? coords[recordIdx];

  return (
    <div ref={wrapRef} className="w-full">
      <div className="flex items-baseline gap-3 mb-2 h-5">
        <span className="font-mono text-[11px] text-text-1 tabular-nums">{readout.year}</span>
        <span className="font-mono text-[11px] tabular-nums" style={{ color: readout.ms === coords[recordIdx].ms ? 'var(--red)' : 'var(--text-2)' }}>
          {readout.time}
        </span>
        <span className="text-[11px] text-text-2">{readout.forename[0]}. {readout.surname}</span>
        {readout.ms === coords[recordIdx].ms && (
          <span className="font-mono text-[10px] text-red uppercase tracking-[0.08em]">{t('allTime')}</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: 'clamp(140px, 18vw, 200px)' }}
        role="img"
        aria-label={`Lap record evolution, ${coords[0].year}–${coords[coords.length - 1].year}`}
      >
        <path d={pathD} stroke="var(--border-subtle)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        <path ref={pathRef} d={pathD} stroke="var(--text-1)" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => {
          const isRecord = i === recordIdx;
          const isHovered = hoverIndex === i;
          return (
            <circle
              key={c.year}
              cx={c.x}
              cy={c.y}
              r={isRecord || isHovered ? 4 : 2.5}
              fill={isRecord ? 'var(--red)' : 'var(--text-1)'}
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
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[10px] text-text-3 tabular-nums">{coords[0].year}</span>
        {coords.length > 1 && (
          <span className="font-mono text-[10px] text-text-3 tabular-nums">{coords[coords.length - 1].year}</span>
        )}
      </div>
    </div>
  );
}
