'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { DriverSelectorRow, HomeScorecardData } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────

const CARD_SHADOW = '8px 8px 20px rgba(5,5,5,0.14), -6px -6px 14px rgba(255,255,255,0.75)';
const INPUT_SHADOW = 'inset 3px 3px 6px rgba(5,5,5,0.10), inset -2px -2px 4px rgba(255,255,255,0.7)';
const INPUT_SHADOW_FOCUS = 'inset 3px 3px 6px rgba(5,5,5,0.12), inset -2px -2px 4px rgba(255,255,255,0.7), 0 0 0 1px #E61919';

// ─── Nationality flag — 3 vertical color strips ───────────────────

const FLAG: Record<string, readonly [string, string, string]> = {
  'Italian':        ['#009246', '#E8E6E0', '#CE2B37'],
  'British':        ['#012169', '#E8E6E0', '#C8102E'],
  'Dutch':          ['#AE1C28', '#E8E6E0', '#21468B'],
  'French':         ['#002395', '#E8E6E0', '#ED2939'],
  'Australian':     ['#00008B', '#E8E6E0', '#FF0000'],
  'Spanish':        ['#AA151B', '#F1BF00', '#AA151B'],
  'Finnish':        ['#E8E6E0', '#003580', '#E8E6E0'],
  'Canadian':       ['#FF0000', '#E8E6E0', '#FF0000'],
  'German':         ['#000000', '#DD0000', '#FFCE00'],
  'Mexican':        ['#006847', '#E8E6E0', '#CE1126'],
  'American':       ['#B22234', '#E8E6E0', '#3C3B6E'],
  'Monégasque':     ['#CE1126', '#E8E6E0', '#CE1126'],
  'New Zealander':  ['#00247D', '#E8E6E0', '#CC142B'],
  'Argentine':      ['#74ACDF', '#E8E6E0', '#74ACDF'],
  'Brazilian':      ['#009C3B', '#FEDF00', '#002776'],
  'Thai':           ['#A51931', '#F4F5F8', '#2D2A4A'],
  'Japanese':       ['#E8E6E0', '#BC002D', '#E8E6E0'],
  'Austrian':       ['#EE0000', '#E8E6E0', '#EE0000'],
  'Belgian':        ['#000000', '#FAE042', '#EF3340'],
  'Danish':         ['#C60C30', '#E8E6E0', '#C60C30'],
  'Swedish':        ['#006AA7', '#FECC00', '#006AA7'],
  'Swiss':          ['#FF0000', '#E8E6E0', '#FF0000'],
  'Colombian':      ['#FCD116', '#003087', '#CE1126'],
  'Russian':        ['#E8E6E0', '#0039A6', '#D52B1E'],
  'South African':  ['#007A4D', '#FFB81C', '#001489'],
  'Venezuelan':     ['#CF142B', '#E8E6E0', '#003893'],
  'Polish':         ['#E8E6E0', '#DC143C', '#E8E6E0'],
};

function flagGradient(nationality: string): string {
  const c = FLAG[nationality];
  if (!c) return 'linear-gradient(to right, var(--border-subtle) 0%, var(--text-3) 100%)';
  return `linear-gradient(to right,${c[0]} 0%,${c[0]} 33.33%,${c[1]} 33.33%,${c[1]} 66.66%,${c[2]} 66.66%,${c[2]} 100%)`;
}

// ─── Filled scorecard display ─────────────────────────────────────

function ScorecardFilled({ sc }: { sc: HomeScorecardData }) {
  const t = useTranslations('hub.home');

  const stats: Array<{ label: string; value: number }> = [
    { label: t('wins').toUpperCase(),        value: sc.wins },
    { label: t('podiums').toUpperCase(),     value: sc.podiums },
    { label: t('poles').toUpperCase(),       value: sc.poles },
    { label: t('fastestLaps').toUpperCase(), value: sc.fastest_laps },
    { label: t('races').toUpperCase(),       value: sc.races },
    { label: t('dnfs').toUpperCase(),        value: sc.dnfs },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero number — flag gradient fill */}
      <div className="flex justify-center mb-2">
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: '120px',
            lineHeight: 0.88,
            letterSpacing: '-0.04em',
            color: 'transparent',
            background: flagGradient(sc.nationality),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            userSelect: 'none',
            display: 'block',
          }}
        >
          {sc.number !== null ? sc.number : '—'}
        </span>
      </div>

      {/* Surname */}
      <h3
        className="text-[24px] uppercase leading-none tracking-[-0.02em] text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {sc.surname}
      </h3>

      {/* Forename + Nationality + Code */}
      <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em] mt-1">
        {sc.forename}
        <span className="text-text-3 mx-1">·</span>
        {sc.nationality}
        {sc.code && <span className="text-text-3 ml-1">{sc.code}</span>}
      </p>

      {/* Stats — 2-col × 3-row ink grid */}
      <div className="grid grid-cols-2 gap-px mt-4 w-full" style={{ background: 'var(--border-subtle)' }}>
        {stats.map(({ label, value }) => (
          <div key={label} className="p-3" style={{ background: 'var(--bg)' }}>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-1">
              {label}
            </p>
            <p
              className="tabular-nums leading-none text-text-1"
              style={{ fontFamily: 'var(--pi-display)', fontSize: '28px' }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/drivers/${sc.driver_ref}`}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-100 mt-4 block"
      >
        [ {t('fullProfile').toUpperCase()} → ]
      </Link>
    </div>
  );
}

// ─── Single scorecard slot ─────────────────────────────────────────

function ScorecardSlot({
  allDrivers,
  excludeRef,
  onSelectedChange,
}: {
  allDrivers: DriverSelectorRow[];
  excludeRef: string | null;
  onSelectedChange: (ref: string | null) => void;
}) {
  const t = useTranslations('hub.home');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DriverSelectorRow | null>(null);
  const [scorecard, setScorecard] = useState<HomeScorecardData | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = (
    query.trim().length === 0
      ? allDrivers
      : allDrivers.filter((d) =>
          `${d.forename} ${d.surname}`.toLowerCase().includes(query.toLowerCase())
        )
  )
    .filter((d) => d.driver_ref !== excludeRef)
    .slice(0, 80);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleSelect = useCallback(
    async (driver: DriverSelectorRow) => {
      setSelected(driver);
      onSelectedChange(driver.driver_ref);
      setQuery('');
      setOpen(false);
      setScorecard(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/home/driver/${driver.driver_ref}`);
        if (res.ok) setScorecard((await res.json()) as HomeScorecardData);
      } catch {
        // leave scorecard null; empty state shows
      }
      setLoading(false);
    },
    [onSelectedChange]
  );

  function handleClear() {
    setSelected(null);
    setScorecard(null);
    onSelectedChange(null);
    setQuery('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col min-h-[420px]"
      style={{ background: 'var(--bg)', boxShadow: CARD_SHADOW }}
    >
      {/* Search / selected row */}
      <div ref={wrapRef} className="relative mb-4 shrink-0">
        {selected ? (
          <div
            className="flex items-center justify-between h-11 px-3"
            style={{ background: 'var(--bg)', borderRadius: '8px', boxShadow: INPUT_SHADOW }}
          >
            <span className="font-mono text-[13px] text-text-1 truncate">
              {selected.forename} <strong style={{ fontFamily: 'var(--pi-display)' }}>{selected.surname.toUpperCase()}</strong>
            </span>
            <button
              onClick={handleClear}
              aria-label="Clear selection"
              className="font-mono text-[15px] text-text-3 hover:text-text-1 transition-colors duration-100 ml-2 shrink-0 bg-transparent border-0 p-0 cursor-pointer leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={(e) => { setOpen(true); e.currentTarget.style.boxShadow = INPUT_SHADOW_FOCUS; }}
              onBlur={(e) => (e.currentTarget.style.boxShadow = INPUT_SHADOW)}
              placeholder={`[ ${t('selectDriver').toUpperCase()} ]`}
              autoComplete="off"
              className="w-full h-11 px-3 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus:outline-none"
              style={{
                background: 'var(--bg)',
                borderRadius: '8px',
                boxShadow: INPUT_SHADOW,
                border: 'none',
              }}
            />
            {open && filtered.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 z-20 max-h-56 overflow-y-auto"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 0, marginTop: '2px' }}
              >
                {filtered.map((d) => (
                  <button
                    key={d.driver_id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(d); }}
                    className="w-full flex items-center gap-3 px-3 h-10 text-left hover:bg-surface-raised transition-colors duration-100 cursor-pointer bg-transparent border-0"
                  >
                    <span
                      className="text-[13px] uppercase text-text-1 shrink-0"
                      style={{ fontFamily: 'var(--pi-display)' }}
                    >
                      {d.surname}
                    </span>
                    <span className="font-mono text-[11px] text-text-2 truncate">{d.forename}</span>
                    <span className="font-mono text-[10px] text-text-3 ml-auto shrink-0">{d.nationality}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[13px] text-text-3 uppercase tracking-[0.1em]">
              [ LOADING... ]
            </span>
          </div>
        ) : scorecard ? (
          <ScorecardFilled sc={scorecard} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[13px] text-text-3 uppercase tracking-[0.06em]">
              [ {t('selectDriver').toUpperCase()} ]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────

export default function CompareScorecardsSection({ allDrivers }: { allDrivers: DriverSelectorRow[] }) {
  const t = useTranslations('hub.home');
  const [refA, setRefA] = useState<string | null>(null);
  const [refB, setRefB] = useState<string | null>(null);

  return (
    <section className="px-4 md:px-6 pb-6">
      {/* ASCII section label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
        03 · {t('compareTitle').toUpperCase()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-0">
        <ScorecardSlot allDrivers={allDrivers} excludeRef={refB} onSelectedChange={setRefA} />

        {/* VS separator */}
        <div className="flex items-center justify-center py-4 md:py-0 md:px-8 md:self-center">
          <span
            className="text-[32px] leading-none text-text-1 select-none"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            VS
          </span>
        </div>

        <ScorecardSlot allDrivers={allDrivers} excludeRef={refA} onSelectedChange={setRefB} />
      </div>
    </section>
  );
}
