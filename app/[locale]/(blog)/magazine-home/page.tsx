import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Instrument_Sans } from 'next/font/google';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import ArticlePreviewCard, { formatDate } from '@/components/blog/ArticlePreviewCard';
import TerrainHero, { type TerrainData } from '@/components/home-dusk/TerrainHero';
import RaceGauges, { type Gauge } from '@/components/home-dusk/RaceGauges';
import PoleDuel, { cumulativeGaps, type DuelSide } from '@/components/home-dusk/PoleDuel';
import StandingsGlow from '@/components/home-dusk/StandingsGlow';
import NextRaceCard from '@/components/home-dusk/NextRaceCard';
import LatestList, { type LatestItem } from '@/components/home-dusk/LatestList';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { SITE_URL, hubLocaleUrl } from '@/lib/site-url';
import { getRaceHighlightsFor } from '@/lib/raceHighlights';
import { getFeaturedAndRecent, getStandings, getCircuitOfTheDay, getFeedTeaser } from './data';
import { getLatestRace } from './dusk-data';
import './dusk.css';

export const revalidate = 3600;

// "Telemetry at Dusk" (docs/DECISION-2026-10-11-home-dusk.md): UI/body face for this page only.
const duskSans = Instrument_Sans({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--pi-dusk-sans',
  display: 'swap',
});

// Gauge scale ceiling for top speed (the arc always starts at 0; stated in the aria-label).
const TOP_SPEED_SCALE_KMH = 350;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;

const HOME_URLS = {
  en: `${SITE_URL}/`,
  es: `${SITE_URL}/es/`,
  pt: `${SITE_URL}/pt/`,
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  // Was `locale === 'es' ? es : en` -- any other locale (pt included) fell
  // through to the EN URL, so the pt homepage declared the EN homepage as
  // its own canonical instead of itself.
  const canonical = HOME_URLS[locale as keyof typeof HOME_URLS] ?? HOME_URLS.en;
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

type ArchiveArticle = NonNullable<Awaited<ReturnType<typeof getArticles>>['articles']>[number];

function ArticleCard({ a, locale }: { a: ArchiveArticle; locale: string }) {
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
function ArticleListRow({ a, locale }: { a: ArchiveArticle; locale: string }) {
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

// "2026-10-11" -> a Date at noon UTC, so no timezone can shift the calendar day.
function dayDate(isoDay: string): Date {
  return new Date(`${isoDay.slice(0, 10)}T12:00:00Z`);
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
  const [t, tMag, tArticleTags, format] = await Promise.all([
    getTranslations('homeDusk'),
    getTranslations('magazine'),
    getTranslations('articleTags'),
    getFormatter(),
  ]);

  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const tag = tagParam?.slice(0, 64) || undefined;
  // tag comes from the URL — fall back to the raw slug if it doesn't match
  // a known canonical tag (stale/bookmarked link, tampered param, etc.)
  const tagLabel = tag ? (tArticleTags.has(tag) ? tArticleTags(tag) : tag) : undefined;

  // Front-page state only (page 1, unfiltered) gets the dusk modules — a
  // filtered or paginated view is an archive, not a cover.
  const isFrontPage = page === 1 && !tag;

  const [{ articles, total }, featuredAndRecent, front] = await Promise.all([
    getArticles(locale, page, tag),
    getFeaturedAndRecent(locale),
    isFrontPage
      ? Promise.all([getStandings(), getLatestRace(), getCircuitOfTheDay(), getFeedTeaser(locale, 6)])
      : Promise.resolve(null),
  ]);

  const [standings, latestRace, nextRace, feedItems] = front ?? [{ drivers: [], constructors: [] }, null, null, []];
  const { featured, recent } = featuredAndRecent;
  const highlights = latestRace ? getRaceHighlightsFor(latestRace.year, latestRace.round) : null;
  const surname = (code: string) => latestRace?.surnameByCode[code] ?? code;
  const fmt3 = (n: number) => format.number(n, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const shortDate = (d: Date) => format.dateTime(d, { month: 'short', day: 'numeric' });

  // ── Hero ────────────────────────────────────────────────────────────
  const featuredStat = ((featured?.stats as Stat[] | undefined) ?? [])[0];
  const featuredPublished = featured?.published_at ? new Date(featured.published_at) : null;
  // The race kicker only describes the featured piece if it was published during that race's
  // week; otherwise the kicker is the article's own, so the hero never mislabels a story.
  const raceDay = latestRace ? dayDate(latestRace.date) : null;
  const featuredIsRaceWeek =
    raceDay && featuredPublished
      ? featuredPublished.getTime() >= raceDay.getTime() - 3 * 86_400_000 &&
        featuredPublished.getTime() <= raceDay.getTime() + 7 * 86_400_000
      : false;
  const heroKicker =
    latestRace && raceDay && featuredIsRaceWeek
      ? t('kickerRace', { race: `${latestRace.name} ${latestRace.year}`, session: t('sessionRace'), date: shortDate(raceDay) })
      : t('kickerFeatured', { date: featuredPublished ? shortDate(featuredPublished) : '' });

  const pole = highlights?.poleLap;
  const terrain: TerrainData | null = pole
    ? {
        speeds: pole.speedKmh,
        caption: t('terrain.caption', {
          driver: surname(pole.driver),
          lapTime: pole.lapTime,
          min: format.number(pole.minSpeedKmh),
          max: format.number(pole.topSpeedKmh),
        }),
        ariaLabel: t('terrain.aria', {
          driver: surname(pole.driver),
          min: format.number(pole.minSpeedKmh),
          max: format.number(pole.topSpeedKmh),
        }),
      }
    : null;

  // ── Race in numbers ─────────────────────────────────────────────────
  const gauges: Gauge[] = [];
  if (pole) {
    gauges.push({
      key: 'top-speed',
      value: pole.topSpeedKmh,
      max: TOP_SPEED_SCALE_KMH,
      display: format.number(pole.topSpeedKmh),
      unit: t('gauges.topSpeedUnit'),
      caption: t('gauges.topSpeedCaption', { driver: surname(pole.driver), lapTime: pole.lapTime }),
      ariaLabel: t('gauges.topSpeedAria', { value: format.number(pole.topSpeedKmh), max: TOP_SPEED_SCALE_KMH }),
    });
  }
  const led = highlights?.lapsLed;
  if (led) {
    gauges.push({
      key: 'laps-led',
      value: led.laps,
      max: led.totalLaps,
      display: `${led.laps}/${led.totalLaps}`,
      unit: t('gauges.lapsLedUnit'),
      caption: t(led.laps === led.totalLaps ? 'gauges.lapsLedCaptionAll' : 'gauges.lapsLedCaption', {
        driver: surname(led.driver),
      }),
      ariaLabel: t('gauges.lapsLedAria', { driver: surname(led.driver), value: led.laps, max: led.totalLaps }),
    });
  }
  const p2w = latestRace?.poleToWin;
  if (latestRace && p2w) {
    gauges.push({
      key: 'pole-to-win',
      value: p2w.poleWins,
      max: p2w.races,
      display: `${p2w.poleWins}/${p2w.races}`,
      unit: t('gauges.poleToWinUnit'),
      caption: t('gauges.poleToWinCaption', { circuit: latestRace.circuitName, year: p2w.sinceYear }),
      ariaLabel: t('gauges.poleToWinAria', {
        value: p2w.poleWins,
        max: p2w.races,
        circuit: latestRace.circuitName,
        year: p2w.sinceYear,
      }),
    });
  }

  // ── Pole duel ───────────────────────────────────────────────────────
  const duel = highlights?.poleDuel;
  let duelNode: ReactNode = null;
  if (duel) {
    const poleSide: DuelSide = {
      name: surname(duel.pole.driver),
      code: duel.pole.driver,
      sectors: duel.pole.sectors,
      colour: duel.pole.teamColour ?? 'var(--dusk-ink-2)',
    };
    const challengerSide: DuelSide = {
      name: surname(duel.challenger.driver),
      code: duel.challenger.driver,
      sectors: duel.challenger.sectors,
      colour: duel.challenger.teamColour ?? 'var(--dusk-muted)',
    };
    const gaps = cumulativeGaps(poleSide, challengerSide);
    const finalGap = gaps[2];
    const lastChallengerLead = [0, 1].filter((i) => gaps[i] < 0).pop();
    const summary =
      lastChallengerLead !== undefined
        ? t('duel.summaryFlip', {
            challenger: challengerSide.name,
            sector: lastChallengerLead + 1,
            pole: poleSide.name,
            gain: fmt3(finalGap - gaps[lastChallengerLead]),
          })
        : t('duel.summaryNoFlip', { pole: poleSide.name });
    const ariaGaps = gaps
      .map((g, i) =>
        t('duel.ariaGap', { n: i + 1, driver: g >= 0 ? poleSide.name : challengerSide.name, gap: fmt3(Math.abs(g)) }),
      )
      .join('; ');
    duelNode = (
      <PoleDuel
        kicker={t('duel.kicker')}
        title={t('duel.title', { gap: fmt3(finalGap) })}
        aheadLabel={(driver, gap) => t('duel.ahead', { driver, gap: fmt3(Number(gap)) })}
        summary={summary}
        ariaLabel={t('duel.aria', {
          pole: poleSide.name,
          challenger: challengerSide.name,
          gaps: ariaGaps,
          gap: fmt3(finalGap),
        })}
        pole={poleSide}
        challenger={challengerSide}
        sectorLabel={(n) => t('duel.sector', { n })}
      />
    );
  }

  // ── Standings ───────────────────────────────────────────────────────
  const topDrivers = standings.drivers;
  const leadChip =
    topDrivers.length > 1
      ? t('standings.lead', {
          driver: topDrivers[0].surname,
          gap: format.number(Number(topDrivers[0].points) - Number(topDrivers[1].points)),
        })
      : null;

  // ── Next race ───────────────────────────────────────────────────────
  const nextRaceNode = nextRace ? (
    <NextRaceCard
      kicker={t('nextRace.kicker', { days: nextRace.days_until })}
      name={nextRace.race_name}
      meta={t('nextRace.meta', {
        circuit: nextRace.name,
        date: format.dateTime(dayDate(nextRace.race_date), { month: 'long', day: 'numeric' }),
      })}
      lapRecord={
        nextRace.fastest_lap
          ? {
              label: t('nextRace.lapRecord'),
              time: nextRace.fastest_lap.time,
              holder: t('nextRace.lapRecordHolder', {
                driver: nextRace.fastest_lap.surname,
                year: nextRace.fastest_lap.year,
              }),
            }
          : null
      }
      winners={
        nextRace.champions.length
          ? {
              label: t('nextRace.recentWinners'),
              rows: nextRace.champions.slice(0, 3).map((c) => `${c.year} ${c.surname}`),
            }
          : null
      }
    />
  ) : null;

  // ── Latest: Feed items + our own recent articles, newest first ──────
  const latestArticles = recent.slice(0, 4);
  const latestItems: (LatestItem & { at: number })[] = [
    ...feedItems.map((f) => ({
      key: `feed-${f.id}`,
      title: f.headline,
      href: f.slug ? `/feed/${f.slug}` : '/feed',
      meta: `${f.source_name} · ${shortDate(new Date(f.published_at))}`,
      at: new Date(f.published_at).getTime(),
    })),
    ...latestArticles.map((a) => ({
      key: `article-${a.slug}`,
      title: a.title,
      href: `/${a.slug}`,
      meta: `${t('latest.ownSource')} · ${a.published_at ? shortDate(new Date(a.published_at)) : ''}`,
      at: a.published_at ? new Date(a.published_at).getTime() : 0,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5);

  // ── Archive ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = locale === 'en' ? '/' : `/${locale}/`;
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    if (tag) q.set('tag', tag);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  // Page 1 never repeats a story already on the cover (hero or Latest).
  const shownSlugs = new Set(
    [featured?.slug, ...latestItems.filter((i) => i.key.startsWith('article-')).map((i) => i.href.slice(1))].filter(Boolean),
  );
  const archiveArticles = isFrontPage ? articles.filter((a) => !shownSlugs.has(a.slug as string)) : articles;

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <h1 className="sr-only">{tMag('headline')}</h1>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 pb-16 flex flex-col gap-6">
        {isFrontPage && featured && (
          <TerrainHero
            kicker={heroKicker}
            title={featured.title as string}
            dek={(featured.meta_description as string | null) ?? null}
            href={`/${featured.slug}`}
            ctaLabel={t('cta')}
            keyNumber={featuredStat ? { value: featuredStat.value, label: featuredStat.label } : null}
            terrain={terrain}
          />
        )}

        {isFrontPage && <RaceGauges title={t('gauges.title')} gauges={gauges} />}

        {isFrontPage && (duelNode || topDrivers.length > 0) && (
          <div className="flex flex-wrap gap-4">
            {duelNode}
            <StandingsGlow
              title={t('standings.title', { race: latestRace?.name ?? '' })}
              leadChip={leadChip}
              linkLabel={t('standings.link')}
              linkHref={hubLocaleUrl(locale, '/drivers/')}
              drivers={topDrivers}
            />
          </div>
        )}

        {isFrontPage && (nextRaceNode || latestItems.length > 0) && (
          <div className="flex flex-wrap gap-4">
            {nextRaceNode}
            <LatestList
              title={t('latest.title')}
              linkLabel={t('latest.link')}
              linkHref="/feed"
              items={latestItems}
            />
          </div>
        )}

        {isFrontPage && <NewsletterBand />}

        {/* Archive — the crawl path to every older article, and the target of every
            `/?tag=` link across the site; kept on the dusk home on purpose. */}
        <section id="archive" className="pt-6 scroll-mt-20">
          <h2 className="dusk-display text-[1.3rem] sm:text-[1.4rem] leading-tight mb-5">{t('archive.title')}</h2>
          {tag && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mb-6 flex items-center gap-3">
              <span>
                {tMag('filter.label')} <span className="text-accent">{tagLabel}</span>
              </span>
              <a
                href={basePath}
                className="text-text-3 hover:text-text-1 transition-colors duration-150 py-2"
                aria-label={tMag('filter.clear')}
              >
                {tMag('filter.clear')} ×
              </a>
            </p>
          )}
          {archiveArticles.length === 0 ? (
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">{tMag('noArticles')}</p>
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
                    {tMag('archive.rest')}
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
                <a href={pageHref(page - 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150 py-3">
                  {tMag('pagination.newer')}
                </a>
              ) : (
                <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{tMag('pagination.newer')}</span>
              )}
              <span className="font-mono text-[11px] tracking-[0.1em] text-text-3 tabular-nums">
                {tMag('pagination.page', { current: page, total: totalPages })}
              </span>
              {page < totalPages ? (
                <a href={pageHref(page + 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150 py-3">
                  {tMag('pagination.older')}
                </a>
              ) : (
                <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{tMag('pagination.older')}</span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
