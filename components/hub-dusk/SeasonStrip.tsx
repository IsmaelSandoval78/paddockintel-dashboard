// Every round of the season in one strip: the winner's code in their team colour, a dot when they
// won from pole, and a bar for who led the championship after that round (warm = current leader,
// ice = anyone else). Rounds still to race show their date. Server-rendered.
import { teamVar } from '@/components/home-dusk/StandingsCard';
import type { SeasonRound } from '@/lib/hubSeason';

type Props = {
  rounds: SeasonRound[];
  lastRound: number;
  leaderCode: string;
  labels: {
    round: (n: number) => string;
    date: (iso: string) => string;
    fromPole: string;
    ledBy: (code: string) => string;
    winner: (surname: string, round: number) => string;
  };
};

export default function SeasonStrip({ rounds, lastRound, leaderCode, labels }: Props) {
  return (
    <ol className="grid grid-cols-6 md:grid-cols-12 xl:grid-flow-col xl:auto-cols-fr xl:grid-cols-none gap-1.5 list-none m-0 p-0">
      {rounds.map((r) => {
        const played = r.round <= lastRound && r.winner;
        return (
          <li
            key={r.round}
            className={`flex flex-col items-center gap-1.5 rounded-[10px] pt-2 overflow-hidden min-h-[118px] text-[11px] ${
              played ? 'bg-[color:var(--dusk-panel-hi)]' : 'border border-dashed border-[color:var(--dusk-line)] opacity-50'
            }`}
            aria-label={played ? labels.winner(r.winner!.surname, r.round) : undefined}
          >
            <span className="dusk-mono text-[color:var(--dusk-muted)]">{labels.round(r.round)}</span>
            <span className="text-[10px] leading-[1.1] h-[22px] overflow-hidden text-center text-[color:var(--dusk-ink-2)] px-0.5">{r.location}</span>
            {played ? (
              <>
                <span
                  className="dusk-mono text-[11px] px-1.5 py-0.5 rounded-md border-l-2"
                  style={{
                    borderColor: teamVar(r.winner!.teamRef),
                    background: `color-mix(in srgb, ${teamVar(r.winner!.teamRef)} 22%, transparent)`,
                  }}
                >
                  {r.winner!.code}
                </span>
                <span
                  className={`w-[7px] h-[7px] rounded-full border ${
                    r.poleCode === r.winner!.code
                      ? 'bg-[color:var(--dusk-sunset)] border-[color:var(--dusk-sunset)]'
                      : 'border-[color:var(--dusk-muted)]'
                  }`}
                  title={r.poleCode === r.winner!.code ? labels.fromPole : undefined}
                />
                {r.leaderCode && (
                  <span
                    className={`mt-auto h-1 w-full ${r.leaderCode === leaderCode ? 'bg-[color:var(--dusk-warm)]' : 'bg-[color:var(--dusk-ice)]'}`}
                    title={labels.ledBy(r.leaderCode)}
                  />
                )}
              </>
            ) : (
              <span className="dusk-mono mt-auto mb-2 text-[color:var(--dusk-muted)]">{labels.date(r.date)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
