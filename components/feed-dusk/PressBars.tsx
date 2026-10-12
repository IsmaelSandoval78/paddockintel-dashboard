// Press mentions per name as ranked bars (the Feed's "most mentioned", Beagle + Feed, last 7 days).
// The leader is drawn in full warm, the rest one step quieter.

export default function PressBars({ rows, ariaLabel }: { rows: { name: string; count: number }[]; ariaLabel: string }) {
  if (!rows.length) return null;
  const max = rows[0].count || 1;
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-[9px]" aria-label={ariaLabel}>
      {rows.map((r, i) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1 text-[13.5px]">
          <span className="truncate">{r.name}</span>
          <span className="tabular-nums text-[color:var(--dusk-ink-2)]">{r.count}</span>
          <span className="col-span-2 h-1.5 rounded-full bg-[#2A2631] overflow-hidden" aria-hidden="true">
            <span
              className="block h-full rounded-full"
              style={{ width: `${((r.count / max) * 100).toFixed(1)}%`, background: i === 0 ? 'var(--dusk-warm)' : '#C26A48' }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
