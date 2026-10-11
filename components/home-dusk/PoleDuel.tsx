// Cumulative qualifying gap after each official sector, as two mirrored lines in team colours
// (the leader of that moment is drawn above the zero line). x is elapsed lap time on the pole
// lap, so each segment's width is that sector's real share of the lap. Server-rendered SVG.

const W = 600;
const H = 220;
const LEFT = 40;
const RIGHT = 560;
const MID = 110;
const MAX_OFFSET = 70;

export type DuelSide = { name: string; code: string; sectors: [number, number, number]; colour: string };

type Props = {
  kicker: string;
  title: string;
  aheadLabel: (driver: string, gap: string) => string;
  summary: string;
  ariaLabel: string;
  pole: DuelSide;
  challenger: DuelSide;
  sectorLabel: (n: number) => string;
};

export function cumulativeGaps(pole: DuelSide, challenger: DuelSide): number[] {
  // challenger − pole after each sector; positive = pole ahead.
  const gaps: number[] = [];
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += challenger.sectors[i] - pole.sectors[i];
    gaps.push(Math.round(sum * 1000) / 1000);
  }
  return gaps;
}

export default function PoleDuel({ kicker, title, aheadLabel, summary, ariaLabel, pole, challenger, sectorLabel }: Props) {
  const gaps = cumulativeGaps(pole, challenger);
  const total = pole.sectors.reduce((a, b) => a + b, 0);
  const xs = [LEFT];
  let elapsed = 0;
  for (const s of pole.sectors) {
    elapsed += s;
    xs.push(LEFT + (elapsed / total) * (RIGHT - LEFT));
  }
  const maxAbs = Math.max(...gaps.map((g) => Math.abs(g)), 0.001);
  const scale = MAX_OFFSET / maxAbs;
  const poleYs = [MID, ...gaps.map((g) => MID - g * scale)];
  const challengerYs = [MID, ...gaps.map((g) => MID + g * scale)];
  const points = (ys: number[]) => xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');

  // Annotate the moment the challenger was furthest ahead, if they ever were.
  const challengerAheadIdx = gaps.reduce<number | null>(
    (best, g, i) => (g < 0 && (best === null || g < gaps[best]) ? i : best),
    null,
  );
  const lastPoleY = poleYs[3];
  const lastChallengerY = challengerYs[3];

  return (
    <section className="dusk-panel flex-[1_1_520px] min-w-0 p-5 sm:p-6">
      <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-muted)]">{kicker}</p>
      <h2 className="dusk-display mt-2 text-[1.6rem] sm:text-[1.9rem] leading-tight">{title}</h2>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="dusk-duel block mt-3 h-auto overflow-visible">
        <line x1={LEFT} y1={MID} x2={RIGHT} y2={MID} stroke="#3A3F4B" strokeDasharray="4 6" />
        {xs.slice(1, 3).map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="190" stroke="var(--dusk-line)" />
        ))}
        {[0, 1, 2].map((i) => (
          <text
            key={i}
            x={(xs[i] + xs[i + 1]) / 2}
            y="206"
            textAnchor="middle"
            fill="var(--dusk-muted)"
            className="dusk-mono"
            fontSize="12"
          >
            {sectorLabel(i + 1)}
          </text>
        ))}
        <polyline
          points={points(challengerYs)}
          fill="none"
          stroke={challenger.colour}
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 6px ${challenger.colour})` }}
          data-glow
        />
        <polyline
          points={points(poleYs)}
          fill="none"
          stroke={pole.colour}
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 6px ${pole.colour})` }}
          data-glow
        />
        <text x={RIGHT + 6} y={lastPoleY + 4} fill="var(--dusk-ink)" className="dusk-mono" fontSize="12">
          {pole.code}
        </text>
        <text x={RIGHT + 6} y={lastChallengerY + 4} fill="var(--dusk-ink)" className="dusk-mono" fontSize="12">
          {challenger.code}
        </text>
        {challengerAheadIdx !== null && (
          <text
            x={Math.min(xs[challengerAheadIdx + 1], RIGHT - 80)}
            y="24"
            textAnchor="middle"
            fill="var(--dusk-sunset)"
            className="dusk-mono"
            fontSize="12"
          >
            {aheadLabel(challenger.code, Math.abs(gaps[challengerAheadIdx]).toFixed(3))}
          </text>
        )}
      </svg>
      <p className="mt-2 text-[15px] leading-[1.5] text-[color:var(--dusk-ink-2)]">{summary}</p>
    </section>
  );
}
