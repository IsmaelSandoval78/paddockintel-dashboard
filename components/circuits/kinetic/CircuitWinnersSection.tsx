'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface WinnerRow {
  year: number;
  forename: string;
  surname: string;
  constructor: string;
}

interface Props {
  winnerRows: WinnerRow[];
  firstYear: number | null;
  motionOk: boolean;
}

function constructorColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('red bull'))                         return 'var(--team-redbull)';
  if (n.includes('mercedes'))                         return 'var(--team-mercedes)';
  if (n.includes('ferrari'))                          return 'var(--team-ferrari)';
  if (n.includes('mclaren'))                          return 'var(--team-mclaren)';
  if (n.includes('alpine') || n.includes('renault'))  return 'var(--team-alpine)';
  if (n.includes('williams'))                         return 'var(--team-williams)';
  if (n.includes('aston martin'))                     return 'var(--team-aston)';
  if (n.includes('haas'))                             return 'var(--team-haas)';
  if (n.includes('sauber') || n.includes('alfa'))     return 'var(--team-sauber)';
  if (n.includes('alphatauri') || n.includes('toro rosso')) return 'var(--team-rb)';
  // Vintage — deterministic muted color from name hash
  const hash = Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const palette = [
    '#5B7FA6', // slate blue   (Lotus-ish)
    '#8B7355', // warm brown   (Brabham-ish)
    '#6B8E6B', // muted green  (Cooper-ish)
    '#9B6B5B', // terracotta   (BRM-ish)
    '#7B6B9B', // muted purple (Tyrrell-ish)
    '#6B8B8B', // teal grey    (March-ish)
    '#9B8B5B', // gold brown   (Matra-ish)
    '#8B5B7B', // mauve        (Wolf-ish)
  ];
  return palette[hash % palette.length];
}

export default function CircuitWinnersSection({ winnerRows, firstYear, motionOk }: Props) {
  const t = useTranslations('circuitDetail');
  const rootRef = useRef<HTMLDivElement>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const driverKey = (w: WinnerRow) => `${w.forename[0]}.${w.surname}`;

  // Win counts per driver
  const winMap = new Map<string, { forename: string; surname: string; constructor: string; wins: number }>();
  for (const w of winnerRows) {
    const k = driverKey(w);
    const e = winMap.get(k);
    if (e) { e.wins++; }
    else { winMap.set(k, { forename: w.forename, surname: w.surname, constructor: w.constructor, wins: 1 }); }
  }
  const drivers = [...winMap.entries()].sort((a, b) => b[1].wins - a[1].wins);
  const maxWins = drivers[0]?.[1].wins ?? 1;

  // Heatmap year range
  const latestYear = winnerRows.length > 0 ? Math.max(...winnerRows.map(w => w.year)) : new Date().getFullYear();
  const startYear = firstYear ?? latestYear;
  const yearMap = new Map(winnerRows.map(w => [w.year, w]));

  // Decades
  const firstDecade = Math.floor(startYear / 10) * 10;
  const lastDecade  = Math.floor(latestYear / 10) * 10;
  const decades: number[] = [];
  for (let d = firstDecade; d <= lastDecade; d += 10) decades.push(d);

  // Unique constructors sorted by first win year (for legend)
  const constructorOrder: string[] = [];
  const seenCon = new Set<string>();
  for (const w of [...winnerRows].sort((a, b) => a.year - b.year)) {
    if (!seenCon.has(w.constructor)) { seenCon.add(w.constructor); constructorOrder.push(w.constructor); }
  }

  useEffect(() => {
    if (!motionOk || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.wall-name', {
        y: 28,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.03,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.wall-grid', start: 'top 88%', once: true },
      });
      gsap.from('.winner-cell[data-has="1"]', {
        autoAlpha: 0,
        scale: 0.4,
        duration: 0.22,
        stagger: { each: 0.01, from: 'start' },
        ease: 'power2.out',
        scrollTrigger: { trigger: '.heatmap-grid', start: 'top 86%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  const hoveredWinner = hoveredYear !== null ? (yearMap.get(hoveredYear) ?? null) : null;

  return (
    <div ref={rootRef}>

      {/* ── Typographic wall ─────────────────────────────────── */}
      <div className="wall-grid px-6 pt-7 pb-7 border-b border-border">
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.07em]">
            {t('winners.all')}
            <span className="text-text-2 tabular-nums ml-2">{winnerRows.length}</span>
          </p>
          {selectedKey && (
            <button
              className="font-mono text-[10px] uppercase tracking-[0.06em] transition-colors duration-100"
              style={{ color: 'var(--red)' }}
              onClick={() => setSelectedKey(null)}
            >
              {t('winners.clear')} ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 leading-none">
          {drivers.map(([key, d]) => {
            const ratio    = (d.wins - 1) / Math.max(maxWins - 1, 1);
            const size     = 0.8 + ratio * 3.4;
            const isSelected = selectedKey === key;
            const isDimmed   = selectedKey !== null && !isSelected;
            return (
              <button
                key={key}
                className="wall-name uppercase tracking-[-0.025em] transition-all duration-200 leading-tight"
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize: `${size}rem`,
                  color: isSelected
                    ? 'var(--red)'
                    : isDimmed
                    ? 'var(--border-subtle)'
                    : 'var(--text-1)',
                }}
                onClick={() => setSelectedKey(selectedKey === key ? null : key)}
                title={`${d.forename} ${d.surname} — ${d.wins} win${d.wins > 1 ? 's' : ''}`}
              >
                {d.surname}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Heatmap ──────────────────────────────────────────── */}
      <div className="heatmap-grid px-6 py-6">

        {/* Info bar */}
        <div className="h-7 mb-5 flex items-center">
          {hoveredWinner ? (
            <div className="flex items-center gap-2.5 font-mono text-[11px]">
              <span className="text-text-3 tabular-nums">{hoveredYear}</span>
              <span className="text-text-3">·</span>
              <span
                className="uppercase leading-none text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '0.95rem', letterSpacing: '-0.01em' }}
              >
                {hoveredWinner.forename[0]}. {hoveredWinner.surname}
              </span>
              <span className="text-text-3">·</span>
              <span className="text-text-2">{hoveredWinner.constructor}</span>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
              {selectedKey
                ? `${winMap.get(selectedKey)?.wins} ${t('winners.victories')}`
                : t('winners.hover')}
            </p>
          )}
        </div>

        {/* Decade rows */}
        <div className="flex flex-col gap-[4px]">
          {decades.map((decade) => (
            <div key={decade} className="flex items-center gap-[4px]">
              <span className="font-mono text-[9px] text-text-3 tabular-nums w-8 shrink-0 text-right select-none">
                {decade}s
              </span>
              <div className="flex gap-[3px]">
                {Array.from({ length: 10 }, (_, i) => {
                  const yr = decade + i;

                  // outside circuit's history — invisible spacer
                  if (yr < startYear || yr > latestYear) {
                    return <div key={yr} className="w-[20px] h-[20px] shrink-0" />;
                  }

                  const winner = yearMap.get(yr);
                  const winKey = winner ? driverKey(winner) : null;
                  const matchesSelected = winKey === selectedKey;
                  const isDriverSelected = selectedKey !== null;
                  const isHovered = yr === hoveredYear;

                  return (
                    <div
                      key={yr}
                      data-has={winner ? '1' : '0'}
                      className="winner-cell w-[20px] h-[20px] shrink-0 transition-all duration-150"
                      style={{
                        background: winner
                          ? constructorColor(winner.constructor)
                          : 'var(--border-subtle)',
                        opacity: winner
                          ? (isDriverSelected && !matchesSelected ? 0.08 : 1)
                          : 0.22,
                        boxShadow: isHovered ? `0 0 0 1.5px var(--text-1)` : 'none',
                        cursor: winner ? 'pointer' : 'default',
                      }}
                      onMouseEnter={() => { if (winner) setHoveredYear(yr); }}
                      onMouseLeave={() => setHoveredYear(null)}
                      onClick={() => {
                        if (winner) {
                          const k = driverKey(winner);
                          setSelectedKey(selectedKey === k ? null : k);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Constructor legend */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {constructorOrder.map((con) => (
            <div key={con} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 shrink-0" style={{ background: constructorColor(con) }} />
              <span className="font-mono text-[9px] text-text-3 leading-none">{con}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
