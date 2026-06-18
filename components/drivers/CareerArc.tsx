'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

export type CareerArcPoint = {
  year: number;
  points: number;
  position: number | null;
};

const VIEW_W = 1000;

// Points/position per season — the shape of a career, drawn like a flying lap.
// Self-detects reduced-motion so it works equally inside a client panel or a server-rendered detail page.
export default function CareerArc({
  data,
  variant = 'compact',
  championshipYears = [],
}: {
  data: CareerArcPoint[];
  variant?: 'compact' | 'full';
  championshipYears?: number[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const isFull = variant === 'full';
  const viewH = isFull ? 220 : 70;
  const padX = isFull ? 24 : 8;
  const padTop = isFull ? 28 : 10;
  const padBottom = isFull ? 20 : 10;

  const maxPoints = Math.max(1, ...data.map((d) => d.points));
  const innerH = viewH - padTop - padBottom;
  const innerW = VIEW_W - padX * 2;

  const coords = data.map((d, i) => {
    const x = data.length > 1 ? padX + (i / (data.length - 1)) * innerW : padX + innerW / 2;
    const y = padTop + innerH - (d.points / maxPoints) * innerH;
    return { x, y, ...d };
  });

  const pathD = coords.length
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    : '';

  useEffect(() => {
    if (!motionOk || !pathRef.current || !wrapRef.current || !pathD) return;
    const ctx = gsap.context(() => {
      const tween: gsap.TweenVars = { drawSVG: '100%', ease: 'power2.inOut', duration: isFull ? 1.1 : 0.7 };
      if (isFull) {
        tween.scrollTrigger = { trigger: wrapRef.current, start: 'top 85%', once: true };
      }
      gsap.fromTo(pathRef.current, { drawSVG: '0%' }, tween);
    }, wrapRef);
    return () => ctx.revert();
  }, [motionOk, pathD, isFull]);

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;
  const readout = hovered ?? coords[coords.length - 1] ?? null;

  if (!coords.length) return null;

  return (
    <div ref={wrapRef} className="w-full">
      {isFull && readout && (
        <div className="flex items-baseline gap-3 mb-2 h-5">
          <span className="font-mono text-[11px] text-text-1 tabular-nums">{readout.year}</span>
          <span className="font-mono text-[11px] text-text-2 tabular-nums">
            {readout.points} pts
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: readout.position === 1 ? 'var(--red)' : 'var(--text-2)' }}>
            {readout.position !== null ? `P${readout.position}` : '—'}
          </span>
          {championshipYears.includes(readout.year) && (
            <span className="font-mono text-[10px] text-gold uppercase tracking-[0.08em]">★ champion</span>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: isFull ? 'clamp(140px, 18vw, 220px)' : '56px' }}
        role="img"
        aria-label={`Career points by season, ${coords[0].year}–${coords[coords.length - 1].year}`}
      >
        {/* ghost baseline — full path, faint */}
        <path d={pathD} stroke="var(--border-subtle)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        {/* drawn path */}
        <path ref={pathRef} d={pathD} stroke="var(--text-1)" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => {
          const isChamp = championshipYears.includes(c.year);
          const isHovered = isFull && hoverIndex === i;
          const r = isChamp ? 4 : isHovered ? 4 : 2.5;
          return (
            <circle
              key={c.year}
              cx={c.x}
              cy={c.y}
              r={r}
              fill={isChamp ? 'var(--red)' : 'var(--text-1)'}
              {...(isFull
                ? {
                    tabIndex: 0,
                    onMouseEnter: () => setHoverIndex(i),
                    onMouseLeave: () => setHoverIndex(null),
                    onFocus: () => setHoverIndex(i),
                    onBlur: () => setHoverIndex(null),
                    style: { cursor: 'pointer', outline: 'none' },
                  }
                : {})}
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
