'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { ConstructorSeasonRow, ConstructorAllTimeRow, ConstructorDetail } from '@/lib/types';
import InlineConstructorPanel from './InlineConstructorPanel';
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
  constructor: c,
  selected,
  onClick,
  t,
}: {
  constructor: ConstructorSeasonRow;
  selected: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<'constructors'>>;
}) {
  const isP1 = c.position === 1;
  const winRate = c.races > 0 ? Math.round((c.wins / c.races) * 100) : 0;
  const color = teamColor(c.constructor_ref);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={c.name}
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
        {c.position}
      </span>

      {/* Team color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0 ml-2"
        style={{ backgroundColor: color }}
      />

      {/* Name */}
      <span className="flex-1 min-w-0 text-[13px] font-medium text-text-1 truncate ml-3">
        {c.name}
      </span>

      {/* Nationality — hidden on mobile */}
      <span className="hidden md:block text-[13px] text-text-2 w-28 shrink-0 mx-4 truncate">
        {c.nationality}
      </span>

      {/* Stats */}
      <span className="font-mono text-[13px] text-text-1 tabular-nums w-14 text-right shrink-0">
        {c.points}
      </span>
      <span className="hidden md:block font-mono text-[11px] text-text-2 tabular-nums w-10 text-right shrink-0">
        {c.wins}
      </span>
      <span className="hidden md:block font-mono text-[11px] text-text-2 tabular-nums w-10 text-right shrink-0">
        {c.podiums}
      </span>
      <span className="hidden md:block font-mono text-[11px] text-text-3 tabular-nums w-12 text-right shrink-0">
        {winRate}%
      </span>
    </div>
  );
}

// ─── All-time row ─────────────────────────────────────────────────
function AllTimeRow({
  constructor: c,
  selected,
  onClick,
}: {
  constructor: ConstructorAllTimeRow;
  selected: boolean;
  onClick: () => void;
}) {
  const color = teamColor(c.constructor_ref);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={c.name}
      className={[
        'flex items-center h-11 border-b border-border cursor-pointer px-5 transition-colors duration-100 select-none',
        selected ? 'bg-surface-raised' : 'hover:bg-surface',
      ].join(' ')}
    >
      {/* Team color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 mr-3"
        style={{ backgroundColor: color }}
      />

      {/* Name */}
      <span className="flex-1 min-w-0 text-[13px] font-medium text-text-1 truncate">
        {c.name}
      </span>

      {/* Nationality — hidden on mobile */}
      <span className="hidden md:block text-[13px] text-text-2 w-28 shrink-0 truncate">
        {c.nationality}
      </span>

      {/* Era — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-3 tabular-nums w-24 text-right shrink-0">
        {c.first_year}–{c.last_year}
      </span>

      {/* Wins */}
      <span className="font-mono text-[11px] text-text-1 tabular-nums w-14 text-right shrink-0">
        {c.wins}
      </span>

      {/* Races — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-3 tabular-nums w-14 text-right shrink-0">
        {c.races}
      </span>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────
export default function ConstructorsClient({
  season2026,
  allTime,
  totalCount,
}: {
  season2026: ConstructorSeasonRow[];
  allTime: ConstructorAllTimeRow[];
  totalCount: number;
}) {
  const t = useTranslations('constructors');

  const [view, setView] = useState<View>('2026');
  const [nationality, setNationality] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ConstructorDetail | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const nationalities = [...new Set(allTime.map((c) => c.nationality))].sort();

  const filtered = allTime.filter((c) => {
    if (nationality !== 'all' && c.nationality !== nationality) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageConstructors = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSelectConstructor(constructorId: number) {
    if (selectedId === constructorId) {
      handleClose();
      return;
    }
    setSelectedId(constructorId);
    const res = await fetch(`/api/constructors/${constructorId}`);
    const data = (await res.json()) as ConstructorDetail;
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
        <span className="font-mono text-xs text-text-3">04 ·</span>
        <h1 className="font-serif text-2xl text-text-1">{t('title')}</h1>
        <span className="font-mono text-xs text-text-3 ml-1">
          {t('count', { count: view === '2026' ? season2026.length : totalCount })}
        </span>
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto">
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
            {/* dot column spacer */}
            <span className="w-5 shrink-0 ml-2" />
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] flex-1 ml-3">
              {t('table.constructor')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-28 shrink-0 mx-4">
              {t('table.nationality')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14 text-right shrink-0">
              {t('table.pts')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10 text-right shrink-0">
              {t('table.pod')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12 text-right shrink-0">
              {t('table.winPct')}
            </span>
          </div>

          {season2026.map((c) => (
            <SeasonRow
              key={c.constructor_id}
              constructor={c}
              selected={c.constructor_id === selectedId}
              onClick={() => handleSelectConstructor(c.constructor_id)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* ── All-time list ─────────────────────────────────────── */}
      {view === 'all' && (
        <div>
          <div className="h-8 px-5 border-b border-border flex items-center bg-surface shrink-0">
            {/* dot spacer */}
            <span className="w-[22px] shrink-0" />
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] flex-1 ml-3">
              {t('table.constructor')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-28 shrink-0">
              {t('table.nationality')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-24 text-right shrink-0">
              {t('table.span')}
            </span>
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14 text-right shrink-0">
              {t('table.wins')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14 text-right shrink-0">
              {t('table.races')}
            </span>
          </div>

          {pageConstructors.length > 0 ? (
            pageConstructors.map((c) => (
              <AllTimeRow
                key={c.constructor_id}
                constructor={c}
                selected={c.constructor_id === selectedId}
                onClick={() => handleSelectConstructor(c.constructor_id)}
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

      {/* ── Inline panel — desktop only ───────────────────────── */}
      <div
        ref={panelRef}
        className={[
          'hidden md:grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          {detail && <InlineConstructorPanel detail={detail} onClose={handleClose} />}
        </div>
      </div>

      {/* ── Bottom sheet — mobile only ───────────────────────── */}
      <BottomSheet open={isOpen} onClose={handleClose}>
        {detail && <InlineConstructorPanel detail={detail} onClose={handleClose} />}
      </BottomSheet>

    </main>
  );
}
