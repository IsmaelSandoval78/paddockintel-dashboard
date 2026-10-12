// Next race on the calendar, with the circuit's history from Supabase (races/results).
// Ice is the cool accent, reserved for this card and for "the rival" in two-driver charts.

type Props = {
  kicker: string;
  name: string;
  meta: string;
  days: number | null;
  daysLabel: string;
  facts: Array<{ label: string; value: string }>;
  className?: string;
};

export default function NextRaceCard({ kicker, name, meta, days, daysLabel, facts, className = '' }: Props) {
  return (
    <section className={`dusk-card dusk-next-race flex flex-col gap-4 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-next-title">
      <p className="dusk-mono uppercase text-[11.5px] tracking-[0.12em] text-[color:var(--dusk-ice)]">{kicker}</p>
      <div>
        <h2 id="dusk-next-title" className="dusk-display text-[1.7rem] sm:text-[1.8rem] leading-[1.05] m-0">{name}</h2>
        <p className="mt-1.5 text-[15px] text-[color:var(--dusk-ink-2)]">{meta}</p>
      </div>
      {days !== null && days >= 0 && (
        <p className="flex items-baseline gap-2">
          <span className="dusk-display tabular-nums leading-none text-[3.4rem] text-[color:var(--dusk-ice)]">{days}</span>
          <span className="dusk-label">{daysLabel}</span>
        </p>
      )}
      {facts.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[14px] m-0">
          {facts.map((f) => (
            <div key={f.label} className="contents">
              <dt className="dusk-label pt-0.5">{f.label}</dt>
              <dd className="m-0">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
