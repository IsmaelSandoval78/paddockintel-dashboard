import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { HomeLastRaceData } from '@/lib/types';

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
  cadillac:     '#888',
  audi:         '#9a0000',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function LastRaceCard({ race }: { race: HomeLastRaceData | null }) {
  const t = useTranslations('hub.home');

  if (!race) {
    return (
      <div className="px-5 md:px-6 py-5">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em]">[ LAST RACE ]</p>
        <p className="font-mono text-[12px] text-text-3 mt-3">[ NO DATA ]</p>
      </div>
    );
  }

  const rdLabel = `RD.${String(race.round).padStart(2, '0')}`;

  return (
    <div className="flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 md:px-6 pt-5 pb-4">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] mb-3">
          [ {t('lastRace').toUpperCase()} ] · {rdLabel} · {formatDate(race.date)}
        </p>
        <h2
          className="uppercase leading-[0.9] text-text-1"
          style={{
            fontFamily:    'var(--pi-display)',
            fontSize:      'clamp(26px, 3.5vw, 40px)',
            letterSpacing: '-0.025em',
          }}
        >
          {race.circuit_name}
        </h2>
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.08em] mt-1.5">
          {race.name}
        </p>
      </div>

      {/* ── Track SVG — full-width editorial strip ──────────── */}
      {race.circuit_svg ? (
        <div
          className="w-full flex items-center justify-center border-y border-border"
          style={{ height: '148px', background: 'var(--bg)' }}
        >
          <svg
            viewBox={race.circuit_svg.viewBox}
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', padding: '12px' }}
            role="img"
            aria-label={`Track map — ${race.circuit_name}`}
          >
            <path
              d={race.circuit_svg.path}
              stroke="var(--text-2)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <div
          className="w-full border-y border-border flex items-center justify-center"
          style={{ height: '148px', background: 'var(--bg)' }}
        >
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em]">
            [ NO TRACK MAP ]
          </span>
        </div>
      )}

      {/* ── Podium ─────────────────────────────────────────── */}
      <div className="px-5 md:px-6 pt-4 pb-3">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] mb-3">
          {t('podium').toUpperCase()}
        </p>
        <div className="flex flex-col gap-1">
          {race.podium.map((p) => (
            <div
              key={p.position}
              className="flex items-center gap-3 pl-3"
              style={{ borderLeft: `2px solid ${teamColor(p.constructor_ref)}` }}
            >
              <span
                className="tabular-nums shrink-0 w-4 text-text-3"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '13px' }}
              >
                {p.position}
              </span>
              <span
                className="uppercase leading-none flex-1 min-w-0 truncate text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '15px', letterSpacing: '-0.01em' }}
              >
                {p.surname}
              </span>
              {p.time && (
                <span className="font-mono text-[10px] text-text-3 shrink-0 tabular-nums">
                  {p.time}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom stats: fastest lap + pit ────────────────── */}
      <div
        className="px-5 md:px-6 pt-3 pb-4 mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border"
      >
        {race.fastest_lap && (
          <div>
            <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em] mb-1">
              {t('fastestLap').toUpperCase()}
            </p>
            <p
              className="uppercase leading-none text-text-1 truncate"
              style={{ fontFamily: 'var(--pi-display)', fontSize: '14px' }}
            >
              {race.fastest_lap.surname}
            </p>
            <p className="font-mono text-[11px] tabular-nums mt-0.5" style={{ color: 'var(--red)' }}>
              {race.fastest_lap.time}
            </p>
          </div>
        )}

        {race.fastest_pit && (
          <div>
            <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em] mb-1">
              {t('fastestPit').toUpperCase()}
            </p>
            <p
              className="uppercase leading-none text-text-1 truncate"
              style={{ fontFamily: 'var(--pi-display)', fontSize: '14px' }}
            >
              {race.fastest_pit.surname}
            </p>
            <p className="font-mono text-[11px] tabular-nums mt-0.5" style={{ color: 'var(--red)' }}>
              {race.fastest_pit.duration}s
            </p>
          </div>
        )}
      </div>

      {/* ── CTA ────────────────────────────────────────────── */}
      <div className="px-5 md:px-6 pb-5 border-t border-border pt-3">
        <Link
          href={`/circuits/${race.circuit_ref}`}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-3 hover:text-text-1 transition-colors duration-100"
        >
          [ {t('viewCircuit').toUpperCase()} → ]
        </Link>
      </div>

    </div>
  );
}
