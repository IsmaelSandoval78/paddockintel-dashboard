'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { DriverDetail } from '@/lib/types';
import CareerArc from './CareerArc';

function posLabel(pos: number | null): string {
  return pos !== null ? `P${pos}` : '—';
}

function posColor(pos: number | null): string {
  if (pos === 1) return 'text-red';
  if (pos !== null && pos <= 3) return 'text-gold';
  if (pos !== null) return 'text-text-1';
  return 'text-text-3';
}

// ─── Section header (mirrors InlineCircuitPanel pattern) ──────────
function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-2">
      <span className="font-mono text-xs text-text-2 leading-none">{n} ·</span>
      <span className="text-[13px] font-medium text-text-2 leading-none">{label}</span>
    </div>
  );
}

export default function InlineDriverPanel({
  detail,
  onClose,
}: {
  detail: DriverDetail;
  onClose: () => void;
}) {
  const t = useTranslations('drivers.panel');

  return (
    <div className="bg-surface border-t border-border">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-start justify-between border-b border-border">
        <div>
          <h2
            className="text-[clamp(1.4rem,2vw,2rem)] uppercase leading-none tracking-[-0.02em] text-text-1"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {detail.surname}
          </h2>
          <p className="text-[13px] text-text-2 mt-0.5">
            {detail.forename}
            {detail.code ? (
              <span className="font-mono text-text-3 ml-2">{detail.code}</span>
            ) : null}
            <span className="text-text-3 mx-2">·</span>
            {detail.nationality}
          </p>
          <p className="font-mono text-[11px] text-text-3 mt-1">
            {detail.first_year}–{detail.last_year}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-surface-raised transition-colors duration-100 shrink-0 text-lg leading-none ml-4 mt-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* ── Stats grid — 3 columns ─────────────────────────────── */}
      <div className="overflow-x-auto">
      <div className="grid grid-cols-3 divide-x divide-border min-w-[480px]">

        {/* Col 1 — Big career numbers */}
        <div className="px-6 py-4 flex gap-8">
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('races')}
            </p>
            <p
              className="text-[40px] text-text-1 leading-none tabular-nums"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {detail.races}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-1">
              {t('wins')}
            </p>
            <p
              className="text-[40px] text-text-1 leading-none tabular-nums"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {detail.wins}
            </p>
          </div>
        </div>

        {/* Col 2 — Career records */}
        <div className="px-6 py-4 flex flex-col gap-4">
          <div>
            <SectionLabel n="01" label={t('podiums')} />
            <span
              className="text-[28px] text-text-1 leading-none tabular-nums"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {detail.podiums}
            </span>
          </div>
          <div>
            <SectionLabel n="02" label={t('poles')} />
            <span className="font-mono text-[20px] text-text-1 leading-none tabular-nums">
              {detail.poles}
            </span>
          </div>
          <div>
            <SectionLabel n="03" label={t('fastestLaps')} />
            <span className="font-mono text-[20px] text-text-2 leading-none tabular-nums">
              {detail.fastest_laps}
            </span>
          </div>
        </div>

        {/* Col 3 — 2026 season or era */}
        <div className="px-6 py-4">
          {detail.season_2026 ? (
            <>
              <SectionLabel n="04" label={t('season2026')} />
              <p
                className="text-[40px] text-text-1 leading-none tabular-nums mb-1"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                P{detail.season_2026.position}
              </p>
              <p className="text-[13px] text-text-2">{detail.season_2026?.constructor_name}</p>
              <p className="font-mono text-[13px] text-text-1 tabular-nums mt-1">
                {detail.season_2026.points}{' '}
                <span className="text-text-3">pts</span>
                {detail.season_2026.wins > 0 && (
                  <span className="ml-2 text-red">{detail.season_2026.wins}W</span>
                )}
              </p>
            </>
          ) : (
            <>
              <SectionLabel n="04" label={t('era')} />
              <p className="font-mono text-[20px] text-text-1 leading-none tabular-nums">
                {detail.first_year}–{detail.last_year}
              </p>
              <p className="text-[13px] text-text-2 mt-2">{detail.nationality}</p>
            </>
          )}
        </div>

      </div>
      </div>

      {/* ── Career arc ──────────────────────────────────────────── */}
      {detail.career_arc.length > 0 && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('careerArc')}
            </span>
          </div>
          <CareerArc data={detail.career_arc} variant="compact" />
        </div>
      )}

      {/* ── Last 5 results ─────────────────────────────────────── */}
      {detail.last_5_results.length > 0 && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">06 ·</span>
            <span className="text-[13px] font-medium text-text-2 leading-none">
              {t('lastResults')}
            </span>
          </div>
          <div>
            {detail.last_5_results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 h-8 border-b border-border last:border-b-0"
              >
                <span className="font-mono text-xs text-text-3 tabular-nums w-10 shrink-0">
                  {r.year}
                </span>
                <span className="text-[13px] text-text-2 flex-1 min-w-0 truncate">
                  {r.race_name}
                </span>
                <span
                  className={[
                    'font-mono text-[13px] tabular-nums w-8 text-right shrink-0',
                    posColor(r.position),
                  ].join(' ')}
                >
                  {posLabel(r.position)}
                </span>
                <span className="font-mono text-[11px] text-text-3 tabular-nums w-10 text-right shrink-0">
                  {r.points > 0 ? `${r.points}pt` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border flex items-center gap-5">
        <Link
          href={`/drivers/${detail.driver_ref}`}
          className="text-[13px] text-text-2 hover:text-red transition-colors duration-150"
        >
          {t('viewFull')}
        </Link>
        <Link
          href={`/compare?type=drivers&a=${detail.driver_ref}`}
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 hover:text-red transition-colors duration-150"
        >
          {t('compare')}
        </Link>
      </div>

    </div>
  );
}
