import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { weeklyEntityCounts, significanceScore } from '@/lib/entityMentions';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import { Link } from '@/lib/i18n/navigation';

export const revalidate = 3600;

type Stat = { value: string; label: string; label_es?: string | null; unit?: string | null; unit_es?: string | null };

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
  stats: Stat[] | null;
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
    featuredStat: item.stats?.[0]
      ? { value: item.stats[0].value, label: isEs ? item.stats[0].label_es ?? item.stats[0].label : item.stats[0].label }
      : null,
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
      'id, slug, source_name, source_url, headline, headline_es, our_summary, our_summary_es, entity_tags, published_at, editor_note, editor_note_es, editor_take, editor_take_es, internal_link_slug, stats'
    )
    .in('issue_id', issueIds)
    .order('published_at', { ascending: false });
  return (data ?? []) as FeedItem[];
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
  const entityCounts = mergeEntityCounts(weeklyEntityCounts(items), beagleCounts);
  const mentioned = mostMentioned(entityCounts);
  const feedUrl = locale === 'es' ? FEED_URLS.es : FEED_URLS.en;

  // Lead + runner-up: the two highest-significance stories (by shared-entity score,
  // tie-broken by recency since `items` is already published_at desc). Everything
  // else keeps its original recency order in the grid below.
  const byScoreDesc = [...items].sort((a, b) => {
    const diff = significanceScore(b, entityCounts) - significanceScore(a, entityCounts);
    if (diff !== 0) return diff;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
  const lead = byScoreDesc[0] ?? null;
  const runnerUp = byScoreDesc[1] ?? null;
  const featuredIds = new Set([lead?.id, runnerUp?.id].filter(Boolean));
  const rest = items.filter((item) => !featuredIds.has(item.id));

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
      <div className="h-12 border-b border-border flex items-center px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2">
          {t('kicker')} · {items.length}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
        <h1
          className="uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
        >
          {t('title')}
        </h1>
        <p className="font-prose text-text-2 leading-relaxed max-w-lg mt-3">{t('description')}</p>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-4">
          {t('editedBy')}
          <span className="text-text-3"> · </span>
          <Link href="/about" className="hover:text-terracotta transition-colors duration-150">
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
                  className="font-mono text-[11px] uppercase tracking-[0.04em] border border-border-subtle rounded-sm px-2.5 py-1 text-text-1"
                >
                  {entity} <span style={{ color: 'var(--terracotta)' }}>×{count}</span>
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
            {/* Lead + runner-up row -- the two highest-significance stories get the
                visual weight; picked by score (see significanceScore), tie-broken by
                recency. Grid rows below stay uniform height via line-clamp, not
                free-floating masonry, so reading order never gets ambiguous. */}
            {lead && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 border-t border-border-subtle pt-6 mb-4 lg:mb-5">
                <div className="lg:col-span-2">
                  <FeedCard item={lead} text={localize(lead, locale)} score={significanceScore(lead, entityCounts)} format={format} t={t} variant="lead" />
                </div>
                {runnerUp && (
                  <div className="lg:col-span-1">
                    <FeedCard item={runnerUp} text={localize(runnerUp, locale)} score={significanceScore(runnerUp, entityCounts)} format={format} t={t} variant="runnerUp" />
                  </div>
                )}
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {rest.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    text={localize(item, locale)}
                    score={significanceScore(item, entityCounts)}
                    format={format}
                    t={t}
                    variant="grid"
                  />
                ))}
              </div>
            )}
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

function FeedCard({
  item,
  text,
  score,
  format,
  t,
  variant,
}: {
  item: FeedItem;
  text: LocalizedText;
  score: number;
  format: Formatter;
  t: FeedT;
  variant: 'lead' | 'runnerUp' | 'grid';
}) {
  const headlineClamp = variant === 'lead' ? '' : 'line-clamp-2';
  const summaryClamp = variant === 'lead' ? 'line-clamp-4' : variant === 'runnerUp' ? 'line-clamp-3' : 'line-clamp-2';
  const headlineSize = variant === 'lead' ? 'clamp(1.25rem, 2.4vw, 1.625rem)' : '0.9375rem';

  const headlineEl = (
    <span className={`block font-prose font-semibold text-text-1 leading-snug ${headlineClamp}`} style={{ fontSize: headlineSize }}>
      {text.headline}
    </span>
  );

  return (
    <article
      className={`h-full flex flex-col border rounded-sm p-4 lg:p-5 transition-colors duration-150 ${
        variant === 'lead' ? 'border-border bg-surface-raised' : 'border-border-subtle hover:border-terracotta'
      }`}
    >
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
          style={{ color: score > 1 ? 'var(--terracotta)' : 'var(--text-3)' }}
          title={t('scoreHint')}
        >
          {score}
        </span>
      </div>

      {variant === 'lead' && (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] mb-1.5" style={{ color: 'var(--terracotta)' }}>
          {t('leadLabel')}
        </p>
      )}

      {item.slug ? (
        <Link href={`/feed/${item.slug}`} className="mb-2 hover:text-terracotta transition-colors duration-150">
          {headlineEl}
        </Link>
      ) : (
        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mb-2 hover:text-terracotta transition-colors duration-150">
          {headlineEl}
        </a>
      )}

      <p
        className={`text-text-2 leading-relaxed mt-1.5 ${summaryClamp}`}
        style={{ fontFamily: 'var(--pi-sans)', fontSize: '0.8125rem', lineHeight: '1.6' }}
      >
        {text.our_summary}
      </p>

      <div className="mt-auto pt-3 flex items-end justify-between gap-3">
        {text.featuredStat ? (
          <div className="min-w-0">
            <p className="font-display tabular-nums text-text-1 leading-none" style={{ fontSize: variant === 'lead' ? '2rem' : '1.375rem' }}>
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
