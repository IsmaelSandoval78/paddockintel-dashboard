'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';
import type { ChampionYear } from '@/lib/types';

// Horizontal ribbon of every champion since 1950, ending at the in-progress season.
// Starts scrolled to the present; the user drags back through history.
export default function ChampionsWall({
  champions,
  motionOk,
  onSelect,
}: {
  champions: ChampionYear[];
  motionOk: boolean;
  onSelect: (driverId: number) => void;
}) {
  const t = useTranslations('drivers.wall');
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cumulative title count per driver, in year order — "×N" marks a dynasty building
  const titleNumber = new Map<number, number>();
  const cells = champions.map((c) => {
    const nth = c.in_progress
      ? (titleNumber.get(c.driver_id) ?? 0)
      : (titleNumber.get(c.driver_id) ?? 0) + 1;
    if (!c.in_progress) titleNumber.set(c.driver_id, nth);
    return { ...c, nth };
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Land on the present; history sits to the left
    el.scrollLeft = el.scrollWidth;
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      // Short pull from the past into the present — one flying lap through history
      gsap.from(el, {
        scrollLeft: el.scrollWidth - el.clientWidth - 320,
        duration: 1.6,
        ease: 'power3.out',
      });
      gsap.from('.wall-cell', {
        autoAlpha: 0,
        duration: 0.5,
        stagger: { each: 0.015, from: 'end' },
        ease: 'power2.out',
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  if (!champions.length) return null;

  return (
    <div ref={rootRef} className="border-b border-border">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          {t('title', { from: champions[0].year, to: champions[champions.length - 1].year })}
        </span>
        <InfoTooltip text={t('info')} />
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto">
          {t('hint')}
        </span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain">
        <div className="flex w-max border-t border-border-subtle">
          {cells.map((c) => (
            <button
              key={c.year}
              type="button"
              onClick={() => onSelect(c.driver_id)}
              className="wall-cell shrink-0 w-[116px] px-3 py-3 border-r border-border-subtle text-left cursor-pointer bg-transparent group"
              aria-label={`${c.year} · ${c.forename} ${c.surname}`}
            >
              <span className="flex items-baseline font-mono text-[10px] tabular-nums leading-none mb-2">
                <span style={{ color: c.in_progress ? 'var(--red)' : 'var(--text-3)' }}>{c.year}</span>
                {c.nth >= 2 && (
                  <span className="ml-auto" style={{ color: 'var(--text-3)' }}>×{c.nth}</span>
                )}
              </span>
              <span
                className="block uppercase text-[12px] leading-[1.05] truncate transition-colors duration-150 group-hover:text-[color:var(--red)]"
                style={{
                  fontFamily: 'var(--pi-display)',
                  letterSpacing: '-0.01em',
                  color: c.in_progress ? 'var(--red)' : 'var(--text-1)',
                }}
              >
                {c.surname}
              </span>
              {c.in_progress && (
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className="pulse-red inline-block w-1.5 h-1.5 rounded-full bg-red" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em]" style={{ color: 'var(--red)' }}>
                    {t('inProgress')}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
