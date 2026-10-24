import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import { formatDate } from '@/components/blog/ArticlePreviewCard';
import HeroLandscape, { type TerrainData } from '@/components/home-dusk/HeroLandscape';
import InsightCarousel, { type InsightSlide } from '@/components/home-dusk/InsightCarousel';
import { LapsLedKpi, PoleToWinKpi, SpeedKpi } from '@/components/home-dusk/KpiCards';
import RaceStoryCard from '@/components/home-dusk/RaceStoryCard';
import { buildRaceStory } from '@/components/home-dusk/raceStory';
import StandingsCard, { teamVar } from '@/components/home-dusk/StandingsCard';
import SectorDuel from '@/components/home-dusk/SectorDuel';
import TrackMap from '@/components/home-dusk/TrackMap';
import TitleTrend, { type TrendSeries } from '@/components/home-dusk/TitleTrend';
import NextRaceCard from '@/components/home-dusk/NextRaceCard';
import { CircuitTile, LongRunsCard, PoleHistoryCard, RaceWeekStrip, StakesCard } from '@/components/home-dusk/RaceWeek';
import LatestList, { type LatestItem } from '@/components/home-dusk/LatestList';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import DuskArticleCard from '@/components/home-dusk/DuskArticleCard';
import { SITE_URL, hubLocaleUrl } from '@/lib/site-url';
import { FASTF1_TEAM_REF, getLatestPracticeFor, getRaceHighlightsFor } from '@/lib/raceHighlights';
import { getFeaturedAndRecent, getStandings, getCircuitOfTheDay, getFeedTeaser } from './data';
import { getLatestRace, getRaceWeek, getTitleTrend } from './dusk-data';
import { circuitTimeZone, hostPalette } from '@/lib/raceWeekHost';
import { duskSans } from '../dusk-font';
import '../dusk.css';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type Stat = { value: string; label: string; unit?: string };

type PageParams = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string; tag?: string }>;

const PAGE_SIZE = 20;
const FEATURED_TAG_SLUG = 'featured';
// Tags that mark a piece as coverage of a race weekend (as opposed to a story that merely
// happened to be published that week).
const RACE_TAGS = new Set(['race-analysis', 'race-weekend-economics']);

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
    openGraph: openGraphFor(canonical),
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

// Dense fallback for the rest of the archive — a text row (kicker · title · stat · date)
// instead of full card chrome, so the section scales without a wall of identical tiles.
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
      {stat && <span className="shrink-0 font-mono text-xs font-bold text-accent-2 tabular-nums">{stat.value}</span>}
      <span className="hidden md:block shrink-0 font-mono text-[10px] text-text-3">{date.toUpperCase()}</span>
    </div>
  );
}

// "2026-10-11" -> a Date at noon UTC, so no timezone can shift the calendar day.
function dayDate(isoDay: string): Date {
  return new Date(`${isoDay.slice(0, 10)}T12:00:00Z`);
}

const pct = (part: number, whole: number) => Math.round((part / whole) * 100);

// 101.481 -> "1:41.481", the timing-screen format the generated files use for lap times.
function lapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(3).padStart(6, '0')}`;
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

  // Front-page state only (page 1, unfiltered) gets the dashboard — a filtered or
  // paginated view is an archive, not a cover.
  const isFrontPage = page === 1 && !tag;

  const [{ articles, total }, featuredAndRecent, front] = await Promise.all([
    getArticles(locale, page, tag),
    getFeaturedAndRecent(locale),
    isFrontPage
      ? Promise.all([getStandings(), getLatestRace(), getCircuitOfTheDay(), getFeedTeaser(locale, 6), getRaceWeek()])
      : Promise.resolve(null),
  ]);

  const [standings, latestRace, nextRace, feedItems, raceWeek] = front ?? [{ drivers: [], constructors: [] }, null, null, [], null];
  const { featured, recent } = featuredAndRecent;
  const topDrivers = standings.drivers;
  const trend =
    isFrontPage && latestRace && topDrivers.length
      ? await getTitleTrend(latestRace.year, latestRace.round, topDrivers.map((d) => d.driver_id))
      : null;

  const highlights = latestRace ? getRaceHighlightsFor(latestRace.year, latestRace.round) : null;
  const surname = (code: string) => latestRace?.surnameByCode[code] ?? code;
  const codeBySurname = new Map(Object.entries(latestRace?.surnameByCode ?? {}).map(([code, name]) => [name, code]));
  const fmt3 = (n: number) => format.number(n, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const shortDate = (d: Date) => format.dateTime(d, { month: 'short', day: 'numeric' });
  const raceDay = latestRace ? dayDate(latestRace.date) : null;
  const pole = highlights?.poleLap;
  const trace = highlights?.raceTrace;

  // ── B · Page header ─────────────────────────────────────────────────
  const raceLaps = trace?.totalLaps ?? highlights?.lapsLed?.totalLaps ?? null;

  // ── 2 · Hero ────────────────────────────────────────────────────────
  const featuredStats = (featured?.stats as Stat[] | undefined) ?? [];
  const featuredStat = featuredStats[0];
  const featuredPublished = featured?.published_at ? new Date(featured.published_at) : null;
  // The race kicker only describes the featured piece if it was published during that race's
  // week; otherwise the kicker is the article's own, so the hero never mislabels a story.
  const inRaceWeek = (d: Date | null) =>
    raceDay && d
      ? d.getTime() >= raceDay.getTime() - 3 * 86_400_000 && d.getTime() <= raceDay.getTime() + 7 * 86_400_000
      : false;
  // A race piece is linked to the latest race, or is race-weekend coverage published that week.
  // The publish date alone isn't enough: a title-math or economics story published two days after
  // a Grand Prix is not about that Grand Prix.
  const isRacePiece = (a: { race_id: number | null; published_at: string | null; tags: TagRef[] }) =>
    !!latestRace &&
    (a.race_id === latestRace.raceId ||
      (inRaceWeek(a.published_at ? new Date(a.published_at) : null) && a.tags.some((tg) => RACE_TAGS.has(tg.slug))));
  // Race mode: the cover dashboard follows the latest race. Story mode: the featured piece isn't
  // about that race, so its own numbers lead and the race data moves to its own labelled section.
  const raceMode = !featured || isRacePiece(featured);
  // A piece linked to the coming race is its preview.
  const isPreview = !!raceWeek && !!featured && featured.race_id === raceWeek.raceId;
  const heroKicker =
    latestRace && raceDay && raceMode
      ? t('kickerRace', { race: `${latestRace.name} ${latestRace.year}`, session: t('sessionRace'), date: shortDate(raceDay) })
      : raceWeek && isPreview
        ? t('kickerRace', { race: `${raceWeek.name} ${raceWeek.year}`, session: t('raceWeek.sessionPreview'), date: featuredPublished ? shortDate(featuredPublished) : '' })
        : t('kickerFeatured', { date: featuredPublished ? shortDate(featuredPublished) : '' });

  // ── Race week: the coming Grand Prix, drawn from its circuit's last edition ──
  const rwLast = raceWeek?.lastEdition ?? null;
  const rwHighlights = rwLast ? getRaceHighlightsFor(rwLast.year, rwLast.round) : null;
  const rwPole = rwHighlights?.poleLap;
  const rwSurname = (code: string) => rwLast?.surnameByCode[code] ?? code;
  // This weekend's latest practice session, once its file exists: fresher than the last edition.
  const rwPractice = raceWeek ? getLatestPracticeFor(raceWeek.year, raceWeek.round) : null;
  const rwPracticeLap = rwPractice?.fastestLap;
  const sessionName = rwPractice ? t('raceWeek.practice.sessionName', { session: rwPractice.session }) : '';
  // Generated files name their own source; the label is the provider's name only.
  const sourceName = (source: string) => (source.startsWith('OpenF1') ? 'OpenF1' : 'FastF1');

  // The pole-lap landscape belongs to the race. In story mode during race week it is this weekend's
  // fastest practice lap, or before practice the coming circuit's last pole lap; otherwise the hero
  // carries the article alone.
  const terrain: TerrainData | null = pole && raceMode
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
    : raceWeek && rwPracticeLap
      ? {
          speeds: rwPracticeLap.speedKmh,
          caption: t('raceWeek.practice.terrainCaption', {
            driver: surname(rwPracticeLap.driver),
            session: sessionName,
            circuit: raceWeek.circuit.name,
            lapTime: rwPracticeLap.lapTime,
            min: format.number(rwPracticeLap.minSpeedKmh),
            max: format.number(rwPracticeLap.topSpeedKmh),
          }),
          ariaLabel: t('raceWeek.practice.terrainAria', {
            driver: surname(rwPracticeLap.driver),
            session: sessionName,
            circuit: raceWeek.circuit.name,
            min: format.number(rwPracticeLap.minSpeedKmh),
            max: format.number(rwPracticeLap.topSpeedKmh),
          }),
        }
    : raceWeek && rwLast && rwPole
      ? {
          speeds: rwPole.speedKmh,
          caption: t('raceWeek.terrain.caption', {
            driver: rwSurname(rwPole.driver),
            year: rwLast.year,
            circuit: raceWeek.circuit.name,
            lapTime: rwPole.lapTime,
            min: format.number(rwPole.minSpeedKmh),
            max: format.number(rwPole.topSpeedKmh),
            source: sourceName(rwPole.source),
          }),
          ariaLabel: t('raceWeek.terrain.aria', {
            driver: rwSurname(rwPole.driver),
            year: rwLast.year,
            circuit: raceWeek.circuit.name,
            min: format.number(rwPole.minSpeedKmh),
            max: format.number(rwPole.topSpeedKmh),
          }),
        }
      : null;

  // ── I · Insights: key numbers already published in our race-week analysis ──
  // The editorial 'featured' flag is a placement, not a topic: label by the first real tag.
  const topicTag = (tags: TagRef[] | undefined) => tags?.find((tg) => tg.slug !== FEATURED_TAG_SLUG)?.label;
  const featuredChip = topicTag(featured?.tags) ?? t('latest.tagOwn');
  const insightCandidates: InsightSlide[] = [
    // In story mode the featured piece's numbers become the KPI row instead.
    ...(raceMode ? featuredStats.slice(1) : []).map((s, i) => ({
      key: `f-${i}`,
      chip: featuredChip,
      value: s.value,
      label: s.label,
      context: s.unit ?? null,
      href: `/${featured?.slug}/`,
      linkLabel: t('insights.read'),
    })),
    ...recent
      .filter((a) => inRaceWeek(a.published_at ? new Date(a.published_at) : null))
      .flatMap((a) => {
        const s = ((a.stats as Stat[] | undefined) ?? [])[0];
        return s
          ? [{ key: `r-${a.slug}`, chip: topicTag(a.tags) ?? t('latest.tagOwn'), value: s.value, label: s.label, context: s.unit ?? null, href: `/${a.slug}/`, linkLabel: t('insights.read') }]
          : [];
      }),
  ];
  const insights = featured ? insightCandidates.slice(0, 3) : [];
  const storyStats = raceMode ? [] : featuredStats.slice(1, 4);

  // ── 3 · KPI row ─────────────────────────────────────────────────────
  const led = highlights?.lapsLed;
  const leaderTrace = led && trace ? trace.drivers.find((d) => d.driver === led.driver) : undefined;
  const ledByLap: boolean[] | null = leaderTrace
    ? leaderTrace.positions.map((p) => p === 1)
    : led && led.laps === led.totalLaps
      ? Array.from({ length: led.totalLaps }, () => true)
      : null;
  const p2w = latestRace?.poleToWin;

  // ── D · How the race was won ────────────────────────────────────────
  const story = trace ? await buildRaceStory(trace, surname, fmt3) : null;

  // ── E · Standings ───────────────────────────────────────────────────
  const racesLeft = latestRace ? Math.max(0, latestRace.seasonRounds - latestRace.round) : 0;

  // ── Duel ────────────────────────────────────────────────────────────
  const duel = highlights?.poleDuel;
  const duelGaps = duel ? duel.pole.sectors.map((v, i) => duel.challenger.sectors[i] - v) : [];
  const cumulative = duelGaps.map((_, i) => duelGaps.slice(0, i + 1).reduce((a, b) => a + b, 0));
  const lastChallengerLead = [0, 1].filter((i) => cumulative[i] < 0).pop();

  // ── F · Title trend ─────────────────────────────────────────────────
  const seenTeams = new Set<string>();
  const trendSeries: TrendSeries[] = trend
    ? topDrivers.flatMap((d) => {
        const s = trend.series.find((x) => x.driverId === d.driver_id);
        if (!s) return [];
        const dashed = seenTeams.has(d.constructor_ref);
        seenTeams.add(d.constructor_ref);
        return [{ code: codeBySurname.get(d.surname) ?? d.surname.slice(0, 3).toUpperCase(), colour: teamVar(d.constructor_ref), dashed, points: s.points }];
      })
    : [];

  // ── 7 · Latest: Feed items + our own recent articles, newest first ──
  const latestItems: (LatestItem & { at: number })[] = [
    ...feedItems.map((f) => ({
      key: `feed-${f.id}`,
      title: f.headline,
      href: f.slug ? `/feed/${f.slug}/` : '/feed/',
      meta: `${f.source_name} · ${shortDate(new Date(f.published_at))}`,
      tag: t('latest.tagFeed'),
      own: false,
      at: new Date(f.published_at).getTime(),
    })),
    ...recent.slice(0, 4).map((a) => ({
      key: `article-${a.slug}`,
      title: a.title,
      href: `/${a.slug}/`,
      meta: `${t('latest.ownSource')} · ${a.published_at ? shortDate(new Date(a.published_at)) : ''}`,
      tag: t('latest.tagOwn'),
      own: true,
      at: a.published_at ? new Date(a.published_at).getTime() : 0,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5);

  // ── 9 · Archive ─────────────────────────────────────────────────────
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

  const sub = 'text-[13px] text-[color:var(--dusk-muted)] mt-0.5';

  // ── Cover blocks, ordered below by mode ─────────────────────────────
  const raceHeader = latestRace && raceDay ? (
          <header className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${raceMode ? '' : 'md:col-span-6 lg:col-span-12 mt-4'}`}>
            <div>
              <p className="dusk-label">
                {t('header.eyebrow', {
                  round: latestRace.round,
                  total: latestRace.seasonRounds,
                  date: format.dateTime(raceDay, { weekday: 'long', month: 'short', day: 'numeric' }),
                })}
              </p>
              <h2 className="dusk-display mt-1.5 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{latestRace.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pole && (
                <span className="dusk-chip">
                  <span className="dusk-chip-dot" aria-hidden="true" />
                  {t('header.chipData')}
                </span>
              )}
              {raceLaps && <span className="dusk-chip">{t('header.chipLaps', { circuit: latestRace.circuitName, laps: raceLaps })}</span>}
            </div>
          </header>
  ) : null;
  const heroEl = featured ? (
              <HeroLandscape
                className={`md:col-span-6 ${insights.length ? 'lg:col-span-8' : 'lg:col-span-12'}`}
                kicker={heroKicker}
                title={featured.title as string}
                dek={(featured.meta_description as string | null) ?? null}
                href={`/${featured.slug}`}
                ctaLabel={t('cta')}
                keyNumber={featuredStat ? { value: featuredStat.value, label: featuredStat.label } : null}
                terrain={terrain}
              />
  ) : null;
  const insightsBlock = insights.length > 0 ? (
              <InsightCarousel
                className="md:col-span-6 lg:col-span-4"
                slides={insights}
                ariaLabel={t('insights.aria')}
                pickLabels={insights.map((_, i) => t('insights.pick', { n: i + 1, total: insights.length }))}
              />
  ) : null;
  const raceKpis = (
    <>
      {pole && (
              <SpeedKpi
                className="md:col-span-2 lg:col-span-4"
                title={t('kpi.speedTitle')}
                sub={t('kpi.speedSub', { driver: surname(pole.driver), lapTime: pole.lapTime })}
                topSpeed={format.number(pole.topSpeedKmh)}
                unit={t('kpi.speedUnit')}
                badge={t('kpi.speedBadge', { min: format.number(pole.minSpeedKmh) })}
                speeds={pole.speedKmh}
                ariaLabel={t('kpi.speedAria', { driver: surname(pole.driver), min: pole.minSpeedKmh, max: pole.topSpeedKmh })}
                source={t('kpi.speedSource')}
              />
      )}
      {led && ledByLap && (
              <LapsLedKpi
                className="md:col-span-2 lg:col-span-4"
                title={t('kpi.ledTitle')}
                sub={t(led.laps === led.totalLaps ? 'kpi.ledSubAll' : 'kpi.ledSub', { driver: surname(led.driver) })}
                laps={led.laps}
                total={led.totalLaps}
                badge={led.laps === led.totalLaps ? t('kpi.ledBadgeAll') : t('kpi.ledBadge', { pct: pct(led.laps, led.totalLaps) })}
                led={ledByLap}
                vscLaps={trace?.vscLaps ?? []}
                ledLabel={t('kpi.ledLegend')}
                vscLabel={t('kpi.vscLegend')}
                ariaLabel={t('kpi.ledAria', { total: led.totalLaps, driver: surname(led.driver), laps: led.laps })}
                source={t('kpi.ledSource')}
              />
      )}
      {latestRace && p2w && (
              <PoleToWinKpi
                className="md:col-span-2 lg:col-span-4"
                title={t('kpi.p2wTitle')}
                sub={t('kpi.p2wSub', { circuit: latestRace.circuitName, year: p2w.sinceYear })}
                wins={p2w.poleWins}
                races={p2w.races}
                badge={t('kpi.p2wBadge', { pct: pct(p2w.poleWins, p2w.races) })}
                history={p2w.history.map((h) => ({ year: h.year, grid: h.grid, title: t('kpi.p2wDot', { year: h.year, winner: h.winner, grid: h.grid }) }))}
                currentYear={latestRace.year}
                ariaLabel={t('kpi.p2wAria', { races: p2w.races, circuit: latestRace.circuitName, year: p2w.sinceYear, wins: p2w.poleWins })}
                source={t('kpi.p2wSource')}
              />
      )}
    </>
  );
  const storyKpis = featured ? storyStats.map((st) => (
    <Link
      key={st.label}
      href={`/${featured.slug}`}
      className="dusk-card group p-5 sm:p-6 flex flex-col gap-2 md:col-span-2 lg:col-span-4 min-w-0"
    >
      <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] m-0">{st.label}</p>
      <p className="dusk-display tabular-nums text-[clamp(2.2rem,4vw,3rem)] leading-none tracking-[-0.03em] m-0">{st.value}</p>
      {st.unit && <p className="text-[13px] text-[color:var(--dusk-ink-2)] m-0">{st.unit}</p>}
      <p className="mt-auto pt-2 dusk-mono text-[10.5px] text-[color:var(--dusk-muted)] m-0 group-hover:text-[color:var(--dusk-ink)]">{t('kpi.fromArticle')} →</p>
    </Link>
  )) : [];
  const storyEl = trace && story ? (
              <RaceStoryCard className={`md:col-span-6 ${raceMode ? 'lg:col-span-8' : 'lg:col-span-6'}`} trace={trace} mover={story.mover} labels={story.labels} />
  ) : null;
  const standingsEl = latestRace && topDrivers.length > 0 ? (
              <StandingsCard
                className={`${raceMode ? 'md:col-span-3' : 'md:col-span-6'} lg:col-span-4`}
                title={t('standings.title')}
                sub={t('standings.sub', { race: latestRace.name, left: racesLeft })}
                leaderPoints={format.number(Number(topDrivers[0].points))}
                delta={
                  topDrivers.length > 1
                    ? t('standings.lead', { gap: format.number(Number(topDrivers[0].points) - Number(topDrivers[1].points)), driver: topDrivers[1].surname })
                    : null
                }
                rows={topDrivers.map((d) => ({
                  key: d.driver_id,
                  name: d.surname,
                  team: d.constructor_name,
                  teamRef: d.constructor_ref,
                  points: Number(d.points),
                  display: format.number(Number(d.points)),
                }))}
                linkLabel={t('standings.link')}
                linkHref={hubLocaleUrl(locale, '/drivers/')}
              />
  ) : null;
  const duelEl = duel ? (
              <SectorDuel
                className="md:col-span-3 lg:col-span-3"
                title={t('duel.title')}
                sub={t('duel.sub')}
                total={`${fmt3(cumulative[2])}s`}
                poleFaster={t('duel.faster', { driver: duel.pole.driver })}
                challengerFaster={t('duel.faster', { driver: duel.challenger.driver })}
                sectorLabel={(n) => t('duel.sector', { n })}
                format={fmt3}
                summary={
                  lastChallengerLead !== undefined
                    ? t('duel.summaryFlip', {
                        challenger: surname(duel.challenger.driver),
                        sector: lastChallengerLead + 1,
                        pole: surname(duel.pole.driver),
                        gain: fmt3(cumulative[2] - cumulative[lastChallengerLead]),
                      })
                    : t('duel.summaryNoFlip', { pole: surname(duel.pole.driver) })
                }
                ariaLabel={t('duel.aria', {
                  pole: surname(duel.pole.driver),
                  challenger: surname(duel.challenger.driver),
                  gaps: duelGaps
                    .map((g, i) => t('duel.ariaGap', { n: i + 1, driver: g > 0 ? surname(duel.pole.driver) : surname(duel.challenger.driver), gap: fmt3(Math.abs(g)) }))
                    .join('; '),
                  gap: fmt3(cumulative[2]),
                })}
                source={t('duel.source')}
                pole={{ code: duel.pole.driver, sectors: duel.pole.sectors }}
                challenger={{ code: duel.challenger.driver, sectors: duel.challenger.sectors }}
              />
  ) : null;
  const mapBlock = pole && highlights?.trackMap && latestRace ? (
              <section className="dusk-card flex flex-col gap-4 p-5 sm:p-6 md:col-span-3 lg:col-span-3" aria-labelledby="dusk-map-title">
                <div>
                  <h2 id="dusk-map-title" className="text-[17px] font-semibold m-0">{latestRace.circuitName}</h2>
                  <p className={sub}>{t('map.sub')}</p>
                </div>
                <TrackMap
                  map={highlights.trackMap}
                  topLabel={t('map.top', { speed: format.number(pole.topSpeedKmh) })}
                  minLabel={t('map.min', { speed: format.number(pole.minSpeedKmh) })}
                  caption={t('map.source')}
                  ariaLabel={t('map.aria', {
                    circuit: latestRace.circuitName,
                    driver: surname(pole.driver),
                    max: format.number(pole.topSpeedKmh),
                    min: format.number(pole.minSpeedKmh),
                  })}
                />
                <div className="flex gap-3.5 text-[12px] text-[color:var(--dusk-muted)] mt-auto">
                  <span className="inline-flex items-center gap-1.5"><i className="dusk-dot w-[9px] bg-[color:var(--dusk-muted)]" />{t('map.slow')}</span>
                  <span className="inline-flex items-center gap-1.5"><i className="dusk-dot dusk-dot-on w-[9px]" />{t('map.fast')}</span>
                </div>
              </section>
  ) : null;
  const trendEl = trend && trendSeries.length > 0 && latestRace ? (
              <TitleTrend
                className={`md:col-span-6 ${raceMode ? 'lg:col-span-6' : 'lg:col-span-8'}`}
                title={t('trend.title')}
                sub={t('trend.sub', { n: trend.rounds.length })}
                roundLabel={t('trend.round', { n: '{n}' })}
                tip={t('trend.tip', { n: '{n}' })}
                ariaLabel={t('trend.aria', { drivers: topDrivers.map((d) => d.surname).join(', ') })}
                source={t('trend.source', { year: latestRace.year, first: trend.rounds[0], last: trend.rounds[trend.rounds.length - 1] })}
                rounds={trend.rounds}
                series={trendSeries}
              />
  ) : null;
  // In race week the race-week section below takes this card's place.
  const nextRaceEl = nextRace && !raceWeek ? (
              <NextRaceCard
                className="md:col-span-6 lg:col-span-4"
                kicker={t('nextRace.kicker', { round: nextRace.round })}
                name={nextRace.race_name}
                meta={t('nextRace.meta', {
                  circuit: nextRace.name,
                  date: format.dateTime(dayDate(nextRace.race_date), { weekday: 'long', month: 'short', day: 'numeric' }),
                })}
                days={nextRace.days_until}
                daysLabel={t('nextRace.days', { days: nextRace.days_until })}
                facts={[
                  ...(nextRace.fastest_lap
                    ? [{ label: t('nextRace.lapRecord'), value: t('nextRace.lapRecordValue', { time: nextRace.fastest_lap.time, driver: nextRace.fastest_lap.surname, year: nextRace.fastest_lap.year }) }]
                    : []),
                  ...(nextRace.champions.length
                    ? [{ label: t('nextRace.recentWinners'), value: nextRace.champions.slice(0, 3).map((c) => `${c.year} ${c.surname}`).join(' · ') }]
                    : []),
                ]}
              />
  ) : null;
  // ── Race week: strip on top, circuit section under the hero ─────────
  const rwTz = raceWeek ? circuitTimeZone(raceWeek.circuit.ref) : null;
  const rwStart = raceWeek?.time ? new Date(`${raceWeek.date}T${raceWeek.time}Z`) : null;
  const rwPlace = raceWeek?.circuit.location ?? '';
  const raceWeekStrip = raceWeek ? (
    <RaceWeekStrip
      eyebrow={t('raceWeek.eyebrow', { round: raceWeek.round, total: raceWeek.seasonRounds })}
      title={raceWeek.name}
      meta={[
        t('raceWeek.meta', {
          circuit: raceWeek.circuit.name,
          location: raceWeek.circuit.location,
          dates: format.dateTimeRange(dayDate(raceWeek.weekendStart), dayDate(raceWeek.date), { month: 'long', day: 'numeric', timeZone: 'UTC' }),
        }),
        ...(rwStart && rwTz
          ? [
              t('raceWeek.raceTime', {
                weekday: format.dateTime(rwStart, { weekday: 'long', timeZone: rwTz }),
                time: format.dateTime(rwStart, { hour: 'numeric', minute: '2-digit', timeZone: rwTz }),
              }),
            ]
          : []),
      ].join(' · ')}
      days={raceWeek.daysUntil}
      daysLabel={t('raceWeek.days', { days: raceWeek.daysUntil })}
      countAria={t('raceWeek.countAria', { days: raceWeek.daysUntil })}
    />
  ) : null;

  const rwP2w = raceWeek?.poleToWin ?? null;
  const [rwTop, rwNext] = raceWeek?.topWinners ?? [];
  const rwRecord = nextRace && raceWeek && nextRace.round === raceWeek.round ? nextRace.fastest_lap : null;
  const rwTileClass = 'dusk-rw md:col-span-2 lg:col-span-4';
  const rwTiles = raceWeek && rwP2w ? (
    <>
      <CircuitTile
        className={rwTileClass}
        label={t('raceWeek.tiles.editionsLabel', { circuit: rwPlace })}
        value={format.number(rwP2w.races)}
        text={t('raceWeek.tiles.editionsText', { year: rwP2w.sinceYear })}
        source={t('raceWeek.tiles.source')}
      />
      {/* A tie among more than two drivers isn't a "most wins" story. */}
      {rwTop && rwTop.surnames.length <= 2 && (
        <CircuitTile
          className={rwTileClass}
          label={t('raceWeek.tiles.topLabel')}
          value={format.number(rwTop.wins)}
          text={
            t('raceWeek.tiles.topText', { n: rwTop.wins, drivers: format.list(rwTop.surnames) }) +
            (rwNext && rwNext.surnames.length <= 2
              ? t('raceWeek.tiles.topNext', { drivers: format.list(rwNext.surnames), count: rwNext.surnames.length, n: rwNext.wins })
              : '')
          }
          source={t('raceWeek.tiles.source')}
        />
      )}
      {rwRecord && (
        <CircuitTile
          className={rwTileClass}
          label={t('raceWeek.tiles.recordLabel')}
          value={rwRecord.time}
          text={t('raceWeek.tiles.recordText', { driver: rwRecord.surname, year: rwRecord.year })}
          source={t('raceWeek.tiles.source')}
        />
      )}
    </>
  ) : null;

  const stakes = raceWeek?.stakes ?? null;
  const needText = (n: number) =>
    n > 0 ? t('raceWeek.stakes.needMore', { n }) : n === 0 ? t('raceWeek.stakes.needZero') : t('raceWeek.stakes.needLess', { n: -n });
  const winConditions = (stakes?.rivals ?? []).flatMap((r) =>
    r.worstIfWin === null
      ? []
      : [r.worstIfWin === 11 ? t('raceWeek.stakes.condOut', { driver: r.surname }) : t('raceWeek.stakes.cond', { driver: r.surname, pos: r.worstIfWin })],
  );
  const stakesEl = raceWeek && stakes ? (
    <StakesCard
      className={`dusk-rw md:col-span-6 ${rwHighlights?.trackMap && rwPole ? 'lg:col-span-7' : 'lg:col-span-12'}`}
      label={t('raceWeek.stakes.label')}
      title={t('raceWeek.stakes.title', { leader: stakes.leader, place: rwPlace })}
      headers={[t('raceWeek.stakes.rival'), t('raceWeek.stakes.gap'), t('raceWeek.stakes.need')]}
      rows={stakes.rivals.map((r, i) => ({
        key: `${i}-${r.surname}`,
        driver: r.surname,
        gap: t('raceWeek.stakes.gapValue', { n: format.number(r.gap) }),
        need: needText(r.need),
      }))}
      bottomLine={t.rich(winConditions.length ? 'raceWeek.stakes.bottom' : 'raceWeek.stakes.bottomAny', {
        b: (chunks) => <b>{chunks}</b>,
        points: format.number(stakes.pointsAfter),
        place: rwPlace,
        leader: stakes.leader,
        conditions: format.list(winConditions),
      })}
      source={t('raceWeek.stakes.source', { round: raceWeek.round - 1 })}
    />
  ) : null;

  const rwMap = raceWeek && rwLast && rwPole && rwHighlights?.trackMap ? (
    <section className="dusk-card dusk-rw flex flex-col gap-4 p-5 sm:p-6 md:col-span-6 lg:col-span-5" aria-labelledby="dusk-rwmap-title">
      <div>
        <p className="dusk-label m-0">{t('raceWeek.map.label')}</p>
        <h2 id="dusk-rwmap-title" className="text-[17px] font-semibold m-0 mt-1">{raceWeek.circuit.name}</h2>
        <p className={sub}>{t('raceWeek.map.sub', { driver: rwSurname(rwPole.driver), year: rwLast.year })}</p>
      </div>
      <TrackMap
        map={rwHighlights.trackMap}
        // The legend below names both markers; on-map labels would sit on the line here.
        topLabel=""
        minLabel=""
        caption={t('raceWeek.map.source', { source: sourceName(rwHighlights.trackMap.source), year: rwLast.year })}
        ariaLabel={t('raceWeek.map.aria', {
          circuit: raceWeek.circuit.name,
          driver: rwSurname(rwPole.driver),
          year: rwLast.year,
          max: format.number(rwPole.topSpeedKmh),
          min: format.number(rwPole.minSpeedKmh),
        })}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[color:var(--dusk-muted)] mt-auto">
        <span className="inline-flex items-center gap-1.5"><i className="dusk-dot dusk-mk-top w-[9px]" />{t('raceWeek.map.top', { speed: format.number(rwPole.topSpeedKmh) })}</span>
        <span className="inline-flex items-center gap-1.5"><i className="dusk-dot dusk-mk-min w-[9px]" />{t('raceWeek.map.min', { speed: format.number(rwPole.minSpeedKmh) })}</span>
      </div>
    </section>
  ) : null;

  const rwNonPole = rwP2w ? rwP2w.history.filter((h) => h.grid !== 1) : [];
  // Furthest back on the grid (grid 0 is a pit-lane start, not a grid slot), latest year on a tie.
  const rwFurthest = rwNonPole.filter((h) => h.grid > 1).sort((a, b) => b.grid - a.grid || b.year - a.year)[0];
  const poleHistoryEl = raceWeek && rwP2w ? (
    <PoleHistoryCard
      className={`dusk-rw md:col-span-6 ${rwMap && !stakesEl ? 'lg:col-span-7' : 'lg:col-span-12'}`}
      label={t('kpi.p2wTitle')}
      title={t('raceWeek.poleHistory.title', { first: rwP2w.history[0].year, last: rwP2w.history[rwP2w.history.length - 1].year })}
      years={rwP2w.history.map((h) => ({ year: h.year, fromPole: h.grid === 1, title: t('kpi.p2wDot', { year: h.year, winner: h.winner, grid: h.grid }) }))}
      ariaLabel={t('kpi.p2wAria', { races: rwP2w.races, circuit: raceWeek.circuit.name, year: rwP2w.sinceYear, wins: rwP2w.poleWins })}
      bottomLine={
        rwNonPole.length === 0
          ? t('raceWeek.poleHistory.bottomAll')
          : rwFurthest
            ? t('raceWeek.poleHistory.bottomExample', { other: rwNonPole.length, races: rwP2w.races, driver: rwFurthest.winner, year: rwFurthest.year, grid: rwFurthest.grid })
            : t('raceWeek.poleHistory.bottomOther', { other: rwNonPole.length, races: rwP2w.races })
      }
      source={t('kpi.p2wSource')}
    />
  ) : null;

  const LONG_RUN_ROWS = 5;
  const runs = rwPractice?.longRuns;
  const longRunColumns = runs
    ? (['SOFT', 'MEDIUM', 'HARD'] as const).flatMap((compound) => {
        const rows = runs.runs.filter((r) => r.compound === compound).slice(0, LONG_RUN_ROWS);
        return rows.length
          ? [{
              key: compound,
              heading: t('raceWeek.practice.compound', { compound }),
              rows: rows.map((r, i) => ({
                key: `${r.driver}-${i}`,
                driver: surname(r.driver),
                teamColour: teamVar(FASTF1_TEAM_REF[r.team] ?? ''),
                laps: r.deletedLaps
                  ? t('raceWeek.practice.lapsDeleted', { laps: r.laps, deleted: r.deletedLaps })
                  : t('raceWeek.practice.laps', { laps: r.laps }),
                mean: lapTime(r.meanSeconds),
                deg: t('raceWeek.practice.deg', {
                  deg: format.number(r.degPerLap, { minimumFractionDigits: 3, maximumFractionDigits: 3, signDisplay: 'exceptZero' }),
                }),
              })),
            }]
          : [];
      })
    : [];
  const longRunsEl = raceWeek && rwPractice && runs && longRunColumns.length ? (
    <LongRunsCard
      className="dusk-rw md:col-span-6 lg:col-span-12"
      label={t('raceWeek.practice.label', { session: sessionName })}
      title={t('raceWeek.practice.title', { place: rwPlace })}
      columns={longRunColumns}
      note={t('raceWeek.practice.note', { minLaps: runs.minLaps, pct: runs.slowLapPct })}
      source={t('raceWeek.practice.source', { session: sessionName })}
    />
  ) : null;

  const raceWeekSection = (
    <>
      {longRunsEl}
      {rwTiles}
      {stakesEl}
      {rwMap}
      {poleHistoryEl}
    </>
  );

  const latestEl = (
            <LatestList
              className={`md:col-span-6 ${nextRaceEl ? 'lg:col-span-8' : 'lg:col-span-12'}`}
              title={t('latest.title')}
              linkLabel={t('latest.link')}
              linkHref="/feed"
              items={latestItems}
            />
  );

  return (
    <main
      className={`theme-dusk ${duskSans.variable} min-h-screen`}
      data-host={isFrontPage && raceWeek ? (hostPalette(raceWeek.circuit.country) ?? undefined) : undefined}
    >
      <h1 className="sr-only">{tMag('headline')}</h1>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-7 pb-16 flex flex-col gap-5">
        {isFrontPage && raceWeekStrip}
        {isFrontPage && raceMode && raceHeader}

        {isFrontPage && (
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4">
            {heroEl}
            {insightsBlock}
            {raceMode ? (
              <>
                {raceKpis}
                {storyEl}
                {standingsEl}
                {duelEl}
                {mapBlock}
                {trendEl}
                {nextRaceEl}
                {raceWeekSection}
                {latestEl}
              </>
            ) : (
              <>
                {raceWeekSection}
                {storyKpis}
                {trendEl}
                {standingsEl}
                {nextRaceEl}
                {latestEl}
                {raceHeader}
                {raceKpis}
                {storyEl}
                {duelEl}
                {mapBlock}
              </>
            )}

            <NewsletterBand className="md:col-span-6 lg:col-span-12" />
          </div>
        )}

        {/* 9 · Archive — the crawl path to every older article, and the target of every
            `/?tag=` link across the site; kept on the home on purpose. */}
        <section id="archive" className="pt-6 scroll-mt-20">
          <h2 className="dusk-display text-[1.3rem] sm:text-[1.4rem] leading-tight mb-5">{t('archive.title')}</h2>
          {tag && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 mb-6 flex items-center gap-3">
              <span>
                {tMag('filter.label')} <span className="text-accent">{tagLabel}</span>
              </span>
              <a href={basePath} className="text-text-3 hover:text-text-1 transition-colors duration-150 py-2" aria-label={tMag('filter.clear')}>
                {tMag('filter.clear')} ×
              </a>
            </p>
          )}
          {archiveArticles.length === 0 ? (
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">{tMag('noArticles')}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {archiveArticles.slice(0, 3).map((a) => {
                  const s = ((a.stats as Stat[]) ?? [])[0];
                  const kicker = [topicTag(a.tags), a.published_at ? formatDate(a.published_at as string, locale) : null].filter(Boolean).join(' · ');
                  return (
                    <DuskArticleCard
                      key={a.slug as string}
                      href={`/${a.slug}`}
                      kicker={kicker}
                      title={a.title as string}
                      stat={s ? { value: s.value, label: s.label } : null}
                    />
                  );
                })}
              </div>
              {archiveArticles.length > 3 && (
                <div className="mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 pt-6 mb-2 border-t border-border-subtle">{tMag('archive.rest')}</p>
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
              <span className="font-mono text-[11px] tracking-[0.1em] text-text-3 tabular-nums">{tMag('pagination.page', { current: page, total: totalPages })}</span>
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
