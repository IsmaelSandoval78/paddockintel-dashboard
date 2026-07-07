import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';

type Stat = { value: string; label: string; unit?: string };

interface FeaturedArticleCardProps {
  slug: string;
  title: string;
  metaDescription: string | null;
  tags: string[];
  publishedAt: string;
  locale: string;
  featuredStat?: Stat;
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function FeaturedArticleCard({
  slug,
  title,
  metaDescription,
  tags,
  publishedAt,
  locale,
  featuredStat,
}: FeaturedArticleCardProps) {
  const tag = tags[0];
  const date = publishedAt ? formatDate(publishedAt, locale) : '';
  const pageUrl = locale === 'en' ? `/${slug}` : `/${locale}/${slug}`;
  const tagHref = `${locale === 'en' ? '/' : `/${locale}/`}?tag=${encodeURIComponent(tag ?? '')}`;

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-end pb-10 border-b border-border">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mb-4">
          {tag && (
            <a href={tagHref} className="hover:text-red transition-colors duration-150">
              {tag.toUpperCase()}
            </a>
          )}
          {tag && date && ' · '}
          {date.toUpperCase()}
        </p>

        <Link href={`/${slug}`} className="group">
          <h2
            className="uppercase text-text-1 leading-[0.9] tracking-[-0.03em] group-hover:text-red transition-colors duration-150"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
          >
            {title}
          </h2>
          {metaDescription && (
            <p className="font-sans text-base text-text-2 leading-relaxed mt-4 max-w-2xl">
              {metaDescription}
            </p>
          )}
        </Link>

        <div className="mt-6">
          <ShareButton url={pageUrl} title={title} />
        </div>
      </div>

      {featuredStat && (
        <div className="shrink-0 lg:text-right lg:pl-8 lg:border-l lg:border-border-subtle">
          <p
            className="tabular-nums leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: 'var(--red)' }}
          >
            {featuredStat.value}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mt-2">
            {featuredStat.label}
          </p>
        </div>
      )}
    </article>
  );
}
