import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import { weeklyEntityCounts } from '@/lib/entityMentions';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import JoinTwoWays from '@/components/blog/JoinTwoWays';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';
import NewsletterCard from '@/components/blog/NewsletterCard';
import StandingsPanel from '@/components/blog/StandingsPanel';
import RaceHighlightsPanel from '@/components/blog/RaceHighlightsPanel';
import RaceDayFastestPanel from '@/components/blog/RaceDayFastestPanel';
import RetirementsPanel from '@/components/blog/RetirementsPanel';
import AttentionThisWeekPanel from '@/components/blog/AttentionThisWeekPanel';
import LearningPanel from '@/components/blog/LearningPanel';
import CircuitOfTheDay from '@/components/blog/CircuitOfTheDay';
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

  // Front-page state only (page 1, unfiltered) gets the full editorial
  // treatment — a filtered or paginated view is an archive, not a cover.
  const isFrontPage = page === 1 && !tag;

  const [{ articles, total }, featuredAndRecent, frontPageExtras] = await Promise.all([
    getArticles(locale, page, tag),
    // Featured runs on every page/filter, not just the front page — the
    // merged hero+featured row would otherwise leave an empty second column
    // once a reader pages into the archive (the grid stayed 2 columns with
    // nothing in the second one).
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

  const [standings, raceHighlights, attention, dataDeskArticles, learningTerms, circuit, feedTeaserAll, latestIssue, beagleCounts] =
    frontPageExtras ?? [
      { drivers: [], constructors: [] },
      { raceName: '', gainers: [], fallers: [], maxAbsDelta: 0, fastestLap: null, fastestPit: null, retirements: [] },
      { mostCovered: null, fastestRiser: null, biggestFall: null, dominantTheme: null },
      [],
      [],
      null,
      [],
      null,
      new Map<string, number>(),
    ];
  const { featured, recent } = featuredAndRecent;

  // Feed teaser split into two non-overlapping slices (Option 1 of the magazine-home
  // redesign discussion): first 6 get the Band B badge treatment, the next 4 feed Band D's
  // "F1 News" column — never the same story twice on one page. Entity counts merge the
  // curated digest_items signal with the wider beagle_items raw-pool signal (see
  // lib/beagleCounts.ts) so the significance badge matches what /feed itself now shows.
  const feedScores = mergeEntityCounts(weeklyEntityCounts(feedTeaserAll), beagleCounts);
  const feedTeaser = feedTeaserAll.slice(0, 6);
  const f1News = feedTeaserAll.slice(6, 10);

  // The archive grid below the curated modules excludes anything already
  // shown as featured/recent, so page 1 never repeats the same article twice.
  const shownSlugs = new Set([featured?.slug, ...recent.map((a) => a.slug)].filter(Boolean));
  const archiveArticles = isFrontPage ? articles.filter((a) => !shownSlugs.has(a.slug as string)) : articles;

  return (
    <main className="bg-bg min-h-screen">
      {/* Band 1 — masthead line: headline + description, centered, kraft base. */}
      <div className="border-b border-border bg-bg">
        <div className="max-w-3xl mx-auto px-5 py-14 md:py-20 text-center">
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.94] tracking-[-0.03em] text-text-1 mb-4">
            {t('headline')}
          </h1>
          <p className="font-prose text-text-2 leading-relaxed">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Band 2 — join line: subscribe or sign in, centered, darker kraft. */}
      <div className="border-b border-border bg-surface-raised">
        <div className="max-w-xl mx-auto px-5 py-10 md:py-14">
          <JoinTwoWays />
        </div>
      </div>

      {/* Band B (Option 1 of the magazine-home redesign discussion) — Featured story + 3
          Latest on the left, a Feed teaser with the shared significance badge on the
          right. Text-first on purpose, no cover image — matches the approved mockup's
          restraint (Critique Gate) rather than the old square-image treatment. */}
      {featured && (
        <div className="border-b border-border bg-bg">
          <div className="max-w-5xl mx-auto px-5 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-2">
                {t('featuredKicker')}
              </p>
              <h2 className="font-display text-text-1 tracking-[-0.02em] leading-[1.02] text-2xl md:text-[1.75rem] mb-3">
                <Link href={`/${featured.slug}`} className="hover:text-terracotta transition-colors duration-150">
                  {featured.title as string}
                </Link>
              </h2>
              {featured.meta_description && (
                <p className="font-prose text-sm text-text-2 leading-relaxed max-w-[48ch] mb-8">
                  {featured.meta_description as string}
                </p>
              )}
              {recent.length > 0 && (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">
                    {t('recent')}
                  </p>
                  <div className="flex flex-col divide-y divide-border-subtle border-t border-b border-border-subtle">
                    {recent.slice(0, 3).map((a) => (
                      <Link key={a.slug} href={`/${a.slug}`} className="group py-3 flex flex-col gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3">
                          {new Date(a.published_at as string).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-prose font-semibold text-text-1 group-hover:text-terracotta transition-colors duration-150 line-clamp-2">
                          {a.title as string}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <FeedTeaserPanel items={feedTeaser} scores={feedScores} title={t('feed.title')} />
          </div>
        </div>
      )}

      {/* Band C — Championship Standings, full width, with gap-to-leader. */}
      {(standings.drivers.length > 0 || standings.constructors.length > 0) && (
        <div className="border-b border-border bg-bg">
          <div className="max-w-5xl mx-auto px-5">
            <StandingsPanel drivers={standings.drivers} constructors={standings.constructors} />
          </div>
        </div>
      )}

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

        {/* Last race + Next race, side by side in one band: everything each
            side already had, just unified instead of separated across the
            page (Option B). Standings has its own full-width band above
            (Band C). */}
        {(() => {
          const hasLastRace =
            raceHighlights.gainers.length > 0 ||
            raceHighlights.fallers.length > 0 ||
            !!raceHighlights.fastestLap ||
            !!raceHighlights.fastestPit ||
            raceHighlights.retirements.length > 0;
          if (!hasLastRace && !circuit) return null;

          return (
            <div className="border-t border-b border-border py-12 md:py-16">
              <div className={`grid grid-cols-1 gap-12 lg:gap-16 ${hasLastRace && circuit ? 'lg:grid-cols-2' : ''}`}>
                {hasLastRace && (
                  <div>
                    {raceHighlights.raceName && (
                      <div className="text-center mb-10">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-2">
                          {t('raceHighlights.lastRace')}
                        </p>
                        <h2
                          className="font-display uppercase text-text-1 tracking-[-0.02em]"
                          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                        >
                          {raceHighlights.raceName}
                        </h2>
                      </div>
                    )}
                    <RaceDayFastestPanel fastestLap={raceHighlights.fastestLap} fastestPit={raceHighlights.fastestPit} />
                    <div className="flex flex-col gap-10 mt-10 pt-10 border-t border-border-subtle">
                      <RaceHighlightsPanel highlights={raceHighlights} />
                      <RetirementsPanel retirements={raceHighlights.retirements} />
                    </div>
                  </div>
                )}

                {circuit && (
                  <div className={hasLastRace ? 'lg:border-l lg:border-border-subtle lg:pl-16' : ''}>
                    <CircuitOfTheDay circuit={circuit} locale={locale} />
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Attention this week — fastest riser / most covered / biggest
            fall / dominant theme, each independently gated by sample size
            (see getAttentionThisWeek() in ./data.ts) */}
        <AttentionThisWeekPanel attention={attention} />

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

        {/* Band D (Option 1 of the magazine-home redesign discussion) — Latest Issue
            summary, F1 News (the Feed teaser's second slice), and Learning F1, three
            module-grid tiles in one band. Any column can be independently empty; the
            whole band hides only if all three are. */}
        {(() => {
          if (!latestIssue && f1News.length === 0 && learningTerms.length === 0) return null;

          return (
            <div className="border-t border-border py-10 md:py-14">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
                {latestIssue && <LatestIssuePanel issue={latestIssue} />}
                {f1News.length > 0 && (
                  <div className={latestIssue ? 'lg:border-l lg:border-border-subtle lg:pl-12' : ''}>
                    <FeedTeaserPanel items={f1News} scores={feedScores} title={t('f1News.title')} showBadge={false} />
                  </div>
                )}
                {learningTerms.length > 0 && (
                  <div className={latestIssue || f1News.length > 0 ? 'lg:border-l lg:border-border-subtle lg:pl-12' : ''}>
                    <LearningPanel terms={learningTerms} compact />
                  </div>
                )}
              </div>
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
