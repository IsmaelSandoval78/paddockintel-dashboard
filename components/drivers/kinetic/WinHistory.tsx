'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { teamColor } from '@/components/home/kinetic/teamColors';

export interface WinRow {
  year: number;
  raceName: string;
  constructorName: string;
  constructorRef: string;
  fastestLap: string | null;
}

const COLLAPSED_COUNT = 12;

// Win history — every row is a chequered flag. Collapsed past 12 rows (paginate >20 rule);
// hover floods the row with the winning constructor's color, origin-left like a lap trace.
export default function WinHistory({ rows }: { rows: WinRow[] }) {
  const t = useTranslations('driverDetail.winsSection');
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const hasMore = rows.length > COLLAPSED_COUNT;

  if (rows.length === 0) {
    return (
      <div className="px-6 py-6">
        <span className="font-mono text-[13px] text-text-3">—</span>
      </div>
    );
  }

  return (
    <div>
      {/* Column headers */}
      <div className="flex items-center gap-3 px-6 h-8 border-b border-border bg-surface">
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10 shrink-0">{t('year')}</span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] flex-1">{t('race')}</span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] hidden sm:block w-24">{t('constructor')}</span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-20 text-right">{t('fastestLap')}</span>
      </div>

      {visible.map((row, i) => {
        const prev = visible[i - 1];
        const yearStart = !prev || prev.year !== row.year;
        return (
          <div
            key={`${row.year}-${row.raceName}`}
            className="win-row group relative flex items-center gap-3 px-6 h-9 border-b border-border-subtle last:border-b-0 overflow-hidden"
          >
            {/* Team-color hover flood */}
            <span
              aria-hidden="true"
              className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out pointer-events-none"
              style={{ background: teamColor(row.constructorRef), opacity: 0.07 }}
            />
            <span className={`font-mono text-[11px] tabular-nums w-10 shrink-0 relative ${yearStart ? 'text-text-1' : 'text-text-3'}`}>
              {yearStart ? row.year : ''}
            </span>
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate relative">
              {row.raceName}
            </span>
            <span className="font-mono text-[11px] text-text-3 hidden sm:block w-24 truncate relative">
              {row.constructorName}
            </span>
            <span className="font-mono text-[12px] tabular-nums w-20 text-right relative">
              {row.fastestLap
                ? <span style={{ color: 'var(--red)' }}>{row.fastestLap}</span>
                : <span className="text-text-3">—</span>
              }
            </span>
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-6 h-10 text-left font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:bg-surface-raised"
          style={{ color: 'var(--red)' }}
        >
          {expanded
            ? `[ ${t('showRecent')} ]`
            : `[ ${t('showAll', { count: rows.length })} → ]`}
        </button>
      )}
    </div>
  );
}
