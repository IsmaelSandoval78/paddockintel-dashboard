import { getTranslations } from 'next-intl/server';

interface RaceSnapshotPanelProps {
  lastRace: {
    raceName: string;
    winner: { forename: string; surname: string; constructor_name: string } | null;
    fastestLap: { forename: string; surname: string; time: string } | null;
  } | null;
  nextRace: {
    name: string;
    daysUntil: number;
    lapRecord: { forename: string; surname: string; time: string; year: number } | null;
    champions: Array<{ year: number; forename: string; surname: string }>;
  } | null;
}

// Last race (winner + fastest lap) and next race (countdown + circuit history:
// lap record and recent winners here) — the standings summary that used to sit
// beside this panel moved out; full standings live in their own section below.
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
                <p className="font-sans font-extrabold tabular-nums leading-none text-accent-2 text-xl">
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
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2">{tCircuit('kicker')}</p>
            <p className="font-mono text-[10px] font-bold text-accent-2 tabular-nums shrink-0">
              {tCircuit('daysUntil', { days: Math.max(nextRace.daysUntil, 0) })}
            </p>
          </div>
          <p className="font-sans font-semibold text-text-1 tracking-[-0.01em] text-base mb-4">{nextRace.name}</p>

          {nextRace.lapRecord && (
            <div className="mb-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{tCircuit('lapRecord')}</p>
              <p className="font-sans font-extrabold tabular-nums leading-none text-accent-2 text-xl">
                {nextRace.lapRecord.time}
              </p>
              <p className="font-sans text-sm text-text-1 mt-1.5">
                {nextRace.lapRecord.forename} {nextRace.lapRecord.surname}
                <span className="font-mono text-[10px] text-text-2 ml-1.5">{nextRace.lapRecord.year}</span>
              </p>
            </div>
          )}

          {nextRace.champions.length > 0 && (
            <div className="pt-3 border-t border-border-subtle">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-2">{tCircuit('recentWinners')}</p>
              <div className="flex flex-col gap-1.5">
                {nextRace.champions.slice(0, 3).map((c) => (
                  <p key={c.year} className="font-sans text-sm text-text-1">
                    <span className="font-mono text-xs text-text-2 tabular-nums mr-2">{c.year}</span>
                    {c.forename} {c.surname}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
