import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';
import Signal from './Signal';

// One Feed story as a bento card (the day's top three) or as a dense row (the rest of the day,
// and the weekly archive). Stories with a slug open their own page; the few without one still
// link straight to the original report, as before.

export type StoryLink = { slug: string | null; sourceUrl: string };

function StoryAnchor({ link, className, children }: { link: StoryLink; className: string; children: ReactNode }) {
  return link.slug ? (
    <Link href={`/feed/${link.slug}`} className={className}>
      {children}
    </Link>
  ) : (
    <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

type CardProps = {
  link: StoryLink;
  meta: string;
  headline: string;
  summary: string;
  signal: { score: number; max: number; title: string };
  stat: { value: string; label: string } | null;
  context: ReactNode;
  readLabel: string;
};

export function StoryCard({ link, meta, headline, summary, signal, stat, context, readLabel }: CardProps) {
  return (
    <StoryAnchor link={link} className="dusk-card group p-5 sm:p-[22px] flex flex-col gap-3 min-w-0 no-underline">
      <div className="flex items-center justify-between gap-2.5">
        <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--dusk-muted)] truncate min-w-0">{meta}</span>
        <Signal {...signal} />
      </div>
      <h3 className="m-0 text-[17px] leading-[1.3] font-semibold text-balance group-hover:text-[color:var(--dusk-peach)]">{headline}</h3>
      <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)] line-clamp-3">{summary}</p>
      {context}
      <div className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)] flex items-end justify-between gap-3">
        {stat && !context ? (
          <div className="min-w-0">
            <p className="dusk-display tabular-nums text-[1.6rem] leading-none m-0 text-[color:var(--dusk-sunset)]">{stat.value}</p>
            <p className="dusk-mono uppercase text-[10px] tracking-[0.07em] text-[color:var(--dusk-muted)] mt-1.5 mb-0">{stat.label}</p>
          </div>
        ) : (
          <span />
        )}
        <span className="dusk-mono text-[11px] text-[color:var(--dusk-ink-2)] whitespace-nowrap">{readLabel}</span>
      </div>
    </StoryAnchor>
  );
}

type RowProps = {
  link: StoryLink;
  source: string;
  headline: string;
  signal: { score: number; max: number; title: string };
};

export function StoryRow({ link, source, headline, signal }: RowProps) {
  return (
    <StoryAnchor
      link={link}
      className="group grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[150px_minmax(0,1fr)_auto] gap-x-3.5 gap-y-1 items-center py-3 border-t border-[color:var(--dusk-line)] first:border-t-0 text-[14.5px] no-underline"
    >
      <span className="col-span-2 sm:col-span-1 dusk-mono uppercase text-[10.5px] tracking-[0.06em] text-[color:var(--dusk-muted)] truncate">{source}</span>
      <span className="min-w-0 sm:truncate group-hover:text-[color:var(--dusk-peach)]">{headline}</span>
      <Signal {...signal} />
    </StoryAnchor>
  );
}
