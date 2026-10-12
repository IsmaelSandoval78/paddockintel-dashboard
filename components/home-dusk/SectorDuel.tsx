// The pole duel as diverging bars: one row per official qualifying sector, the bar on the side
// of whoever was faster, its length scaled to the largest sector difference. Pole-sitter warm,
// challenger ice (the cool counter-accent).

type Side = { code: string; sectors: [number, number, number] };

type Props = {
  title: string;
  sub: string;
  total: string;
  poleFaster: string;
  challengerFaster: string;
  sectorLabel: (n: number) => string;
  summary: string;
  ariaLabel: string;
  source: string;
  pole: Side;
  challenger: Side;
  format: (n: number) => string;
  className?: string;
};

export default function SectorDuel(props: Props) {
  const diffs = props.pole.sectors.map((v, i) => props.challenger.sectors[i] - v);
  const maxAbs = Math.max(...diffs.map(Math.abs)) || 1;
  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${props.className ?? ''}`} aria-labelledby="dusk-duel-title">
      <div>
        <h2 id="dusk-duel-title" className="text-[17px] font-semibold m-0">{props.title}</h2>
        <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{props.sub}</p>
      </div>
      <p className="dusk-display tabular-nums leading-none text-[2.1rem]">{props.total}</p>
      <div role="img" aria-label={props.ariaLabel} className="flex flex-col gap-2">
        <div className="flex justify-between dusk-mono text-[12px]">
          <span className="text-[color:var(--dusk-warm)]">◀ {props.poleFaster}</span>
          <span className="text-[color:var(--dusk-ice)]">{props.challengerFaster} ▶</span>
        </div>
        {diffs.map((d, i) => {
          const width = `${((Math.abs(d) / maxAbs) * 100).toFixed(1)}%`;
          const poleWins = d > 0;
          return (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)] items-center gap-1.5">
              <div className="h-[22px] flex justify-end">
                {poleWins && (
                  <span className="h-full rounded-md flex items-center px-1.5 dusk-mono text-[11px] font-medium text-[color:var(--dusk-ground)] bg-[color:var(--dusk-warm)] min-w-max" style={{ width }}>
                    {props.format(Math.abs(d))}
                  </span>
                )}
              </div>
              <span className="text-center dusk-mono text-[11px] text-[color:var(--dusk-muted)]">{props.sectorLabel(i + 1)}</span>
              <div className="h-[22px] flex">
                {!poleWins && (
                  <span className="h-full rounded-md flex items-center justify-end px-1.5 dusk-mono text-[11px] font-medium text-[color:var(--dusk-ground)] bg-[color:var(--dusk-ice)] min-w-max" style={{ width }}>
                    {props.format(Math.abs(d))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[13.5px] leading-[1.5] text-[color:var(--dusk-ink-2)]">{props.summary}</p>
      <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] mt-auto">{props.source}</p>
    </section>
  );
}
