// Server-rendered SVG, zero client JS. The circuit drawn from the pole lap's own X/Y positions
// (scripts/highlights/race_highlights.py), not a stock outline: the line is the car's line, coloured
// by its speed at every point — muted where it brakes for a corner, warm where it's flat out.

const PAD = 60;
const BANDS = 6;

export type TrackMapData = {
  width: number;
  height: number;
  points: [number, number, number][];
  topSpeedAt: [number, number];
  minSpeedAt: [number, number];
};

type Props = {
  map: TrackMapData;
  topLabel: string;
  minLabel: string;
  caption: string;
  ariaLabel: string;
};

// Consecutive points in the same speed band become one polyline, so the map is a handful of
// elements instead of one per segment.
function bandRuns(points: TrackMapData['points']) {
  const speeds = points.map((p) => p[2]);
  const min = Math.min(...speeds);
  const span = Math.max(...speeds) - min || 1;
  const band = (s: number) => Math.min(BANDS - 1, Math.floor(((s - min) / span) * BANDS));

  const closed = [...points, points[0]];
  const runs: { band: number; pts: string[] }[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const b = band(closed[i][2]);
    const last = runs[runs.length - 1];
    const next = `${closed[i + 1][0]},${closed[i + 1][1]}`;
    if (last && last.band === b) last.pts.push(next);
    else runs.push({ band: b, pts: [`${closed[i][0]},${closed[i][1]}`, next] });
  }
  return runs;
}

export default function TrackMap({ map, topLabel, minLabel, caption, ariaLabel }: Props) {
  if (map.points.length < 2) return null;
  const runs = bandRuns(map.points);
  const [tx, ty] = map.topSpeedAt;
  const [mx, my] = map.minSpeedAt;
  // Keep each label inside the box: anchor it away from the nearer edge.
  const anchor = (x: number) => (x > map.width / 2 ? 'end' : 'start');
  const dx = (x: number) => (x > map.width / 2 ? -22 : 22);

  return (
    <figure className="m-0">
      <svg
        width="100%"
        viewBox={`${-PAD} ${-PAD} ${map.width + PAD * 2} ${map.height + PAD * 2}`}
        role="img"
        aria-label={ariaLabel}
        className="block h-auto overflow-visible"
      >
        {runs.map((r, i) => (
          <polyline
            key={i}
            points={r.pts.join(' ')}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              stroke: `color-mix(in srgb, var(--dusk-warm) ${Math.round((r.band / (BANDS - 1)) * 100)}%, var(--dusk-muted))`,
            }}
          />
        ))}
        <circle cx={tx} cy={ty} r="16" className="dusk-mk-top dusk-glow-warm" />
        <text x={tx + dx(tx)} y={ty - 24} textAnchor={anchor(tx)} fill="white" className="dusk-mono" fontSize="46">
          {topLabel}
        </text>
        <circle cx={mx} cy={my} r="16" className="dusk-mk-min" />
        <text x={mx + dx(mx)} y={my + 60} textAnchor={anchor(mx)} fill="var(--dusk-ink-2)" className="dusk-mono" fontSize="46">
          {minLabel}
        </text>
      </svg>
      <figcaption className="dusk-mono uppercase mt-2 text-[11px] tracking-[0.08em] text-[color:var(--dusk-muted)]">
        {caption}
      </figcaption>
    </figure>
  );
}
