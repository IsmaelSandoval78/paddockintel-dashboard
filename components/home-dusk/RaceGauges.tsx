// 270° radial gauges, server-rendered SVG. The arc always starts at zero (DATA-EXPERT:
// no truncated scales); `max` is stated in each gauge's aria-label so the fill is honest.

const ARC = 'M30.4,109.6 A56,56 0 1 1 109.6,109.6';

export type Gauge = {
  key: string;
  value: number;
  max: number;
  display: string;
  unit: string;
  caption: string;
  ariaLabel: string;
};

export default function RaceGauges({ title, gauges }: { title: string; gauges: Gauge[] }) {
  if (!gauges.length) return null;
  return (
    <section aria-label={title} className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
      {gauges.map((g) => {
        const pct = Math.max(0, Math.min(100, (g.value / g.max) * 100));
        return (
          <div key={g.key} className="dusk-panel p-5 sm:p-6 flex items-center gap-4 sm:gap-5 min-w-0">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              role="img"
              aria-label={g.ariaLabel}
              className="shrink-0 w-[112px] h-[112px] sm:w-[140px] sm:h-[140px]"
            >
              <path d={ARC} fill="none" stroke="var(--dusk-line)" strokeWidth="10" strokeLinecap="round" />
              <path
                d={ARC}
                fill="none"
                stroke="var(--dusk-warm)"
                strokeWidth="10"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${pct.toFixed(1)} 100`}
                className="dusk-glow-gauge"
              />
              <text x="70" y="78" textAnchor="middle" fill="var(--dusk-ink)" className="dusk-display" fontSize="26">
                {g.display}
              </text>
              <text x="70" y="98" textAnchor="middle" fill="var(--dusk-muted)" className="dusk-mono" fontSize="11">
                {g.unit}
              </text>
            </svg>
            <p className="m-0 text-[15px] sm:text-[16px] leading-[1.4] text-[color:var(--dusk-ink-2)] min-w-0">{g.caption}</p>
          </div>
        );
      })}
    </section>
  );
}
