// The title fight as terrain: cumulative points after each round for the top five, the leader in warm
// with a glowing area, the runner-up in ice, the rest muted. Rounds still to race are hatched, and a
// dashed line climbs from the runner-up to the most they can still reach. Server-rendered SVG, drawn
// twice (wide and compact) so the labels stay legible on a phone.

type Series = { code: string; points: number[] };

type Props = {
  series: Series[];
  totalRounds: number;
  leaderCode: string;
  rivalCode: string | null;
  rivalMax: number | null;
  labels: { aria: string; ceiling: string; pending: string; round: (n: number) => string };
};

const WARM = 'var(--dusk-warm)';
const ICE = 'var(--dusk-ice)';
const MUTED = 'var(--dusk-muted)';

function Chart({ series, totalRounds, leaderCode, rivalCode, rivalMax, labels, wide }: Props & { wide: boolean }) {
  const W = wide ? 1200 : 400;
  const H = wide ? 320 : 300;
  const PL = wide ? 40 : 30;
  const PR = wide ? 20 : 10;
  const PT = 20;
  const PB = 34;
  const fs = 13;
  const id = wide ? 'w' : 'c';
  const last = series[0]?.points.length ?? 0;
  const top = Math.max(rivalMax ?? 0, ...series.flatMap((s) => s.points));
  const ymax = Math.ceil((top * 1.08) / 100) * 100;
  const X = (round: number) => PL + ((round - 1) / Math.max(1, totalRounds - 1)) * (W - PL - PR);
  const Y = (v: number) => PT + (1 - v / ymax) * (H - PT - PB);
  const leader = series.find((s) => s.code === leaderCode);
  const rival = series.find((s) => s.code === rivalCode);
  const pointsOf = (s: Series) => s.points.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const gridLines = [1, 2, 3, 4].map((k) => (k * ymax) / 5).filter((v) => v % 50 === 0);
  const ticks = wide ? [1, Math.round(last / 2), last] : [1, Math.round(last / 2)];
  const future = last < totalRounds;
  const lead = leader?.points[last - 1] ?? 0;
  const riv = rival?.points[last - 1] ?? 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={labels.aria}
      className={wide ? 'hidden md:block w-full h-auto' : 'md:hidden block w-full h-auto'}
    >
      <defs>
        <linearGradient id={`hs-area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--dusk-warm)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--dusk-warm)" stopOpacity="0" />
        </linearGradient>
        <pattern id={`hs-hatch-${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--dusk-ink)" strokeOpacity="0.05" strokeWidth="3" />
        </pattern>
        <filter id={`hs-glow-${id}`}>
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {gridLines.map((v) => (
        <g key={v}>
          <line x1={PL} x2={X(totalRounds)} y1={Y(v)} y2={Y(v)} stroke="var(--dusk-line)" />
          <text x={PL - 6} y={Y(v) + 4} fontSize={fs - 2} fill={MUTED} textAnchor="end">{v}</text>
        </g>
      ))}
      {future && (
        <>
          <rect x={X(last)} y={PT} width={X(totalRounds) - X(last)} height={H - PT - PB} fill={`url(#hs-hatch-${id})`} />
          {wide && (
            <text x={(X(last) + X(totalRounds)) / 2} y={H - PB + 22} fontSize={fs - 2} fill={MUTED} textAnchor="middle" letterSpacing="0.08em">
              {labels.pending}
            </text>
          )}
        </>
      )}
      {leader && (
        <polygon
          points={`${X(1).toFixed(1)},${Y(0).toFixed(1)} ${pointsOf(leader)} ${X(last).toFixed(1)},${Y(0).toFixed(1)}`}
          fill={`url(#hs-area-${id})`}
        />
      )}
      {[...series].reverse().map((s) => {
        const main = s.code === leaderCode || s.code === rivalCode;
        return (
          <polyline
            key={s.code}
            points={pointsOf(s)}
            fill="none"
            stroke={s.code === leaderCode ? WARM : s.code === rivalCode ? ICE : MUTED}
            strokeWidth={main ? 3.2 : 1.3}
            strokeOpacity={main ? 1 : 0.45}
            strokeLinejoin="round"
            filter={s.code === leaderCode ? `url(#hs-glow-${id})` : undefined}
          />
        );
      })}
      {future && leader && (
        <line x1={X(last)} y1={Y(lead)} x2={X(totalRounds)} y2={Y(lead)} stroke={WARM} strokeDasharray="4 5" strokeOpacity="0.8" />
      )}
      {future && rival && rivalMax !== null && (
        <>
          <line x1={X(last)} y1={Y(riv)} x2={X(totalRounds)} y2={Y(rivalMax)} stroke={ICE} strokeDasharray="4 5" />
          <circle cx={X(totalRounds)} cy={Y(rivalMax)} r="4" fill={ICE} />
          <text x={X(totalRounds) - 4} y={Y(rivalMax) + (wide ? -12 : 22)} fontSize={fs} fill={ICE} textAnchor="end">
            {labels.ceiling}
          </text>
        </>
      )}
      {leader && (
        <text x={X(last) - 6} y={Y(lead) - 10} fontSize={fs} fill={WARM} textAnchor="end">{`${leader.code} ${lead}`}</text>
      )}
      {rival && (
        <text x={X(last) - 6} y={Y(riv) + fs + 8} fontSize={fs} fill={ICE} textAnchor="end">{`${rival.code} ${riv}`}</text>
      )}
      {ticks.map((r) => (
        <text key={r} x={X(r)} y={H - PB + 22} fontSize={fs - 2} fill={MUTED} textAnchor="middle">{labels.round(r)}</text>
      ))}
    </svg>
  );
}

export default function SeasonTerrain(props: Props) {
  if (!props.series.length || (props.series[0]?.points.length ?? 0) < 2) return null;
  return (
    <>
      <Chart {...props} wide />
      <Chart {...props} wide={false} />
    </>
  );
}
