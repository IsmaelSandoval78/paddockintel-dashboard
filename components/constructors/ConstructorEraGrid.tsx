'use client';

import { Link } from '@/lib/i18n/navigation';
import type { ConstructorAllTimeRow } from '@/lib/types';
import { flagGradient } from '@/lib/flagGradient';

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
  heroSize: string;
  nameSize: string;
}> = {
  modern:  { label: 'MODERN',  subtitle: 'Hybrid Era · 2014–2026',  gridClass: 'era-grid-modern',  heroSize: '88px',  nameSize: '18px' },
  v10:     { label: 'V10',     subtitle: 'Golden Era · 1989–2005',   gridClass: 'era-grid-v10',     heroSize: '72px',  nameSize: '16px' },
  turbo:   { label: 'TURBO',   subtitle: 'Turbo Era · 1977–1988',    gridClass: 'era-grid-turbo',   heroSize: '60px',  nameSize: '15px' },
  v8:      { label: 'V8',      subtitle: 'V8 Era · 2006–2013',       gridClass: 'era-grid-v8',      heroSize: '60px',  nameSize: '15px' },
  classic: { label: 'CLASSIC', subtitle: 'Classic Era · 1950–1976',  gridClass: 'era-grid-classic', heroSize: '52px',  nameSize: '14px' },
};

const ERA_ORDER: EraKey[] = ['modern', 'v10', 'turbo', 'v8', 'classic'];

// Official constructor border colors — fallback to hazard red
const CONSTRUCTOR_COLORS: Record<string, string> = {
  mercedes:       '#00D2BE',
  mclaren:        '#FF8700',
  red_bull:       '#3671C6',
  ferrari:        '#E8002D',
  alpine:         '#FF87BC',
  aston_martin:   '#358C75',
  haas:           '#B6BABD',
  williams:       '#64C4FF',
  sauber:         '#52E252',
  kick_sauber:    '#52E252',
  rb:             '#6692FF',
  alphatauri:     '#6692FF',
  toro_rosso:     '#469BFF',
  renault:        '#FFD700',
  benetton:       '#00964B',
  lotus_f1:       '#FFD700',
  team_lotus:     '#FFD700',
  lotus:          '#FFD700',
  brabham:        '#006400',
  tyrrell:        '#0033CC',
  brm:            '#003300',
  cooper:         '#006600',
  jordan:         '#FFB800',
  brawn:          '#B0FF00',
  force_india:    '#F596C8',
  racing_point:   '#F596C8',
  bar:            '#C8A000',
  jaguar:         '#006400',
  toyota:         '#CC0000',
  honda:          '#CC0000',
  stewart:        '#8B0000',
  minardi:        '#000080',
  arrows:         '#FF8C00',
  caterham:       '#006400',
  virgin:         '#CC0000',
  hispania:       '#CC0000',
  marussia:       '#CC0000',
  manor:          '#CC0000',
  march:          '#FF8C00',
  ligier:         '#002FA7',
  vanwall:        '#006400',
};

function constructorBorderColor(ref: string): string {
  return CONSTRUCTOR_COLORS[ref] ?? '#E61919';
}


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

function ConstructorCard({
  constructor: c,
  eraKey,
}: {
  constructor: ConstructorAllTimeRow;
  eraKey: EraKey;
}) {
  const meta = ERA_META[eraKey];
  const borderColor = constructorBorderColor(c.constructor_ref);
  const heroLetters = c.name.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/constructors/${c.constructor_ref}`}
      className="flex flex-col p-3 hover:bg-surface-raised transition-colors duration-100 select-none border-b border-r border-border"
      style={{
        background: 'var(--bg)',
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: '10px',
      }}
    >
      {/* Hero letters — flag gradient fill */}
      <span
        aria-hidden="true"
        className="block leading-none tabular-nums"
        style={{
          fontFamily: 'var(--pi-display)',
          fontSize: meta.heroSize,
          letterSpacing: '-0.04em',
          color: 'transparent',
          background: flagGradient(c.nationality),
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          userSelect: 'none',
        }}
      >
        {heroLetters}
      </span>

      {/* Constructor name */}
      <span
        className="block uppercase leading-none truncate text-text-1 mt-1"
        style={{
          fontFamily: 'var(--pi-display)',
          fontSize: meta.nameSize,
          letterSpacing: '-0.01em',
        }}
      >
        {c.name}
      </span>

      {/* Nationality */}
      <span className="block font-mono text-[10px] text-text-2 uppercase tracking-[0.06em] truncate mt-0.5 mb-2">
        {c.nationality}
      </span>

      {/* Stats — 3-col ink grid */}
      <div className="grid grid-cols-3 gap-px mt-auto" style={{ background: 'var(--border-subtle)' }}>
        {(
          [
            { label: 'W', value: c.wins },
            { label: 'C', value: c.championships },
            { label: 'R', value: c.races },
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
        {c.first_year}–{c.last_year}
      </span>
    </Link>
  );
}

interface ConstructorEraGridProps {
  constructors: ConstructorAllTimeRow[];
  activeEra: 'all' | EraKey;
}

export default function ConstructorEraGrid({ constructors, activeEra }: ConstructorEraGridProps) {
  // Group by era (already sorted by wins desc from server)
  const byEra = new Map<EraKey, ConstructorAllTimeRow[]>();
  for (const era of ERA_ORDER) byEra.set(era, []);
  for (const c of constructors) {
    const era = getEra(c.first_year, c.last_year);
    byEra.get(era)?.push(c);
  }

  const erasToShow = activeEra === 'all' ? ERA_ORDER : [activeEra];

  if (constructors.length === 0) {
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
    <div className="flex flex-col">
      {erasToShow.map((eraKey) => {
        const eraConstructors = byEra.get(eraKey) ?? [];
        if (eraConstructors.length === 0) return null;
        const meta = ERA_META[eraKey];

        return (
          <section key={eraKey} className="border-t border-border">
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
                {eraConstructors.length}
              </span>
            </div>

            {/* Constructor cards grid */}
            <div
              className={`grid ${meta.gridClass} border-t border-l border-border`}
              style={{ background: 'var(--bg)' }}
            >
              {eraConstructors.map((c) => (
                <ConstructorCard key={c.constructor_id} constructor={c} eraKey={eraKey} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
