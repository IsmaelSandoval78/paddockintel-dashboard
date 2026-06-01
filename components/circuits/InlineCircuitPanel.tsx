'use client';

import { useTranslations } from 'next-intl';
import type { CircuitInfo } from '@/lib/types';
import { Link } from '@/lib/i18n/navigation';

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export default function InlineCircuitPanel({
  info,
  onClose,
}: {
  info: CircuitInfo;
  onClose: () => void;
}) {
  const t = useTranslations('circuit');

  return (
    <div className="bg-surface border-t border-border">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-start justify-between border-b border-border">
        <div>
          <h2 className="font-serif text-[28px] text-text-1 leading-tight">
            {info.name}
          </h2>
          <p className="text-[13px] text-text-2 mt-0.5">
            {info.location} · {info.country}
          </p>
          <p className="font-mono text-[11px] text-text-3 mt-1">
            {formatCoord(info.lat, info.lng)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-text-3 hover:text-text-1 hover:bg-surface-raised transition-colors duration-150 shrink-0 text-lg leading-none ml-4 mt-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* ── Stats grid — 3 columns ─────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-border">

        {/* Col 1 — Quick stats */}
        <div className="px-6 py-4 flex gap-8">
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('firstRace')}
            </p>
            <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
              {info.first_year ?? '—'}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('totalRaces')}
            </p>
            <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
              {info.total_races}
            </p>
          </div>
        </div>

        {/* Col 2 — Last 5 Champions */}
        <div className="px-6 py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('champions')}
            </span>
          </div>
          {info.champions.length > 0 ? (
            <div>
              {info.champions.map((c) => (
                <div
                  key={c.year}
                  className="flex items-center gap-3 h-8 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-xs text-text-3 tabular-nums w-10 shrink-0">
                    {c.year}
                  </span>
                  <span className="text-[13px] text-text-2 shrink-0">{c.forename}</span>
                  <span className="text-[13px] font-semibold text-text-1 uppercase tracking-[0.02em]">
                    {c.surname}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

        {/* Col 3 — Records */}
        <div className="px-6 py-4 flex flex-col gap-5">
          {info.fastest_pit && (
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
                <span className="text-[13px] font-medium text-text-2 leading-none">
                  {t('fastestPit')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0 truncate">
                  {info.fastest_pit.constructor}
                </span>
                <span className="font-mono text-[13px] text-text-1 tabular-nums shrink-0">
                  {info.fastest_pit.duration}s
                </span>
                <span className="font-mono text-xs text-text-3 tabular-nums shrink-0">
                  {info.fastest_pit.year}
                </span>
              </div>
            </div>
          )}

          {info.fastest_lap && (
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
                <span className="text-[13px] font-medium text-text-2 leading-none">
                  {t('fastestLap')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0">
                  {info.fastest_lap.forename[0]}. {info.fastest_lap.surname}
                </span>
                <span className="font-mono text-[13px] text-text-1 tabular-nums shrink-0">
                  {info.fastest_lap.time}
                </span>
                <span className="font-mono text-xs text-text-3 tabular-nums shrink-0">
                  {info.fastest_lap.year}
                </span>
              </div>
            </div>
          )}

          {!info.fastest_pit && !info.fastest_lap && (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

      </div>

      {/* ── Historical records row — 4 cols ───────────────────── */}
      <div className="grid grid-cols-4 divide-x divide-border border-t border-border">

        {/* 04 · Top Constructor */}
        <div className="px-6 py-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('topConstructor')}
            </span>
          </div>
          {info.top_constructor ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0 truncate">
                {info.top_constructor.name}
              </span>
              <span className="font-mono text-xs text-text-3 tabular-nums shrink-0">
                {info.top_constructor.wins}W
              </span>
            </div>
          ) : (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

        {/* 05 · Most Wins Driver */}
        <div className="px-6 py-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('topWinDriver')}
            </span>
          </div>
          {info.top_win_driver ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0 truncate">
                {info.top_win_driver.forename[0]}. {info.top_win_driver.surname}
              </span>
              <span className="font-mono text-xs text-text-3 tabular-nums shrink-0">
                {info.top_win_driver.wins}W
              </span>
            </div>
          ) : (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

        {/* 06 · Most Poles Driver */}
        <div className="px-6 py-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-xs text-text-2 leading-none">06 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('topPoleDriver')}
            </span>
          </div>
          {info.top_pole_driver ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-text-1 flex-1 min-w-0 truncate">
                {info.top_pole_driver.forename[0]}. {info.top_pole_driver.surname}
              </span>
              <span className="font-mono text-xs text-text-3 tabular-nums shrink-0">
                {info.top_pole_driver.poles}P
              </span>
            </div>
          ) : (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

        {/* 07 · Avg. Winner's Grid */}
        <div className="px-6 py-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-xs text-text-2 leading-none">07 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('avgWinnerGrid')}
            </span>
          </div>
          {info.avg_winner_grid !== null ? (
            <span className="font-serif text-[32px] text-text-1 leading-none tabular-nums">
              P{info.avg_winner_grid}
            </span>
          ) : (
            <span className="font-mono text-[13px] text-text-3">—</span>
          )}
        </div>

      </div>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border">
        <Link
          href={`/circuits/${info.circuit_ref}`}
          className="text-[13px] text-text-2 hover:text-red transition-colors duration-150"
        >
          {t('viewFull')}
        </Link>
      </div>

    </div>
  );
}
