'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { ConstructorSeasonRow, ConstructorAllTimeRow, ConstructorDetail } from '@/lib/types';
import InlineConstructorPanel from './InlineConstructorPanel';
import BottomSheet from '@/components/ui/BottomSheet';
import ConstructorEraGrid, { type EraKey } from './ConstructorEraGrid';

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
  const [activeEra, setActiveEra] = useState<EraFilter>('all');
  const [nationality, setNationality] = useState('all');
  const [search, setSearch] = useState('');
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
    setSearch('');
    setNationality('all');
    setActiveEra('all');
  }

  return (
    <main className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">04 ·</span>
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

      {/* ── View toggle ──────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto">
        <button
          onClick={() => handleViewChange('2026')}
          className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
          style={{ color: view === '2026' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.season')}
        </button>
        <button
          onClick={() => handleViewChange('all')}
          className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
          style={{ color: view === 'all' ? 'var(--red)' : 'var(--text-2)' }}
        >
          {t('view.allTime')}
        </button>
      </div>

      {/* ── Era + search filters (all-time view only) ─────── */}
      {view === 'all' && (
        <div className="border-b border-border shrink-0">
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
              onChange={(e) => setNationality(e.target.value)}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 min-w-[120px]"
            />
          </div>
        </div>
      )}

      {/* ── 2026 Season table ─────────────────────────────────── */}
      {view === '2026' && (
        <div>
          <div className="h-8 px-5 border-b border-border flex items-center shrink-0" style={{ background: 'var(--border)' }}>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-8 shrink-0">
              {t('table.pos')}
            </span>
            <span className="w-5 shrink-0 ml-2" />
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] flex-1 ml-3">
              {t('table.constructor')}
            </span>
            <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-28 shrink-0 mx-4">
              {t('table.nationality')}
            </span>
            <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-14 text-right shrink-0">
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

      {/* ── Era grid (all-time view) ──────────────────────────── */}
      {view === 'all' && (
        <ConstructorEraGrid constructors={filtered} activeEra={activeEra} />
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
