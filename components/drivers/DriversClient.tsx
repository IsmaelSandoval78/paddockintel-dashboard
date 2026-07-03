'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type {
  DriverSeasonRow,
  DriverAllTimeRow,
  DriverDetail,
  DriversBattleData,
  DriversFormGuide,
  QualiDuelPair,
  ChampionYear,
  FormRace,
} from '@/lib/types';
import InlineDriverPanel from './InlineDriverPanel';
import BottomSheet from '@/components/ui/BottomSheet';
import EraGrid, { type EraKey } from './EraGrid';
import ChampionshipBattle from './ChampionshipBattle';
import QualiDuel from './QualiDuel';
import ChampionsWall from './ChampionsWall';
import FormStrip from './FormStrip';
import InfoTooltip from '@/components/circuits/kinetic/InfoTooltip';

gsap.registerPlugin(SplitText);

type View = '2026' | 'all';
type EraFilter = 'all' | EraKey;

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

const COLLAPSE_MS = 200;

// ─── Season row ──────────────────────────────────────────────────
function SeasonRow({
  driver,
  form,
  selected,
  onClick,
}: {
  driver: DriverSeasonRow;
  form: FormRace[] | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const isP1 = driver.position === 1;
  const winRate =
    driver.races > 0 ? Math.round((driver.wins / driver.races) * 100) : 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${driver.forename} ${driver.surname}`}
      className="drivers-season-row flex items-center h-[52px] pr-5 cursor-pointer select-none"
      style={{
        background: isP1 ? 'var(--surface-raised)' : selected ? 'var(--surface-raised)' : 'var(--bg)',
        borderLeft: isP1 ? '3px solid var(--red)' : '3px solid transparent',
        paddingLeft: '17px',
      }}
      onMouseEnter={(e) => {
        if (!isP1 && !selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)';
      }}
      onMouseLeave={(e) => {
        if (!isP1 && !selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
      }}
    >
      {/* POS — Archivo Black 13px */}
      <span
        className="w-8 shrink-0 tabular-nums text-[13px]"
        style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
      >
        {driver.position}
      </span>

      {/* CODE — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-2 w-10 shrink-0 ml-3 tracking-[0.1em] uppercase">
        {driver.code ?? '—'}
      </span>

      {/* DRIVER — forename + surname stack */}
      <div className="flex-1 min-w-0 overflow-hidden ml-3">
        <span className="block font-mono text-[11px] text-text-2 leading-none mb-[3px] truncate">
          {driver.forename}
        </span>
        <span
          className="block text-[14px] uppercase leading-none truncate"
          style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}
        >
          {driver.surname}
        </span>
      </div>

      {/* TEAM — hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 w-36 shrink-0 mx-4">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: teamColor(driver.constructor_ref) }}
        />
        <span className="font-mono text-[11px] text-text-2 truncate">{driver.constructor_name}</span>
      </div>

      {/* FORM — last 5 races, desktop only */}
      <div className="hidden lg:flex w-[102px] shrink-0 justify-end mr-4">
        {form && form.length > 0 && <FormStrip form={form} />}
      </div>

      {/* PTS — Archivo Black 18px, dominant */}
      <span
        className="w-16 text-right shrink-0 tabular-nums text-[18px]"
        style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
      >
        {driver.points}
      </span>

      {/* WINS — hidden on mobile */}
      <span className="hidden md:block font-mono text-[13px] text-text-1 tabular-nums w-10 text-right shrink-0">
        {driver.wins}
      </span>

      {/* POD — hidden on mobile */}
      <span className="hidden md:block font-mono text-[13px] text-text-1 tabular-nums w-10 text-right shrink-0">
        {driver.podiums}
      </span>

      {/* WIN% — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-2 tabular-nums w-12 text-right shrink-0">
        {winRate}%
      </span>
    </div>
  );
}


// ─── Main client component ────────────────────────────────────────
export default function DriversClient({
  season2026,
  allTime,
  totalCount,
  battle,
  formGuide,
  qualiDuels,
  champions,
}: {
  season2026: DriverSeasonRow[];
  allTime: DriverAllTimeRow[];
  totalCount: number;
  battle: DriversBattleData;
  formGuide: DriversFormGuide;
  qualiDuels: QualiDuelPair[];
  champions: ChampionYear[];
}) {
  const t = useTranslations('drivers');

  const [view, setView] = useState<View>('2026');
  const [activeEra, setActiveEra] = useState<EraFilter>('all');
  const [nationality, setNationality] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DriverDetail | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [motionOk, setMotionOk] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Header entrance animation — mirrors CircuitsClient
  useEffect(() => {
    const ok = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(ok);
    if (!ok) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!titleRef.current) return;
        const split = new SplitText(titleRef.current, { type: 'chars' });
        gsap.set(titleRef.current, { visibility: 'visible' });
        gsap.from(split.chars, { yPercent: 110, duration: 0.7, stagger: 0.04, ease: 'power4.out' });
        gsap.from('.drivers-filter-btn', { opacity: 0, y: 6, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.35 });
        // y-only (no opacity): rows sit on a 1px-grid-line dark container — fading opacity
        // would expose that background through still-hidden rows. Slide-up keeps it opaque throughout.
        gsap.from('.drivers-season-row', { y: 10, duration: 0.4, stagger: 0.025, ease: 'power3.out', delay: 0.4 });
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  const nationalities = [...new Set(allTime.map((d) => d.nationality))].sort();

  const filtered = allTime.filter((d) => {
    if (nationality !== 'all' && d.nationality !== nationality) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${d.forename} ${d.surname}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleSelectDriver(driverId: number) {
    if (selectedId === driverId) {
      handleClose();
      return;
    }
    setSelectedId(driverId);
    const res = await fetch(`/api/drivers/${driverId}`);
    const data = (await res.json()) as DriverDetail;
    setDetail(data);
    setIsOpen(true);
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleClose() {
    setIsOpen(false);
    setSelectedId(null);
    setTimeout(() => setDetail(null), COLLAPSE_MS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewChange(newView: View) {
    if (isOpen) {
      setIsOpen(false);
      setSelectedId(null);
      setTimeout(() => setDetail(null), COLLAPSE_MS);
    }
    setView(newView);
    setSearch('');
    setNationality('all');
    setActiveEra('all');
  }

  return (
    <main className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────── */}
      <div ref={headerRef} className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0 overflow-hidden bg-bg">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">03 ·</span>
        <div className="kinetic-mask shrink-0">
          <h1
            ref={titleRef}
            className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--pi-display)', visibility: 'hidden' }}
          >
            {t('title')}
          </h1>
        </div>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: view === '2026' ? season2026.length : totalCount })}
        </span>
      </div>

      {/* ── View toggle ──────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto">
        <button
          onClick={() => handleViewChange('2026')}
          className="drivers-filter-btn font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
          style={{ color: view === '2026' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.season')}
        </button>
        <button
          onClick={() => handleViewChange('all')}
          className="drivers-filter-btn font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
          style={{ color: view === 'all' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.allTime')}
        </button>
      </div>

      {/* ── Champions wall (all-time view) ────────────────────── */}
      {view === 'all' && (
        <ChampionsWall champions={champions} motionOk={motionOk} onSelect={handleSelectDriver} />
      )}

      {/* ── Era + search filters (all-time view only) ─────── */}
      {view === 'all' && (
        <div className="border-b border-border shrink-0">
          {/* Era tabs */}
          <div className="h-9 px-5 flex items-center gap-4 overflow-x-auto">
            {(['all', 'modern', 'v10', 'turbo', 'v8', 'classic'] as EraFilter[]).map((era) => (
              <button
                key={era}
                onClick={() => setActiveEra(era)}
                className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
                style={{ color: activeEra === era ? 'var(--red)' : 'var(--text-2)' }}
              >
                {era === 'all' ? 'ALL' : era.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-4 shrink-0 ml-1" style={{ background: 'var(--border-subtle)' }} />
            <select
              value={nationality}
              onChange={(e) => { setNationality(e.target.value); }}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 bg-transparent border-0 p-0 cursor-pointer focus:outline-none shrink-0"
            >
              <option value="all">{t('filter.allNationalities')}</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
            <div className="w-px h-4 shrink-0" style={{ background: 'var(--border-subtle)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              placeholder={t('search.placeholder')}
              className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 min-w-[120px]"
            />
          </div>
        </div>
      )}

      {/* ── 01 · Championship battle chart ────────────────────── */}
      {view === '2026' && <ChampionshipBattle data={battle} motionOk={motionOk} />}

      {/* ── 02 · 2026 Season standings table ──────────────────── */}
      {view === '2026' && battle.series.length >= 2 && (
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
            02 · {t('sections.standings')}
          </span>
          <InfoTooltip text={t('sections.standingsInfo')} />
        </div>
      )}
      {view === '2026' && (
        <div className="grid gap-px" style={{ background: 'var(--border)' }}>

          {/* Header — ink background, substrate text */}
          <div
            className="flex items-center h-9 pr-5 shrink-0"
            style={{ background: 'var(--border)', paddingLeft: '20px' }}
          >
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-8 shrink-0">
              {t('table.pos')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-10 shrink-0 ml-3">
              COD
            </span>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] flex-1 ml-3">
              {t('table.driver')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-36 shrink-0 mx-4">
              {t('table.team')}
            </span>
            <span className="hidden lg:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-[102px] text-right shrink-0 mr-4">
              {t('table.form')}
            </span>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-16 text-right shrink-0">
              {t('table.pts')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-10 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-10 text-right shrink-0">
              {t('table.pod')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-12 text-right shrink-0">
              {t('table.winPct')}
            </span>
          </div>

          {season2026.map((driver) => (
            <SeasonRow
              key={driver.driver_id}
              driver={driver}
              form={formGuide[driver.driver_id]}
              selected={driver.driver_id === selectedId}
              onClick={() => handleSelectDriver(driver.driver_id)}
            />
          ))}
        </div>
      )}

      {/* ── 03 · Qualifying head-to-head ──────────────────────── */}
      {view === '2026' && <QualiDuel duels={qualiDuels} motionOk={motionOk} />}

      {/* ── Era grid (all-time view) ──────────────────────────── */}
      {view === 'all' && (
        <EraGrid drivers={filtered} activeEra={activeEra} motionOk={motionOk} />
      )}

      {/* ── Inline driver panel — desktop only ───────────────── */}
      <div
        ref={panelRef}
        className="hidden md:grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {detail && <InlineDriverPanel detail={detail} onClose={handleClose} />}
        </div>
      </div>

      {/* ── Bottom sheet — mobile only ───────────────────────── */}
      <BottomSheet open={isOpen} onClose={handleClose}>
        {detail && <InlineDriverPanel detail={detail} onClose={handleClose} />}
      </BottomSheet>

    </main>
  );
}
