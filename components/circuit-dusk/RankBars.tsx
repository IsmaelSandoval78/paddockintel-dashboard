// A ranked list as bars: label, a bar in the given colour scaled to the leader, and the value.
// Server-rendered.
type Row = { key: string; label: string; value: number; colour: string };

export default function RankBars({ rows }: { rows: Row[] }) {
  const best = rows[0]?.value ?? 0;
  if (best <= 0) return null;
  return (
    <ul className="list-none m-0 p-0">
      {rows.map((r) => (
        <li
          key={r.key}
          className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_32px] items-center gap-3 py-2.5 border-t border-[color:var(--dusk-line)] text-[14px]"
        >
          <span className="truncate">{r.label}</span>
          <span className="relative h-2.5 rounded-md bg-[color:var(--dusk-header-line)]">
            <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${((r.value / best) * 100).toFixed(1)}%`, background: r.colour }} />
          </span>
          <span className="dusk-mono text-right">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
