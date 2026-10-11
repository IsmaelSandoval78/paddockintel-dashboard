// Next race on the calendar, with the circuit's history from Supabase (races/results).
// Ice is the cool accent reserved for this module only.

type Props = {
  kicker: string;
  name: string;
  meta: string;
  lapRecord: { label: string; time: string; holder: string } | null;
  winners: { label: string; rows: string[] } | null;
};

export default function NextRaceCard({ kicker, name, meta, lapRecord, winners }: Props) {
  return (
    <section className="dusk-next-race flex-[1_1_320px] min-w-0 p-5 sm:p-6">
      <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-ice)]">{kicker}</p>
      <h2 className="dusk-display mt-2.5 text-[1.5rem] sm:text-[1.8rem] leading-tight">{name}</h2>
      <p className="mt-1.5 text-[16px] text-[color:var(--dusk-ink-2)]">{meta}</p>
      {(lapRecord || winners) && (
        <div className="flex gap-6 mt-5 flex-wrap">
          {lapRecord && (
            <div>
              <p className="dusk-mono uppercase text-[11px] text-[color:var(--dusk-muted)]">{lapRecord.label}</p>
              <p className="dusk-display mt-1 text-[1.6rem] text-[color:var(--dusk-ice)] tabular-nums">{lapRecord.time}</p>
              <p className="mt-0.5 text-[14px] text-[color:var(--dusk-ink-2)]">{lapRecord.holder}</p>
            </div>
          )}
          {winners && winners.rows.length > 0 && (
            <div>
              <p className="dusk-mono uppercase text-[11px] text-[color:var(--dusk-muted)]">{winners.label}</p>
              <ul className="m-0 mt-1 p-0 list-none text-[15px] leading-[1.6]">
                {winners.rows.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
