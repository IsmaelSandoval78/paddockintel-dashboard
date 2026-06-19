'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import type { DriverAllTimeRow } from '@/lib/types';
import { flagGradient } from '@/lib/flagGradient';

gsap.registerPlugin(ScrollTrigger);

export type EraKey = 'modern' | 'v8' | 'v10' | 'turbo' | 'classic';

const ERA_RANGES: Array<{ key: EraKey; start: number; end: number }> = [
  { key: 'modern',  start: 2014, end: 2026 },
  { key: 'v8',      start: 2006, end: 2013 },
  { key: 'v10',     start: 1989, end: 2005 },
  { key: 'turbo',   start: 1977, end: 1988 },
  { key: 'classic', start: 1950, end: 1976 },
];

const ERA_META: Record<EraKey, {
  label: string;
  subtitle: string;
  gridClass: string;
  numberSize: string;
  surnameSize: string;
}> = {
  modern:  { label: 'MODERN',  subtitle: 'Hybrid Era · 2014–2026',  gridClass: 'era-grid-modern',  numberSize: '72px', surnameSize: '18px' },
  v10:     { label: 'V10',     subtitle: 'Golden Era · 1989–2005',   gridClass: 'era-grid-v10',     numberSize: '60px', surnameSize: '16px' },
  turbo:   { label: 'TURBO',   subtitle: 'Turbo Era · 1977–1988',    gridClass: 'era-grid-turbo',   numberSize: '52px', surnameSize: '15px' },
  v8:      { label: 'V8',      subtitle: 'V8 Era · 2006–2013',       gridClass: 'era-grid-v8',      numberSize: '52px', surnameSize: '15px' },
  classic: { label: 'CLASSIC', subtitle: 'Classic Era · 1950–1976',  gridClass: 'era-grid-classic', numberSize: '44px', surnameSize: '14px' },
};

// Display order: most recent era first (hero position)
const ERA_ORDER: EraKey[] = ['modern', 'v10', 'turbo', 'v8', 'classic'];


export function getEra(firstYear: number, lastYear: number): EraKey {
  let maxOverlap = 0;
  let best: EraKey = 'classic';
  for (const era of ERA_RANGES) {
    const overlap = Math.max(
      0,
      Math.min(lastYear, era.end) - Math.max(firstYear, era.start) + 1
    );
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      best = era.key;
    }
  }
  return best;
}

function DriverCard({ driver, eraKey }: { driver: DriverAllTimeRow; eraKey: EraKey }) {
  const meta = ERA_META[eraKey];
  const heroNum = driver.number ?? (driver.wins > 0 ? driver.wins : null);

  return (
    <Link
      href={`/drivers/${driver.driver_ref}`}
      className="flex flex-col p-3 hover:bg-surface-raised transition-colors duration-100 select-none border-b border-r border-border"
      style={{ background: 'var(--bg)' }}
    >
      {/* Hero number — flag gradient fill */}
      {heroNum !== null && (
        <span
          aria-hidden="true"
          className="block leading-none tabular-nums"
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: meta.numberSize,
            letterSpacing: '-0.04em',
            color: 'transparent',
            background: flagGradient(driver.nationality),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            userSelect: 'none',
          }}
        >
          {heroNum}
        </span>
      )}

      {/* Surname */}
      <span
        className="block uppercase leading-none truncate text-text-1 mt-1"
        style={{
          fontFamily: 'var(--pi-display)',
          fontSize: meta.surnameSize,
          letterSpacing: '-0.01em',
        }}
      >
        {driver.surname}
      </span>

      {/* Forename */}
      <span className="block font-mono text-[10px] text-text-2 uppercase tracking-[0.06em] truncate mt-0.5 mb-2">
        {driver.forename}
      </span>

      {/* Stats — 3-col ink grid */}
      <div className="grid grid-cols-3 gap-px mt-auto" style={{ background: 'var(--border-subtle)' }}>
        {(
          [
            { label: 'W', value: driver.wins },
            { label: 'C', value: driver.championships },
            { label: 'R', value: driver.races },
          ] as Array<{ label: string; value: number }>
        ).map(({ label, value }) => (
          <div key={label} className="px-1.5 py-1" style={{ background: 'var(--bg)' }}>
            <span className="block font-mono text-[9px] text-text-3 uppercase tracking-[0.08em] leading-none mb-0.5">
              {label}
            </span>
            <span
              className="block tabular-nums leading-none text-text-1"
              style={{ fontFamily: 'var(--pi-display)', fontSize: '13px' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Active years */}
      <span className="block font-mono text-[9px] text-text-3 mt-1.5 tabular-nums">
        {driver.first_year}–{driver.last_year}
      </span>
    </Link>
  );
}

interface EraGridProps {
  drivers: DriverAllTimeRow[];
  activeEra: 'all' | EraKey;
  motionOk?: boolean;
}

export default function EraGrid({ drivers, activeEra, motionOk = false }: EraGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Each era section fades up as it enters — too many driver cards to stagger individually.
  useEffect(() => {
    if (!motionOk || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.era-section').forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 92%', once: true },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [motionOk, activeEra]);

  // Group drivers by era (already sorted by wins desc from server)
  const byEra = new Map<EraKey, DriverAllTimeRow[]>();
  for (const era of ERA_ORDER) byEra.set(era, []);
  for (const d of drivers) {
    const era = getEra(d.first_year, d.last_year);
    byEra.get(era)?.push(d);
  }

  const erasToShow = activeEra === 'all' ? ERA_ORDER : [activeEra];

  if (drivers.length === 0) {
    return (
      <div
        className="px-5 py-12 text-center font-mono text-[13px] text-text-3 uppercase tracking-[0.1em]"
        style={{ background: 'var(--bg)' }}
      >
        —
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col">
      {erasToShow.map((eraKey) => {
        const eraDrivers = byEra.get(eraKey) ?? [];
        if (eraDrivers.length === 0) return null;
        const meta = ERA_META[eraKey];

        return (
          <section key={eraKey} className="era-section border-t border-border">
            {/* Era header */}
            <div className="flex items-baseline gap-3 px-5 py-3 flex-wrap">
              <h2
                className="uppercase leading-none text-text-1"
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                {'// '}{meta.label}
              </h2>
              <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.08em]">
                {meta.subtitle}
              </span>
              <span className="font-mono text-[10px] text-text-3 ml-auto tabular-nums">
                {eraDrivers.length}
              </span>
            </div>

            {/* Driver cards grid — border-t border-l so cards complete the 1px grid */}
            <div
              className={`grid ${meta.gridClass} border-t border-l border-border`}
              style={{ background: 'var(--bg)' }}
            >
              {eraDrivers.map((driver) => (
                <DriverCard key={driver.driver_id} driver={driver} eraKey={eraKey} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
