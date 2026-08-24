'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { ConstructorDetail } from '@/lib/types';

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

function posLabel(pos: number | null): string {
  return pos !== null ? `P${pos}` : '—';
}

function posColor(pos: number | null): string {
  if (pos === 1) return 'text-terracotta';
  if (pos !== null && pos <= 3) return 'text-gold';
  if (pos !== null) return 'text-text-1';
  return 'text-text-3';
}

function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-2">
      <span className="font-mono text-xs text-text-2 leading-none">{n} ·</span>
      <span className="text-[13px] font-medium text-text-2 leading-none">{label}</span>
    </div>
  );
}

export default function InlineConstructorPanel({
  detail,
  onClose,
}: {
  detail: ConstructorDetail;
  onClose: () => void;
}) {
  const t = useTranslations('constructors.panel');
  const color = teamColor(detail.constructor_ref);

  return (
    <div className="bg-surface border-t border-border">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-start justify-between border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-3 h-3 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: color }}
            />
            <h2 className="font-serif text-[28px] text-text-1 leading-tight">
              {detail.name}
            </h2>
          </div>
          <p className="font-mono text-[11px] text-text-3 ml-6">
            {detail.nationality}
            <span className="mx-2">·</span>
            {detail.first_year}–{detail.last_year}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-none text-text-3 hover:text-text-1 hover:bg-surface-raised transition-colors duration-150 shrink-0 text-lg leading-none ml-4 mt-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* ── Stats grid — 3 columns ─────────────────────────────── */}
      <div className="overflow-x-auto">
      <div className="grid grid-cols-3 divide-x divide-border min-w-[480px]">

        {/* Col 1 — Career numbers */}
        <div className="px-6 py-4 flex gap-8">
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('races')}
            </p>
            <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
              {detail.races}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('wins')}
            </p>
            <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
              {detail.wins}
            </p>
          </div>
        </div>

        {/* Col 2 — Career records */}
        <div className="px-6 py-4 flex flex-col gap-4">
          <div>
            <SectionLabel n="01" label={t('podiums')} />
            <span className="font-serif text-[28px] text-text-1 leading-none tabular-nums">
              {detail.podiums}
            </span>
          </div>
          <div>
            <SectionLabel n="02" label={t('fastestLaps')} />
            <span className="font-mono text-[20px] text-text-2 leading-none tabular-nums">
              {detail.fastest_laps}
            </span>
          </div>
        </div>

        {/* Col 3 — 2026 season or era */}
        <div className="px-6 py-4">
          {detail.season_2026 ? (
            <>
              <SectionLabel n="03" label={t('season2026')} />
              <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums mb-1">
                P{detail.season_2026.position}
              </p>
              <p className="font-mono text-[13px] text-text-1 tabular-nums mt-1">
                {detail.season_2026.points}{' '}
                <span className="text-text-3">pts</span>
                {detail.season_2026.wins > 0 && (
                  <span className="ml-2 text-terracotta">{detail.season_2026.wins}W</span>
                )}
              </p>
            </>
          ) : (
            <>
              <SectionLabel n="03" label={t('era')} />
              <p className="font-mono text-[20px] text-text-1 leading-none tabular-nums">
                {detail.first_year}–{detail.last_year}
              </p>
              <p className="text-[13px] text-text-2 mt-2">{detail.nationality}</p>
            </>
          )}
        </div>

      </div>
      </div>

      {/* ── Last 5 races ───────────────────────────────────────── */}
      {detail.last_5_results.length > 0 && (
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
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
                    posColor(r.best_position),
                  ].join(' ')}
                >
                  {posLabel(r.best_position)}
                </span>
                <span className="font-mono text-[11px] text-text-3 tabular-nums w-12 text-right shrink-0">
                  {r.points > 0 ? `${r.points}pt` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border">
        <Link
          href={`/constructors/${detail.constructor_ref}`}
          className="text-[13px] text-text-2 hover:text-terracotta transition-colors duration-150"
        >
          {t('viewFull')}
        </Link>
      </div>

    </div>
  );
}
