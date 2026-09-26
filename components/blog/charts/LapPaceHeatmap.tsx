// Same discipline as GridToFinishChart.tsx: pure server component, plain SVG
// computed at render time, zero client JS. See that file's header comment
// for why a chart has to reach the page this way instead of as markup in
// body_markdown.

export type LapPaceDriver = {
  code: string;
  team: string; // maps to --team-<team> in app/globals.css
  laps: (number | null)[]; // lap time in milliseconds, null where no time exists (pit/formation lap)
};

export type LapPaceHeatmapSpec = {
  type: 'lap_pace_heatmap';
  title: string;
  note?: string;
  drivers: LapPaceDriver[];
  // Laps at/above this are excluded from the color scale (Safety Car,
  // red flag, formation lap) — set per-article from that race's own lap
  // distribution, never reused from a different circuit's pace. See
  // DATA-EXPERT.md on why a fixed cross-circuit threshold is a real
  // integrity risk, not just a cosmetic choice.
  outlierThresholdMs: number;
};

const TEAM_VAR: Record<string, string> = {
  mercedes: 'var(--team-mercedes)',
  mclaren: 'var(--team-mclaren)',
  redbull: 'var(--team-redbull)',
  ferrari: 'var(--team-ferrari)',
  alpine: 'var(--team-alpine)',
  aston: 'var(--team-aston)',
  haas: 'var(--team-haas)',
  williams: 'var(--team-williams)',
  sauber: 'var(--team-sauber)',
  rb: 'var(--team-rb)',
};

function teamColor(team: string): string {
  return TEAM_VAR[team] ?? 'var(--text-2)';
}

export default function LapPaceHeatmap({ spec }: { spec: LapPaceHeatmapSpec }) {
  const { title, note, drivers, outlierThresholdMs } = spec;
  if (!drivers || drivers.length === 0) return null;

  const nLaps = Math.max(...drivers.map((d) => d.laps.length));
  const W = 720;
  const rowH = 34;
  const H = drivers.length * rowH + 24;
  const marginL = 44;
  const marginR = 8;
  const marginT = 4;
  const innerW = W - marginL - marginR;
  const colW = innerW / nLaps;

  const bestByDriver = drivers.map((d) => {
    const valid = d.laps.filter((v): v is number => v != null && v < outlierThresholdMs);
    return valid.length ? Math.min(...valid) : null;
  });

  const lapMarks = [1, 10, 20, 30, 40, 50].filter((l) => l <= nLaps);

  return (
    <figure className="my-8 not-prose">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mb-1">{title}</p>
      {note && <p className="font-sans text-sm text-text-2 leading-relaxed mb-4 max-w-2xl">{note}</p>}

      <div className="border border-border-subtle rounded-md p-4 overflow-x-auto bg-surface">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ minWidth: 480, overflow: 'visible' }}>
          {drivers.map((d, ri) => {
            const best = bestByDriver[ri];
            const y = marginT + rowH * ri;
            return (
              <g key={d.code}>
                <text x={marginL - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--text-1)">
                  {d.code}
                </text>
                {d.laps.map((v, li) => {
                  const x = marginL + colW * li;
                  const isOutlier = v == null || v >= outlierThresholdMs || best == null;
                  if (isOutlier) {
                    return (
                      <rect
                        key={li}
                        x={x + 0.5}
                        y={y + 0.5}
                        width={Math.max(1, colW - 1)}
                        height={rowH - 4}
                        fill="var(--bg)"
                        stroke="var(--border-subtle)"
                        strokeWidth={0.5}
                        strokeDasharray="2,2"
                      />
                    );
                  }
                  const rel = Math.min(1, (v - best) / (best * 0.035));
                  const opacity = 0.15 + 0.8 * rel;
                  return (
                    <rect
                      key={li}
                      x={x + 0.5}
                      y={y + 0.5}
                      width={Math.max(1, colW - 1)}
                      height={rowH - 4}
                      fill={teamColor(d.team)}
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            );
          })}

          {lapMarks.map((lap) => (
            <text
              key={lap}
              x={marginL + colW * (lap - 1) + colW / 2}
              y={H - 2}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-3)"
            >
              {lap}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}
