import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import JoinTwoWays from '@/components/blog/JoinTwoWays';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';
import NewsletterCard from '@/components/blog/NewsletterCard';
import StandingsPanel from '@/components/blog/StandingsPanel';
import RaceSnapshotPanel from '@/components/blog/RaceSnapshotPanel';
import AttentionThisWeekPanel from '@/components/blog/AttentionThisWeekPanel';
import LearningPanel from '@/components/blog/LearningPanel';
import FeedTeaserPanel from '@/components/blog/FeedTeaserPanel';
import LatestIssuePanel from '@/components/blog/LatestIssuePanel';
import {
  getFeaturedAndRecent,
  getDataDeskArticles,
  getStandings,
  getRaceHighlights,
  getAttentionThisWeek,
  getLearningTerms,
  getCircuitOfTheDay,
  getFeedTeaser,
  getDigestEntityCounts,
  getLatestIssueSummary,
} from './data';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PaddockIntel — Follow the Facts, Not the Hype',
    description:
      'Economics, data, and real F1 news — verified against 75 years of race history, not press releases.',
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

  // Front-page state only (page 1, unfiltered) gets the full bento treatment — a
  // filtered or paginated view is an archive, not a cover.
  const isFrontPage = page === 1 && !tag;

  const [{ articles, total }, featuredAndRecent, frontPageExtras] = await Promise.all([
    getArticles(locale, page, tag),
    getFeaturedAndRecent(locale),
    isFrontPage
      ? Promise.all([
          getStandings(),
          getRaceHighlights(),
          getAttentionThisWeek(locale),
          getDataDeskArticles(locale),
          getLearningTerms(locale),
          getCircuitOfTheDay(),
          getFeedTeaser(locale, 10),
          getLatestIssueSummary(),
          getBeagleEntityCounts(createClient()),
          getDigestEntityCounts(),
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

  const [standings, raceHighlights, attention, dataDeskArticles, learningTerms, circuit, feedTeaserAll, latestIssue, beagleCounts, digestCounts] =
    frontPageExtras ?? [
      { drivers: [], constructors: [] },
      { raceName: '', gainers: [], fallers: [], maxAbsDelta: 0, winner: null, fastestLap: null, fastestPit: null, retirements: [] },
      { mostCovered: null, fastestRiser: null, biggestFall: null, dominantTheme: null },
      [],
      [],
      null,
      [],
      null,
      new Map<string, number>(),
      new Map<string, number>(),
    ];
  const { featured, recent } = featuredAndRecent;
  const featuredStat = ((featured?.stats as Stat[] | undefined) ?? [])[0];

  const lastRaceSnapshot = raceHighlights.raceName
    ? { raceName: raceHighlights.raceName, winner: raceHighlights.winner, fastestLap: raceHighlights.fastestLap }
    : null;
  const nextRaceSnapshot = circuit ? { name: circuit.name, daysUntil: circuit.days_until } : null;
  const hasRaceSnapshot = Boolean(lastRaceSnapshot || nextRaceSnapshot);

  // Feed teaser split into two non-overlapping slices: first 6 get the hero bento tile,
  // the next 4 feed the lower "F1 News" tile — never the same story twice on one page.
  const feedScores = mergeEntityCounts(digestCounts, beagleCounts);
  const feedTeaser = feedTeaserAll.slice(0, 6);
  const f1News = feedTeaserAll.slice(6, 10);

  // The archive grid below the curated modules excludes anything already
  // shown as featured/recent, so page 1 never repeats the same article twice.
  const shownSlugs = new Set([featured?.slug, ...recent.map((a) => a.slug)].filter(Boolean));
  const archiveArticles = isFrontPage ? articles.filter((a) => !shownSlugs.has(a.slug as string)) : articles;

  return (
    <main className="bg-bg min-h-screen">
      {/* Hero — mesh-glow wash, generous vertical rhythm, masthead + join CTAs */}
      <div className="relative overflow-hidden border-b border-border-subtle">
        <div className="mesh-glow absolute inset-0 pointer-events-none" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-5 pt-20 pb-14 md:pt-28 md:pb-20">
          <div className="max-w-2xl">
            <h1
              className="font-sans font-bold text-text-1 mb-5"
              style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
            >
              {t('headline')}
            </h1>
            <p className="font-sans text-text-2 text-lg leading-relaxed max-w-[52ch]">
              {t('description')}
            </p>
          </div>
          <div className="mt-12 max-w-2xl">
            <JoinTwoWays />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-14 md:py-20">
        {/* Hero bento — Featured story (large tile) + Feed teaser + Race snapshot,
            asymmetric spans so the featured story is unmistakably the one thing to
            read first, not a grid cell identical to its neighbors. */}
        {featured && (
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 mb-4" style={{ gridAutoRows: '1fr' }}>
            <Link
              href={`/${featured.slug}`}
              className="glass-panel glass-panel-interactive relative overflow-hidden p-8 md:p-10 flex flex-col justify-between lg:col-span-2 lg:row-span-2"
            >
              <div className="mesh-glow absolute inset-0 pointer-events-none opacity-60" aria-hidden />
              <div className="relative">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-4">
                  {t('featuredKicker')}
                </p>
                <h2
                  className="font-sans font-bold text-text-1 tracking-[-0.02em] leading-[1.05] mb-4"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
                >
                  {featured.title as string}
                </h2>
                {featured.meta_description && (
                  <p className="font-sans text-text-2 leading-relaxed max-w-[52ch]">
                    {featured.meta_description as string}
                  </p>
                )}
              </div>
              <div className="relative mt-10 flex items-end justify-between gap-6">
                {featuredStat ? (
                  <div>
                    <p className="font-sans font-bold tabular-nums leading-none tracking-[-0.02em] text-accent" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}>
                      {featuredStat.value}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mt-2">
                      {featuredStat.label}
                    </p>
                  </div>
                ) : (
                  <div />
                )}
                {recent.length > 0 && (
                  <div className="hidden sm:flex flex-col gap-1.5 text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-3">{t('recent')}</p>
                    {recent.slice(0, 2).map((a) => (
                      <span key={a.slug} className="font-sans text-xs text-text-2 line-clamp-1 max-w-[22ch]">
                        {a.title as string}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>

            <div className="glass-panel p-6 lg:col-span-2 lg:row-span-1">
              <FeedTeaserPanel items={feedTeaser} scores={feedScores} title={t('feed.title')} />
            </div>

            {hasRaceSnapshot && (
              <div className="glass-panel p-6 lg:col-span-2 lg:row-span-1">
                <RaceSnapshotPanel lastRace={lastRaceSnapshot} nextRace={nextRaceSnapshot} />
              </div>
            )}
          </div>
        )}

        {/* Standings — full-width tile, own internal 2-column split */}
        {(standings.drivers.length > 0 || standings.constructors.length > 0) && (
          <div className="mb-4">
            <StandingsPanel drivers={standings.drivers} constructors={standings.constructors} />
          </div>
        )}

        {tag && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mt-6 mb-6 flex items-center gap-3">
            <span>
              {t('filter.label')} <span className="text-accent">{tagLabel}</span>
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

        {/* Attention this week — own tile, each row independently gated by sample size
            (see getAttentionThisWeek() in ./data.ts) */}
        <div className="mb-4">
          <AttentionThisWeekPanel attention={attention} />
        </div>

        {/* Newsletter invite — full-width, its own mesh-glow moment */}
        {isFrontPage && <NewsletterCard />}

        {/* The Data Desk — pure-data articles, section only renders once tagged content exists */}
        {dataDeskArticles.length > 0 && (
          <section className="py-10 md:py-14">
            <h2
              className="font-sans font-semibold text-text-1 tracking-[-0.01em] mb-6"
              style={{ fontSize: 'clamp(1.35rem, 2.6vw, 1.75rem)' }}
            >
              {t('dataDesk.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataDeskArticles.map((a) => (
                <ArticleCard key={a.slug} a={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Issue / F1 News / Learning — three equal bento tiles. Any can be
            independently empty; the whole row hides only if all three are. */}
        {(() => {
          if (!latestIssue && f1News.length === 0 && learningTerms.length === 0) return null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-6">
              {latestIssue && (
                <div className="glass-panel glass-panel-interactive p-6">
                  <LatestIssuePanel issue={latestIssue} />
                </div>
              )}
              {f1News.length > 0 && (
                <div className="glass-panel p-6">
                  <FeedTeaserPanel items={f1News} scores={feedScores} title={t('f1News.title')} showBadge={false} />
                </div>
              )}
              {learningTerms.length > 0 && (
                <div className="glass-panel glass-panel-interactive p-6">
                  <LearningPanel terms={learningTerms} compact />
                </div>
              )}
            </div>
          );
        })()}

        {/* Archive grid */}
        <div id="archive" className="py-10 md:py-14 scroll-mt-20">
          {archiveArticles.length === 0 ? (
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
              {t('noArticles')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archiveArticles.map((a) => (
                <ArticleCard key={a.slug as string} a={a} locale={locale} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-10 pt-5 border-t border-border-subtle">
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

      {/* Cross-promo: Weekly Digest / The Book */}
      <div className="max-w-5xl mx-auto px-5 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href={locale === 'en' ? '/weekly' : `/${locale}/weekly`} className="glass-panel glass-panel-interactive group p-6">
            <h2 className="font-sans font-semibold text-text-1 group-hover:text-accent transition-colors duration-150">
              {t('promo.digest')}
            </h2>
            <p className="font-sans text-sm text-text-2 leading-relaxed mt-2">
              {t('promo.digestDescription')}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">
              {t('promo.goTo')}
            </p>
          </a>

          <div className="glass-panel p-6 opacity-50">
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
