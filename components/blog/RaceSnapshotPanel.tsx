import { getTranslations } from 'next-intl/server';

interface RaceSnapshotPanelProps {
  lastRace: {
    raceName: string;
    winner: { forename: string; surname: string; constructor_name: string } | null;
    fastestLap: { forename: string; surname: string; time: string } | null;
  } | null;
  nextRace: { name: string; daysUntil: number } | null;
}

// Compact bento tile: who won the last race + the fastest lap, and a countdown to the
// next one. Deeper detail (movers, retirements, full circuit history) lives on the Hub
// circuit page, not on the magazine cover.
export default async function RaceSnapshotPanel({ lastRace, nextRace }: RaceSnapshotPanelProps) {
  const t = await getTranslations('magazine.raceHighlights');
  const tFast = await getTranslations('magazine.fastestFacts');
  const tCircuit = await getTranslations('magazine.circuit');

  if (!lastRace && !nextRace) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
      {lastRace && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('lastRace')}</p>
          <p className="font-sans font-semibold text-text-1 tracking-[-0.01em] text-base mb-4">{lastRace.raceName}</p>
          <div className="flex flex-col gap-4">
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
                <p className="font-sans font-bold tabular-nums leading-none text-accent text-xl">
                  {lastRace.fastestLap.time}
                </p>
                <p className="font-sans text-sm text-text-1 mt-1.5">
                  {lastRace.fastestLap.forename} {lastRace.fastestLap.surname}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {nextRace && (
        <div className="sm:border-l sm:border-border-subtle sm:pl-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{tCircuit('kicker')}</p>
          <p className="font-sans font-semibold text-text-1 tracking-[-0.01em] text-base mb-4">{nextRace.name}</p>
          <p className="font-sans font-bold tabular-nums leading-none text-accent text-xl">
            {tCircuit('daysUntil', { days: Math.max(nextRace.daysUntil, 0) })}
          </p>
        </div>
      )}
    </div>
  );
}
