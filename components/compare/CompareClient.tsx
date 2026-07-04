'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type {
  DriverSelectorRow,
  ConstructorSelectorRow,
  CompareDriverData,
  CompareConstructorData,
  CompareDriverSeason,
  CompareConstructorSeason,
  CompareH2HData,
} from '@/lib/types';
import TaleOfTape, { type TapeSide } from './kinetic/TaleOfTape';
import VerdictBoard, { type VerdictMetric } from './kinetic/VerdictBoard';
import H2HDuel from './kinetic/H2HDuel';
import CareerArcDuel, { type ArcSeason } from './kinetic/CareerArcDuel';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';

gsap.registerPlugin(SplitText);

type Mode = 'drivers' | 'constructors';

// Preloaded rivalries — one click loads the duel, and the URL becomes a
// shareable landing page for it. Refs verified against the drivers table.
const DRIVER_DUELS: Array<[string, string]> = [
  ['senna', 'prost'],
  ['hunt', 'lauda'],
  ['hamilton', 'max_verstappen'],
  ['alonso', 'michael_schumacher'],
  ['mansell', 'piquet'],
  ['antonelli', 'russell'],
];
const CONSTRUCTOR_DUELS: Array<[string, string]> = [
  ['ferrari', 'mclaren'],
  ['red_bull', 'mercedes'],
  ['williams', 'ferrari'],
];

const Loader = () => (
  <span className="font-mono text-[11px] text-text-3 animate-pulse">···</span>
);

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
}: {
  year: number;
  team?: string;
  aPos: number | null;
  aPts: number;
  aWins: number;
  bPos: number | null;
  bPts: number;
  bWins: number;
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
  const [h2h, setH2h] = useState<CompareH2HData | null>(null);
  const [motionOk, setMotionOk] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Header entrance — mirrors DriversClient
  useEffect(() => {
    const ok = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(ok);
    if (!ok) {
      if (titleRef.current) titleRef.current.style.visibility = 'visible';
      return;
    }
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!titleRef.current) return;
        const split = new SplitText(titleRef.current, { type: 'chars' });
        gsap.set(titleRef.current, { visibility: 'visible' });
        gsap.from(split.chars, { yPercent: 110, duration: 0.7, stagger: 0.04, ease: 'power4.out' });
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  // Real on-track H2H — drivers mode only, refetch on pair change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setH2h(null);
    if (mode !== 'drivers' || !driverA || !driverB) return;
    let cancelled = false;
    fetch(`/api/compare/h2h/${driverA.driver_ref}/${driverB.driver_ref}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CompareH2HData | null) => {
        if (!cancelled) setH2h(data);
      })
      .catch(() => {
        if (!cancelled) setH2h(null);
      });
    return () => { cancelled = true; };
  }, [mode, driverA, driverB]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // fetchDriver sets loading state before its first await — the standard fetch-on-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'drivers' && driverA) fetchDriver(driverA.driver_ref, 'a');
    else setDataA(null);
  }, [driverA, mode, fetchDriver]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'drivers' && driverB) fetchDriver(driverB.driver_ref, 'b');
    else setDataB(null);
  }, [driverB, mode, fetchDriver]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'constructors' && constructorA) fetchConstructor(constructorA.constructor_ref, 'a');
    else setDataA(null);
  }, [constructorA, mode, fetchConstructor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const teammateRows: TeammateRow[] = [];
  const sharedSeasonRows: SharedSeasonRow[] = [];

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

  // ─── Preloaded duels ─────────────────────────────────────────────

  const driversByRef = new Map(drivers.map((d) => [d.driver_ref, d]));
  const constructorsByRef = new Map(constructors.map((c) => [c.constructor_ref, c]));

  const driverDuels = DRIVER_DUELS.flatMap(([refA, refB]) => {
    const rowA = driversByRef.get(refA);
    const rowB = driversByRef.get(refB);
    if (!rowA || !rowB) return [];
    const active =
      mode === 'drivers' &&
      ((driverA?.driver_ref === refA && driverB?.driver_ref === refB) ||
        (driverA?.driver_ref === refB && driverB?.driver_ref === refA));
    return [{
      key: `${refA}|${refB}`,
      label: `${rowA.surname} — ${rowB.surname}`,
      active,
      load: () => { setDriverA(rowA); setDriverB(rowB); },
    }];
  });

  const constructorDuels = CONSTRUCTOR_DUELS.flatMap(([refA, refB]) => {
    const rowA = constructorsByRef.get(refA);
    const rowB = constructorsByRef.get(refB);
    if (!rowA || !rowB) return [];
    const active =
      mode === 'constructors' &&
      ((constructorA?.constructor_ref === refA && constructorB?.constructor_ref === refB) ||
        (constructorA?.constructor_ref === refB && constructorB?.constructor_ref === refA));
    return [{
      key: `${refA}|${refB}`,
      label: `${rowA.name} — ${rowB.name}`,
      active,
      load: () => { setConstructorA(rowA); setConstructorB(rowB); },
    }];
  });

  // ─── Kinetic section inputs ──────────────────────────────────────

  const ready = bothSelected && dataA !== null && dataB !== null;
  const pairKey = ready
    ? isDriverData(dataA!) ? `${dataA!.driver_ref}|${(dataB as CompareDriverData).driver_ref}` : `${(dataA as CompareConstructorData).constructor_ref}|${(dataB as CompareConstructorData).constructor_ref}`
    : '';

  // Side colors: ink vs racing red for drivers (Blueprint convention); team
  // colors for constructors, falling back to ink/red when both are unmapped.
  let aColor = 'var(--text-1)';
  let bColor = 'var(--red)';
  if (ready && !isDriverData(dataA!)) {
    const ca = teamColor((dataA as CompareConstructorData).constructor_ref);
    const cb = teamColor((dataB as CompareConstructorData).constructor_ref);
    if (!(ca === cb)) { aColor = ca; bColor = cb; }
  }

  const tapeSide = (d: CompareDriverData | CompareConstructorData, color: string): TapeSide =>
    isDriverData(d)
      ? {
          name: d.surname,
          sub: d.forename,
          meta: `${d.first_year}–${d.last_year} · ${d.nationality}${d.code ? ` · ${d.code}` : ''}`,
          championships: d.championships,
          color,
        }
      : {
          name: d.name,
          sub: d.nationality,
          meta: `${d.first_year}–${d.last_year} · ${d.races} GP`,
          championships: d.championships,
          color,
        };

  const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 1000) / 10 : 0);

  const verdictMetrics: VerdictMetric[] = ready
    ? isDriverData(dataA!) && isDriverData(dataB!)
      ? [
          { label: t('stats.championships'), a: dataA!.championships, b: dataB!.championships },
          { label: t('stats.wins'), a: dataA!.wins, b: dataB!.wins },
          { label: t('stats.winPct'), a: dataA!.win_pct, b: dataB!.win_pct, aDisplay: `${dataA!.win_pct}%`, bDisplay: `${dataB!.win_pct}%` },
          { label: t('stats.podiums'), a: dataA!.podiums, b: dataB!.podiums },
          { label: t('stats.podiumPct'), a: pct(dataA!.podiums, dataA!.races), b: pct(dataB!.podiums, dataB!.races), aDisplay: `${pct(dataA!.podiums, dataA!.races)}%`, bDisplay: `${pct(dataB!.podiums, dataB!.races)}%` },
          { label: t('stats.poles'), a: (dataA as CompareDriverData).poles, b: (dataB as CompareDriverData).poles },
          { label: t('stats.fastestLaps'), a: dataA!.fastest_laps, b: dataB!.fastest_laps },
        ]
      : [
          { label: t('stats.championships'), a: dataA!.championships, b: dataB!.championships },
          { label: t('stats.wins'), a: dataA!.wins, b: dataB!.wins },
          { label: t('stats.winPct'), a: dataA!.win_pct, b: dataB!.win_pct, aDisplay: `${dataA!.win_pct}%`, bDisplay: `${dataB!.win_pct}%` },
          { label: t('stats.podiums'), a: dataA!.podiums, b: dataB!.podiums },
          { label: t('stats.fastestLaps'), a: dataA!.fastest_laps, b: dataB!.fastest_laps },
        ]
    : [];

  const arcSeasons = (d: CompareDriverData | CompareConstructorData): ArcSeason[] =>
    [...d.seasons]
      .sort((x, y) => x.year - y.year)
      .map((s) => ({ year: s.year, wins: s.wins, title: s.position === 1 }));

  const sideLabel = (d: CompareDriverData | CompareConstructorData): string =>
    isDriverData(d) ? (d.code ?? d.surname.slice(0, 3).toUpperCase()) : d.name;

  // ─── Rendering ───────────────────────────────────────────────────

  return (
    <main className="flex flex-col">

      {/* ── Header + mode tabs ─────────────────────────────────── */}
      <div ref={headerRef} className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0 overflow-hidden bg-bg">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">05 ·</span>
        <div className="kinetic-mask shrink-0">
          <h1
            ref={titleRef}
            className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--pi-display)', visibility: 'hidden' }}
          >
            {t('title')}
          </h1>
        </div>
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

      {/* ── Preloaded rivalries ────────────────────────────────── */}
      <div className="border-b border-border px-5 py-2.5 flex items-center gap-4 overflow-x-auto">
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.16em] shrink-0">
          {t('duels.label')}
        </span>
        {(mode === 'drivers' ? driverDuels : constructorDuels).map((duel) => (
          <button
            key={duel.key}
            onClick={duel.load}
            className="font-mono text-[10px] uppercase tracking-[0.08em] cursor-pointer bg-transparent border-0 p-0 shrink-0 transition-colors duration-150"
            style={{ color: duel.active ? 'var(--red)' : 'var(--text-2)' }}
          >
            {duel.label}
          </button>
        ))}
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
          {/* ── Tale of the tape — lights out ────────────────────── */}
          {/* Keyed remount: SplitText mutates the heading DOM, so React can't
              patch the name text on pair change — a fresh mount replays the
              lights-out sequence for the new duel, which is what we want. */}
          <TaleOfTape
            key={pairKey}
            a={tapeSide(dataA, aColor)}
            b={tapeSide(dataB, bColor)}
            pairKey={pairKey}
            motionOk={motionOk}
          />

          {/* ── 01 · The verdict ─────────────────────────────────── */}
          <VerdictBoard
            metrics={verdictMetrics}
            aLabel={sideLabel(dataA)}
            bLabel={sideLabel(dataB)}
            aColor={aColor}
            bColor={bColor}
            pairKey={pairKey}
            motionOk={motionOk}
            index="01"
          />

          {/* ── 02 · On-track head-to-head (drivers) ─────────────── */}
          {mode === 'drivers' && (
            <H2HDuel
              h2h={h2h}
              aLabel={sideLabel(dataA)}
              bLabel={sideLabel(dataB)}
              aColor={aColor}
              bColor={bColor}
              pairKey={pairKey}
              motionOk={motionOk}
              index="02"
            />
          )}

          {/* ── Career arc — cumulative wins by career season ────── */}
          <CareerArcDuel
            aSeasons={arcSeasons(dataA)}
            bSeasons={arcSeasons(dataB)}
            aLabel={sideLabel(dataA)}
            bLabel={sideLabel(dataB)}
            aColor={aColor}
            bColor={bColor}
            pairKey={pairKey}
            motionOk={motionOk}
            index={mode === 'drivers' ? '03' : '02'}
          />

          {/* ── Teammate seasons / shared seasons ────────────────── */}
          <section>
            <div className="px-5 pt-5 pb-3 border-b border-border flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
                {mode === 'drivers' ? '04' : '03'} · {mode === 'drivers' ? t('hth.teammates') : t('hth.headToHead')}
              </span>
              <InfoTooltip text={mode === 'drivers' ? t('hth.infoTeammates') : t('hth.infoShared')} />
              {mode === 'constructors' && (
                <span className="font-mono text-[10px] text-text-3 tabular-nums">
                  {sharedSeasonRows.length}
                </span>
              )}
              {mode === 'drivers' && teammateRows.length > 0 && (
                <span className="font-mono text-[10px] text-text-3 tabular-nums">
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
                <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
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
                <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
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
