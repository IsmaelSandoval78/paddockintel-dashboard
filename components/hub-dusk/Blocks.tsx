// The two building blocks every dusk Hub page shares: a numbered chapter header and a stat card.
import type { ReactNode } from 'react';

export function Section({ n, title, sub, children }: { n: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 mt-7">
        <span className="dusk-label">{n}</span>
        <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] leading-[1.15] font-semibold tracking-[-0.01em]">{title}</h2>
        {sub && <span className="text-[14px] text-[color:var(--dusk-muted)]">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ kicker, big, text, tone }: { kicker: string; big: ReactNode; text: ReactNode; tone?: 'warm' | 'good' }) {
  return (
    <div className="dusk-card soft-card p-5 flex flex-col gap-1.5">
      <span className="dusk-label">{kicker}</span>
      <span
        className={`dusk-display text-[clamp(28px,3.2vw,40px)] leading-none mt-1 ${
          tone === 'warm' ? 'text-[color:var(--dusk-sunset)]' : tone === 'good' ? 'text-[color:var(--dusk-good)]' : ''
        }`}
      >
        {big}
      </span>
      <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{text}</p>
    </div>
  );
}
