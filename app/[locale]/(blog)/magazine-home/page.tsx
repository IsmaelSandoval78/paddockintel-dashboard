import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import JoinTwoWays from '@/components/blog/JoinTwoWays';
import ArticlePreviewCard, { formatDate } from '@/components/blog/ArticlePreviewCard';
import NewsletterCard from '@/components/blog/NewsletterCard';
import StandingsPanel from '@/components/blog/StandingsPanel';
import RaceSnapshotPanel from '@/components/blog/RaceSnapshotPanel';
import AttentionThisWeekPanel from '@/components/blog/AttentionThisWeekPanel';
import LearningPanel from '@/components/blog/LearningPanel';
import FeedTeaserPanel from '@/components/blog/FeedTeaserPanel';
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
} from './data';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

// next/image only for hosts already in next.config remotePatterns. A cover on
// any other host is skipped and the hero number fills the tile instead.
function isOptimizableCover(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'paddockintel.com' && parsed.pathname.startsWith('/content/images/')) return true;
    if (parsed.hostname === 'hub.paddockintel.com' && parsed.pathname.startsWith('/charts/')) return true;
    return false;
  } catch {
    return false;
  }
}

function FeaturedCover({ src }: { src: string }) {
  return (
    <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-raised">
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 34vw, 100vw" className="object-cover" />
    </div>
  );
}

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;

const HOME_URLS = {
  en: 'https://paddockintel.com/',
  es: 'https://paddockintel.com/es/',
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const canonical = locale === 'es' ? HOME_URLS.es : HOME_URLS.en;
  return {
    title: 'PaddockIntel — Follow the Facts, Not the Hype',
    description:
      'Economics, data, and real F1 news — verified against 75 years of race history, not press releases.',
    alternates: {
      canonical,
      languages: { ...HOME_URLS, 'x-default': HOME_URLS.en },
    },
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

// Dense fallback for the rest of the archive, once it grows past the first few
// cards — a text row (kicker · title · stat · date) instead of full card chrome,
// so the section scales without turning into a wall of identical tiles.
function ArticleListRow({ a, locale }: { a: NonNullable<Awaited<ReturnType<typeof getArticles>>['articles']>[number]; locale: string }) {
  const stats = (a.stats as Stat[]) ?? [];
  const stat = stats[0];
  const tag = a.tags[0];
  const publishedAt = a.published_at as string;
  const date = publishedAt ? formatDate(publishedAt, locale) : '';
  const tagHref = `${locale === 'en' ? '/' : `/${locale}/`}?tag=${encodeURIComponent(tag?.slug ?? '')}`;

  return (
    <div className="flex items-center gap-4 py-3">
      {tag && (
        <a
          href={tagHref}
          className="hidden sm:block w-36 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 hover:text-accent transition-colors duration-150 truncate"
        >
          {tag.label.toUpperCase()}
        </a>
      )}
      <Link
        href={`/${a.slug}`}
        className="flex-1 min-w-0 font-sans text-sm font-semibold text-text-1 hover:text-accent transition-colors duration-150 truncate"
      >
        {a.title as string}
      </Link>
      {stat && (
        <span className="shrink-0 font-mono text-xs font-bold text-accent-2 tabular-nums">{stat.value}</span>
      )}
      <span className="hidden md:block shrink-0 font-mono text-[10px] text-text-3">{date.toUpperCase()}</span>
    </div>
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

  const [standings, raceHighlights, attention, dataDeskArticles, learningTerms, circuit, feedTeaserAll, beagleCounts, digestCounts] =
    frontPageExtras ?? [
      { drivers: [], constructors: [] },
      { raceName: '', gainers: [], fallers: [], maxAbsDelta: 0, winner: null, fastestLap: null, fastestPit: null, retirements: [] },
      { mostCovered: null, fastestRiser: null, biggestFall: null, dominantTheme: null },
      [],
      [],
      null,
      [],
      new Map<string, number>(),
      new Map<string, number>(),
    ];
  const { featured, recent } = featuredAndRecent;
  const featuredStat = ((featured?.stats as Stat[] | undefined) ?? [])[0];
  const featuredCoverRaw = featured?.cover_image_url?.trim() || null;
  const featuredCover = featuredCoverRaw && isOptimizableCover(featuredCoverRaw) ? featuredCoverRaw : null;

  const lastRaceSnapshot = raceHighlights.raceName
    ? { raceName: raceHighlights.raceName, winner: raceHighlights.winner, fastestLap: raceHighlights.fastestLap }
    : null;
  const nextRaceSnapshot = circuit
    ? { name: circuit.name, daysUntil: circuit.days_until, lapRecord: circuit.fastest_lap, champions: circuit.champions }
    : null;
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
    <main className="bg-bg min-h-screen font-sans">
      {/* Hero bar — headline + subhead, and one primary CTA (the newsletter).
          Google sign-in stays in the header. Below md the row stacks so the
          email field stays inside the viewport. */}
      <div className="border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <div className="flex items-baseline gap-3 flex-wrap min-w-0">
            <h1 className="font-sans font-bold text-text-1 text-lg md:text-xl tracking-[-0.01em] min-w-0 md:shrink-0 text-balance">
              {t('headline')}
            </h1>
            <p className="hidden sm:block min-w-0 max-w-full font-sans text-text-2 text-sm truncate">
              {t('description')}
            </p>
          </div>
          <JoinTwoWays compact />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-14 md:py-20">
        {/* Hero bento — Featured (spans 2 of 3 columns) + Feed teaser, wide-contained
            grid per the approved layout: not full-bleed, not the old 1024px column. */}
        {featured && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* sm is 375px in this theme, so the Featured | Latest split waits
                until md — same stack PR #43 uses below 768px. */}
            <div className="soft-card-lg soft-card-interactive lg:col-span-2 h-full p-7 md:p-9 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-0 md:gap-6">
              <Link href={`/${featured.slug}`} className="flex h-full flex-col min-w-0">
                {featuredCover && <FeaturedCover src={featuredCover} />}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">
                    {t('featuredKicker')}
                  </p>
                  <h2
                    className="font-sans font-bold text-text-1 tracking-[-0.02em] leading-[1.12] mb-3 text-balance break-words"
                    style={{ fontSize: featuredCover ? 'clamp(1.3rem, 2.4vw, 1.75rem)' : 'clamp(1.65rem, 2.8vw, 2.15rem)' }}
                  >
                    {featured.title as string}
                  </h2>
                  {featured.meta_description && (
                    <p className="font-sans text-sm text-text-2 leading-relaxed max-w-[46ch]">
                      {featured.meta_description as string}
                    </p>
                  )}
                </div>
                {featuredStat && (
                  <div className={featuredCover ? 'mt-6' : 'mt-auto pt-8'}>
                    <p
                      className="font-sans font-extrabold tabular-nums leading-none tracking-[-0.03em] text-accent-2"
                      style={{ fontSize: featuredCover ? 'clamp(1.75rem, 3.4vw, 2.5rem)' : 'clamp(3.25rem, 6vw, 4.75rem)' }}
                    >
                      {featuredStat.value}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mt-2">
                      {featuredStat.label}
                    </p>
                  </div>
                )}
              </Link>

              {recent.length > 0 && (
                <div className="mt-6 border-t border-border-subtle pt-6 md:mt-0 md:border-t-0 md:border-l md:border-border-subtle md:pt-0 md:pl-6 flex flex-col justify-center min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-3 mb-1">{t('recent')}</p>
                  <div className="flex flex-col divide-y divide-border-subtle">
                    {recent.slice(0, 5).map((a) => (
                      <Link
                        key={a.slug}
                        href={`/${a.slug}`}
                        className="py-3 font-sans text-sm font-semibold text-text-1 hover:text-accent transition-colors duration-150 line-clamp-2 min-w-0 break-words"
                      >
                        {a.title as string}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="soft-card p-6">
              <FeedTeaserPanel items={feedTeaser} scores={feedScores} title={t('feed.title')} />
            </div>
          </div>
        )}

        {/* Second row — last race + next race, now with circuit history (lap
            record, recent winners) instead of the standings summary that used
            to sit beside it; full standings get their own section below. */}
        {hasRaceSnapshot && (
          <div className="soft-card p-6 mb-4">
            <RaceSnapshotPanel lastRace={lastRaceSnapshot} nextRace={nextRaceSnapshot} />
          </div>
        )}

        {/* Standings — full detail, own soft card */}
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

        {/* Newsletter invite */}
        {isFrontPage && <NewsletterCard />}

        {/* The Data Desk */}
        {dataDeskArticles.length > 0 && (
          <section className="py-10 md:py-14">
            <h2 className="font-sans font-semibold text-text-1 tracking-[-0.01em] mb-6" style={{ fontSize: 'clamp(1.35rem, 2.6vw, 1.75rem)' }}>
              {t('dataDesk.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataDeskArticles.map((a) => (
                <ArticleCard key={a.slug} a={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Attention This Week / F1 News / Learning — three equal soft-card
            tiles. Attention This Week replaces the old Latest Issue slot here
            (moved out of its own full-width band above). */}
        {(() => {
          const hasAttention = Boolean(
            attention.mostCovered || attention.fastestRiser || attention.biggestFall || attention.dominantTheme
          );
          if (!hasAttention && f1News.length === 0 && learningTerms.length === 0) return null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-6">
              {hasAttention && <AttentionThisWeekPanel attention={attention} scores={feedScores} />}
              {f1News.length > 0 && (
                <div className="soft-card p-6">
                  <FeedTeaserPanel items={f1News} scores={feedScores} title={t('f1News.title')} showBadge={false} />
                </div>
              )}
              {learningTerms.length > 0 && (
                <div className="soft-card soft-card-interactive p-6">
                  <LearningPanel terms={learningTerms} compact />
                </div>
              )}
            </div>
          );
        })()}

        {/* Archive grid — the newest few keep full card treatment; the rest
            falls to a dense text row so the section scales without becoming a
            wall of identical tiles as it grows. */}
        <div id="archive" className="py-10 md:py-14 scroll-mt-20">
          {archiveArticles.length === 0 ? (
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
              {t('noArticles')}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archiveArticles.slice(0, 3).map((a) => (
                  <ArticleCard key={a.slug as string} a={a} locale={locale} />
                ))}
              </div>
              {archiveArticles.length > 3 && (
                <div className="mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 pt-6 mb-2 border-t border-border-subtle">
                    {t('archive.rest')}
                  </p>
                  <div className="flex flex-col divide-y divide-border-subtle">
                    {archiveArticles.slice(3).map((a) => (
                      <ArticleListRow key={a.slug as string} a={a} locale={locale} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-10 pt-5 border-t border-border-subtle">
              {page > 1 ? (
                <a href={pageHref(page - 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150">
                  {t('pagination.newer')}
                </a>
              ) : (
                <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{t('pagination.newer')}</span>
              )}
              <span className="font-mono text-[11px] tracking-[0.1em] text-text-3 tabular-nums">
                {t('pagination.page', { current: page, total: totalPages })}
              </span>
              {page < totalPages ? (
                <a href={pageHref(page + 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150">
                  {t('pagination.older')}
                </a>
              ) : (
                <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{t('pagination.older')}</span>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Cross-promo: Weekly Digest */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
        <a href={locale === 'en' ? '/weekly' : `/${locale}/weekly`} className="soft-card soft-card-interactive group block max-w-md p-6">
          <h2 className="font-sans font-semibold text-text-1 group-hover:text-accent transition-colors duration-150">
            {t('promo.digest')}
          </h2>
          <p className="font-sans text-sm text-text-2 leading-relaxed mt-2">{t('promo.digestDescription')}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">{t('promo.goTo')}</p>
        </a>
      </div>
    </main>
  );
}
