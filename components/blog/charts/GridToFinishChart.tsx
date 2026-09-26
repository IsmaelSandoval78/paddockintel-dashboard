// Server-rendered SVG — no client JS, no hydration cost. Draws straight into
// the initial HTML so it's there on first paint and visible to crawlers,
// which a client-computed chart (canvas or a useEffect-driven SVG) isn't.
// See PERFORMANCE-EXPERT.md: a chart that blocks first paint or adds a
// client bundle just to draw static race data is the failure mode this
// avoids by construction.

export type GridToFinishRow = {
  code: string;
  team: string; // maps to --team-<team> in app/globals.css
  quali: number;
  finish: number | null; // null when dnf is true
  dnf?: boolean;
  highlight?: boolean; // thicker, opaque line — the driver(s) the article is actually about
};

export type GridToFinishChartSpec = {
  type: 'grid_to_finish';
  title: string;
  note?: string;
  rows: GridToFinishRow[];
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

export default function GridToFinishChart({ spec }: { spec: GridToFinishChartSpec }) {
  const { title, note, rows } = spec;
  if (!rows || rows.length === 0) return null;

  const W = 720;
  const H = Math.max(220, rows.length * 34);
  const marginY = 20;
  const innerH = H - marginY * 2;
  const xL = 96;
  const xR = W - 96;

  const byQuali = [...rows].sort((a, b) => a.quali - b.quali);
  const finishers = rows.filter((r) => !r.dnf).sort((a, b) => (a.finish ?? 999) - (b.finish ?? 999));
  const dnfs = rows.filter((r) => r.dnf);

  const leftSlot = byQuali.length > 1 ? innerH / (byQuali.length - 1) : 0;
  const rightCount = finishers.length + (dnfs.length ? 1 : 0);
  const rightSlot = rightCount > 1 ? innerH / (rightCount - 1) : 0;

  const leftY = new Map<string, number>();
  byQuali.forEach((r, i) => leftY.set(r.code, marginY + leftSlot * i));

  const rightY = new Map<string, number>();
  finishers.forEach((r, i) => rightY.set(r.code, marginY + rightSlot * i));
  const dnfY = marginY + rightSlot * finishers.length;

  return (
    <figure className="my-8 not-prose">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mb-1">{title}</p>
      {note && <p className="font-sans text-sm text-text-2 leading-relaxed mb-4 max-w-2xl">{note}</p>}

      <div className="border border-border-subtle rounded-md p-4 overflow-x-auto bg-surface">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ minWidth: 480, overflow: 'visible' }}>
          {rows.map((r) => {
            const y1 = leftY.get(r.code)!;
            const y2 = r.dnf ? dnfY : rightY.get(r.code)!;
            const midX = (xL + xR) / 2;
            const d = `M ${xL},${y1} C ${midX},${y1} ${midX},${y2} ${xR},${y2}`;
            const color = r.dnf ? 'var(--border-subtle)' : teamColor(r.team);
            return (
              <path
                key={r.code}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={r.highlight ? 6 : 3.5}
                strokeLinecap="round"
                opacity={r.dnf ? 0.6 : r.highlight ? 0.95 : 0.65}
              />
            );
          })}

          {byQuali.map((r) => (
            <text
              key={`l-${r.code}`}
              x={xL - 10}
              y={leftY.get(r.code)! + 4}
              textAnchor="end"
              fontSize={11}
              fontWeight={r.highlight ? 700 : 400}
              fill={r.highlight ? 'var(--text-1)' : 'var(--text-2)'}
            >
              {`P${r.quali}  ${r.code}`}
            </text>
          ))}

          {finishers.map((r) => (
            <text
              key={`r-${r.code}`}
              x={xR + 10}
              y={rightY.get(r.code)! + 4}
              textAnchor="start"
              fontSize={11}
              fontWeight={r.highlight ? 700 : 400}
              fill={r.highlight ? 'var(--text-1)' : 'var(--text-2)'}
            >
              {`${r.code}  P${r.finish}`}
            </text>
          ))}

          {dnfs.length > 0 && (
            <text x={xR + 10} y={dnfY + 4} textAnchor="start" fontSize={11} fill="var(--text-2)">
              {`${dnfs.map((r) => r.code).join(' / ')}  DNF`}
            </text>
          )}
        </svg>
      </div>
    </figure>
  );
}
