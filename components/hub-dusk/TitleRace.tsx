// Who can still catch the leader: each rival's points today (solid, team colour) and the most they
// can still add if they win every remaining race (dashed), against a warm line at the leader's
// points. A rival whose ceiling stays under that line is out. Server-rendered.
import { teamVar } from '@/components/home-dusk/StandingsCard';

type Row = { surname: string; teamRef: string; points: number };

type Props = {
  leaderPoints: number;
  pointsLeft: number;
  rivals: Row[];
  labels: { gap: (n: number) => string; alive: (max: number) => string; out: (max: number) => string };
};

export default function TitleRace({ leaderPoints, pointsLeft, rivals, labels }: Props) {
  if (!rivals.length) return null;
  const scale = Math.max(leaderPoints, ...rivals.map((r) => r.points + pointsLeft)) * 1.04;
  const pct = (v: number) => `${((v / scale) * 100).toFixed(1)}%`;
  return (
    <ul className="list-none m-0 p-0">
      {rivals.map((r) => {
        const max = r.points + pointsLeft;
        const alive = max >= leaderPoints;
        return (
          <li
            key={r.surname}
            className="grid grid-cols-[minmax(0,1fr)_48px] md:grid-cols-[110px_48px_minmax(0,1fr)_170px] items-center gap-x-3 gap-y-1.5 py-2.5 border-t border-[color:var(--dusk-line)] text-[14px]"
          >
            <span className="truncate">{r.surname}</span>
            <span className="dusk-mono text-[color:var(--dusk-ink-2)] text-right md:text-left">{labels.gap(leaderPoints - r.points)}</span>
            <span className="relative h-2.5 rounded-md bg-[color:var(--dusk-header-line)] col-span-2 md:col-span-1">
              <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: pct(r.points), background: teamVar(r.teamRef) }} />
              <span
                className="absolute inset-y-0 rounded-r-md border border-l-0 border-dashed border-[color:var(--dusk-muted)]"
                style={{ left: pct(r.points), width: pct(pointsLeft) }}
              />
              <span className="absolute -inset-y-1.5 w-0.5 bg-[color:var(--dusk-warm)]" style={{ left: pct(leaderPoints) }} />
            </span>
            <span className={`dusk-mono text-[12.5px] whitespace-nowrap col-span-2 md:col-span-1 ${alive ? 'text-[color:var(--dusk-good)]' : 'text-[color:var(--dusk-muted)]'}`}>
              {alive ? labels.alive(max) : labels.out(max)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
