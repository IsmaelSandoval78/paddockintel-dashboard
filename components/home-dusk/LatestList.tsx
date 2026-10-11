import { Link } from '@/lib/i18n/navigation';

export type LatestItem = { key: string; title: string; href: string; meta: string };

type Props = { title: string; linkLabel: string; linkHref: string; items: LatestItem[] };

export default function LatestList({ title, linkLabel, linkHref, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="dusk-panel flex-[2_1_520px] min-w-0 p-5 sm:p-6">
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <h2 className="dusk-display text-[1.3rem] sm:text-[1.4rem] leading-tight">{title}</h2>
        <Link href={linkHref} className="dusk-link text-[14px] py-2">
          {linkLabel}
        </Link>
      </div>
      <ul className="m-0 mt-2 p-0 list-none">
        {items.map((item) => (
          <li key={item.key} className="border-t border-[color:var(--dusk-line)]">
            <Link
              href={item.href}
              className="block py-3.5 text-[16px] sm:text-[17px] leading-[1.35] text-[color:var(--dusk-ink)] no-underline hover:text-[color:var(--dusk-sunset)] transition-colors duration-150"
            >
              {item.title}
              <span className="dusk-mono uppercase block mt-1 text-[11px] tracking-[0.08em] text-[color:var(--dusk-muted)]">
                {item.meta}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
