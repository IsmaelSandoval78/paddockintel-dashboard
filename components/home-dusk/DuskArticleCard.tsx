import { Link } from '@/lib/i18n/navigation';

// An analysis piece as a bento tile: kicker, headline, and the article's own key number.

type Props = {
  href: string;
  kicker: string;
  title: string;
  stat: { value: string; label: string } | null;
  className?: string;
};

export default function DuskArticleCard({ href, kicker, title, stat, className = '' }: Props) {
  return (
    <Link href={href} className={`dusk-card group flex flex-col gap-3 p-5 sm:p-6 no-underline text-[color:var(--dusk-ink)] ${className}`}>
      <p className="dusk-label">{kicker}</p>
      <h3 className="text-[18px] leading-[1.25] font-semibold m-0 text-balance group-hover:text-[color:var(--dusk-peach)] transition-colors duration-150">
        {title}
      </h3>
      {stat && (
        <div className="mt-auto pt-2">
          <p className="dusk-display tabular-nums leading-none text-[2rem] text-[color:var(--dusk-sunset)]">{stat.value}</p>
          <p className="dusk-mono uppercase text-[10.5px] tracking-[0.06em] text-[color:var(--dusk-muted)] mt-1">{stat.label}</p>
        </div>
      )}
    </Link>
  );
}
