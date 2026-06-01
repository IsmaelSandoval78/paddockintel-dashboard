'use client';

import { useTranslations } from 'next-intl';
import type { CircuitInfo } from '@/lib/types';
import { Link } from '@/lib/i18n/navigation';

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

interface Props {
  info: CircuitInfo;
  onClose: () => void;
}

export default function CircuitPanel({ info, onClose }: Props) {
  const t = useTranslations('circuit');

  return (
    <div className="px-5 py-5 flex flex-col h-full overflow-y-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="font-serif text-2xl text-text-1 leading-tight">
            {info.name}
          </h2>
          <p className="text-[13px] text-text-2 mt-1">
            {info.location}, {info.country}
          </p>
          <p className="font-mono text-xs text-text-3 mt-1">
            {formatCoord(info.lat, info.lng)}
          </p>
        </div>

        {/* X close button */}
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-text-3 hover:text-text-1 hover:bg-surface-raised transition-colors duration-150 shrink-0 text-lg leading-none"
          aria-label="Close circuit panel"
        >
          ×
        </button>
      </div>

      {/* ── Quick stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-0 border-t border-border py-4">
        <div className="pr-4">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('firstRace')}
          </p>
          <p className="font-serif text-[28px] text-text-1 leading-none tabular-nums">
            {info.first_year ?? '—'}
          </p>
        </div>
        <div className="pl-4 border-l border-border">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('totalRaces')}
          </p>
          <p className="font-serif text-[28px] text-text-1 leading-none tabular-nums">
            {info.total_races}
          </p>
        </div>
      </div>

      {/* ── Last 5 Champions ───────────────────────────────── */}
      {info.champions.length > 0 && (
        <div className="border-t border-border py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">{t('champions')}</span>
          </div>
          {info.champions.map((c) => (
            <div
              key={c.year}
              className="flex items-center h-10 border-b border-border gap-4 last:border-b-0"
            >
              <span className="font-mono text-xs text-text-3 w-10 shrink-0 tabular-nums">
                {c.year}
              </span>
              <span className="text-[13px] text-text-2 shrink-0">{c.forename}</span>
              <span className="text-[13px] font-semibold text-text-1 uppercase tracking-[0.02em]">
                {c.surname}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Fastest Pit Stop ───────────────────────────────── */}
      {info.fastest_pit && (
        <div className="border-t border-border py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">{t('fastestPit')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0 truncate">
              {info.fastest_pit.constructor}
            </span>
            <span className="font-mono text-[13px] text-text-1 shrink-0 tabular-nums">
              {info.fastest_pit.duration}s
            </span>
            <span className="font-mono text-xs text-text-3 shrink-0 tabular-nums">
              {info.fastest_pit.year}
            </span>
          </div>
        </div>
      )}

      {/* ── Fastest Lap ────────────────────────────────────── */}
      {info.fastest_lap && (
        <div className="border-t border-border py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">{t('fastestLap')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0">
              {info.fastest_lap.forename[0]}. {info.fastest_lap.surname}
            </span>
            <span className="font-mono text-[13px] text-text-1 shrink-0 tabular-nums">
              {info.fastest_lap.time}
            </span>
            <span className="font-mono text-xs text-text-3 shrink-0 tabular-nums">
              {info.fastest_lap.year}
            </span>
          </div>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────── */}
      <div className="border-t border-border pt-4 mt-auto">
        <Link
          href={`/circuits/${info.circuit_ref}`}
          className="text-[13px] text-text-2 hover:text-text-1 transition-colors duration-150"
        >
          {t('viewFull')}
        </Link>
      </div>

    </div>
  );
}
