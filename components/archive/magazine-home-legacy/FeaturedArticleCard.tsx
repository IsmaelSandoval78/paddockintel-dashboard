// UNUSED as of 2026-09-18 — replaced by magazine-home's Option 1 redesign, Band B's
// text-first Featured treatment (no cover image, see app/[locale]/(blog)/magazine-home/page.tsx).

import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import type { TagRef } from '@/lib/blog/tags';

type Stat = { value: string; label: string; unit?: string };

interface FeaturedArticleCardProps {
  slug: string;
  title: string;
  metaDescription: string | null;
  tags: TagRef[];
  publishedAt: string;
  locale: string;
  featuredStat?: Stat;
  /** Half-width rendering for the merged hero+featured row — fixed, smaller
   * type and the stat stacked above the headline instead of a side column. */
  compact?: boolean;
  /** Image-led rendering for the front-page "big square" module. Only
   * renders an image when the article has a real cover_image_url — no
   * fallback to the auto-generated OG card, which was slow enough
   * (server-rendered per request) to hurt this module's LCP. Image sits
   * above the text, never behind it — DESIGN.md bans gradient scrims, so
   * overlaying text on a photo isn't an option here. */
  square?: boolean;
  imageUrl?: string;
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
  compact = false,
  square = false,
  imageUrl,
}: FeaturedArticleCardProps) {
  const tag = tags[0];
  const date = publishedAt ? formatDate(publishedAt, locale) : '';
  const pageUrl = locale === 'en' ? `/${slug}` : `/${locale}/${slug}`;
  const tagHref = `${locale === 'en' ? '/' : `/${locale}/`}?tag=${encodeURIComponent(tag?.slug ?? '')}`;

  if (square) {
    return (
      <article>
        <Link href={`/${slug}`} className="group block">
          {imageUrl && (
            <div className="relative aspect-square w-full overflow-hidden border border-border">
              {/* unoptimized: this project's only next/image usage today, and its
                  source is a dynamic route handler (the OG card), not a static
                  asset — the Next.js image optimizer's own upstream fetch to that
                  route 404s on this Cloudflare/OpenNext deploy ("upstream response
                  is invalid"), confirmed against production, even though the route
                  itself serves a real PNG when hit directly. The route already
                  outputs a fixed 1200x630 size, so there's nothing to optimize. */}
              <Image src={imageUrl} alt="" fill unoptimized sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          )}

          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mt-5 mb-3">
            {tag && tag.label.toUpperCase()}
            {tag && date && ' · '}
            {date.toUpperCase()}
          </p>

          <h2
            className="uppercase text-text-1 leading-[0.95] tracking-[-0.02em] group-hover:text-terracotta transition-colors duration-150"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)' }}
          >
            {title}
          </h2>
          {metaDescription && (
            <p className="font-prose text-sm text-text-2 leading-relaxed mt-3">
              {metaDescription}
            </p>
          )}
        </Link>

        <div className="mt-4">
          <ShareButton url={pageUrl} title={title} />
        </div>
      </article>
    );
  }

  if (compact) {
    return (
      <article>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mb-3">
          {tag && (
            <a href={tagHref} className="hover:text-terracotta transition-colors duration-150">
              {tag.label.toUpperCase()}
            </a>
          )}
          {tag && date && ' · '}
          {date.toUpperCase()}
        </p>

        {featuredStat && (
          <p
            className="tabular-nums leading-none tracking-[-0.03em] mb-3"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)', color: 'var(--terracotta)' }}
          >
            {featuredStat.value}
          </p>
        )}

        <Link href={`/${slug}`} className="group">
          <h2
            className="uppercase text-text-1 leading-[0.98] tracking-[-0.02em] group-hover:text-terracotta transition-colors duration-150"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)' }}
          >
            {title}
          </h2>
          {metaDescription && (
            <p className="font-prose text-sm text-text-2 leading-relaxed mt-3 max-w-lg">
              {metaDescription}
            </p>
          )}
        </Link>

        {featuredStat && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mt-2">
            {featuredStat.label}
          </p>
        )}

        <div className="mt-4">
          <ShareButton url={pageUrl} title={title} />
        </div>
      </article>
    );
  }

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-end pb-10 border-b border-border">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mb-4">
          {tag && (
            <a href={tagHref} className="hover:text-terracotta transition-colors duration-150">
              {tag.label.toUpperCase()}
            </a>
          )}
          {tag && date && ' · '}
          {date.toUpperCase()}
        </p>

        <Link href={`/${slug}`} className="group">
          <h2
            className="uppercase text-text-1 leading-[0.9] tracking-[-0.03em] group-hover:text-terracotta transition-colors duration-150"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
          >
            {title}
          </h2>
          {metaDescription && (
            <p className="font-prose text-base text-text-2 leading-relaxed mt-4 max-w-2xl">
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
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: 'var(--terracotta)' }}
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
