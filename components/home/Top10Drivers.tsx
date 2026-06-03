import { useTranslations } from 'next-intl';
import type { HomeDriverRow } from '@/lib/types';

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

function DriverRow({ driver }: { driver: HomeDriverRow }) {
  const isP1 = driver.position === 1;

  return (
    <div
      className="flex items-center h-[52px] pr-5"
      style={{
        background: isP1 ? 'var(--surface-raised)' : 'var(--bg)',
        borderLeft: isP1 ? '3px solid var(--red)' : '3px solid transparent',
        paddingLeft: isP1 ? '17px' : '17px',
      }}
    >
      {/* POS */}
      <span
        className="w-8 shrink-0 tabular-nums text-[13px]"
        style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
      >
        {driver.position}
      </span>

      {/* CODE — hidden on mobile */}
      <span className="hidden md:block font-mono text-[11px] text-text-2 w-10 shrink-0 ml-1 tracking-[0.1em] uppercase">
        {driver.code ?? '—'}
      </span>

      {/* DRIVER — forename + surname */}
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

      {/* TEAM DOT — hidden on mobile */}
      <div
        className="hidden md:block w-2 h-2 rounded-full shrink-0 ml-3"
        style={{ backgroundColor: teamColor(driver.constructor_ref) }}
      />

      {/* PTS — dominant number */}
      <span
        className="w-14 text-right shrink-0 tabular-nums text-[20px] ml-3"
        style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
      >
        {driver.points}
      </span>
    </div>
  );
}

export default function Top10Drivers({ drivers }: { drivers: HomeDriverRow[] }) {
  const t = useTranslations();

  if (drivers.length === 0) {
    return (
      <div className="font-mono text-[13px] text-text-3 py-8 text-center">
        [ AWAITING DATA ]
      </div>
    );
  }

  return (
    <div className="grid gap-px" style={{ background: 'var(--border)' }}>
      {/* Header row */}
      <div
        className="flex items-center h-9 pr-5 shrink-0"
        style={{ background: 'var(--border)', paddingLeft: '20px' }}
      >
        <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-8 shrink-0">
          {t('drivers.table.pos')}
        </span>
        <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-10 shrink-0 ml-1">
          COD
        </span>
        <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] flex-1 ml-3">
          {t('drivers.table.driver')}
        </span>
        <span className="hidden md:block font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-6 shrink-0 ml-3">
          ●
        </span>
        <span className="font-mono text-[10px] text-bg uppercase tracking-[0.1em] w-14 text-right shrink-0 ml-3">
          {t('drivers.table.pts')}
        </span>
      </div>

      {drivers.map((d) => (
        <DriverRow key={d.driver_id} driver={d} />
      ))}
    </div>
  );
}
