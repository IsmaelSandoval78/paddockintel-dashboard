'use client';

import { useState, type PointerEvent } from 'react';

// The lap's real height (FastF1 Z), in metres above its lowest point, against distance. One series:
// the title names it, corners sit on the line, and the crosshair reads distance, height and the
// nearest corner. Unlike the hero landscape (speed), this is the track's own elevation.

type Props = {
  label: string;
  title: string;
  sub: string;
  ariaLabel: string;
  source: string;
  locale: string;
  heights: number[]; // evenly spaced from 0 to lapLength
  lapLength: number; // metres
  corners: Array<{ number: string; distance: number }>;
  kmTick: string; // "{n} km"
  mTick: string; // "{n} m"
  cornerTag: string; // "T{n}"
  tip: string; // "{km} km · {m} m"
  className?: string;
};

const W = 620;
const H = 250;
const L = 40;
const R = 14;
const T = 18;
const B = 30;
const LABEL_GAP = 40; // minimum viewBox units between two corner labels
const CORNER_SNAP = 80; // metres: the tooltip names a corner this close to the cursor

export default function ElevationProfile({
  label, title, sub, ariaLabel, source, locale, heights, lapLength, corners, kmTick, mTick, cornerTag, tip, className = '',
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const n = heights.length;
  if (n < 2 || lapLength <= 0) return null;
  const step = 10;
  const ymax = Math.max(step, Math.ceil(Math.max(...heights) / step) * step);
  const distAt = (i: number) => (i / (n - 1)) * lapLength;
  const x = (d: number) => L + (d / lapLength) * (W - L - R);
  const y = (h: number) => T + (1 - h / ymax) * (H - T - B);
  const heightAt = (d: number) => {
    const f = (d / lapLength) * (n - 1);
    const i = Math.min(n - 2, Math.max(0, Math.floor(f)));
    return heights[i] + (heights[i + 1] - heights[i]) * (f - i);
  };
  const line = heights.map((h, i) => `${x(distAt(i)).toFixed(1)},${y(h).toFixed(1)}`).join(' ');
  const yTicks = Array.from({ length: ymax / step + 1 }, (_, i) => i * step);
  const kmTicks = Array.from({ length: Math.floor(lapLength / 1000) + 1 }, (_, i) => i);
  const tag = (c: { number: string }) => cornerTag.replace('{n}', c.number);

  // Label corners left to right, skipping any that would crowd the previous label.
  const marks = corners.reduce<Array<{ number: string; distance: number; cx: number; cy: number; show: boolean }>>((acc, c) => {
    const cx = x(c.distance);
    const lastLabelX = acc.findLast((m) => m.show)?.cx ?? -Infinity;
    return [...acc, { ...c, cx, cy: y(heightAt(c.distance)), show: cx - lastLabelX >= LABEL_GAP }];
  }, []);

  const num1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const num2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  function onMove(e: PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    const sx = ((e.clientX - box.left) * W) / box.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((sx - L) / (W - L - R)) * (n - 1)))));
  }

  const hd = hover === null ? 0 : distAt(hover);
  const near = hover === null ? undefined : corners.find((c) => Math.abs(c.distance - hd) <= CORNER_SNAP);
  const tipText =
    hover === null
      ? ''
      : tip.replace('{km}', num2.format(hd / 1000)).replace('{m}', num1.format(heights[hover])) + (near ? ` · ${tag(near)}` : '');

  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-elev-title">
      <div>
        <p className="dusk-label m-0">{label}</p>
        <h2 id="dusk-elev-title" className="text-[17px] font-semibold m-0 mt-1">{title}</h2>
        <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{sub}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="dusk-elev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--dusk-ice)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--dusk-ice)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--dusk-line)" strokeDasharray={v ? '3 5' : undefined} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--dusk-muted)">{mTick.replace('{n}', String(v))}</text>
          </g>
        ))}
        {kmTicks.map((k) => (
          <text key={`x-${k}`} x={x(k * 1000)} y={H - 8} textAnchor={k ? 'middle' : 'start'} fontSize="12" fill="var(--dusk-muted)">
            {kmTick.replace('{n}', String(k))}
          </text>
        ))}
        <path d={`M${x(0)},${y(0)} L${line.split(' ').join(' L')} L${x(lapLength)},${y(0)} Z`} fill="url(#dusk-elev-fill)" />
        <polyline points={line} fill="none" stroke="var(--dusk-ice)" strokeWidth="2" strokeLinejoin="round" />
        {marks.map((m) => (
          <g key={`c-${m.number}`}>
            <circle cx={m.cx} cy={m.cy} r="2.5" fill="var(--dusk-ink)" />
            {m.show && (
              <text x={m.cx} y={m.cy - 9} textAnchor="middle" fontSize="12" fill="var(--dusk-ink-2)">{tag(m)}</text>
            )}
          </g>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hd)} x2={x(hd)} y1={T} y2={H - B} stroke="rgba(255,255,255,.3)" />
            <circle cx={x(hd)} cy={y(heights[hover])} r="4" fill="var(--dusk-ice)" stroke="var(--dusk-ground)" strokeWidth="2" />
            <g transform={`translate(${Math.min(Math.max(x(hd), L + 90), W - R - 90)},${T - 14})`}>
              <rect x="-90" y="-5" width="180" height="24" rx="8" fill="rgba(14,13,18,.94)" stroke="var(--dusk-line)" />
              <text x="0" y="11" textAnchor="middle" fontSize="12" fill="var(--dusk-ink)">{tipText}</text>
            </g>
          </g>
        )}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] mt-auto">{source}</p>
    </section>
  );
}
