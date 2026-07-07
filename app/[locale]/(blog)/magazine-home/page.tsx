import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import EmailCapture from '@/components/ui/EmailCapture';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';
import FeaturedArticleCard from '@/components/blog/FeaturedArticleCard';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PaddockIntel — F1 Economics, Unfiltered',
    description:
      'Original reporting on the business of Formula 1 — contracts, sponsorships, prize money, and the numbers behind the racing.',
  };
}

async function getArticles(locale: string, page: number, tag?: string) {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from('articles')
    .select('slug, title, meta_description, tags, published_at, stats', { count: 'exact' })
    .eq('locale', locale)
    .eq('status', 'published');
  if (tag) query = query.contains('tags', [tag]);
  const { data, count } = await query
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);
  return { articles: data ?? [], total: count ?? 0 };
}

export default async function MagazineHomePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { page: pageParam, tag: tagParam } = await searchParams;
  const t = await getTranslations('magazine');

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const tag = tagParam?.slice(0, 64) || undefined;
  const { articles, total } = await getArticles(locale, page, tag);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Front-page state only (page 1, unfiltered) gets a lead story — a filtered
  // or paginated view is an archive, not a cover, so it stays a flat index.
  const isFrontPage = page === 1 && !tag;
  const [lead, ...rest] = isFrontPage ? articles : [undefined, ...articles];
  const basePath = locale === 'en' ? '/' : `/${locale}/`;
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    if (tag) q.set('tag', tag);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <main className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="border-b border-border px-5 py-12 md:py-16 max-w-5xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2">
          {t('kicker')}
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mt-3 mb-5">
          {t('headline')}
        </h1>
        <p className="font-sans text-text-2 leading-relaxed max-w-lg mb-6">
          {t('description')}
        </p>
        <EmailCapture className="max-w-sm" />
      </div>

      {/* Article grid */}
      <div className="max-w-5xl mx-auto px-5 pt-10 md:pt-14 pb-10">
        {tag && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mb-6 flex items-center gap-3">
            <span>
              {t('filter.label')} <span className="text-red">{tag}</span>
            </span>
            <a
              href={basePath}
              className="text-text-3 hover:text-text-1 transition-colors duration-150"
              aria-label={t('filter.clear')}
            >
              {t('filter.clear')} ×
            </a>
          </p>
        )}
        {articles.length === 0 ? (
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
            {t('noArticles')}
          </p>
        ) : (
          <>
            {lead && (
              <div className="mb-10 md:mb-14">
                <FeaturedArticleCard
                  slug={lead.slug as string}
                  title={lead.title as string}
                  metaDescription={lead.meta_description as string | null}
                  tags={(lead.tags as string[]) ?? []}
                  publishedAt={lead.published_at as string}
                  locale={locale}
                  featuredStat={((lead.stats as Stat[]) ?? [])[0]}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((a) => {
                if (!a) return null;
                const stats = (a.stats as Stat[]) ?? [];
                return (
                  <ArticlePreviewCard
                    key={a.slug as string}
                    slug={a.slug as string}
                    title={a.title as string}
                    metaDescription={a.meta_description as string | null}
                    tags={(a.tags as string[]) ?? []}
                    publishedAt={a.published_at as string}
                    locale={locale}
                    featuredStat={stats[0]}
                  />
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-between mt-10 pt-5 border-t border-border">
            {page > 1 ? (
              <a
                href={pageHref(page - 1)}
                className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150"
              >
                {t('pagination.newer')}
              </a>
            ) : (
              <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">
                {t('pagination.newer')}
              </span>
            )}
            <span className="font-mono text-[11px] tracking-[0.1em] text-text-3 tabular-nums">
              {t('pagination.page', { current: page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <a
                href={pageHref(page + 1)}
                className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150"
              >
                {t('pagination.older')}
              </a>
            ) : (
              <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">
                {t('pagination.older')}
              </span>
            )}
          </nav>
        )}
      </div>

      {/* Cross-promo: Hub / Digest / Book — ruled band, not three more boxes */}
      <div className="max-w-5xl mx-auto px-5 py-12 md:py-16 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border-subtle md:divide-y-0 md:divide-x">
          <a
            href="https://hub.paddockintel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group py-5 first:pt-0 md:py-0 md:px-8 md:first:pl-0"
          >
            <h2 className="font-sans font-semibold text-text-1 group-hover:text-red transition-colors duration-150">
              {t('promo.hub')}
            </h2>
            <p className="font-sans text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.hubDescription')}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">
              {t('promo.goTo')}
            </p>
          </a>

          <a
            href={locale === 'en' ? '/weekly' : `/${locale}/weekly`}
            className="group py-5 md:py-0 md:px-8"
          >
            <h2 className="font-sans font-semibold text-text-1 group-hover:text-red transition-colors duration-150">
              {t('promo.digest')}
            </h2>
            <p className="font-sans text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.digestDescription')}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">
              {t('promo.goTo')}
            </p>
          </a>

          <div className="py-5 pb-0 md:py-0 md:px-8 md:last:pr-0 opacity-50">
            <h2 className="font-sans font-semibold text-text-1">{t('promo.book')}</h2>
            <p className="font-sans text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.bookDescription')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
