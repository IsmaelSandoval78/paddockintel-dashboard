// Server-rendered scatter of every stored Delta Ribbon gap sample for one race/pairing.
// The vertical axis is signed-square-root scaled -- the same compression the ribbon's width uses
// (widthForDelta in components/circuits/kinetic/deltaRibbon/geometry.ts), so sub-second fights
// stay readable next to a pit-stop-sized gap.

export type GapPoint = { lapPos: number; delta: number };
export type GapEvent = { lapPos: number; delta: number; type: 'snap' | 'defend' };

type Props = {
  points: GapPoint[];
  events: GapEvent[];
  ledLaps: number[];
  totalLaps: number;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  ariaLabel: string;
};

const W = 720;
const H = 340;
const L = 52;
const R = 12;
const T = 18;
const B = 36;
const TICKS = [20, 8, 2, 0.5, 0, -0.5, -2, -8, -20];
const ssqrt = (d: number) => Math.sign(d) * Math.sqrt(Math.abs(d));

export default function GapChart({ points, events, ledLaps, totalLaps, colorA, colorB, labelA, labelB, ariaLabel }: Props) {
  const maxPos = Math.max(0, ...points.map((p) => p.delta));
  const maxNeg = Math.max(0, ...points.map((p) => -p.delta));
  const top = Math.max(Math.sqrt(maxPos * 1.08), 0.8);
  const bottom = -Math.max(Math.sqrt(maxNeg * 1.6), 0.8);
  const x = (lapPos: number) => L + (lapPos / totalLaps) * (W - L - R);
  const y = (d: number) => T + ((H - T - B) * (top - ssqrt(d))) / (top - bottom);
  const ticks = TICKS.filter((d) => ssqrt(d) <= top && ssqrt(d) >= bottom);
  const lapTicks = [1, 10, 20, 30, 40, totalLaps].filter((l, i, a) => l <= totalLaps && a.indexOf(l) === i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block w-full min-w-[600px] h-auto dusk-mono">
      {ledLaps.map((l) => (
        <rect key={l} x={x(l - 1)} y={T} width={x(l) - x(l - 1)} height={H - T - B} fill="var(--surface-raised)" />
      ))}
      {ticks.map((d) => (
        <g key={d}>
          <line x1={L} x2={W - R} y1={y(d)} y2={y(d)} stroke={d === 0 ? 'var(--text-3)' : 'var(--border)'} strokeWidth="1" />
          <text x={L - 6} y={y(d) + 4} textAnchor="end" fontSize="13" fill="var(--text-3)">
            {d === 0 ? '0' : `${Math.abs(d)}s`}
          </text>
        </g>
      ))}
      {lapTicks.map((l) => (
        <text key={l} x={x(l - 0.5)} y={H - 12} textAnchor="middle" fontSize="13" fill="var(--text-3)">
          L{l}
        </text>
      ))}
      <text x={L + 6} y={T + 14} fontSize="13" fill={colorA}>{labelA} ↑</text>
      <text x={L + 6} y={H - B - 8} fontSize="13" fill={colorB}>{labelB} ↓</text>
      {points.map((p, i) => (
        <circle key={i} cx={x(p.lapPos)} cy={y(p.delta)} r="3" fill={p.delta >= 0 ? colorA : colorB} />
      ))}
      {events.map((ev, i) =>
        ev.type === 'snap' ? (
          <circle key={i} cx={x(ev.lapPos)} cy={y(ev.delta)} r="8" fill="none" stroke="var(--accent)" strokeWidth="2" />
        ) : (
          <rect
            key={i}
            x={x(ev.lapPos) - 4.5}
            y={y(ev.delta) - 4.5}
            width="9"
            height="9"
            fill="none"
            stroke="var(--text-1)"
            strokeWidth="1.6"
            transform={`rotate(45 ${x(ev.lapPos)} ${y(ev.delta)})`}
          />
        ),
      )}
    </svg>
  );
}
