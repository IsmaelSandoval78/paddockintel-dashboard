import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { weeklyEntityCounts, significanceScore } from '@/lib/entityMentions';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import { Link } from '@/lib/i18n/navigation';
import HookDeliverBlock from '@/components/digest/HookDeliverBlock';
import {
  loadHookDeliverMap,
  readFeaturedStats,
  type HookDeliverFallbacks,
  type ResolvedHookDeliver,
} from '@/lib/hookDeliver';

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
    featuredStat: (() => {
      const stat = readFeaturedStats(item.stats)[0];
      return stat
        ? { value: stat.value, label: isEs ? stat.label_es ?? stat.label : stat.label }
        : null;
    })(),
  };
}

const FEED_URLS = {
  en: 'https://paddockintel.com/feed/',
  es: 'https://paddockintel.com/es/feed/',
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

function dayLabel(
  date: Date,
  t: Awaited<ReturnType<typeof getTranslations>>,
  format: Awaited<ReturnType<typeof getFormatter>>
): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');
  return format.dateTime(date, { month: 'short', day: 'numeric' });
}

function mostMentioned(counts: Map<string, number>): { entity: string; count: number }[] {
  return Array.from(counts.entries())
    .map(([entity, count]) => ({ entity, count }))
    .filter((e) => e.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('feed');
  const format = await getFormatter();
  const [items, beagleCounts] = await Promise.all([getItems(), getBeagleEntityCounts(createClient())]);
  const hookById = await loadHookDeliverMap(items, locale, hookDeliverFallbacks(t));
  const entityCounts = mergeEntityCounts(weeklyEntityCounts(items), beagleCounts);
  const mentioned = mostMentioned(entityCounts);
  const feedUrl = locale === 'es' ? FEED_URLS.es : FEED_URLS.en;

  // Grouped by day (items already arrive published_at desc, so same-day items
  // are always adjacent -- a single pass groups them without re-sorting).
  // Within each day, the 3 highest-significance stories keep full card
  // treatment; the rest of that day falls to a dense list row. Replaces the
  // old whole-page lead+runner-up pick, which read fine at a handful of
  // stories but turned into a wall of identical cards once the feed grew.
  const dayGroups: { key: string; date: Date; items: FeedItem[] }[] = [];
  for (const item of items) {
    const date = new Date(item.published_at);
    const key = date.toISOString().slice(0, 10);
    const current = dayGroups[dayGroups.length - 1];
    if (current && current.key === key) current.items.push(item);
    else dayGroups.push({ key, date, items: [item] });
  }

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
          author: { '@type': 'Person', name: 'Ismael Sandoval', url: 'https://paddockintel.com/about' },
          publisher: {
            '@type': 'Organization',
            name: 'PaddockIntel',
            url: 'https://paddockintel.com',
            logo: { '@type': 'ImageObject', url: 'https://paddockintel.com/opengraph-image' },
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
        item: locale === 'en' ? 'https://paddockintel.com/' : `https://paddockintel.com/${locale}/`,
      },
      { '@type': 'ListItem', position: 2, name: t('title') },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <main className="bg-bg min-h-screen">
      <div className="h-12 border-b border-border-subtle flex items-center px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2">
          {t('kicker')} · {items.length}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
        <h1 className="font-sans font-bold text-text-1 tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 'clamp(1.75rem, 4.2vw, 2.5rem)' }}>
          {t('title')}
        </h1>
        <p className="font-sans text-text-2 leading-relaxed max-w-lg mt-3">{t('description')}</p>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-4">
          {t('editedBy')}
          <span className="text-text-3"> · </span>
          <Link href="/about" className="hover:text-accent transition-colors duration-150">
            {t('about')}
          </Link>
        </p>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mt-4">{t('scoreHint')}</p>

        {mentioned.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mb-3">
              {t('mostMentioned')}
            </p>
            <div className="flex flex-wrap gap-2">
              {mentioned.map(({ entity, count }) => (
                <span
                  key={entity}
                  className="bg-accent-dim rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-text-1"
                >
                  {entity} <span className="text-accent font-semibold">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-5 pb-16">
        {items.length === 0 ? (
          <p className="py-12 font-mono text-[11px] text-text-3 uppercase tracking-[0.1em] border-t border-border-subtle">
            {t('noItems')}
          </p>
        ) : (
          <>
            {dayGroups.map((group, i) => {
              const scored = group.items.map((item) => ({ item, score: significanceScore(item, entityCounts) }));
              const topCards = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
              const topIds = new Set(topCards.map((s) => s.item.id));
              const restRows = scored.filter((s) => !topIds.has(s.item.id));

              return (
                <div key={group.key} className={`${i === 0 ? 'border-t border-border-subtle pt-6' : 'mt-8 lg:mt-10'}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-3 pb-2 border-b border-border-subtle">
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                      {dayLabel(group.date, t, format)}
                    </p>
                    <p className="font-mono text-[10px] text-text-3">{t('storyCount', { count: group.items.length })}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                    {topCards.map(({ item, score }) => (
                      <FeedCard
                        key={item.id}
                        item={item}
                        text={localize(item, locale)}
                        score={score}
                        format={format}
                        t={t}
                        hook={hookById.get(item.id) ?? null}
                      />
                    ))}
                  </div>

                  {restRows.length > 0 && (
                    <div className="flex flex-col divide-y divide-border-subtle mt-3">
                      {restRows.map(({ item, score }) => (
                        <FeedListRow
                          key={item.id}
                          item={item}
                          text={localize(item, locale)}
                          score={score}
                          format={format}
                          t={t}
                          hook={hookById.get(item.id) ?? null}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </main>
    </>
  );
}

type LocalizedText = ReturnType<typeof localize>;
type Formatter = Awaited<ReturnType<typeof getFormatter>>;
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

function HookDeliverSlot({ data, t }: { data: ResolvedHookDeliver; t: FeedT }) {
  return (
    <HookDeliverBlock
      data={data}
      variant="compact"
      contextLabel={t('hookDeliver.context')}
      sourceLabel={t('hookDeliver.source', { tables: data.sources.join(' · ') })}
      hubLabel={t('hookDeliver.hub', { name: data.hub.name })}
    />
  );
}

function FeedCard({
  item,
  text,
  score,
  format,
  t,
  hook,
}: {
  item: FeedItem;
  text: LocalizedText;
  score: number;
  format: Formatter;
  t: FeedT;
  hook: ResolvedHookDeliver | null;
}) {
  const headlineEl = (
    <span className="block font-sans font-semibold text-text-1 leading-snug line-clamp-2" style={{ fontSize: '0.9375rem' }}>
      {text.headline}
    </span>
  );

  return (
    <article className="soft-card soft-card-interactive h-full flex flex-col p-4 lg:p-5 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 truncate">{item.source_name}</span>
          <span className="text-text-3 shrink-0">·</span>
          <span className="font-mono text-[10px] text-text-3 shrink-0">
            {format.dateTime(new Date(item.published_at), { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <span
          className="font-mono text-[11px] tabular-nums shrink-0 font-medium"
          style={{ color: score > 1 ? 'var(--accent)' : 'var(--text-3)' }}
          title={t('scoreHint')}
        >
          {score}
        </span>
      </div>

      {item.slug ? (
        <Link href={`/feed/${item.slug}`} className="mb-2 hover:text-accent transition-colors duration-150">
          {headlineEl}
        </Link>
      ) : (
        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mb-2 hover:text-accent transition-colors duration-150">
          {headlineEl}
        </a>
      )}

      <p className="font-sans text-text-2 leading-relaxed mt-1.5 line-clamp-2" style={{ fontSize: '0.8125rem', lineHeight: '1.6' }}>
        {text.our_summary}
      </p>

      {hook && <HookDeliverSlot data={hook} t={t} />}

      <div className="mt-auto pt-3 flex items-end justify-between gap-3">
        {text.featuredStat && !hook ? (
          <div className="min-w-0">
            <p className="font-sans font-extrabold tabular-nums text-accent-2 leading-none tracking-[-0.01em]" style={{ fontSize: '1.375rem' }}>
              {text.featuredStat.value}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1 truncate">{text.featuredStat.label}</p>
          </div>
        ) : (
          <span />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3 shrink-0">
          {item.slug ? t('readBrief') : t('readOriginal')}
        </span>
      </div>
    </article>
  );
}

// Dense fallback once a day's story count passes 3 -- a text row (source ·
// headline · score · date) instead of full card chrome, so a busy day
// doesn't turn into a wall of identical cards.
function FeedListRow({
  item,
  text,
  score,
  format,
  t,
  hook,
}: {
  item: FeedItem;
  text: LocalizedText;
  score: number;
  format: Formatter;
  t: FeedT;
  hook: ResolvedHookDeliver | null;
}) {
  const headlineEl = (
    <span className="flex-1 min-w-0 font-sans font-semibold text-text-1 truncate" style={{ fontSize: '0.875rem' }}>
      {text.headline}
    </span>
  );

  return (
    <div className="min-w-0 py-3">
    <div className="flex items-center gap-4 min-w-0">
      <span className="hidden sm:block w-32 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 truncate">
        {item.source_name}
      </span>
      {item.slug ? (
        <Link href={`/feed/${item.slug}`} className="flex-1 min-w-0 flex hover:text-accent transition-colors duration-150">
          {headlineEl}
        </Link>
      ) : (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 flex hover:text-accent transition-colors duration-150"
          title={t('readOriginal')}
        >
          {headlineEl}
        </a>
      )}
      <span
        className="font-mono text-[11px] tabular-nums shrink-0 font-medium"
        style={{ color: score > 1 ? 'var(--accent)' : 'var(--text-3)' }}
        title={t('scoreHint')}
      >
        {score}
      </span>
      <span className="hidden md:block shrink-0 font-mono text-[10px] text-text-3">
        {format.dateTime(new Date(item.published_at), { month: 'short', day: 'numeric' })}
      </span>
    </div>
    {hook && (
      <div className="min-w-0 sm:pl-36">
        <HookDeliverSlot data={hook} t={t} />
      </div>
    )}
    </div>
  );
}
