import { Link } from '@/lib/i18n/navigation';

export interface RecordCardRow {
  key: string;
  rank: number;
  name: string;
  valueDisplay: string;
  era?: string | null;
}

export function RecordCard({
  index,
  href,
  categoryLabel,
  unitLabel,
  fullRankingLabel,
  leader,
  rest,
}: {
  index: number;
  href: string;
  categoryLabel: string;
  unitLabel: string;
  fullRankingLabel: string;
  leader: RecordCardRow | undefined;
  rest: RecordCardRow[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border-r border-b border-border p-5 no-underline hover:bg-surface-raised transition-colors duration-150"
    >
      {/* Category label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-5">
        {String(index + 1).padStart(2, '0')} · {categoryLabel}
      </p>

      {leader ? (
        <>
          {/* Record holder */}
          <p
            className="text-[2.6rem] leading-none tabular-nums text-terracotta"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {leader.valueDisplay}
          </p>
          <p
            className="text-[clamp(1.1rem,1.6vw,1.35rem)] uppercase leading-tight tracking-[-0.02em] text-text-1 mt-2"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {leader.name}
          </p>
          <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mt-1.5">
            {unitLabel}
            {leader.era && <span className="text-text-3"> · {leader.era}</span>}
          </p>

          {/* Ranks 02–03 */}
          <div className="mt-5">
            {rest.map((e) => (
              <div key={e.key} className="flex items-baseline gap-3 h-8 border-t border-border-subtle">
                <span className="font-mono text-[10px] text-text-3 tabular-nums self-center">
                  {String(e.rank).padStart(2, '0')}
                </span>
                <span className="font-sans text-[13px] font-medium text-text-1 uppercase self-center truncate">
                  {e.name}
                </span>
                <span className="font-mono text-[13px] text-text-1 tabular-nums ml-auto self-center">
                  {e.valueDisplay}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">—</p>
      )}

      {/* CTA */}
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 group-hover:text-terracotta transition-colors duration-150 mt-auto pt-5">
        {fullRankingLabel} →
      </p>
    </Link>
  );
}
