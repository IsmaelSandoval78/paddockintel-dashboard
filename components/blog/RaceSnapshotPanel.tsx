import { getTranslations } from 'next-intl/server';

interface RaceSnapshotPanelProps {
  lastRace: {
    raceName: string;
    winner: { forename: string; surname: string; constructor_name: string } | null;
    fastestLap: { forename: string; surname: string; time: string } | null;
  } | null;
  nextRace: { name: string; daysUntil: number } | null;
}

// Compact strip for Band B (magazine-home redesign, 2026-09-18): who won the
// last race + the fastest lap, and a countdown to the next one. Replaces the
// old full "Last race + Next race" band (movers, retirements, full circuit
// history) that used to sit lower on the page -- that level of detail earns
// its own page (Hub circuit page), not real estate on the magazine cover.
export default async function RaceSnapshotPanel({ lastRace, nextRace }: RaceSnapshotPanelProps) {
  const t = await getTranslations('magazine.raceHighlights');
  const tFast = await getTranslations('magazine.fastestFacts');
  const tCircuit = await getTranslations('magazine.circuit');

  if (!lastRace && !nextRace) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 pb-10 mb-10 border-b border-border-subtle">
      {lastRace && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('lastRace')}</p>
          <p className="font-display text-text-1 tracking-[-0.02em] text-lg mb-4">{lastRace.raceName}</p>
          <div className="grid grid-cols-2 gap-6">
            {lastRace.winner && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('winner')}</p>
                <p className="font-sans text-sm text-text-1">
                  {lastRace.winner.forename} {lastRace.winner.surname}
                </p>
                {lastRace.winner.constructor_name && (
                  <p className="font-mono text-[10px] text-text-2 mt-0.5">{lastRace.winner.constructor_name}</p>
                )}
              </div>
            )}
            {lastRace.fastestLap && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{tFast('lap')}</p>
                <p
                  className="tabular-nums leading-none"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: '1.15rem', color: 'var(--terracotta)' }}
                >
                  {lastRace.fastestLap.time}
                </p>
                <p className="font-sans text-sm text-text-1 mt-1">
                  {lastRace.fastestLap.forename} {lastRace.fastestLap.surname}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {nextRace && (
        <div className="sm:border-l sm:border-border-subtle sm:pl-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{tCircuit('kicker')}</p>
          <p className="font-display text-text-1 tracking-[-0.02em] text-lg mb-4">{nextRace.name}</p>
          <p
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--pi-display)', fontSize: '1.15rem', color: 'var(--terracotta)' }}
          >
            {tCircuit('daysUntil', { days: Math.max(nextRace.daysUntil, 0) })}
          </p>
        </div>
      )}
    </div>
  );
}
