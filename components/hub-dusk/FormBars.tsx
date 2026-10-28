// Who arrives in form: points scored over the last rounds, as bars in team colour scaled to the best,
// with each of those rounds' results beside the name. Server-rendered.
import { teamVar } from '@/components/home-dusk/StandingsCard';

type Row = { code: string; surname: string; teamRef: string; points: number; results: string[] };

export default function FormBars({ rows, resultsLabel }: { rows: Row[]; resultsLabel: string }) {
  const best = rows[0]?.points ?? 0;
  if (best <= 0) return null;
  return (
    <ul className="list-none m-0 p-0">
      {rows.map((r) => (
        <li
          key={r.code}
          className="grid grid-cols-[minmax(0,1fr)_44px] sm:grid-cols-[110px_minmax(0,1fr)_150px_44px] items-center gap-x-3 gap-y-1 py-2.5 border-t border-[color:var(--dusk-line)] text-[14px]"
        >
          <span className="truncate">{r.surname}</span>
          <span className="dusk-mono text-right sm:order-last">{r.points}</span>
          <span className="relative h-2.5 rounded-md bg-[color:var(--dusk-header-line)] col-span-2 sm:col-span-1">
            <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${((r.points / best) * 100).toFixed(1)}%`, background: teamVar(r.teamRef) }} />
          </span>
          <span className="dusk-mono text-[12px] text-[color:var(--dusk-muted)] col-span-2 sm:col-span-1" aria-label={`${resultsLabel}: ${r.results.join(', ')}`}>
            {r.results.map((p) => (/^\d+$/.test(p) ? `P${p}` : p)).join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  );
}
