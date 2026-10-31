// Where each winner started: one bar per edition, hanging down from the top, as long as the winner's
// grid slot. Wins from pole in sunset, the deepest comeback in warm, the rest muted. Pit-lane starts
// (grid 0) are drawn at the back of the field. Server-rendered SVG.
import type { Edition } from '@/lib/circuitStory';

type Props = {
  editions: Edition[];
  deepestRaceId: number | null;
  labels: { aria: string; bar: (year: number, surname: string, grid: string) => string; pitLane: string };
};

const W = 1200;
const TOP = 24;

export default function WinnerGrid({ editions, deepestRaceId, labels }: Props) {
  if (editions.length < 2) return null;
  const n = editions.length;
  const back = Math.max(...editions.map((e) => e.winner.grid), 1);
  const step = n > 30 ? 6 : 12;
  const H = TOP + back * step + 40;
  const bw = (W - 40) / n;
  const yearEvery = Math.ceil(n / 30);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria} className="block w-full h-auto">
      {editions.map((e, i) => {
        const grid = e.winner.grid > 0 ? e.winner.grid : back;
        const h = 8 + (grid - 1) * step;
        const x = 20 + i * bw;
        const fill =
          e.raceId === deepestRaceId ? 'var(--dusk-warm)' : e.pole && e.pole.ref === e.winner.ref ? 'var(--dusk-sunset)' : 'var(--dusk-muted)';
        const gridLabel = e.winner.grid > 0 ? `P${e.winner.grid}` : labels.pitLane;
        return (
          <g key={e.raceId}>
            <rect x={x + bw * 0.15} y={TOP} width={bw * 0.7} height={h} rx={Math.min(4, bw * 0.2)} fill={fill} fillOpacity={fill === 'var(--dusk-muted)' ? 0.55 : 1}>
              <title>{labels.bar(e.year, e.winner.surname, gridLabel)}</title>
            </rect>
            {(n <= 30 || e.winner.grid >= 4 || e.raceId === deepestRaceId) && (
              <text x={x + bw / 2} y={TOP + h + 14} textAnchor="middle" fontSize={11} fill={fill}>
                {gridLabel}
              </text>
            )}
            {i % yearEvery === 0 && (
              <text x={x + bw / 2} y={14} textAnchor="middle" fontSize={11} fill="var(--dusk-muted)">
                {String(e.year).slice(2)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
