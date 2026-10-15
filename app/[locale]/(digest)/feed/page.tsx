import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { easternDateKey } from '@/lib/dates';
import { weeklyEntityCounts, significanceScore } from '@/lib/entityMentions';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import { Link } from '@/lib/i18n/navigation';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import HubContext from '@/components/feed-dusk/HubContext';
import PressBars from '@/components/feed-dusk/PressBars';
import DayBars from '@/components/feed-dusk/DayBars';
import { StoryCard, StoryRow } from '@/components/feed-dusk/FeedStory';
import { SITE_URL } from '@/lib/site-url';
import {
  loadHookDeliverMap,
  readFeaturedStats,
  type HookDeliverFallbacks,
  type ResolvedHookDeliver,
} from '@/lib/hookDeliver';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type FeedItem = {
  id: string;
  slug: string | null;
  source_name: string;
  source_url: string;
  headline: string;
  headline_es: string | null;
  our_summary: string;
  our_summary_es: string | null;
  entity_tags: string[];
  published_at: string;
  editor_note: string | null;
  editor_note_es: string | null;
  editor_take: string | null;
  editor_take_es: string | null;
  internal_link_slug: string | null;
  stats: unknown;
  hook_deliver: unknown;
};

const DAY_MS = 86_400_000;
// Request time for the day windows below (a server component renders once per revalidation).
const requestTime = () => Date.now();

// Feed content lives on one row per story (see the digest_items _es columns
// migration) rather than a locale-paired row per Blog articles -- pick the
// Spanish text when present, fall back to English rather than showing blank.
function localize(item: FeedItem, locale: string) {
  const isEs = locale === 'es';
  return {
    headline: isEs ? item.headline_es ?? item.headline : item.headline,
    our_summary: isEs ? item.our_summary_es ?? item.our_summary : item.our_summary,
    editor_note: isEs ? item.editor_note_es ?? item.editor_note : item.editor_note,
    editor_take: isEs ? item.editor_take_es ?? item.editor_take : item.editor_take,
    stats: readFeaturedStats(item.stats).map((s) => ({
      value: s.value,
      label: isEs ? s.label_es ?? s.label : s.label,
      unit: isEs ? s.unit_es ?? s.unit : s.unit,
    })),
  };
}

const FEED_URLS = {
  en: `${SITE_URL}/feed/`,
  es: `${SITE_URL}/es/feed/`,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('feed');
  const canonical = locale === 'es' ? FEED_URLS.es : FEED_URLS.en;
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
    alternates: {
      canonical,
      languages: { ...FEED_URLS, 'x-default': FEED_URLS.en },
    },
    openGraph: openGraphFor(canonical),
  };
}

async function getItems(): Promise<FeedItem[]> {
  const supabase = createClient();
  const { data: issues } = await supabase
    .from('digest_issues')
    .select('id')
    .eq('series', 'newsletter')
    .eq('status', 'published');
  const issueIds = (issues ?? []).map((i) => i.id as string);
  if (issueIds.length === 0) return [];

  const { data } = await supabase
    .from('digest_items')
    .select(
      'id, slug, source_name, source_url, headline, headline_es, our_summary, our_summary_es, entity_tags, published_at, editor_note, editor_note_es, editor_take, editor_take_es, internal_link_slug, stats, hook_deliver'
    )
    .in('issue_id', issueIds)
    .order('published_at', { ascending: false });
  return (data ?? []) as FeedItem[];
}

// "2026-10-11" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (key: string) => new Date(`${key}T12:00:00Z`);

export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('feed');
  const tCrumbs = await getTranslations('articleDusk');
  const format = await getFormatter();
  const [items, beagleCounts] = await Promise.all([getItems(), getBeagleEntityCounts(createClient())]);
  const hookById = await loadHookDeliverMap(items, locale, hookDeliverFallbacks(t));
  const entityCounts = mergeEntityCounts(weeklyEntityCounts(items), beagleCounts);
  const feedUrl = locale === 'es' ? FEED_URLS.es : FEED_URLS.en;

  const now = requestTime();
  const todayKey = easternDateKey(new Date(now));
  const yesterdayKey = easternDateKey(new Date(now - DAY_MS));
  // Same 7-day window as the mention counts: these days get the full card treatment, older
  // days fold into the weekly archive (every story still linked, so nothing leaves the page).
  const weekStartKey = easternDateKey(new Date(now - 7 * DAY_MS));
  // The archive reaches back into previous seasons: dates outside the current year carry it.
  const shortDate = (key: string) =>
    format.dateTime(dayDate(key), {
      month: 'short',
      day: 'numeric',
      ...(key.slice(0, 4) !== todayKey.slice(0, 4) ? { year: 'numeric' as const } : {}),
    });
  const dayLabel = (key: string) =>
    key === todayKey
      ? t('today')
      : key === yesterdayKey
        ? t('yesterday')
        : format.dateTime(dayDate(key), { weekday: 'long', month: 'short', day: 'numeric' });

  const scored = items.map((item) => ({ item, text: localize(item, locale), score: significanceScore(item, entityCounts) }));
  type Scored = (typeof scored)[number];
  const maxScore = Math.max(1, ...scored.map((s) => s.score));
  const signal = (s: Scored) => ({ score: s.score, max: maxScore, title: t('scoreHint') });

  // Grouped by day (items already arrive published_at desc, so same-day items
  // are always adjacent -- a single pass groups them without re-sorting).
  const dayGroups: { key: string; items: Scored[] }[] = [];
  for (const s of scored) {
    const key = easternDateKey(new Date(s.item.published_at));
    const current = dayGroups[dayGroups.length - 1];
    if (current && current.key === key) current.items.push(s);
    else dayGroups.push({ key, items: [s] });
  }
  const recentDays = dayGroups.filter((g) => g.key >= weekStartKey);
  const olderDays = dayGroups.filter((g) => g.key < weekStartKey);
  const weekItems = recentDays.flatMap((g) => g.items);

  // Lead: the highest-significance story of the latest day.
  const latest = dayGroups[0];
  const lead = latest ? [...latest.items].sort((a, b) => b.score - a.score)[0] : null;

  const mentioned = Array.from(entityCounts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
  const weekSources = new Set(weekItems.map((s) => s.item.source_name)).size;
  const weekWithData = weekItems.filter((s) => s.text.stats.length > 0 || hookById.has(s.item.id)).length;

  const countByDay = new Map(dayGroups.map((g) => [g.key, g.items.length]));
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const key = easternDateKey(new Date(now - (13 - i) * DAY_MS));
    const count = countByDay.get(key) ?? 0;
    return { key, day: Number(key.slice(8)), count, title: t('perDayTip', { date: shortDate(key), count }) };
  });

  // Archive: older days by week (weeks start on Monday).
  const weeks: { key: string; items: Scored[] }[] = [];
  for (const g of olderDays) {
    const d = dayDate(g.key);
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS).toISOString().slice(0, 10);
    const current = weeks[weeks.length - 1];
    if (current && current.key === monday) current.items.push(...g.items);
    else weeks.push({ key: monday, items: [...g.items] });
  }

  const contextFor = (item: FeedItem) => {
    const hook = hookById.get(item.id);
    return hook ? <HookContext data={hook} t={t} /> : null;
  };
  const card = (s: Scored) => (
    <StoryCard
      key={s.item.id}
      link={{ slug: s.item.slug, sourceUrl: s.item.source_url }}
      meta={`${s.item.source_name} · ${shortDate(easternDateKey(new Date(s.item.published_at)))}`}
      headline={s.text.headline}
      summary={s.text.our_summary}
      signal={signal(s)}
      stat={s.text.stats[0] ?? null}
      context={contextFor(s.item)}
      readLabel={s.item.slug ? t('readBrief') : t('readOriginal')}
    />
  );
  const row = (s: Scored, withDate: boolean) => (
    <StoryRow
      key={s.item.id}
      link={{ slug: s.item.slug, sourceUrl: s.item.source_url }}
      source={withDate ? `${s.item.source_name} · ${shortDate(easternDateKey(new Date(s.item.published_at)))}` : s.item.source_name}
      headline={s.text.headline}
      signal={signal(s)}
    />
  );

  // Items with a slug get their own page (app/[locale]/(digest)/feed/[slug]/page.tsx) and
  // a real, independently indexable URL -- Google can rank and rich-snippet that story on
  // its own instead of only ever seeing it folded into this one aggregate page. Items not
  // yet backfilled with a slug fall back to the old same-page anchor.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('title'),
    url: feedUrl,
    itemListElement: items.map((item, i) => {
      const text = localize(item, locale);
      const itemUrl = item.slug ? `${feedUrl}${item.slug}/` : `${feedUrl}#item-${item.id}`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'NewsArticle',
          headline: text.headline,
          description: text.our_summary,
          datePublished: item.published_at,
          url: itemUrl,
          ...(item.slug ? {} : { mainEntityOfPage: feedUrl }),
          isBasedOn: item.source_url,
          author: { '@type': 'Person', name: 'Ismael Sandoval', url: `${SITE_URL}/about/` },
          publisher: {
            '@type': 'Organization',
            name: 'PaddockIntel',
            url: SITE_URL,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
          },
        },
      };
    }),
  };

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
      { '@type': 'ListItem', position: 2, name: t('title') },
    ],
  };

  const cardTitle = 'text-[17px] font-semibold m-0';
  const cardSub = 'text-[13px] text-[color:var(--dusk-muted)] mt-0.5 mb-0';
  const source = 'dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('title')}
          </nav>

          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              {latest && <p className="dusk-label m-0">{t('updated', { date: shortDate(latest.key) })}</p>}
              <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{t('title')}</h1>
              <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('description')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/about" className="dusk-chip hover:text-[color:var(--dusk-ink)]">
                <span className="dusk-chip-dot" aria-hidden="true" />
                {t('editedBy')}
              </Link>
              {weekItems.length > 0 && <span className="dusk-chip">{t('storiesWeek', { count: weekItems.length })}</span>}
              {weekSources > 0 && <span className="dusk-chip">{t('sourcesCount', { count: weekSources })}</span>}
            </div>
          </header>

          {items.length === 0 ? (
            <p className="dusk-card p-6 dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--dusk-muted)]">{t('noItems')}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {lead && (
                  <article className={`dusk-card dusk-feed-lead p-6 sm:p-8 flex flex-col gap-3.5 ${mentioned.length ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                    <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
                      {t('leadKicker', { day: dayLabel(latest.key), source: lead.item.source_name })}
                    </p>
                    <h2 className="dusk-display m-0 text-[clamp(1.7rem,3.2vw,2.6rem)] leading-[1.04] tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                      {lead.item.slug ? (
                        <Link href={`/feed/${lead.item.slug}`} className="hover:text-[color:var(--dusk-peach)]">{lead.text.headline}</Link>
                      ) : (
                        lead.text.headline
                      )}
                    </h2>
                    <p className="dusk-hero-dek m-0 text-[16.5px] leading-[1.55] max-w-[68ch]">{lead.text.our_summary}</p>
                    {lead.text.stats.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {lead.text.stats.slice(0, 2).map((s) => (
                          <div key={s.label} className="flex-[1_1_200px] rounded-2xl px-4 py-3.5 bg-[rgba(14,13,18,0.35)] border border-[rgba(255,255,255,0.1)]">
                            <p className="dusk-display tabular-nums text-[1.9rem] leading-none m-0">{s.value}</p>
                            <p className="dusk-mono uppercase text-[10.5px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] mt-2 mb-0">{s.label}</p>
                            {s.unit && <p className="text-[13px] text-[#E2CEC6] mt-1 mb-0">{s.unit}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!lead.text.stats.length && contextFor(lead.item)}
                    {lead.text.editor_take && (
                      <p className="m-0 pl-4 border-l-[3px] border-[color:var(--dusk-warm)] text-[15.5px] max-w-[70ch]">
                        <span className="block dusk-mono uppercase text-[10.5px] tracking-[0.1em] text-[color:var(--dusk-sunset)] mb-1">{t('editorsTake')}</span>
                        {lead.text.editor_take}
                      </p>
                    )}
                    {lead.item.slug ? (
                      <Link href={`/feed/${lead.item.slug}`} className="dusk-pill self-start text-[14.5px]">{t('readBrief')}</Link>
                    ) : (
                      <a href={lead.item.source_url} target="_blank" rel="noopener noreferrer" className="dusk-pill self-start text-[14.5px]">{t('readOriginal')}</a>
                    )}
                  </article>
                )}
                {mentioned.length > 0 && (
                  <section className="dusk-card p-5 sm:p-6 flex flex-col gap-3 lg:col-span-4" aria-labelledby="feed-press-title">
                    <div>
                      <h2 id="feed-press-title" className={cardTitle}>{t('pressTitle')}</h2>
                      <p className={cardSub}>{t('pressSub')}</p>
                    </div>
                    <PressBars rows={mentioned} ariaLabel={t('pressTitle')} />
                    <p className={`${source} mt-auto`}>{t('pressSource')}</p>
                  </section>
                )}
                {weekItems.length > 0 && (
                  <section className="dusk-card p-5 sm:p-6 flex flex-col gap-3 lg:col-span-4" aria-labelledby="feed-week-title">
                    <h2 id="feed-week-title" className="dusk-label m-0 font-normal">{t('weekTitle')}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {[
                        { v: weekItems.length, l: t('weekStories'), warm: false },
                        { v: weekSources, l: t('weekSources'), warm: false },
                        { v: weekWithData, l: t('weekData'), warm: true },
                      ].map((k) => (
                        <div key={k.l}>
                          <p className={`dusk-display tabular-nums text-[2.4rem] leading-none tracking-[-0.03em] m-0 ${k.warm ? 'text-[color:var(--dusk-sunset)]' : ''}`}>
                            {format.number(k.v)}
                          </p>
                          <p className={`${source} mt-1.5`}>{k.l}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section className={`dusk-card p-5 sm:p-6 flex flex-col gap-3 ${weekItems.length ? 'lg:col-span-8' : 'lg:col-span-12'}`} aria-labelledby="feed-days-title">
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div>
                      <h2 id="feed-days-title" className={cardTitle}>{t('perDayTitle')}</h2>
                      <p className={cardSub}>{t('perDaySub')}</p>
                    </div>
                    {latest && latest.key >= last14[0].key && (
                      <span className="dusk-delta dusk-delta-warm">{t('perDayBadge', { count: latest.items.length, date: shortDate(latest.key) })}</span>
                    )}
                  </div>
                  <DayBars days={last14} highlight={latest?.key ?? ''} ariaLabel={t('perDayAria')} />
                </section>
              </div>

              {recentDays.map((g) => {
                const pool = g.items.filter((s) => s !== lead);
                if (!pool.length) return null;
                const top = [...pool].sort((a, b) => b.score - a.score).slice(0, 3);
                const rest = pool.filter((s) => !top.includes(s));
                return (
                  <section key={g.key} aria-labelledby={`feed-day-${g.key}`} className="flex flex-col gap-4 mt-2">
                    <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--dusk-line)]">
                      <h2 id={`feed-day-${g.key}`} className="dusk-display m-0 text-[1.35rem] leading-tight">{dayLabel(g.key)}</h2>
                      <span className="dusk-label">{t('storyCount', { count: g.items.length })}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{top.map(card)}</div>
                    {rest.length > 0 && <div className="dusk-card px-5 sm:px-[22px] py-1.5">{rest.map((s) => row(s, false))}</div>}
                  </section>
                );
              })}

              {weeks.length > 0 && (
                <section className="dusk-card p-5 sm:p-6 flex flex-col gap-1 mt-2" aria-labelledby="feed-earlier-title">
                  <h2 id="feed-earlier-title" className="dusk-display m-0 text-[1.35rem]">{t('earlier')}</h2>
                  <p className={cardSub}>
                    {t('earlierSub', { stories: weeks.reduce((n, w) => n + w.items.length, 0), weeks: weeks.length })}
                  </p>
                  {weeks.map((w, i) => (
                    <details key={w.key} className="dusk-faq mt-1" open={i === 0}>
                      <summary className="flex justify-between gap-3 py-3.5 border-t border-[color:var(--dusk-line)] font-semibold">
                        {t('weekOf', { date: shortDate(w.key) })}
                        <span className="ml-auto dusk-mono text-[11px] font-normal text-[color:var(--dusk-muted)]">{t('storyCount', { count: w.items.length })}</span>
                      </summary>
                      <div>{w.items.map((s) => row(s, true))}</div>
                    </details>
                  ))}
                </section>
              )}
            </>
          )}

          <NewsletterBand className="mt-2" />
        </div>
      </main>
    </>
  );
}

type FeedT = Awaited<ReturnType<typeof getTranslations>>;

function hookDeliverFallbacks(t: FeedT): HookDeliverFallbacks {
  return {
    h2h: (year) => t('hookDeliver.h2h', { year }),
    winsAtCircuit: t('hookDeliver.winsAtCircuit'),
    constructorSeasonPoints: t('hookDeliver.constructorPoints'),
    constructorCareer: (metric) => {
      if (metric === 'wins') return t('hookDeliver.constructorWins');
      if (metric === 'podiums') return t('hookDeliver.constructorPodiums');
      if (metric === 'races') return t('hookDeliver.constructorRaces');
      if (metric === 'championships') return t('hookDeliver.constructorChampionships');
      return t('hookDeliver.constructorCareerPoints');
    },
  };
}

function HookContext({ data, t }: { data: ResolvedHookDeliver; t: FeedT }) {
  return (
    <HubContext
      data={data}
      contextLabel={t('hookDeliver.context')}
      sourceLabel={t('hookDeliver.source', { tables: data.sources.join(' · ') })}
      hubLabel={t('hookDeliver.hub', { name: data.hub.name })}
    />
  );
}
