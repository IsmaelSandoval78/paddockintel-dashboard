'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  DriverSelectorRow,
  ConstructorSelectorRow,
  CompareDriverData,
  CompareConstructorData,
  CompareDriverSeason,
  CompareConstructorSeason,
} from '@/lib/types';

type Mode = 'drivers' | 'constructors';

// ─── Team color map (for constructor dots) ────────────────────────
const TEAM_COLORS: Record<string, string> = {
  mercedes:     'var(--team-mercedes)',
  mclaren:      'var(--team-mclaren)',
  red_bull:     'var(--team-redbull)',
  ferrari:      'var(--team-ferrari)',
  alpine:       'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas:         'var(--team-haas)',
  williams:     'var(--team-williams)',
  sauber:       'var(--team-sauber)',
  kick_sauber:  'var(--team-sauber)',
  rb:           'var(--team-rb)',
  alphatauri:   'var(--team-rb)',
};
function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

// ─── Combobox selector ────────────────────────────────────────────
function Combobox<T extends { label: string; ref: string; sub: string }>({
  items,
  selected,
  onSelect,
  placeholder,
  excludeRef,
}: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  placeholder: string;
  excludeRef: string | null;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.length < 1
    ? items.slice(0, 80)
    : items.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 80);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(item: T) {
    onSelect(item);
    setQuery('');
    setOpen(false);
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 h-10 px-4 border border-border bg-surface">
        <span className="text-[13px] font-medium text-text-1 flex-1 truncate">
          {selected.label}
        </span>
        <span className="font-mono text-[11px] text-text-3 truncate hidden sm:block">
          {selected.sub}
        </span>
        <button
          onClick={() => onSelect(null as unknown as T)}
          className="font-mono text-[13px] text-text-3 hover:text-text-1 transition-colors duration-100 shrink-0 ml-2"
          aria-label="Clear"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full h-10 px-4 font-mono text-[11px] text-text-2 placeholder:text-text-3 bg-surface border border-border focus:outline-none focus:border-text-3 transition-colors duration-100"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 max-h-[220px] overflow-y-auto bg-surface border border-border border-t-0">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 font-mono text-[11px] text-text-3">—</div>
          ) : (
            filtered.map((item) => {
              const disabled = item.ref === excludeRef;
              return (
                <button
                  key={item.ref}
                  onClick={() => !disabled && handleSelect(item)}
                  disabled={disabled}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-100',
                    disabled
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-surface-raised cursor-pointer',
                  ].join(' ')}
                >
                  <span className="text-[13px] text-text-1 flex-1 truncate">{item.label}</span>
                  <span className="font-mono text-[10px] text-text-3 shrink-0">{item.sub}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Career stat row ──────────────────────────────────────────────
function StatRow({
  label,
  a,
  b,
  lowerIsBetter = false,
}: {
  label: string;
  a: string | number;
  b: string | number;
  lowerIsBetter?: boolean;
}) {
  const aNum = typeof a === 'number' ? a : parseFloat(String(a));
  const bNum = typeof b === 'number' ? b : parseFloat(String(b));
  const aWins = !isNaN(aNum) && !isNaN(bNum) && aNum !== bNum
    ? lowerIsBetter ? aNum < bNum : aNum > bNum
    : null;
  const bWins = aWins === null ? null : !aWins;

  return (
    <div className="flex items-center h-10 border-b border-border px-0">
      <span className={[
        'flex-1 text-right font-mono text-[13px] tabular-nums pr-5',
        aWins ? 'text-text-1 font-semibold' : 'text-text-2',
      ].join(' ')}>
        {a}
      </span>
      <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-36 text-center shrink-0 px-2">
        {label}
      </span>
      <span className={[
        'flex-1 font-mono text-[13px] tabular-nums pl-5',
        bWins ? 'text-text-1 font-semibold' : 'text-text-2',
      ].join(' ')}>
        {b}
      </span>
    </div>
  );
}

// ─── Head-to-head table row ───────────────────────────────────────
function HthRow({
  year,
  team,
  aPos,
  aPts,
  aWins,
  bPos,
  bPts,
  bWins,
  t,
}: {
  year: number;
  team?: string;
  aPos: number | null;
  aPts: number;
  aWins: number;
  bPos: number | null;
  bPts: number;
  bWins: number;
  t: ReturnType<typeof useTranslations<'compare'>>;
}) {
  const aIsWinner = aPos !== null && bPos !== null
    ? aPos < bPos
    : bPos === null && aPos !== null;
  const bIsWinner = aPos !== null && bPos !== null
    ? bPos < aPos
    : aPos === null && bPos !== null;

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface transition-colors duration-100">
      <td className="px-5 py-2.5 font-mono text-xs text-text-3 tabular-nums w-16">{year}</td>
      {team !== undefined && (
        <td className="px-4 py-2.5 text-[13px] text-text-2 truncate max-w-[120px]">{team}</td>
      )}
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-10', aIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {aPos !== null ? `P${aPos}` : '—'}
      </td>
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-14', aIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {aPts}
      </td>
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-10', aIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {aWins}
      </td>
      <td className="px-4 py-2.5 w-8 text-center">
        <span className="font-mono text-[10px] text-text-3">vs</span>
      </td>
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-10', bIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {bPos !== null ? `P${bPos}` : '—'}
      </td>
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-14', bIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {bPts}
      </td>
      <td className={['px-4 py-2.5 font-mono text-[13px] tabular-nums text-right w-10', bIsWinner ? 'text-text-1 font-semibold' : 'text-text-2'].join(' ')}>
        {bWins}
      </td>
      <td className="px-5 py-2.5 font-mono text-[11px] text-right w-14">
        {aIsWinner
          ? <span className="text-red">A</span>
          : bIsWinner
            ? <span className="text-red">B</span>
            : <span className="text-text-3">—</span>}
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function CompareClient({
  drivers,
  constructors,
}: {
  drivers: DriverSelectorRow[];
  constructors: ConstructorSelectorRow[];
}) {
  const t = useTranslations('compare');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>(
    (searchParams.get('type') as Mode | null) ?? 'drivers'
  );
  const [driverA, setDriverA] = useState<DriverSelectorRow | null>(null);
  const [driverB, setDriverB] = useState<DriverSelectorRow | null>(null);
  const [constructorA, setConstructorA] = useState<ConstructorSelectorRow | null>(null);
  const [constructorB, setConstructorB] = useState<ConstructorSelectorRow | null>(null);
  const [dataA, setDataA] = useState<CompareDriverData | CompareConstructorData | null>(null);
  const [dataB, setDataB] = useState<CompareDriverData | CompareConstructorData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('type', mode);
    if (mode === 'drivers') {
      if (driverA) params.set('a', driverA.driver_ref);
      if (driverB) params.set('b', driverB.driver_ref);
    } else {
      if (constructorA) params.set('a', constructorA.constructor_ref);
      if (constructorB) params.set('b', constructorB.constructor_ref);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [mode, driverA, driverB, constructorA, constructorB, router]);

  // Initialise from URL on mount
  useEffect(() => {
    const type = searchParams.get('type') as Mode | null;
    const aRef = searchParams.get('a');
    const bRef = searchParams.get('b');
    if (type === 'constructors') {
      setMode('constructors');
      if (aRef) setConstructorA(constructors.find((c) => c.constructor_ref === aRef) ?? null);
      if (bRef) setConstructorB(constructors.find((c) => c.constructor_ref === bRef) ?? null);
    } else {
      if (aRef) setDriverA(drivers.find((d) => d.driver_ref === aRef) ?? null);
      if (bRef) setDriverB(drivers.find((d) => d.driver_ref === bRef) ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDriver = useCallback(async (ref: string, slot: 'a' | 'b') => {
    if (slot === 'a') setLoadingA(true); else setLoadingB(true);
    try {
      const res = await fetch(`/api/compare/driver/${ref}`);
      const data = await res.json() as CompareDriverData;
      if (slot === 'a') setDataA(data); else setDataB(data);
    } finally {
      if (slot === 'a') setLoadingA(false); else setLoadingB(false);
    }
  }, []);

  const fetchConstructor = useCallback(async (ref: string, slot: 'a' | 'b') => {
    if (slot === 'a') setLoadingA(true); else setLoadingB(true);
    try {
      const res = await fetch(`/api/compare/constructor/${ref}`);
      const data = await res.json() as CompareConstructorData;
      if (slot === 'a') setDataA(data); else setDataB(data);
    } finally {
      if (slot === 'a') setLoadingA(false); else setLoadingB(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'drivers' && driverA) fetchDriver(driverA.driver_ref, 'a');
    else setDataA(null);
  }, [driverA, mode, fetchDriver]);

  useEffect(() => {
    if (mode === 'drivers' && driverB) fetchDriver(driverB.driver_ref, 'b');
    else setDataB(null);
  }, [driverB, mode, fetchDriver]);

  useEffect(() => {
    if (mode === 'constructors' && constructorA) fetchConstructor(constructorA.constructor_ref, 'a');
    else setDataA(null);
  }, [constructorA, mode, fetchConstructor]);

  useEffect(() => {
    if (mode === 'constructors' && constructorB) fetchConstructor(constructorB.constructor_ref, 'b');
    else setDataB(null);
  }, [constructorB, mode, fetchConstructor]);

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setDataA(null);
    setDataB(null);
  }

  // Selector items
  const driverItems = drivers.map((d) => ({
    ref: d.driver_ref,
    label: `${d.forename} ${d.surname}`,
    sub: `${d.nationality} · ${d.wins}W`,
    _row: d,
  }));
  const constructorItems = constructors.map((c) => ({
    ref: c.constructor_ref,
    label: c.name,
    sub: `${c.nationality} · ${c.wins}W`,
    _row: c,
  }));

  const bothSelected = mode === 'drivers'
    ? !!(driverA && driverB)
    : !!(constructorA && constructorB);

  const isDriverData = (d: CompareDriverData | CompareConstructorData): d is CompareDriverData =>
    'driver_ref' in d;

  // ─── H2H computation ─────────────────────────────────────────────

  type TeammateRow = {
    year: number;
    team: string;
    aSeason: CompareDriverSeason;
    bSeason: CompareDriverSeason;
  };

  type SharedSeasonRow = {
    year: number;
    aSeason: CompareConstructorSeason;
    bSeason: CompareConstructorSeason;
  };

  let teammateRows: TeammateRow[] = [];
  let sharedSeasonRows: SharedSeasonRow[] = [];

  if (bothSelected && dataA && dataB) {
    if (isDriverData(dataA) && isDriverData(dataB)) {
      const bSeasonByYear = new Map(dataB.seasons.map((s) => [s.year, s]));
      for (const aSeason of dataA.seasons) {
        const bSeason = bSeasonByYear.get(aSeason.year);
        if (bSeason && aSeason.constructor_ref && aSeason.constructor_ref === bSeason.constructor_ref) {
          teammateRows.push({ year: aSeason.year, team: aSeason.constructor_name, aSeason, bSeason });
        }
      }
      teammateRows.sort((x, y) => y.year - x.year);
    } else if (!isDriverData(dataA) && !isDriverData(dataB)) {
      const bSeasonByYear = new Map(dataB.seasons.map((s) => [s.year, s]));
      for (const aSeason of dataA.seasons) {
        const bSeason = bSeasonByYear.get(aSeason.year);
        if (bSeason) {
          sharedSeasonRows.push({ year: aSeason.year, aSeason, bSeason });
        }
      }
      sharedSeasonRows.sort((x, y) => y.year - x.year);
    }
  }

  // ─── Rendering ───────────────────────────────────────────────────

  const Loader = () => (
    <span className="font-mono text-[11px] text-text-3 animate-pulse">···</span>
  );

  return (
    <main className="flex flex-col">

      {/* ── Header + mode tabs ─────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-5 shrink-0">
        <span className="font-mono text-xs text-text-3">05 ·</span>
        <h1 className="font-serif text-2xl text-text-1">{t('title')}</h1>
        <div className="flex items-center gap-4 ml-4">
          {(['drivers', 'constructors'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={[
                'font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0',
                mode === m ? 'text-red' : 'text-text-2 hover:text-text-1',
              ].join(' ')}
            >
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Selectors ──────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 border-b border-border">
        <div className="p-5">
          {mode === 'drivers' ? (
            <Combobox
              items={driverItems}
              selected={driverA ? { ...driverItems.find((i) => i.ref === driverA.driver_ref)! } : null}
              onSelect={(item) => setDriverA(item ? item._row : null)}
              placeholder={t('selector.searchDrivers')}
              excludeRef={driverB?.driver_ref ?? null}
            />
          ) : (
            <Combobox
              items={constructorItems}
              selected={constructorA ? { ...constructorItems.find((i) => i.ref === constructorA.constructor_ref)! } : null}
              onSelect={(item) => setConstructorA(item ? item._row : null)}
              placeholder={t('selector.searchConstructors')}
              excludeRef={constructorB?.constructor_ref ?? null}
            />
          )}
        </div>
        <div className="flex items-center justify-center px-5 border-x border-border">
          <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em]">
            {t('selector.vs')}
          </span>
        </div>
        <div className="p-5">
          {mode === 'drivers' ? (
            <Combobox
              items={driverItems}
              selected={driverB ? { ...driverItems.find((i) => i.ref === driverB.driver_ref)! } : null}
              onSelect={(item) => setDriverB(item ? item._row : null)}
              placeholder={t('selector.searchDrivers')}
              excludeRef={driverA?.driver_ref ?? null}
            />
          ) : (
            <Combobox
              items={constructorItems}
              selected={constructorB ? { ...constructorItems.find((i) => i.ref === constructorB.constructor_ref)! } : null}
              onSelect={(item) => setConstructorB(item ? item._row : null)}
              placeholder={t('selector.searchConstructors')}
              excludeRef={constructorA?.constructor_ref ?? null}
            />
          )}
        </div>
      </div>

      {/* ── Prompt (nothing selected yet) ──────────────────────── */}
      {!bothSelected && (
        <div className="px-5 py-12 text-center">
          <p className="font-mono text-[13px] text-text-3">
            {t('prompt', { type: t(`mode.${mode}`).toLowerCase() })}
          </p>
        </div>
      )}

      {/* ── Comparison panels (once both selected + data loaded) ── */}
      {bothSelected && dataA && dataB && (
        <>
          {/* ── Entity headers ───────────────────────────────────── */}
          <div className="grid grid-cols-[1fr_144px_1fr] border-b border-border">
            <div className="px-6 py-5 border-r border-border">
              {isDriverData(dataA) ? (
                <>
                  <p className="font-mono text-[11px] text-text-3 mb-0.5">
                    {dataA.nationality}
                    {dataA.code && <span className="ml-2">{dataA.code}</span>}
                  </p>
                  <h2 className="font-serif text-[28px] text-text-1 leading-tight">
                    {dataA.surname}
                  </h2>
                  <p className="text-[13px] text-text-2">{dataA.forename}</p>
                  <p className="font-mono text-[11px] text-text-3 mt-1">
                    {dataA.first_year}–{dataA.last_year}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: teamColor(dataA.constructor_ref) }} />
                    <p className="font-mono text-[11px] text-text-3">{dataA.nationality}</p>
                  </div>
                  <h2 className="font-serif text-[28px] text-text-1 leading-tight">{dataA.name}</h2>
                  <p className="font-mono text-[11px] text-text-3 mt-1">
                    {dataA.first_year}–{dataA.last_year}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center justify-center border-r border-border">
              <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em]">vs</span>
            </div>
            <div className="px-6 py-5">
              {isDriverData(dataB) ? (
                <>
                  <p className="font-mono text-[11px] text-text-3 mb-0.5">
                    {dataB.nationality}
                    {dataB.code && <span className="ml-2">{dataB.code}</span>}
                  </p>
                  <h2 className="font-serif text-[28px] text-text-1 leading-tight">
                    {dataB.surname}
                  </h2>
                  <p className="text-[13px] text-text-2">{dataB.forename}</p>
                  <p className="font-mono text-[11px] text-text-3 mt-1">
                    {dataB.first_year}–{dataB.last_year}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: teamColor(dataB.constructor_ref) }} />
                    <p className="font-mono text-[11px] text-text-3">{dataB.nationality}</p>
                  </div>
                  <h2 className="font-serif text-[28px] text-text-1 leading-tight">{dataB.name}</h2>
                  <p className="font-mono text-[11px] text-text-3 mt-1">
                    {dataB.first_year}–{dataB.last_year}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── 01 · Career Stats ────────────────────────────────── */}
          <section className="border-b border-border">
            <div className="px-5 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('career')}</h2>
            </div>
            <div className="px-5 py-2">
              <StatRow label={t('stats.races')} a={dataA.races} b={dataB.races} />
              <StatRow label={t('stats.wins')} a={dataA.wins} b={dataB.wins} />
              <StatRow label={t('stats.podiums')} a={dataA.podiums} b={dataB.podiums} />
              {isDriverData(dataA) && isDriverData(dataB) && (
                <>
                  <StatRow label={t('stats.poles')} a={dataA.poles} b={dataB.poles} />
                  <StatRow label={t('stats.fastestLaps')} a={dataA.fastest_laps} b={dataB.fastest_laps} />
                </>
              )}
              {!isDriverData(dataA) && !isDriverData(dataB) && (
                <StatRow label={t('stats.fastestLaps')} a={dataA.fastest_laps} b={dataB.fastest_laps} />
              )}
              <StatRow label={t('stats.championships')} a={dataA.championships} b={dataB.championships} />
              <StatRow label={`${t('stats.winPct')}`} a={`${dataA.win_pct}%`} b={`${dataB.win_pct}%`} />
              <StatRow label={t('stats.era')}
                a={`${dataA.first_year}–${dataA.last_year}`}
                b={`${dataB.first_year}–${dataB.last_year}`}
                lowerIsBetter />
            </div>
          </section>

          {/* ── 02 · Head-to-Head ────────────────────────────────── */}
          <section>
            <div className="px-5 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">
                {mode === 'drivers' ? t('hth.teammates') : t('hth.headToHead')}
              </h2>
              {mode === 'constructors' && (
                <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
                  {sharedSeasonRows.length}
                </span>
              )}
              {mode === 'drivers' && teammateRows.length > 0 && (
                <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
                  {teammateRows.length}
                </span>
              )}
            </div>

            {/* Drivers — teammate seasons */}
            {mode === 'drivers' && (
              teammateRows.length === 0 ? (
                <div className="px-5 py-8">
                  <span className="font-mono text-[13px] text-text-3">{t('hth.neverTeammates')}</span>
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="sticky top-0 bg-surface border-b border-border z-10">
                        <th className="px-5 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">{t('hth.year')}</th>
                        <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('hth.team')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.pos')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.pts')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.wins')}</th>
                        <th className="w-8" />
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.pos')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.pts')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.wins')}</th>
                        <th className="px-5 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.winner')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teammateRows.map((row) => (
                        <HthRow
                          key={row.year}
                          year={row.year}
                          team={row.team}
                          aPos={row.aSeason.position}
                          aPts={row.aSeason.points}
                          aWins={row.aSeason.wins}
                          bPos={row.bSeason.position}
                          bPts={row.bSeason.points}
                          bWins={row.bSeason.wins}
                          t={t}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Constructors — all shared seasons */}
            {mode === 'constructors' && (
              sharedSeasonRows.length === 0 ? (
                <div className="px-5 py-8">
                  <span className="font-mono text-[13px] text-text-3">—</span>
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="sticky top-0 bg-surface border-b border-border z-10">
                        <th className="px-5 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">{t('hth.year')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.pos')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.pts')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.wins')}</th>
                        <th className="w-8" />
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.pos')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.pts')}</th>
                        <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('hth.wins')}</th>
                        <th className="px-5 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('hth.winner')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedSeasonRows.map((row) => (
                        <HthRow
                          key={row.year}
                          year={row.year}
                          aPos={row.aSeason.position}
                          aPts={row.aSeason.points}
                          aWins={row.aSeason.wins}
                          bPos={row.bSeason.position}
                          bPts={row.bSeason.points}
                          bWins={row.bSeason.wins}
                          t={t}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>
        </>
      )}

      {/* Loading state — one selected, fetching the other */}
      {bothSelected && (loadingA || loadingB) && (!dataA || !dataB) && (
        <div className="px-5 py-12 flex justify-center">
          <Loader />
        </div>
      )}

    </main>
  );
}
