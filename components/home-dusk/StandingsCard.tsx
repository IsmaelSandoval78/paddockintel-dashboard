// Zentra's KPI card with breakdown (E): the leader's points as the big number, the lead over P2
// as the delta badge, and the top five as bars in team colour, scaled from zero to the leader.
// Team colours are data (constructor_ref -> --team-*), never decoration.

const TEAM_VAR: Record<string, string> = {
  mercedes: 'var(--team-mercedes)',
  mclaren: 'var(--team-mclaren)',
  red_bull: 'var(--team-redbull)',
  ferrari: 'var(--team-ferrari)',
  alpine: 'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas: 'var(--team-haas)',
  williams: 'var(--team-williams)',
  rb: 'var(--team-rb)',
  audi: 'var(--team-audi)',
  cadillac: 'var(--team-cadillac)',
};

export const teamVar = (ref: string) => TEAM_VAR[ref] ?? 'var(--dusk-ink-2)';

export type StandingsRow = { key: number; name: string; team: string; teamRef: string; points: number; display: string };

type Props = {
  title: string;
  sub: string;
  leaderPoints: string;
  delta: string | null;
  rows: StandingsRow[];
  linkLabel: string;
  linkHref: string;
  className?: string;
};

export default function StandingsCard({ title, sub, leaderPoints, delta, rows, linkLabel, linkHref, className = '' }: Props) {
  if (!rows.length) return null;
  const max = rows[0].points || 1;
  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-standings-title">
      <div>
        <h2 id="dusk-standings-title" className="text-[17px] font-semibold m-0">{title}</h2>
        <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{sub}</p>
      </div>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <p className="dusk-display tabular-nums leading-none tracking-[-0.03em] text-[3.2rem]">{leaderPoints}</p>
        {delta && <span className="dusk-delta">{delta}</span>}
      </div>
      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.key} className="grid grid-cols-[18px_minmax(0,1fr)_auto] gap-x-2.5 gap-y-1 items-center">
            <span className="dusk-mono text-[12px] text-[color:var(--dusk-muted)]">{i + 1}</span>
            <span className="text-[14.5px] font-semibold truncate">
              {r.name}
              <span className="dusk-mono text-[11px] font-normal text-[color:var(--dusk-muted)] ml-1.5">{r.team}</span>
            </span>
            <span className="dusk-mono text-[14px] tabular-nums">{r.display}</span>
            <span className="dusk-track col-start-2 col-end-4 h-2 rounded-full overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${((r.points / max) * 100).toFixed(1)}%`, background: teamVar(r.teamRef) }} />
            </span>
          </li>
        ))}
      </ol>
      <a href={linkHref} className="dusk-link text-[13.5px] mt-auto">{linkLabel} →</a>
    </section>
  );
}
