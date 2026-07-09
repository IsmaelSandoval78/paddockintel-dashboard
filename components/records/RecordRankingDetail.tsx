import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';

export interface RecordRow {
  key: string;
  rank: number;
  name: string;
  code?: string | null;
  nationality?: string | null;
  era?: string | null;
  valueDisplay: string;
  href: string | null;
}

export function RecordRankingDetail({
  leaderLabel,
  unitLabel,
  entries,
  scorecard,
  share,
}: {
  leaderLabel: string;
  unitLabel: string;
  entries: RecordRow[];
  scorecard: ReactNode;
  share: ReactNode;
}) {
  const leader = entries[0];
  if (!leader) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
      {/* ── Record holder panel ─────────────────────────────── */}
      <section className="border-b lg:border-b-0 lg:border-r border-border p-5 md:p-6 flex flex-col">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">{leaderLabel}</p>

        <p
          className="text-[clamp(3.5rem,9vw,7.5rem)] leading-none tabular-nums text-red mt-4"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {leader.valueDisplay}
        </p>
        <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.15em] mt-2">{unitLabel}</p>

        <div className="mt-6">
          {leader.href ? (
            <Link
              href={leader.href}
              className="no-underline text-text-1 hover:text-red transition-colors duration-150"
            >
              <span
                className="text-[clamp(1.6rem,3.4vw,2.4rem)] uppercase leading-none tracking-[-0.03em] block"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {leader.name}
              </span>
            </Link>
          ) : (
            <span
              className="text-[clamp(1.6rem,3.4vw,2.4rem)] uppercase leading-none tracking-[-0.03em] block text-text-1"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {leader.name}
            </span>
          )}
          {(leader.code || leader.nationality || leader.era) && (
            <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.1em] mt-2">
              {leader.code && <span>{leader.code} · </span>}
              {leader.nationality}
              {leader.era && <span className="text-text-3"> · {leader.era}</span>}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 mt-auto pt-8">
          {scorecard}
          {share}
        </div>
      </section>

      {/* ── Full top 10 ─────────────────────────────────────── */}
      <section>
        {entries.map((e) => {
          const isFirst = e.rank === 1;
          const row = (
            <>
              <span className="font-mono text-[10px] text-text-3 tabular-nums w-7 shrink-0">
                {String(e.rank).padStart(2, '0')}
              </span>
              <span className="text-[13px] font-medium uppercase truncate text-text-1">{e.name}</span>
              {e.era && (
                <span className="font-mono text-[10px] text-text-3 tabular-nums hidden sm:block">{e.era}</span>
              )}
              <span
                className={[
                  'font-mono text-[13px] tabular-nums ml-auto shrink-0',
                  isFirst ? 'text-red' : 'text-text-1',
                ].join(' ')}
              >
                {e.valueDisplay}
              </span>
            </>
          );
          const rowClass = 'flex items-center gap-3 h-12 px-5 border-b border-border-subtle no-underline';
          return e.href ? (
            <Link key={e.key} href={e.href} className={`${rowClass} hover:bg-surface-raised transition-colors duration-150`}>
              {row}
            </Link>
          ) : (
            <div key={e.key} className={rowClass}>
              {row}
            </div>
          );
        })}
      </section>
    </div>
  );
}
