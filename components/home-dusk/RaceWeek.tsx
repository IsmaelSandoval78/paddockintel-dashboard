import type { CSSProperties, ReactNode } from 'react';

// Race week on the home: the strip that names the coming Grand Prix, and the circuit section
// under the hero (history tiles, title stakes, pole-to-win by year). Server-rendered; every value
// arrives formatted from Supabase data, a module without data isn't rendered by the page.

export function RaceWeekStrip({
  eyebrow,
  title,
  meta,
  days,
  daysLabel,
  countAria,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  days: number;
  daysLabel: string;
  countAria: string;
}) {
  return (
    <header className="dusk-strip flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3.5" aria-label={eyebrow}>
      <span className="dusk-strip-band" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className="min-w-0">
        <p className="dusk-label m-0">{eyebrow}</p>
        <h2 className="dusk-display m-0 mt-0.5 text-[clamp(1.15rem,2.2vw,1.5rem)] leading-[1.1] tracking-[-0.01em]">{title}</h2>
        <p className="mt-1 text-[13.5px] text-[color:var(--dusk-ink-2)] m-0">{meta}</p>
      </div>
      <p className="flex items-baseline gap-2.5 m-0" aria-label={countAria}>
        <span className="dusk-strip-count dusk-display tabular-nums leading-none text-[clamp(2rem,4vw,2.6rem)]" aria-hidden="true">
          {days}
        </span>
        <span className="dusk-label max-w-[9ch] leading-[1.35]" aria-hidden="true">{daysLabel}</span>
      </p>
    </header>
  );
}

export function CircuitTile({
  label,
  value,
  text,
  source,
  className = '',
}: {
  label: string;
  value: string;
  text: string;
  source: string;
  className?: string;
}) {
  return (
    <section className={`dusk-card flex flex-col gap-1.5 px-5 pt-[18px] pb-5 ${className}`}>
      <p className="dusk-label m-0">{label}</p>
      <p className="dusk-display tabular-nums m-0 text-[clamp(1.8rem,3vw,2.4rem)] leading-none tracking-[-0.02em]">{value}</p>
      <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{text}</p>
      <p className="dusk-mono mt-auto pt-1 text-[10px] uppercase tracking-[0.06em] text-[color:var(--dusk-muted)] m-0">{source}</p>
    </section>
  );
}

export function StakesCard({
  label,
  title,
  headers,
  rows,
  bottomLine,
  source,
  className = '',
}: {
  label: string;
  title: string;
  headers: [string, string, string];
  rows: Array<{ key: string; driver: string; gap: string; need: string }>;
  bottomLine: ReactNode;
  source: string;
  className?: string;
}) {
  return (
    <section className={`dusk-card flex flex-col p-5 sm:p-6 ${className}`} aria-labelledby="dusk-stakes-title">
      <p className="dusk-label m-0">{label}</p>
      <h2 id="dusk-stakes-title" className="mt-1 mb-3.5 text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
      <table className="w-full border-collapse tabular-nums text-left">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={h} scope="col" className={`dusk-label !text-[10px] font-normal pb-1.5 ${i ? 'text-right pl-3' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-[color:var(--dusk-line)]">
              <th scope="row" className="py-2.5 font-semibold text-left">{r.driver}</th>
              <td className="py-2.5 pl-3 text-right dusk-mono text-[13px] text-[color:var(--dusk-ink-2)] whitespace-nowrap">{r.gap}</td>
              <td className="py-2.5 pl-3 text-right">
                <span className="dusk-need">{r.need}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3.5 text-[14px] text-[color:var(--dusk-ink-2)] [&_b]:font-semibold [&_b]:text-[color:var(--dusk-ink)]">{bottomLine}</p>
      <p className="dusk-mono mt-auto pt-3 text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0">{source}</p>
    </section>
  );
}

export function PoleHistoryCard({
  label,
  title,
  years,
  ariaLabel,
  bottomLine,
  source,
  className = '',
}: {
  label: string;
  title: string;
  years: Array<{ year: number; fromPole: boolean; title: string }>;
  ariaLabel: string;
  bottomLine: string | null;
  source: string;
  className?: string;
}) {
  return (
    <section className={`dusk-card flex flex-col p-5 sm:p-6 ${className}`} aria-labelledby="dusk-polehist-title">
      <p className="dusk-label m-0">{label}</p>
      <h2 id="dusk-polehist-title" className="mt-1 mb-3.5 text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
      <ol
        role="img"
        aria-label={ariaLabel}
        className="grid gap-2 list-none p-0 m-0 grid-cols-7 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ '--n': years.length } as CSSProperties}
      >
        {years.map((y) => (
          <li key={y.year} title={y.title} className="flex flex-col items-center gap-1.5 min-w-0">
            <i className={`dusk-dot w-full max-w-[26px] ${y.fromPole ? 'dusk-dot-on' : ''}`} />
            <span className="dusk-mono text-[10px] text-[color:var(--dusk-muted)]">{String(y.year).slice(2)}</span>
          </li>
        ))}
      </ol>
      {bottomLine && <p className="mt-3.5 text-[14px] text-[color:var(--dusk-ink-2)]">{bottomLine}</p>}
      <p className="dusk-mono mt-auto pt-3 text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0">{source}</p>
    </section>
  );
}
