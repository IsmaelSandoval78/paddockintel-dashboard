import { notFound } from 'next/navigation';
import { draftMode, cookies } from 'next/headers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import { ArticleScorecardButton } from '@/components/scorecards/ArticleScorecard';
import ArticleTOC from '@/components/blog/ArticleTOC';
import ArticleCharts, { type ChartSpec } from '@/components/blog/ArticleCharts';
import NewsletterCard from '@/components/blog/NewsletterCard';
import ArticlePaywallGate from '@/components/blog/ArticlePaywallGate';
import { extractTOC, markdownToHtml, estimateReadTime, splitMarkdownAtSection } from '@/lib/markdown';
import { linkGlossaryTerms } from '@/lib/glossaryLinks';
import { getGlossaryTerms } from '../glossary/data';
import { getArticleTagSlugs, getRelatedArticles, getArticleVoices } from '@/lib/blog/tags';
import { getArticleRace } from '@/lib/blog/articleRace';
import ArticleVoices from '@/components/blog/ArticleVoices';
import { TerrainFigure, type TerrainData } from '@/components/home-dusk/HeroLandscape';
import TrackDominance from '@/components/home-dusk/TrackDominance';
import GridToFlag, { type GridToFlagRow } from '@/components/home-dusk/GridToFlag';
import RaceStoryCard from '@/components/home-dusk/RaceStoryCard';
import { buildRaceStory } from '@/components/home-dusk/raceStory';
import { teamVar } from '@/components/home-dusk/StandingsCard';
import { getRaceHighlightsFor } from '@/lib/raceHighlights';
import { getCurrentAuthUser } from '@/lib/auth/getCurrentAuthUser';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../dusk-font';
import '../dusk.css';

// Free sections before the registration wall cuts in — see
// docs on ArticlePaywallGate. Matches EDITORIAL.md's five-section
// structure: reader gets "What Happened" + "Why It Happened" free,
// the wall sits right before "Economic Impact".
const FREE_SECTIONS = 2;

export const revalidate = 3600;

type Stat   = { value: string; label: string; unit?: string };
type FAQ    = { q: string; a: string };
type Source = { name: string; url: string };

type PageParams = Promise<{ locale: string; slug: string }>;

// A paragraph that is only `[[figure:name]]` (optionally `[[figure:name:arg]]`) in body_markdown
// marks where a race figure goes. markdownToHtml leaves it as `<p>[[figure:…]]</p>`; split()
// with two capture groups yields [html, name, arg, html, name, arg, …, html].
const FIGURE_MARKER = /<p>\[\[figure:([a-z-]+)(?::([\w-]+))?\]\]<\/p>/g;

const FEATURED_TAG_SLUG = 'featured';

async function getArticle(locale: string, slug: string, isDraft: boolean) {
  const supabase = createClient();

  let query = supabase
    .from('articles')
    .select(
      'id, title, meta_description, body_markdown, published_at, updated_at, translation_group_id, paywalled, cover_image_url, stats, faq_items, sources, charts, race_id'
    )
    .eq('locale', locale)
    .eq('slug', slug);

  if (!isDraft) query = query.eq('status', 'published');

  const { data } = await query.single();
  return data;
}

async function getHreflangUrls(translationGroupId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('articles')
    .select('locale, slug')
    .eq('translation_group_id', translationGroupId)
    .eq('status', 'published');
  return data ?? [];
}

function localeUrl(locale: string, slug: string): string {
  return locale === 'en'
    ? `${SITE_URL}/${slug}/`
    : `${SITE_URL}/${locale}/${slug}/`;
}

// "2026-10-11…" -> a Date at noon UTC, so no timezone can shift the calendar day.
function dayDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const article = await getArticle(locale, slug, isDraft);
  if (!article) {
    const t = await getTranslations({ locale, namespace: 'notFound' });
    return { title: `${t('label')} — PaddockIntel`, robots: { index: false, follow: true } };
  }

  const alternates: Record<string, string> = {};
  if (article.translation_group_id) {
    const versions = await getHreflangUrls(article.translation_group_id as string);
    for (const v of versions) {
      alternates[v.locale as string] = localeUrl(v.locale as string, v.slug as string);
    }
  }

  const ogImage =
    (article.cover_image_url as string | null) ?? `${SITE_URL}/api/og/article/${locale}/${slug}`;

  const canonical = localeUrl(locale, slug);

  return {
    title: `${article.title as string} — PaddockIntel`,
    description: (article.meta_description as string) ?? undefined,
    alternates: {
      canonical,
      ...(Object.keys(alternates).length ? { languages: alternates } : {}),
    },
    openGraph: { url: canonical, images: [ogImage] },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  };
}

export default async function ArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const article = await getArticle(locale, slug, isDraft);
  if (!article) notFound();

  const rawBody     = article.body_markdown as string;
  const title       = article.title as string;
  const dek         = (article.meta_description as string | null) ?? null;
  const publishedAt = article.published_at as string;
  // updated_at is stamped by every ingest, so it can sit a few seconds before a published_at
  // set in frontmatter; dateModified never goes earlier than the publish date.
  const updatedAt   = article.updated_at as string | null;
  const modifiedAt  = updatedAt && Date.parse(updatedAt) > Date.parse(publishedAt) ? updatedAt : publishedAt;
  const raceId      = (article.race_id as number | null) ?? null;
  const allStats    = (article.stats as Stat[]) ?? [];
  const allFaqItems = (article.faq_items as FAQ[]) ?? [];
  const allSources  = (article.sources as Source[]) ?? [];
  const allCharts   = (article.charts as ChartSpec[]) ?? [];

  const cookieStore = await cookies();
  const hasSubscribedCookie = cookieStore.get('pi_subscribed')?.value === '1';
  const authUser = hasSubscribedCookie ? null : await getCurrentAuthUser();
  const isSubscribed = hasSubscribedCookie || !!authUser;

  // Draft-mode preview (reached via /api/draft?secret=...) is already
  // trusted — never gate a piece Ismael is reviewing before it's even live.
  const isGated = Boolean(article.paywalled) && !isSubscribed && !isDraft;

  // Stat callouts, FAQ, and sources all draw from sections past the free
  // preview — hold them back too, not just the body text, or the KPI row
  // spoils the numbers the wall is supposed to gate.
  const stats    = isGated ? [] : allStats;
  const faqItems = isGated ? [] : allFaqItems;
  const sources  = isGated ? [] : allSources;
  const charts   = isGated ? [] : allCharts;

  // Independent reads (no shared inputs) — run concurrently so their
  // latency doesn't stack, which is what turns a single slow round trip
  // into several on a page far from Supabase's region.
  const [t, tTerrain, tTags, format, tagSlugsMap, relatedArticles, voicesMap, race, glossaryTerms] = await Promise.all([
    getTranslations('articleDusk'),
    getTranslations('homeDusk.terrain'),
    getTranslations('articleTags'),
    getFormatter(),
    getArticleTagSlugs(createClient(), [article.id as string]),
    getRelatedArticles(createClient(), article.id as string, locale, 3),
    getArticleVoices(createClient(), [article.id as string]),
    raceId ? getArticleRace(createClient(), raceId) : Promise.resolve(null),
    getGlossaryTerms(locale),
  ]);
  // First mention of each glossary term links to its glossary page (lib/glossaryLinks.ts).
  const fullBody = linkGlossaryTerms(rawBody, glossaryTerms, locale);
  const body = isGated ? splitMarkdownAtSection(fullBody, FREE_SECTIONS).free : fullBody;
  const tagSlugs = tagSlugsMap.get(article.id as string) ?? [];
  const tags = tagSlugs.map((slug) => tTags(slug));
  // 'featured' is a placement, not a topic: the cover labels the piece by its first real tag.
  const topicSlug = tagSlugs.find((s) => s !== FEATURED_TAG_SLUG);
  // Gated the same as stats/faq/sources -- a Voices quote can carry the same
  // substance the paywall is meant to hold back.
  const voices = isGated ? [] : voicesMap.get(article.id as string) ?? [];

  const toc      = extractTOC(body);
  const html     = markdownToHtml(body);
  const readTime = estimateReadTime(fullBody);
  const pageUrl  = localeUrl(locale, slug);

  // Only offered when there's a real, ungated stat to feature — a stat card
  // with nothing to show isn't worth the modal, and using `stats` (not
  // `allStats`) means a gated article never lets a reader share the exact
  // number the paywall is holding back.
  const cardStat = stats[0];
  const articleCardData = cardStat
    ? {
        kicker: tags[0] ?? 'PaddockIntel',
        title,
        statValue: cardStat.value,
        statLabel: cardStat.label,
        date: new Date(`${publishedAt.slice(0, 10)}T12:00:00`).toLocaleDateString(
          locale === 'pt' ? 'pt-BR' : locale,
          { month: 'short', day: 'numeric', year: 'numeric' }
        ),
        path: pageUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      }
    : null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    // Without a cover, the scorecard in the three ratios Google lists for an article image.
    image:
      (article.cover_image_url as string | null) ??
      ['16x9', '4x3', '1x1'].map((r) => `${SITE_URL}/api/og/article/${locale}/${slug}?ratio=${r}`),
    author: { '@type': 'Person', name: 'Ismael Sandoval', url: `${SITE_URL}/about/` },
    publisher: {
      '@type': 'Organization',
      name: 'PaddockIntel',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
    },
    url: pageUrl,
    ...(article.meta_description ? { description: article.meta_description as string } : {}),
  };

  const faqJsonLd = faqItems.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: locale === 'en' ? `${SITE_URL}/` : `${SITE_URL}/${locale}/`,
      },
      { '@type': 'ListItem', position: 2, name: title },
    ],
  };

  // ── Race data (only for articles tied to a race via articles.race_id) ───────────────────
  const highlights = race ? getRaceHighlightsFor(race.year, race.round) : null;
  const surname = (code: string) => race?.surnameByCode[code] ?? code;
  const fmt3 = (n: number) => format.number(n, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const pole = highlights?.poleLap;
  const terrain: TerrainData | null = pole
    ? {
        speeds: pole.speedKmh,
        caption: tTerrain('caption', {
          driver: surname(pole.driver),
          lapTime: pole.lapTime,
          min: format.number(pole.minSpeedKmh),
          max: format.number(pole.topSpeedKmh),
        }),
        ariaLabel: tTerrain('aria', {
          driver: surname(pole.driver),
          min: format.number(pole.minSpeedKmh),
          max: format.number(pole.topSpeedKmh),
        }),
      }
    : null;

  const trace = highlights?.raceTrace;
  const story = trace ? await buildRaceStory(trace, surname, fmt3) : null;

  // Pole dominance: counts and the biggest single gain, all read off the generated sections.
  const dom = highlights?.qualiDominance;
  let domCaption = '';
  if (dom) {
    const p = dom.pole.driver;
    const c = dom.challenger.driver;
    const total = dom.sections.length;
    const poleWon = dom.sections.filter((s) => s.faster === p).length;
    const best = dom.sections.filter((s) => s.corners.length).sort((a, b) => b.gain - a.gain)[0];
    domCaption = [
      poleWon * 2 === total
        ? t('dom.captionEven', { pole: surname(p), challenger: surname(c), won: poleWon })
        : t('dom.captionMore', {
            driver: surname(poleWon * 2 > total ? p : c),
            won: Math.max(poleWon, total - poleWon),
            total,
          }),
      best ? t('dom.captionBest', { gain: fmt3(best.gain), driver: surname(best.faster), corners: best.corners.join('–') }) : '',
      t('dom.captionLine', { pole: surname(p), gap: fmt3(dom.gapAtBoundaries[dom.gapAtBoundaries.length - 1]) }),
    ]
      .filter(Boolean)
      .join(' ');
  }

  // Grid to flag: slots are ranked so pit-lane starters (grid 0) sit after the last grid slot.
  const raceRows = race?.rows ?? [];
  const gridSlot = new Map(
    [...raceRows]
      .sort((a, b) => (a.grid || 1000 + a.positionOrder) - (b.grid || 1000 + b.positionOrder))
      .map((r, i) => [r.code, i + 1]),
  );
  const flagRows: GridToFlagRow[] = raceRows.map((r) => ({
    code: r.code,
    grid: gridSlot.get(r.code) ?? r.positionOrder,
    gridLabel: r.grid > 0 ? `P${r.grid}` : t('flag.pitLane'),
    finish: r.positionOrder,
    finishLabel: r.classified
      ? `P${r.positionOrder}`
      : t(r.positionText === 'D' ? 'flag.dsq' : r.positionText === 'W' ? 'flag.dns' : 'flag.dnf'),
    classified: r.classified,
    colour: teamVar(r.constructorRef),
  }));
  const finishers = raceRows.filter((r) => r.classified && r.grid > 0);
  const climber = [...finishers].sort((a, b) => b.grid - b.positionOrder - (a.grid - a.positionOrder))[0];
  const faller = [...finishers].sort((a, b) => a.grid - a.positionOrder - (b.grid - b.positionOrder))[0];
  const retiredCount = raceRows.filter((r) => r.positionText === 'R').length;
  const flagCaption = [
    climber && climber.grid > climber.positionOrder
      ? t('flag.captionUp', { driver: climber.surname, from: climber.grid, to: climber.positionOrder })
      : '',
    faller && faller.grid < faller.positionOrder
      ? t('flag.captionDown', { driver: faller.surname, from: faller.grid, to: faller.positionOrder })
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  function raceFigure(name: string, arg: string | undefined, key: number) {
    if (name === 'pole-dominance' && dom && race) {
      return (
        <div key={key} className="-mx-1.5 md:mx-0 lg:-mx-10">
          <TrackDominance
            data={dom}
            format={fmt3}
            highlightCorner={arg}
            labels={{
              title: t('dom.title'),
              sub: t('dom.sub', { pole: surname(dom.pole.driver), challenger: surname(dom.challenger.driver) }),
              badge: t('dom.badge', { gap: fmt3(dom.gapAtBoundaries[dom.gapAtBoundaries.length - 1]) }),
              gapTitle: t('dom.gapTitle'),
              ahead: (driver) => t('dom.ahead', { driver }),
              sectorEnd: (n) => t('dom.sectorEnd', { n }),
              caption: domCaption,
              mapAria: t('dom.mapAria', { circuit: race.circuitName, pole: surname(dom.pole.driver), challenger: surname(dom.challenger.driver) }),
              gapAria: t('dom.gapAria', {
                pole: surname(dom.pole.driver),
                challenger: surname(dom.challenger.driver),
                gap: fmt3(dom.gapAtBoundaries[dom.gapAtBoundaries.length - 1]),
              }),
              source: t('dom.source'),
            }}
          />
        </div>
      );
    }
    if (name === 'grid-to-flag' && flagRows.length > 1) {
      return (
        <div key={key} className="-mx-1.5 md:mx-0 lg:-mx-10">
          <GridToFlag
            rows={flagRows}
            labels={{
              title: t('flag.title'),
              sub: t('flag.sub'),
              badge: retiredCount ? t('flag.badge', { n: retiredCount }) : null,
              grid: t('flag.grid'),
              flag: t('flag.flag'),
              caption: flagCaption,
              aria: t('flag.aria', { n: flagRows.length }),
              source: t('flag.source'),
            }}
          />
        </div>
      );
    }
    if (name === 'race-story' && trace && story) {
      return (
        <div key={key} className="my-8 -mx-1.5 md:mx-0 lg:-mx-10">
          <RaceStoryCard className="dusk-island" trace={trace} mover={story.mover} labels={story.labels} />
        </div>
      );
    }
    // Unknown marker, or no data for this race: the module is hidden, never filled.
    return null;
  }

  const parts = html.split(FIGURE_MARKER);
  const bodyNodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i].trim()) {
      bodyNodes.push(
        <div
          key={`h-${i}`}
          className={`prose-article ${i === 0 ? 'dusk-prose-first' : 'dusk-prose-cont'}`}
          dangerouslySetInnerHTML={{ __html: parts[i] }}
        />
      );
    }
    if (i + 1 < parts.length) bodyNodes.push(raceFigure(parts[i + 1], parts[i + 2], i));
  }

  // The cover always shows the lead stat (as the old hero did, gated or not); the rest of the
  // row only when ungated.
  const kpis = isGated ? allStats.slice(0, 1) : stats;
  const kicker = [
    topicSlug ? tTags(topicSlug) : null,
    race ? `${race.name} ${race.year}` : null,
    race ? t('round', { round: race.round }) : null,
  ].filter(Boolean).join(' · ');
  const podium = raceRows.slice(0, 6);
  const shortDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">

          <nav aria-label={t('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {topicSlug && (
              <>
                {' / '}
                <Link href={`/?tag=${topicSlug}`} className="hover:text-[color:var(--dusk-ink)]">{tTags(topicSlug)}</Link>
              </>
            )}
            {race && ` / ${race.name} ${race.year}`}
          </nav>

          {/* Cover */}
          <header className="dusk-card dusk-cover">
            <div className="relative z-[2] px-5 pt-6 md:px-9 md:pt-9 max-w-[900px]">
              {kicker && (
                <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)]">{kicker}</p>
              )}
              <h1 className="dusk-display mt-3.5 text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                {title}
              </h1>
              {dek && <p className="dusk-hero-dek mt-4 text-[16px] sm:text-[19px] leading-[1.5] max-w-[58ch]">{dek}</p>}
              <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 mt-5 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
                <span>
                  {t('by')}{' '}
                  <Link href="/about" className="text-[color:var(--dusk-ink)] font-medium hover:text-[color:var(--dusk-peach)]">Ismael Sandoval</Link>
                </span>
                {publishedAt && <time dateTime={publishedAt}>{shortDate(publishedAt)}</time>}
                <span>{t('readTime', { n: readTime })}</span>
                {sources.length > 0 && <span>{t('sources', { n: sources.length })}</span>}
              </div>
              <div className={`flex items-center gap-2 mt-5 ${terrain ? '' : 'pb-7 md:pb-9'}`}>
                {articleCardData && <ArticleScorecardButton data={articleCardData} />}
                <ShareButton url={pageUrl} title={title} />
              </div>
            </div>
            {terrain && <TerrainFigure terrain={terrain} className="relative m-0 -mt-2" />}
          </header>

          {/* KPI row: the article's own key numbers */}
          {kpis.length > 0 && (
            <section aria-label={t('kpisAria')} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpis.map((stat, i) => (
                <div key={i} className="dusk-card p-5 sm:p-6 flex flex-col gap-2.5">
                  <p className="dusk-display tabular-nums text-[2.5rem] leading-none tracking-[-0.03em]">{stat.value}</p>
                  <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)]">{stat.label}</p>
                  {stat.unit && <p className="text-[13.5px] text-[color:var(--dusk-ink-2)]">{stat.unit}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Reading column (light sheet) + rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
            <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-14 min-w-0">
              <div className="max-w-[66ch] mx-auto">
                {/* TOC — mobile collapsible only (desktop version lives in the rail) */}
                <ArticleTOC toc={toc} locale={locale} mobileOnly />

                {bodyNodes}

                {/* Charts — server-rendered, data-driven (see the `charts`
                    column and ArticleCharts.tsx); never embedded markup/JS */}
                <ArticleCharts charts={charts} />

                {/* Registration wall (gated) or the normal newsletter card —
                    never both, the wall already asks for an email itself */}
                {isGated ? <ArticlePaywallGate /> : <NewsletterCard />}

                {/* Voices — curated expert_picks relevant to this article's topic */}
                <ArticleVoices voices={voices} />

                {/* Author footer */}
                <p className="mt-12 pt-6 border-t border-border-subtle font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
                  {t('writtenBy')}{' '}
                  <Link href="/about" className="text-text-1 hover:text-terracotta transition-colors duration-150">
                    Ismael Sandoval
                  </Link>
                  {' '}· PaddockIntel
                </p>
              </div>
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              {toc.length > 0 && (
                <section className="dusk-card p-5 hidden lg:block">
                  <ArticleTOC toc={toc} locale={locale} desktopOnly />
                </section>
              )}
              {race && podium.length > 0 && (
                <section className="dusk-card p-5 flex flex-col gap-3" aria-labelledby="dusk-result-title">
                  <h2 id="dusk-result-title" className="dusk-label m-0 font-normal">{t('resultTitle')}</h2>
                  <ol className="m-0 p-0 list-none flex flex-col gap-2.5">
                    {podium.map((r) => (
                      <li key={r.code} className="grid grid-cols-[22px_8px_minmax(0,1fr)_auto] items-center gap-2.5 text-[14px]">
                        <span className="dusk-mono tabular-nums text-[color:var(--dusk-muted)]">{r.classified ? r.positionOrder : r.positionText}</span>
                        <span className="w-2 h-2 rounded-full" style={{ background: teamVar(r.constructorRef) }} aria-hidden="true" />
                        <span className="truncate">{r.surname}</span>
                        <span className="dusk-mono tabular-nums text-[12px] text-[color:var(--dusk-ink-2)]">{t('resultPoints', { n: r.points })}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0">{t('resultSource')}</p>
                </section>
              )}
            </aside>
          </div>

          {/* FAQ + sources */}
          {(faqItems.length > 0 || sources.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqItems.length > 0 && (
                <section className="dusk-card p-5 sm:p-6" aria-labelledby="dusk-faq-title">
                  <h2 id="dusk-faq-title" className="text-[17px] font-semibold m-0 mb-2">{t('faqTitle')}</h2>
                  {faqItems.map((faq, i) => (
                    <details key={i} className={`dusk-faq ${i > 0 ? 'border-t border-[color:var(--dusk-line)]' : ''}`}>
                      <summary className="flex justify-between gap-4 py-3.5 font-semibold text-[15.5px]">{faq.q}</summary>
                      <p className="m-0 mb-3.5 text-[15px] leading-[1.6] text-[color:var(--dusk-ink-2)]">{faq.a}</p>
                    </details>
                  ))}
                </section>
              )}
              {sources.length > 0 && (
                <section className="dusk-card p-5 sm:p-6" aria-labelledby="dusk-sources-title">
                  <h2 id="dusk-sources-title" className="text-[17px] font-semibold m-0 mb-2">{t('sourcesTitle')}</h2>
                  <ul className="m-0 p-0 list-none">
                    {sources.map((src, i) => (
                      <li key={i} className={i > 0 ? 'border-t border-[color:var(--dusk-line)]' : ''}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 py-3 text-[14.5px] hover:text-[color:var(--dusk-peach)]"
                        >
                          <span className="dusk-mono text-[11px] pt-[3px] text-[color:var(--dusk-sunset)]">{String(i + 1).padStart(2, '0')}</span>
                          <span>{src.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Related coverage — same-tag articles first, backfilled with
              the most recent others so this is never empty */}
          {relatedArticles.length > 0 && (
            <section className="flex flex-col gap-3.5 mt-2" aria-labelledby="dusk-related-title">
              <h2 id="dusk-related-title" className="dusk-display text-[1.4rem] m-0">{t('related')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArticles.map((rel) => (
                  <Link key={rel.slug} href={`/${rel.slug}`} className="dusk-card p-5 sm:p-6 flex flex-col gap-3 group">
                    {rel.published_at && <p className="dusk-label m-0">{shortDate(rel.published_at)}</p>}
                    <h3 className="text-[18px] leading-[1.25] font-semibold m-0 text-balance group-hover:text-[color:var(--dusk-peach)]">{rel.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
