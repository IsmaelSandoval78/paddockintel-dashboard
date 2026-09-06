import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import EmailCapture from '@/components/ui/EmailCapture';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';
import FeaturedArticleCard from '@/components/blog/FeaturedArticleCard';
import NewsletterCard from '@/components/blog/NewsletterCard';
import StandingsPanel from '@/components/blog/StandingsPanel';
import MoversPanel from '@/components/blog/MoversPanel';
import CircuitOfTheDay from '@/components/blog/CircuitOfTheDay';
import { getFeaturedAndRecent, getDataDeskArticles, getStandings, getMovers, getCircuitOfTheDay } from './data';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PaddockIntel — The Economics F1 Doesn\'t Publish',
    description:
      'Contracts, sponsorships, prize money — verified against 75 years of F1 race data, not team press releases.',
  };
}

async function getArticles(locale: string, page: number, tag?: string) {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('articles')
    .select('id, slug, title, meta_description, published_at, stats', { count: 'exact' })
    .eq('locale', locale)
    .eq('status', 'published');

  if (tag) {
    const ids = await getArticleIdsForTagSlug(supabase, tag);
    if (!ids.length) return { articles: [], total: 0 };
    query = query.in('id', ids);
  }

  const { data, count } = await query
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = data ?? [];
  const [tTags, slugsByArticle] = await Promise.all([
    getTranslations('articleTags'),
    getArticleTagSlugs(supabase, rows.map((r) => r.id as string)),
  ]);
  const articles = rows.map((r) => ({
    ...r,
    tags: (slugsByArticle.get(r.id as string) ?? []).map((slug): TagRef => ({ slug, label: tTags(slug) })),
  }));

  return { articles, total: count ?? 0 };
}

function ArticleCard({ a, locale }: { a: NonNullable<Awaited<ReturnType<typeof getArticles>>['articles']>[number]; locale: string }) {
  const stats = (a.stats as Stat[]) ?? [];
  return (
    <ArticlePreviewCard
      slug={a.slug as string}
      title={a.title as string}
      metaDescription={a.meta_description as string | null}
      tags={a.tags}
      publishedAt={a.published_at as string}
      locale={locale}
      featuredStat={stats[0]}
    />
  );
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
  const tArticleTags = await getTranslations('articleTags');

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const tag = tagParam?.slice(0, 64) || undefined;
  // tag comes from the URL — fall back to the raw slug if it doesn't match
  // a known canonical tag (stale/bookmarked link, tampered param, etc.)
  const tagLabel = tag ? (tArticleTags.has(tag) ? tArticleTags(tag) : tag) : undefined;

  // Front-page state only (page 1, unfiltered) gets the full editorial
  // treatment — a filtered or paginated view is an archive, not a cover.
  const isFrontPage = page === 1 && !tag;

  const [{ articles, total }, frontPageExtras] = await Promise.all([
    getArticles(locale, page, tag),
    isFrontPage
      ? Promise.all([
          getFeaturedAndRecent(locale),
          getStandings(),
          getMovers(),
          getDataDeskArticles(locale),
          getCircuitOfTheDay(),
        ])
      : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = locale === 'en' ? '/' : `/${locale}/`;
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    if (tag) q.set('tag', tag);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const [featuredAndRecent, standings, movers, dataDeskArticles, circuit] = frontPageExtras ?? [
    { featured: null, recent: [] },
    { drivers: [], constructors: [] },
    { raceName: '', driverRiser: null, driverFaller: null, constructorRiser: null, constructorFaller: null },
    [],
    null,
  ];
  const { featured, recent } = featuredAndRecent;

  // The archive grid below the curated modules excludes anything already
  // shown as featured/recent, so page 1 never repeats the same article twice.
  const shownSlugs = new Set([featured?.slug, ...recent.map((a) => a.slug)].filter(Boolean));
  const archiveArticles = isFrontPage ? articles.filter((a) => !shownSlugs.has(a.slug as string)) : articles;

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
        <p className="font-prose text-text-2 leading-relaxed max-w-lg mb-6">
          {t('description')}
        </p>
        <EmailCapture className="max-w-sm" />
      </div>

      <div className="max-w-5xl mx-auto px-5">
        {tag && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mt-10 flex items-center gap-3">
            <span>
              {t('filter.label')} <span className="text-terracotta">{tagLabel}</span>
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

        {/* Featured */}
        {featured && (
          <div className="pt-10 md:pt-14">
            <FeaturedArticleCard
              slug={featured.slug as string}
              title={featured.title as string}
              metaDescription={featured.meta_description as string | null}
              tags={featured.tags}
              publishedAt={featured.published_at as string}
              locale={locale}
              featuredStat={((featured.stats as Stat[]) ?? [])[0]}
            />
          </div>
        )}

        {/* Latest */}
        {recent.length > 0 && (
          <section className="py-10 md:py-14">
            <h2
              className="font-display uppercase text-text-1 tracking-[-0.02em] mb-6"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              {t('recent')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recent.map((a) => (
                <ArticleCard key={a.slug} a={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Top 5 Drivers / Top 5 Constructors */}
        {(standings.drivers.length > 0 || standings.constructors.length > 0) && (
          <StandingsPanel drivers={standings.drivers} constructors={standings.constructors} />
        )}

        {/* This race's movers — real standings deltas, not a "trending" signal */}
        <MoversPanel movers={movers} />

        {/* Newsletter invite */}
        {isFrontPage && <NewsletterCard />}

        {/* The Data Desk — pure-data articles, section only renders once tagged content exists */}
        {dataDeskArticles.length > 0 && (
          <section className="py-10 md:py-14 border-t border-border">
            <h2
              className="font-display uppercase text-text-1 tracking-[-0.02em] mb-6"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              {t('dataDesk.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dataDeskArticles.map((a) => (
                <ArticleCard key={a.slug} a={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Circuit of the day (next race circuit) */}
        {circuit && <CircuitOfTheDay circuit={circuit} locale={locale} />}

        {/* Archive grid */}
        <div className="py-10 md:py-14">
          {archiveArticles.length === 0 ? (
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
              {t('noArticles')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archiveArticles.map((a) => (
                <ArticleCard key={a.slug as string} a={a} locale={locale} />
              ))}
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
      </div>

      {/* Cross-promo: Weekly Digest / The Book — Hub already got its CTA in the standings section above */}
      <div className="max-w-5xl mx-auto px-5 py-12 md:py-16 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border-subtle md:divide-y-0 md:divide-x">
          <a
            href={locale === 'en' ? '/weekly' : `/${locale}/weekly`}
            className="group py-5 first:pt-0 md:py-0 md:pr-8 md:first:pl-0"
          >
            <h2 className="font-prose font-semibold text-text-1 group-hover:text-terracotta transition-colors duration-150">
              {t('promo.digest')}
            </h2>
            <p className="font-prose text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.digestDescription')}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">
              {t('promo.goTo')}
            </p>
          </a>

          <div className="py-5 pb-0 md:py-0 md:pl-8 opacity-50">
            <h2 className="font-prose font-semibold text-text-1">{t('promo.book')}</h2>
            <p className="font-prose text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.bookDescription')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
