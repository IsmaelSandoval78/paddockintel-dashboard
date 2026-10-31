// Every edition of a Grand Prix on one time axis: a dot per race in the winning team's colour, a band
// per layout era, and the gaps between eras labelled with how long the circuit went without a race.
// Single missing years inside an era are hollow dashed dots. Server-rendered SVG, drawn twice (wide
// and compact) so the labels stay legible on a phone.
import { teamVar } from '@/components/home-dusk/StandingsCard';
import type { Era } from '@/lib/circuitStory';

type Props = {
  eras: Era[];
  labels: { aria: string; gap: (years: number) => string; gapShort: (years: number) => string; missing: string; winner: (year: number, surname: string) => string };
};

function Timeline({ eras, labels, wide }: Props & { wide: boolean }) {
  const W = wide ? 1200 : 400;
  const H = wide ? 120 : 132;
  const PAD = wide ? 24 : 14;
  const fs = wide ? 11 : 13;
  const editions = eras.flatMap((e) => e.editions);
  const first = editions[0].year;
  const last = editions[editions.length - 1].year;
  const X = (y: number) => PAD + ((y - (first - 1)) / (last + 1 - (first - 1))) * (W - 2 * PAD);
  const decades = [];
  const every = wide ? 10 : 20;
  for (let y = Math.ceil(first / every) * every; y <= last; y += every) decades.push(y);
  const raced = new Set(editions.map((e) => e.year));
  const missing: number[] = [];
  for (const era of eras) for (let y = era.from; y <= era.to; y++) if (!raced.has(y)) missing.push(y);
  const r = wide ? (editions.length > 40 ? 4 : 6) : editions.length > 20 ? 2.5 : 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria} className={wide ? 'hidden md:block w-full h-auto' : 'md:hidden block w-full h-auto'}>
      {eras.map((era) => (
        <g key={`${era.from}-${era.layout}`}>
          <rect x={X(era.from) - 8} y={30} width={X(era.to) - X(era.from) + 16} height={36} rx={10} fill="var(--dusk-panel-hi)" stroke="var(--dusk-line)" />
          {eras.length > 1 && X(era.to) - X(era.from) >= (wide ? 60 : 70) && (
            <text x={(X(era.from) + X(era.to)) / 2} y={20} textAnchor="middle" fontSize={fs} fill="var(--dusk-muted)">
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
            {(wide || X(era.from) - X(prev.to) >= 90) && (
              <text x={(X(prev.to) + X(era.from)) / 2} y={wide ? 92 : 96} textAnchor="middle" fontSize={fs} fill="var(--dusk-muted)">
                {wide ? labels.gap(years) : labels.gapShort(years)}
              </text>
            )}
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
        <text key={y} x={X(y)} y={wide ? 114 : 124} textAnchor="middle" fontSize={fs} fill="var(--dusk-muted)">
          {y}
        </text>
      ))}
    </svg>
  );
}

export default function EraTimeline(props: Props) {
  if (props.eras.flatMap((e) => e.editions).length < 2) return null;
  return (
    <>
      <Timeline {...props} wide />
      <Timeline {...props} wide={false} />
    </>
  );
}
