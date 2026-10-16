import FeedLink from '@/components/ui/FeedLink';

export type LatestItem = { key: string; title: string; href: string; meta: string; tag: string; own: boolean };

type Props = { title: string; linkLabel: string; linkHref: string; items: LatestItem[]; className?: string };

export default function LatestList({ title, linkLabel, linkHref, items, className = '' }: Props) {
  if (!items.length) return null;
  return (
    <section className={`dusk-card flex flex-col gap-2 p-5 sm:p-6 ${className}`} aria-labelledby="dusk-latest-title">
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <h2 id="dusk-latest-title" className="text-[17px] font-semibold m-0">{title}</h2>
        <FeedLink href={linkHref} className="dusk-link text-[13.5px] py-2">
          {linkLabel} →
        </FeedLink>
      </div>
      <ul className="m-0 p-0 list-none">
        {items.map((item) => (
          <li key={item.key} className="border-t border-[color:var(--dusk-line)]">
            <FeedLink
              href={item.href}
              className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3 no-underline text-[color:var(--dusk-ink)]"
            >
              <span className="text-[15.5px] leading-[1.35] group-hover:text-[color:var(--dusk-peach)] transition-colors duration-150">{item.title}</span>
              <span
                className={`row-span-2 self-center dusk-mono text-[10.5px] px-2 py-0.5 rounded-full border ${item.own ? 'border-[color:var(--dusk-sunset)] text-[color:var(--dusk-sunset)]' : 'border-[color:var(--dusk-line)] text-[color:var(--dusk-ink-2)]'}`}
              >
                {item.tag}
              </span>
              <span className="dusk-mono uppercase text-[10.5px] tracking-[0.06em] text-[color:var(--dusk-muted)]">{item.meta}</span>
            </FeedLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
