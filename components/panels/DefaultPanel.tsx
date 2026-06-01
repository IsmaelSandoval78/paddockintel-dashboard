import { useTranslations } from 'next-intl';
import type { DriverRow, ConstructorRow } from '@/lib/types';
import type { PanelData } from '@/lib/panel-data';

// Team color dot — inline style required for runtime CSS variable lookup
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

// ─── Section header ──────────────────────────────────────────────
function SectionHeader({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border">
      <span className="font-mono text-xs text-text-2 leading-none">{n} ·</span>
      <span className="text-[13px] font-medium text-text-2 leading-none">{label}</span>
    </div>
  );
}

// ─── Driver row ──────────────────────────────────────────────────
function DriverRow({ driver }: { driver: DriverRow }) {
  const isP1 = driver.position === 1;
  const winRate =
    driver.races > 0 ? Math.round((driver.wins / driver.races) * 100) : 0;

  return (
    <div
      className={[
        'flex items-center h-[52px] border-b border-border',
        // P1: red left border + tinted background. Border-l set via style to
        // avoid Tailwind cascade conflict between border-border (all sides)
        // and side-specific border-l-red.
        isP1 ? 'bg-red-dim pl-[10px]' : 'pl-3',
      ].join(' ')}
      style={isP1 ? { borderLeft: '2px solid var(--red)' } : { borderLeft: '2px solid transparent' }}
    >
      {/* Rank */}
      <span className="font-mono text-xs text-text-3 w-5 shrink-0 tabular-nums text-right mr-3">
        {driver.position}
      </span>

      {/* Name block */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="block text-[11px] text-text-2 leading-none mb-[3px] truncate">
          {driver.forename}
        </span>
        <span className="block text-[13px] font-semibold text-text-1 uppercase leading-none tracking-[0.02em] truncate">
          {driver.surname}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span className="font-mono text-[13px] text-text-1 tabular-nums w-10 text-right">
          {driver.points}
        </span>
        <span className="font-mono text-[11px] text-text-2 tabular-nums w-5 text-right">
          {driver.podiums}
        </span>
        <span className="font-mono text-[11px] text-text-3 tabular-nums w-8 text-right">
          {winRate}%
        </span>
      </div>
    </div>
  );
}

// ─── Constructor row ─────────────────────────────────────────────
function ConstructorRow({ constructor: c }: { constructor: ConstructorRow }) {
  return (
    <div className="flex items-center h-[44px] border-b border-border gap-3 px-3">
      {/* Team color dot — dynamic color requires inline style */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: teamColor(c.constructor_ref) }}
      />

      {/* Name */}
      <span className="flex-1 text-[13px] font-medium text-text-1 min-w-0 truncate">
        {c.name}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-[13px] text-text-1 tabular-nums w-10 text-right">
          {c.points}
        </span>
        <span className="font-mono text-[11px] text-text-2 tabular-nums w-5 text-right">
          {c.wins}
        </span>
      </div>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────
// NOTE: no width/background/border here — HubClient's panel wrapper owns those.
export default function DefaultPanel({ drivers, constructors }: PanelData) {
  const t = useTranslations();

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-6 flex flex-col gap-6">

        {/* 01 · Championship Standings */}
        <section>
          <SectionHeader n="01" label={t('panel.championship')} />

          {/* Column headers — layout mirrors DriverRow exactly */}
          <div className="flex items-center h-6 pl-3" style={{ borderLeft: '2px solid transparent' }}>
            <span className="w-5 mr-3 shrink-0" />
            <div className="flex-1" />
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span className="font-mono text-[10px] text-text-3 tracking-[0.06em] uppercase w-10 text-right">{t('panel.pts')}</span>
              <span className="font-mono text-[10px] text-text-3 tracking-[0.06em] uppercase w-5 text-right">{t('panel.pod')}</span>
              <span className="font-mono text-[10px] text-text-3 tracking-[0.06em] uppercase w-8 text-right">{t('panel.winPct')}</span>
            </div>
          </div>

          {drivers.map((d) => (
            <DriverRow key={d.driver_id} driver={d} />
          ))}
        </section>

        {/* 02 · Constructor Battle */}
        <section>
          <SectionHeader n="02" label={t('panel.constructors')} />
          {constructors.map((c) => (
            <ConstructorRow key={c.constructor_id} constructor={c} />
          ))}
        </section>

      </div>
    </div>
  );
}
