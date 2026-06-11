import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import TrackSvg, { TrackSvgFallback } from '@/components/circuits/TrackSvg';
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
  cadillac:     '#ffffff',
  audi:         '#bb0000',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mt-5 mb-2">
      {children}
    </p>
  );
}

export default function LastRaceCard({ race }: { race: HomeLastRaceData | null }) {
  const t = useTranslations('hub.home');

  if (!race) {
    return (
      <div className="border border-border p-5">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
          [ LAST RACE ]
        </p>
        <p className="font-mono text-[13px] text-text-3">[ NO DATA ]</p>
      </div>
    );
  }

  const rdLabel = `RD.${String(race.round).padStart(2, '0')}`;

  return (
    <div className="border border-border p-5 flex flex-col">

      {/* Header */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-1">
        [ {t('lastRace').toUpperCase()} ] · {rdLabel}
      </p>

      <h2
        className="text-[clamp(1.3rem,2.2vw,1.5rem)] uppercase leading-[0.92] tracking-[-0.02em] text-text-1 mt-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {race.circuit_name}
      </h2>

      <p className="font-mono text-[11px] text-text-2 mt-1">
        {race.name} · {formatDate(race.date)}
      </p>

      {/* Circuit SVG */}
      <div className="mt-4 max-w-[160px] mx-auto w-full">
        {race.circuit_svg ? (
          <TrackSvg
            pathData={race.circuit_svg.path}
            viewBox={race.circuit_svg.viewBox}
            circuitName={race.circuit_name}
          />
        ) : (
          <TrackSvgFallback circuitName={race.circuit_name} />
        )}
      </div>

      {/* Podium */}
      <SectionLabel>{t('podium').toUpperCase()}</SectionLabel>
      <div className="flex flex-col gap-[3px]">
        {race.podium.map((p) => (
          <div key={p.position} className="flex items-center gap-2">
            <span
              className="w-5 shrink-0 tabular-nums text-[13px] leading-none"
              style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)' }}
            >
              {p.position}
            </span>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: teamColor(p.constructor_ref) }}
            />
            <span
              className="text-[13px] uppercase leading-none flex-1 min-w-0 truncate"
              style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}
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

      {/* Fastest Lap */}
      {race.fastest_lap && (
        <>
          <SectionLabel>{t('fastestLap').toUpperCase()}</SectionLabel>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] uppercase leading-none flex-1 min-w-0 truncate"
              style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}
            >
              {race.fastest_lap.surname}
            </span>
            <span
              className="font-mono text-[11px] shrink-0 tabular-nums"
              style={{ color: 'var(--red)' }}
            >
              {race.fastest_lap.time}
            </span>
          </div>
        </>
      )}

      {/* Fastest Pit */}
      {race.fastest_pit && (
        <>
          <SectionLabel>{t('fastestPit').toUpperCase()}</SectionLabel>
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] uppercase leading-none flex-1 min-w-0 truncate"
              style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-1)', letterSpacing: '-0.01em' }}
            >
              {race.fastest_pit.surname}
            </span>
            <span className="font-mono text-[10px] text-text-3 shrink-0 truncate">
              {race.fastest_pit.constructor_name}
            </span>
            <span
              className="font-mono text-[11px] shrink-0 tabular-nums"
              style={{ color: 'var(--red)' }}
            >
              {race.fastest_pit.duration}s
            </span>
          </div>
        </>
      )}

      {/* Retirements */}
      {race.retirements.length > 0 && (
        <>
          <SectionLabel>
            {t('retirements').toUpperCase()} · {race.retirements.length}
          </SectionLabel>
          <div className="flex flex-col gap-[3px]">
            {race.retirements.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="text-[12px] uppercase leading-none flex-1 min-w-0 truncate"
                  style={{ fontFamily: 'var(--pi-display)', color: 'var(--text-2)', letterSpacing: '-0.01em' }}
                >
                  {r.surname}
                </span>
                <span className="font-mono text-[10px] text-text-3 shrink-0 tabular-nums">
                  {t('lap')} {r.lap}
                </span>
                <span className="font-mono text-[10px] text-text-3 shrink-0 truncate max-w-[80px]">
                  {r.status}
                </span>
              </div>
            ))}
            {race.retirements.length > 5 && (
              <p className="font-mono text-[10px] text-text-3 mt-1">
                +{race.retirements.length - 5} {t('more')}
              </p>
            )}
          </div>
        </>
      )}

      {/* CTA */}
      <Link
        href={`/circuits/${race.circuit_ref}`}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-100 mt-6 block"
      >
        [ {t('viewCircuit').toUpperCase()} → ]
      </Link>

    </div>
  );
}
