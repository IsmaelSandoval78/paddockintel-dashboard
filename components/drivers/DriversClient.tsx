'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { DriverSeasonRow, DriverAllTimeRow, DriverDetail } from '@/lib/types';
import InlineDriverPanel from './InlineDriverPanel';
import BottomSheet from '@/components/ui/BottomSheet';

type View = '2026' | 'all';

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

const PAGE_SIZE = 20;
const COLLAPSE_MS = 200;

// ─── Season row ──────────────────────────────────────────────────
function SeasonRow({
  driver,
  selected,
  onClick,
}: {
  driver: DriverSeasonRow;
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
      className="flex items-center h-[52px] pr-5 cursor-pointer select-none"
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

// ─── All-time row ─────────────────────────────────────────────────
function AllTimeRow({
  driver,
  index,
  selected,
  onClick,
}: {
  driver: DriverAllTimeRow;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${driver.forename} ${driver.surname}`}
      className="flex items-center h-[44px] pr-5 cursor-pointer select-none"
      style={{
        background: selected ? 'var(--surface-raised)' : 'var(--bg)',
        paddingLeft: '20px',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-raised)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
      }}
    >
      {/* Rank */}
      <span
        className="w-8 shrink-0 tabular-nums text-[13px] text-text-2"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {index + 1}
      </span>

      {/* DRIVER */}
      <div className="flex-1 min-w-0 overflow-hidden ml-3">
        <span className="font-mono text-[11px] text-text-2">{driver.forename} </span>
        <span
          className="text-[14px] uppercase"
          style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}
        >
          {driver.surname}
        </span>
      </div>

      {/* NATIONALITY — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-2 w-28 shrink-0 truncate">{driver.nationality}</span>

      {/* SPAN — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-3 tabular-nums w-24 text-right shrink-0">
        {driver.first_year}–{driver.last_year}
      </span>

      {/* WINS */}
      <span
        className="w-14 text-right shrink-0 tabular-nums text-[13px]"
        style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
      >
        {driver.wins}
      </span>

      {/* RACES — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-3 tabular-nums w-14 text-right shrink-0">
        {driver.races}
      </span>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────
export default function DriversClient({
  season2026,
  allTime,
  totalCount,
}: {
  season2026: DriverSeasonRow[];
  allTime: DriverAllTimeRow[];
  totalCount: number;
}) {
  const t = useTranslations('drivers');

  const [view, setView] = useState<View>('2026');
  const [nationality, setNationality] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DriverDetail | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const nationalities = [...new Set(allTime.map((d) => d.nationality))].sort();

  const filtered = allTime.filter((d) => {
    if (nationality !== 'all' && d.nationality !== nationality) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${d.forename} ${d.surname}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageDrivers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    setPage(1);
    setSearch('');
    setNationality('all');
  }

  return (
    <main className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">03 ·</span>
        <h1
          className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {t('title')}
        </h1>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: view === '2026' ? season2026.length : totalCount })}
        </span>
      </div>

      {/* ── View / filter bar ────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto">
        <button
          onClick={() => handleViewChange('2026')}
          className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0"
          style={{ color: view === '2026' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.season')}
        </button>
        <button
          onClick={() => handleViewChange('all')}
          className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0"
          style={{ color: view === 'all' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.allTime')}
        </button>

        {view === 'all' && (
          <>
            <div className="w-px h-4 shrink-0" style={{ background: 'var(--border-subtle)' }} />
            <select
              value={nationality}
              onChange={(e) => { setNationality(e.target.value); setPage(1); }}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('search.placeholder')}
              className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 min-w-[160px]"
            />
          </>
        )}
      </div>

      {/* ── 2026 Season standings table ───────────────────────── */}
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
              selected={driver.driver_id === selectedId}
              onClick={() => handleSelectDriver(driver.driver_id)}
            />
          ))}
        </div>
      )}

      {/* ── All-time list ─────────────────────────────────────── */}
      {view === 'all' && (
        <div className="grid gap-px" style={{ background: 'var(--border)' }}>

          {/* Header */}
          <div
            className="flex items-center h-9 pr-5 shrink-0"
            style={{ background: 'var(--border)', paddingLeft: '20px' }}
          >
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-8 shrink-0">
              #
            </span>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] flex-1 ml-3">
              {t('table.driver')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-28 shrink-0">
              NAT
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-24 text-right shrink-0">
              {t('table.span')}
            </span>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-14 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-14 text-right shrink-0">
              {t('table.races')}
            </span>
          </div>

          {pageDrivers.length > 0 ? (
            pageDrivers.map((driver, i) => (
              <AllTimeRow
                key={driver.driver_id}
                driver={driver}
                index={(page - 1) * PAGE_SIZE + i}
                selected={driver.driver_id === selectedId}
                onClick={() => handleSelectDriver(driver.driver_id)}
              />
            ))
          ) : (
            <div
              className="px-5 py-8 text-center font-mono text-[13px] text-text-3"
              style={{ background: 'var(--bg)' }}
            >
              —
            </div>
          )}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────── */}
      {view === 'all' && totalPages > 1 && (
        <div className="h-10 px-5 flex items-center gap-4 border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 disabled:text-text-3 disabled:cursor-not-allowed bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('pagination.prev')}
          </button>
          <span className="font-mono text-[11px] text-text-3 tabular-nums">
            {page} {t('pagination.of')} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 disabled:text-text-3 disabled:cursor-not-allowed bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('pagination.next')}
          </button>
        </div>
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
