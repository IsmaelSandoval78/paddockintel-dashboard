import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import type { TagRef } from '@/lib/blog/tags';

type Stat = { value: string; label: string; unit?: string };

interface ArticlePreviewCardProps {
  slug: string;
  title: string;
  metaDescription: string | null;
  tags: TagRef[];
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

export default function ArticlePreviewCard({
  slug,
  title,
  metaDescription,
  tags,
  publishedAt,
  locale,
  featuredStat,
}: ArticlePreviewCardProps) {
  const tag = tags[0];
  const date = publishedAt ? formatDate(publishedAt, locale) : '';
  const pageUrl = locale === 'en' ? `/${slug}` : `/${locale}/${slug}`;
  const tagHref = `${locale === 'en' ? '/' : `/${locale}/`}?tag=${encodeURIComponent(tag?.slug ?? '')}`;

  return (
    <article className="border border-border p-6 flex flex-col h-full">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mb-3">
        {tag && (
          <a href={tagHref} className="hover:text-terracotta transition-colors duration-150">
            {tag.label.toUpperCase()}
          </a>
        )}
        {tag && date && ' · '}
        {date.toUpperCase()}
      </p>

      <Link href={`/${slug}`} className="group flex-1">
        <h2
          className="uppercase text-text-1 leading-[0.95] tracking-[-0.02em] group-hover:text-terracotta transition-colors duration-150"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 3.5vw, 2rem)' }}
        >
          {title}
        </h2>
        {metaDescription && (
          <p className="font-prose text-sm text-text-2 leading-relaxed mt-3 line-clamp-2">
            {metaDescription}
          </p>
        )}
      </Link>

      <div className="flex items-end justify-between gap-4 mt-6 pt-4 border-t border-border-subtle">
        {featuredStat ? (
          <div>
            <p
              className="tabular-nums leading-none tracking-[-0.03em]"
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--terracotta)' }}
            >
              {featuredStat.value}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mt-1.5">
              {featuredStat.label}
            </p>
          </div>
        ) : (
          <div />
        )}
        <div className="shrink-0">
          <ShareButton url={pageUrl} title={title} />
        </div>
      </div>
    </article>
  );
}
