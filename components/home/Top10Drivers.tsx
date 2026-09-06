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

function DriverRow({
  driver,
  leaderPoints,
}: {
  driver: HomeDriverRow;
  leaderPoints: number;
}) {
  const isP1 = driver.position === 1;
  const gap = leaderPoints - driver.points;
  const barPct = leaderPoints > 0 ? (driver.points / leaderPoints) * 100 : 0;
  const leftColor = isP1 ? 'var(--terracotta)' : teamColor(driver.constructor_ref);
  const barColor = isP1 ? 'var(--terracotta)' : teamColor(driver.constructor_ref);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: isP1 ? 'var(--surface-raised)' : 'var(--bg)',
        borderLeft: `${isP1 ? '3px' : '2px'} solid ${leftColor}`,
        paddingLeft: isP1 ? '17px' : '18px',
      }}
    >
      {/* Ghost rank number — editorial depth */}
      <span
        aria-hidden
        className="absolute right-1 top-1/2 font-mono select-none pointer-events-none leading-none"
        style={{
          fontFamily: 'var(--pi-display)',
          fontSize: isP1 ? '96px' : '80px',
          opacity: 0.04,
          color: 'var(--text-1)',
          transform: 'translateY(-50%)',
          lineHeight: 1,
        }}
      >
        {driver.position}
      </span>

      {/* Main content row */}
      <div
        className="flex items-center pr-5"
        style={{ height: isP1 ? '60px' : '50px' }}
      >
        {/* POS */}
        <span
          className="w-8 shrink-0 tabular-nums text-[12px]"
          style={{
            fontFamily: 'var(--pi-display)',
            color: isP1 ? 'var(--terracotta)' : 'var(--text-3)',
          }}
        >
          {String(driver.position).padStart(2, '0')}
        </span>

        {/* CODE */}
        <span className="hidden md:block font-mono text-[11px] text-text-2 w-10 shrink-0 ml-1 tracking-[0.1em] uppercase">
          {driver.code ?? '—'}
        </span>

        {/* DRIVER name block */}
        <div className="flex-1 min-w-0 overflow-hidden ml-3">
          <span className="block font-mono text-[10px] text-text-3 leading-none mb-[3px] truncate uppercase tracking-[0.06em]">
            {driver.forename}
          </span>
          <span
            className="block uppercase leading-none truncate"
            style={{
              fontFamily: 'var(--pi-display)',
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
              fontSize: isP1 ? '16px' : '14px',
            }}
          >
            {driver.surname}
          </span>
        </div>

        {/* Team dot */}
        <div
          className="hidden md:block w-2 h-2 rounded-full shrink-0 ml-3"
          style={{ backgroundColor: teamColor(driver.constructor_ref) }}
        />

        {/* WINS this season */}
        <div className="hidden md:flex flex-col items-end w-10 shrink-0 ml-3">
          <span className="font-mono text-[13px] text-text-1 tabular-nums leading-none">
            {driver.wins}
          </span>
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.08em] leading-none mt-[2px]">
            WIN
          </span>
        </div>

        {/* PTS + gap block */}
        <div className="flex flex-col items-end shrink-0 ml-4">
          <span
            className="tabular-nums leading-none"
            style={{
              fontFamily: 'var(--pi-display)',
              color: 'var(--text-1)',
              fontSize: isP1 ? '26px' : '20px',
            }}
          >
            {driver.points}
          </span>
          {isP1 ? (
            <span
              className="font-mono text-[9px] uppercase tracking-[0.1em] leading-none mt-[3px]"
              style={{ color: 'var(--terracotta)' }}
            >
              LEADER
            </span>
          ) : (
            <span className="font-mono text-[9px] text-text-3 tabular-nums leading-none mt-[3px]">
              {gap > 0 ? `−${gap}` : '='}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — relative to leader */}
      <div
        className="mx-0 h-[2px]"
        style={{ background: 'var(--surface-raised)' }}
      >
        <div
          className="h-full"
          style={{
            width: `${barPct}%`,
            backgroundColor: barColor,
            opacity: isP1 ? 1 : 0.6,
          }}
        />
      </div>
    </div>
  );
}

export default function Top10Drivers({ drivers }: { drivers: HomeDriverRow[] }) {
  const t = useTranslations();
  const leaderPoints = drivers[0]?.points ?? 0;

  if (drivers.length === 0) {
    return (
      <div className="font-mono text-[13px] text-text-3 py-8 text-center">
        [ {t('hub.home.awaitingData')} ]
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center h-9 pr-5 shrink-0"
        style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', paddingLeft: '20px' }}
      >
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-8 shrink-0">
          {t('drivers.table.pos')}
        </span>
        <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-10 shrink-0 ml-1">
          {t('hub.home.driverCode')}
        </span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] flex-1 ml-3">
          {t('drivers.table.driver')}
        </span>
        <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-6 shrink-0 ml-3">
          ●
        </span>
        <span className="hidden md:block font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-10 text-right shrink-0 ml-3">
          WIN
        </span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-[4.5rem] text-right shrink-0 ml-4">
          {t('drivers.table.pts')}
        </span>
      </div>

      {/* Rows — 1px ink dividers via gap */}
      <div className="grid gap-px" style={{ background: 'var(--border)' }}>
        {drivers.map((d) => (
          <DriverRow key={d.driver_id} driver={d} leaderPoints={leaderPoints} />
        ))}
      </div>
    </div>
  );
}
