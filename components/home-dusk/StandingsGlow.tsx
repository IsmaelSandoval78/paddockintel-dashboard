import type { Top5Driver } from '@/app/[locale]/(blog)/magazine-home/data';

// Top 5 drivers with team-colour bars. Bars start at zero and scale to the leader's points.
// Team colours resolve through the --team-* tokens, which the dusk scope sets to the official
// 2026 live-timing colours.

const TEAM_VAR: Record<string, string> = {
  mercedes: 'var(--team-mercedes)',
  mclaren: 'var(--team-mclaren)',
  red_bull: 'var(--team-redbull)',
  ferrari: 'var(--team-ferrari)',
  alpine: 'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas: 'var(--team-haas)',
  williams: 'var(--team-williams)',
  sauber: 'var(--team-sauber)',
  kick_sauber: 'var(--team-sauber)',
  rb: 'var(--team-rb)',
  audi: 'var(--team-audi)',
  cadillac: 'var(--team-cadillac)',
};

function teamVar(ref: string): string {
  return TEAM_VAR[ref] ?? 'var(--dusk-ink-2)';
}

type Props = {
  title: string;
  leadChip: string | null;
  linkLabel: string;
  linkHref: string;
  drivers: Top5Driver[];
};

export default function StandingsGlow({ title, leadChip, linkLabel, linkHref, drivers }: Props) {
  if (!drivers.length) return null;
  const leaderPoints = Number(drivers[0].points) || 1;
  const leaderColour = teamVar(drivers[0].constructor_ref);

  return (
    <section className="dusk-panel flex-[1_1_380px] min-w-0 p-5 sm:p-6 flex flex-col gap-3.5">
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <h2 className="dusk-display text-[1.3rem] sm:text-[1.4rem] leading-tight">{title}</h2>
        {leadChip && (
          <span className="dusk-mono uppercase text-[12px] tracking-[0.06em]" style={{ color: leaderColour }}>
            {leadChip}
          </span>
        )}
      </div>
      <ol className="m-0 p-0 list-none flex flex-col gap-3.5">
        {drivers.map((d) => {
          const points = Number(d.points);
          const width = Math.max(0, Math.min(100, (points / leaderPoints) * 100));
          const colour = teamVar(d.constructor_ref);
          return (
            <li key={d.driver_id} className="grid grid-cols-[22px_minmax(0,1fr)_52px] gap-3 items-center">
              <span className="dusk-mono text-[12px] text-[color:var(--dusk-muted)] tabular-nums">{d.position}</span>
              <div className="min-w-0">
                <div className="text-[15px] truncate">
                  {d.surname}{' '}
                  <span className="dusk-mono text-[11px] text-[color:var(--dusk-muted)]">{d.constructor_name}</span>
                </div>
                <div className="h-2 rounded-[4px] bg-[color:var(--dusk-line)] mt-1.5 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-2"
                    style={{ width: `${width.toFixed(1)}%`, background: colour, boxShadow: `0 0 12px ${colour}` }}
                    data-glow
                  />
                </div>
              </div>
              <span className="dusk-mono font-bold text-[16px] text-right tabular-nums">{points}</span>
            </li>
          );
        })}
      </ol>
      <a href={linkHref} className="dusk-link mt-1 text-[14px] self-start py-2">
        {linkLabel}
      </a>
    </section>
  );
}
