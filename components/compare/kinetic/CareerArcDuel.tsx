'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

export type ArcSeason = {
  year: number;
  wins: number;
  /** Championship-winning season */
  title: boolean;
};

const VIEW_W = 1000;
const VIEW_H = 300;
const PAD_X = 6;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;
const LABEL_GUTTER = 110;

// Cumulative wins by career season — era-neutral: both careers start at S1,
// so Fangio and Verstappen overlay honestly. Gold dots mark title seasons.
export default function CareerArcDuel({
  aSeasons,
  bSeasons,
  aLabel,
  bLabel,
  aColor,
  bColor,
  pairKey,
  motionOk,
  index,
}: {
  aSeasons: ArcSeason[];
  bSeasons: ArcSeason[];
  aLabel: string;
  bLabel: string;
  aColor: string;
  bColor: string;
  pairKey: string;
  motionOk: boolean;
  index: string;
}) {
  const t = useTranslations('compare.arc');
  const rootRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<'a' | 'b' | null>(null);

  useEffect(() => {
    if (!motionOk || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.arc-duel-line',
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          duration: 1.6,
          stagger: 0.18,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
        }
      );
      gsap.from('.arc-duel-dot, .arc-duel-label', {
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power2.out',
        delay: 1.2,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, pairKey]);

  const series = [
    { key: 'a' as const, seasons: aSeasons, label: aLabel, color: aColor },
    { key: 'b' as const, seasons: bSeasons, label: bLabel, color: bColor },
  ].map((s) => {
    let cum = 0;
    const points = s.seasons.map((season) => {
      cum += season.wins;
      return { cum, year: season.year, title: season.title };
    });
    return { ...s, points, total: cum };
  });

  const maxX = Math.max(series[0].points.length, series[1].points.length);
  const maxY = Math.max(series[0].total, series[1].total, 1);
  if (maxX < 2) return null;

  const innerW = VIEW_W - PAD_X - LABEL_GUTTER;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (i / (maxX - 1)) * innerW;
  const y = (v: number) => PAD_TOP + innerH - (v / maxY) * innerH;

  const drawn = series.map((s) => {
    const coords = s.points.map((p, i) => ({ ...p, x: x(i), y: y(p.cum) }));
    const d = coords
      .map((c, i) => `${i === 0 ? `M ${c.x.toFixed(1)},${y(0).toFixed(1)} L` : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' ');
    return { ...s, coords, d, end: coords[coords.length - 1] };
  });

  // Season ticks: S1, then every 5
  const ticks: number[] = [0];
  for (let i = 4; i < maxX; i += 5) ticks.push(i);
  if (ticks[ticks.length - 1] !== maxX - 1) ticks.push(maxX - 1);

  const dim = (key: 'a' | 'b') => hovered !== null && hovered !== key;

  // End labels: avoid vertical collision
  const labels = drawn
    .map((s) => ({ ...s, topPct: (s.end.y / VIEW_H) * 100 }))
    .sort((p, q) => p.topPct - q.topPct);
  if (labels.length === 2 && labels[1].topPct - labels[0].topPct < 8) {
    labels[1].topPct = labels[0].topPct + 8;
  }

  return (
    <section ref={rootRef} className="border-b border-border" aria-label={t('title')}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          {index} · {t('title')}
        </span>
        <InfoTooltip text={t('info')} />
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto hidden md:block">
          {t('axis')}
        </span>
      </div>

      <div className="px-5 pt-4 pb-6">
        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: 'clamp(160px, 24vw, 280px)' }}
            role="img"
            aria-label={t('title')}
          >
            <line
              x1={PAD_X} y1={y(0)} x2={VIEW_W - LABEL_GUTTER + 30} y2={y(0)}
              stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke"
            />
            {drawn.map((s) => (
              <g key={s.key}>
                <path
                  className="arc-duel-line"
                  d={s.d}
                  stroke={s.color}
                  strokeWidth="2.25"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  style={{ opacity: dim(s.key) ? 0.15 : 1, transition: 'opacity 150ms ease-out' }}
                />
                <path
                  d={s.d}
                  stroke="transparent"
                  strokeWidth="16"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHovered(s.key)}
                  onMouseLeave={() => setHovered(null)}
                />
                {/* Title-season markers */}
                {s.coords.filter((c) => c.title).map((c) => (
                  <circle
                    key={c.year}
                    className="arc-duel-dot"
                    cx={c.x}
                    cy={c.y}
                    r={4}
                    fill="var(--gold)"
                    stroke="var(--bg)"
                    strokeWidth="1"
                    style={{ opacity: dim(s.key) ? 0.15 : 1, transition: 'opacity 150ms ease-out' }}
                  >
                    <title>{`${c.year} · ${t('champion')}`}</title>
                  </circle>
                ))}
                <circle
                  className="arc-duel-dot"
                  cx={s.end.x}
                  cy={s.end.y}
                  r={3.5}
                  fill={s.color}
                  style={{ opacity: dim(s.key) ? 0.15 : 1, transition: 'opacity 150ms ease-out' }}
                />
              </g>
            ))}
          </svg>

          {/* End-of-line labels */}
          {labels.map((s) => (
            <button
              key={s.key}
              type="button"
              className="arc-duel-label absolute font-mono text-[10px] tabular-nums uppercase tracking-[0.06em] cursor-pointer bg-transparent border-0 p-0 text-left"
              style={{
                left: `${((s.end.x + 10) / VIEW_W) * 100}%`,
                top: `${s.topPct}%`,
                transform: 'translateY(-50%)',
                color: s.color,
                opacity: dim(s.key) ? 0.25 : 1,
                transition: 'opacity 150ms ease-out',
              }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
            >
              {s.label}
              <span className="text-text-2 ml-1.5">{s.total}W</span>
            </button>
          ))}
        </div>

        {/* Season ticks */}
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
                key={idx}
                className="font-mono text-[9px] text-text-3 tabular-nums absolute top-0 uppercase"
                style={anchor}
              >
                S{idx + 1}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
