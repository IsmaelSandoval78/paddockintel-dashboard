import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import EmailCapture from '@/components/ui/EmailCapture';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string }>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PaddockIntel — F1 Economics, Unfiltered',
    description:
      'Original reporting on the business of Formula 1 — contracts, sponsorships, prize money, and the numbers behind the racing.',
  };
}

async function getArticles(locale: string, page: number) {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from('articles')
    .select('slug, title, meta_description, tags, published_at, stats', { count: 'exact' })
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
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
  const { page: pageParam } = await searchParams;
  const t = await getTranslations('magazine');

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const { articles, total } = await getArticles(locale, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = locale === 'en' ? '/' : `/${locale}/`;
  const pageHref = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <main className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="border-b border-border px-5 py-10 max-w-5xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2">
          {t('kicker')}
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mt-3 mb-5">
          {t('headline')}
        </h1>
        <p className="font-sans text-text-2 leading-relaxed max-w-md mb-6">
          {t('description')}
        </p>
        <EmailCapture className="max-w-sm" />
      </div>

      {/* Article grid */}
      <div className="max-w-5xl mx-auto px-5 py-10">
        {articles.length === 0 ? (
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
            {t('noArticles')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {articles.map((a) => {
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

      {/* Cross-promo: Hub / Digest / Book */}
      <div className="max-w-5xl mx-auto px-5 py-10 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a
            href="https://hub.paddockintel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group border border-border p-6 hover:border-red transition-colors duration-150"
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
            className="group border border-border p-6 hover:border-red transition-colors duration-150"
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

          <div className="border border-border-subtle p-6 opacity-50">
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
