// Grid to flag, every car: starting slot on the left, finishing slot on the right, one ribbon per
// car in team colour. Unclassified cars sit at the bottom in classification order. Hovering a ribbon
// dims the rest (CSS only, see .dusk-ribbons in dusk.css). Server-rendered SVG.

export type GridToFlagRow = {
  code: string;
  grid: number; // 1-based starting slot (pit-lane starters are placed after the last grid slot)
  gridLabel: string; // "P7", or the pit-lane label
  finish: number; // 1-based classification order
  finishLabel: string; // "P5", or DNF / DSQ / DNS for an unclassified car
  classified: boolean;
  colour: string;
};

type Labels = {
  title: string;
  sub: string;
  badge: string | null;
  grid: string;
  flag: string;
  caption: string;
  aria: string;
  source: string;
};

const W = 820;
const COL = 120;
const T = 10;

export default function GridToFlag({ rows, labels }: { rows: GridToFlagRow[]; labels: Labels }) {
  const n = rows.length;
  if (n < 2) return null;
  const H = Math.max(320, n * 25 + T * 2);
  const rowH = (H - T * 2) / n;
  const band = rowH * 0.62;
  const y = (slot: number) => T + (slot - 0.5) * rowH;
  const xL = COL;
  const xR = W - COL;
  const mid = (xL + xR) / 2;

  return (
    <figure className="dusk-island dusk-card m-0 my-8 p-5 sm:p-6 flex flex-col gap-4 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold m-0 text-[color:var(--dusk-ink)]">{labels.title}</h3>
          <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5 mb-0">{labels.sub}</p>
        </div>
        {labels.badge && <span className="dusk-delta dusk-delta-warm">{labels.badge}</span>}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H + 14}`} role="img" aria-label={labels.aria} className="block w-full min-w-[600px] h-auto overflow-visible">
          <g className="dusk-ribbons">
            {rows.map((r) => {
              const y0 = y(r.grid);
              const y1 = y(r.finish);
              const d =
                `M${xL},${y0 - band / 2} C${mid},${y0 - band / 2} ${mid},${y1 - band / 2} ${xR},${y1 - band / 2}` +
                ` L${xR},${y1 + band / 2} C${mid},${y1 + band / 2} ${mid},${y0 + band / 2} ${xL},${y0 + band / 2} Z`;
              return (
                <path key={r.code} d={d} fill={r.colour}>
                  <title>{`${r.code}: ${r.gridLabel} → ${r.finishLabel}`}</title>
                </path>
              );
            })}
          </g>
          {rows.map((r) => {
            const move = r.grid - r.finish;
            return (
              <g key={`lbl-${r.code}`}>
                <rect x={xL - 3} y={y(r.grid) - band / 2} width="3" height={band} fill={r.colour} />
                <rect x={xR} y={y(r.finish) - band / 2} width="3" height={band} fill={r.colour} />
                <text x={xL - 8} y={y(r.grid) + 4} textAnchor="end" fontSize="11" fill="var(--dusk-ink-2)">{`${r.gridLabel} ${r.code}`}</text>
                <text x={xR + 8} y={y(r.finish) + 4} fontSize="11" fill={r.classified ? 'var(--dusk-ink)' : 'var(--dusk-muted)'}>
                  {`${r.code} ${r.finishLabel}`}
                </text>
                {r.classified && Math.abs(move) >= 4 && (
                  <text x={xR + 72} y={y(r.finish) + 4} fontSize="10.5" fill={move > 0 ? 'var(--dusk-good)' : 'var(--dusk-warm)'}>
                    {`${move > 0 ? '▲' : '▼'}${Math.abs(move)}`}
                  </text>
                )}
              </g>
            );
          })}
          <text x={xL - 8} y={H + 12} textAnchor="end" fontSize="10" fill="var(--dusk-muted)">{labels.grid}</text>
          <text x={xR + 8} y={H + 12} fontSize="10" fill="var(--dusk-muted)">{labels.flag}</text>
        </svg>
      </div>
      <figcaption className="flex flex-col gap-2">
        <p className="text-[14.5px] leading-[1.5] text-[color:var(--dusk-ink-2)] m-0">{labels.caption}</p>
        <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0">{labels.source}</p>
      </figcaption>
    </figure>
  );
}
