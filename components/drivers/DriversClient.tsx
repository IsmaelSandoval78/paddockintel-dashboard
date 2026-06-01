'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { DriverSeasonRow, DriverAllTimeRow, DriverDetail } from '@/lib/types';
import InlineDriverPanel from './InlineDriverPanel';

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
  t,
}: {
  driver: DriverSeasonRow;
  selected: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<'drivers'>>;
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
      className={[
        'flex items-center h-[52px] border-b border-border cursor-pointer transition-colors duration-100 select-none',
        isP1 ? 'bg-red-dim' : selected ? 'bg-surface-raised' : 'hover:bg-surface',
      ].join(' ')}
      style={{
        borderLeft: isP1 ? '2px solid var(--red)' : '2px solid transparent',
        paddingLeft: isP1 ? '18px' : '20px',
        paddingRight: '20px',
      }}
    >
      {/* Pos */}
      <span className="font-mono text-xs text-text-3 tabular-nums w-8 shrink-0">
        {driver.position}
      </span>

      {/* Code */}
      <span className="font-mono text-[11px] text-text-3 w-10 shrink-0 ml-3 tracking-[0.06em]">
        {driver.code ?? ''}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0 overflow-hidden ml-3">
        <span className="block text-[11px] text-text-2 leading-none mb-[3px] truncate">
          {driver.forename}
        </span>
        <span className="block text-[13px] font-semibold text-text-1 uppercase leading-none tracking-[0.02em] truncate">
          {driver.surname}
        </span>
      </div>

      {/* Constructor */}
      <div className="flex items-center gap-2 w-36 shrink-0 mx-4">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: teamColor(driver.constructor_ref) }}
        />
        <span className="text-[13px] text-text-2 truncate">{driver.constructor_name}</span>
      </div>

      {/* Stats */}
      <span className="font-mono text-[13px] text-text-1 tabular-nums w-12 text-right shrink-0">
        {driver.points}
      </span>
      <span className="font-mono text-[11px] text-text-2 tabular-nums w-10 text-right shrink-0">
        {driver.wins}
      </span>
      <span className="font-mono text-[11px] text-text-2 tabular-nums w-8 text-right shrink-0">
        {driver.podiums}
      </span>
      <span className="font-mono text-[11px] text-text-3 tabular-nums w-12 text-right shrink-0">
        {winRate}%
      </span>
    </div>
  );
}

// ─── All-time row ─────────────────────────────────────────────────
function AllTimeRow({
  driver,
  selected,
  onClick,
}: {
  driver: DriverAllTimeRow;
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
      className={[
        'flex items-center h-11 border-b border-border cursor-pointer px-5 transition-colors duration-100 select-none',
        selected ? 'bg-surface-raised' : 'hover:bg-surface',
      ].join(' ')}
    >
      {/* Name */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="text-[11px] text-text-2">{driver.forename} </span>
        <span className="text-[13px] font-semibold text-text-1 uppercase tracking-[0.02em]">
          {driver.surname}
        </span>
      </div>

      {/* Nationality */}
      <span className="text-[13px] text-text-2 w-28 shrink-0 truncate">
        {driver.nationality}
      </span>

      {/* Era */}
      <span className="font-mono text-[11px] text-text-3 tabular-nums w-24 text-right shrink-0">
        {driver.first_year}–{driver.last_year}
      </span>

      {/* Wins */}
      <span className="font-mono text-[11px] text-text-1 tabular-nums w-14 text-right shrink-0">
        {driver.wins}
      </span>

      {/* Races */}
      <span className="font-mono text-[11px] text-text-3 tabular-nums w-14 text-right shrink-0">
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

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-text-3">03 ·</span>
        <h1 className="font-serif text-2xl text-text-1">{t('title')}</h1>
        <span className="font-mono text-xs text-text-3 ml-1">
          {t('count', { count: view === '2026' ? season2026.length : totalCount })}
        </span>
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0">
        <button
          onClick={() => handleViewChange('2026')}
          className={[
            'font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0',
            view === '2026' ? 'text-red' : 'text-text-2 hover:text-text-1',
          ].join(' ')}
        >
          {t('view.season')}
        </button>
        <button
          onClick={() => handleViewChange('all')}
          className={[
            'font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0',
            view === 'all' ? 'text-red' : 'text-text-2 hover:text-text-1',
          ].join(' ')}
        >
          {t('view.allTime')}
        </button>

        {view === 'all' && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={nationality}
              onChange={(e) => {
                setNationality(e.target.value);
                setPage(1);
              }}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
            >
              <option value="all">{t('filter.allNationalities')}</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-border shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('search.placeholder')}
              className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 min-w-[160px]"
            />
          </>
        )}
      </div>

      {/* ── 2026 Season table ─────────────────────────────────── */}
      {view === '2026' && (
        <div>
          <div className="h-8 px-5 border-b border-border flex items-center bg-surface shrink-0">
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-8 shrink-0">
              {t('table.pos')}
            </span>
            <span className="w-10 shrink-0 ml-3" />
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] flex-1 ml-3">
              {t('table.driver')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-36 shrink-0 mx-4">
              {t('table.team')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12 text-right shrink-0">
              {t('table.pts')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-8 text-right shrink-0">
              {t('table.pod')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12 text-right shrink-0">
              {t('table.winPct')}
            </span>
          </div>

          {season2026.map((driver) => (
            <SeasonRow
              key={driver.driver_id}
              driver={driver}
              selected={driver.driver_id === selectedId}
              onClick={() => handleSelectDriver(driver.driver_id)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* ── All-time list ─────────────────────────────────────── */}
      {view === 'all' && (
        <div>
          <div className="h-8 px-5 border-b border-border flex items-center bg-surface shrink-0">
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] flex-1">
              {t('table.driver')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-28 shrink-0">
              {/* nationality label implied */}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-24 text-right shrink-0">
              {t('table.span')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14 text-right shrink-0">
              {t('table.races')}
            </span>
          </div>

          {pageDrivers.length > 0 ? (
            pageDrivers.map((driver) => (
              <AllTimeRow
                key={driver.driver_id}
                driver={driver}
                selected={driver.driver_id === selectedId}
                onClick={() => handleSelectDriver(driver.driver_id)}
              />
            ))
          ) : (
            <div className="px-5 py-8 text-center font-mono text-[13px] text-text-3">
              —
            </div>
          )}

          {totalPages > 1 && (
            <div className="h-10 px-5 flex items-center gap-4 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-mono text-[11px] text-text-2 hover:text-text-1 disabled:text-text-3 disabled:cursor-not-allowed transition-colors duration-100 bg-transparent border-0 p-0 cursor-pointer"
              >
                {t('pagination.prev')}
              </button>
              <span className="font-mono text-[11px] text-text-3 tabular-nums">
                {page} {t('pagination.of')} {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="font-mono text-[11px] text-text-2 hover:text-text-1 disabled:text-text-3 disabled:cursor-not-allowed transition-colors duration-100 bg-transparent border-0 p-0 cursor-pointer"
              >
                {t('pagination.next')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Inline panel — CSS grid-rows collapse ─────────────── */}
      <div
        ref={panelRef}
        className={[
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          {detail && <InlineDriverPanel detail={detail} onClose={handleClose} />}
        </div>
      </div>

    </main>
  );
}
