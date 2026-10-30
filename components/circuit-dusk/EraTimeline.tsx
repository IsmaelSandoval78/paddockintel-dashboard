// Every edition of a Grand Prix on one time axis: a dot per race in the winning team's colour, a band
// per layout era, and the gaps between eras labelled with how long the circuit went without a race.
// Single missing years inside an era are hollow dashed dots. Server-rendered SVG.
import { teamVar } from '@/components/home-dusk/StandingsCard';
import type { Era } from '@/lib/circuitStory';

type Props = {
  eras: Era[];
  labels: { aria: string; gap: (years: number) => string; missing: string; winner: (year: number, surname: string) => string };
};

const W = 1200;
const H = 120;
const PAD = 24;

export default function EraTimeline({ eras, labels }: Props) {
  const editions = eras.flatMap((e) => e.editions);
  if (editions.length < 2) return null;
  const first = editions[0].year;
  const last = editions[editions.length - 1].year;
  const X = (y: number) => PAD + ((y - (first - 1)) / (last + 1 - (first - 1))) * (W - 2 * PAD);
  const decades = [];
  for (let y = Math.ceil(first / 10) * 10; y <= last; y += 10) decades.push(y);
  const raced = new Set(editions.map((e) => e.year));
  const missing: number[] = [];
  for (const era of eras) for (let y = era.from; y <= era.to; y++) if (!raced.has(y)) missing.push(y);
  const r = editions.length > 40 ? 4 : 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria} className="block w-full h-auto">
      {eras.map((era) => (
        <g key={`${era.from}-${era.layout}`}>
          <rect x={X(era.from) - 8} y={30} width={X(era.to) - X(era.from) + 16} height={36} rx={10} fill="var(--dusk-panel-hi)" stroke="var(--dusk-line)" />
          {eras.length > 1 && (
            <text x={(X(era.from) + X(era.to)) / 2} y={20} textAnchor="middle" fontSize={11} fill="var(--dusk-muted)">
              {era.from === era.to ? era.from : `${era.from}–${era.to}`}
            </text>
          )}
        </g>
      ))}
      {eras.slice(1).map((era, i) => {
        const prev = eras[i];
        const years = era.from - prev.to - 1;
        if (years < 2) return null;
        return (
          <g key={`gap-${era.from}`}>
            <line x1={X(prev.to) + 12} x2={X(era.from) - 12} y1={48} y2={48} stroke="var(--dusk-line)" strokeDasharray="3 5" />
            <text x={(X(prev.to) + X(era.from)) / 2} y={92} textAnchor="middle" fontSize={11} fill="var(--dusk-muted)">
              {labels.gap(years)}
            </text>
          </g>
        );
      })}
      {missing.map((y) => (
        <circle key={`m-${y}`} cx={X(y)} cy={48} r={r - 1} fill="none" stroke="var(--dusk-muted)" strokeDasharray="2 2">
          <title>{`${y} · ${labels.missing}`}</title>
        </circle>
      ))}
      {editions.map((e) => (
        <circle key={e.raceId} cx={X(e.year)} cy={48} r={r} fill={teamVar(e.winner.teamRef)}>
          <title>{labels.winner(e.year, e.winner.surname)}</title>
        </circle>
      ))}
      {decades.map((y) => (
        <text key={y} x={X(y)} y={114} textAnchor="middle" fontSize={11} fill="var(--dusk-muted)">
          {y}
        </text>
      ))}
    </svg>
  );
}
