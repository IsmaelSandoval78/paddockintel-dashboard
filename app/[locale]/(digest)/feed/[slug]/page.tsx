import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import HubContext from '@/components/feed-dusk/HubContext';
import PressBars from '@/components/feed-dusk/PressBars';
import { easternDateKey } from '@/lib/dates';
import { weeklyEntityCounts } from '@/lib/entityMentions';
import { getBeagleEntityCounts, mergeEntityCounts } from '@/lib/beagleCounts';
import {
  readFeaturedStats,
  resolveHookDeliver,
  hookDeliverSpecForItem,
  type HookDeliverFallbacks,
} from '@/lib/hookDeliver';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../../../(blog)/dusk-font';
import '../../../(blog)/dusk.css';

export const revalidate = 3600;

type Faq = { q: string; a: string; q_es?: string | null; a_es?: string | null };

type FeedItem = {
  id: string;
  slug: string;
  source_name: string;
  source_url: string;
  headline: string;
  headline_es: string | null;
  our_summary: string;
  our_summary_es: string | null;
  entity_tags: string[];
  published_at: string;
  created_at: string;
  editor_note: string | null;
  editor_note_es: string | null;
  editor_take: string | null;
  editor_take_es: string | null;
  internal_link_slug: string | null;
  stats: unknown;
  hook_deliver: unknown;
  faq: Faq[] | null;
  meta_description: string | null;
  meta_description_es: string | null;
  digest_issues: { slug: string };
};

type NearbyItem = {
  id: string;
  slug: string | null;
  source_name: string;
  source_url: string;
  headline: string;
  headline_es: string | null;
  entity_tags: string[];
  published_at: string;
};

type PageParams = Promise<{ locale: string; slug: string }>;

const MAGAZINE_BASE = SITE_URL;
const DAY_MS = 86_400_000;
// Request time for the day windows below (a server component renders once per revalidation).
const requestTime = () => Date.now();

function localeUrl(locale: string, path: string): string {
  return locale === 'en' ? `${MAGAZINE_BASE}${path}` : `${MAGAZINE_BASE}/${locale}${path}`;
}

// The item's scorecard image (app/api/og/feed/[locale]/[slug]): 16:9 for og/twitter, and the three
// ratios Google lists for a NewsArticle image.
const CARD_RATIOS = ['16x9', '4x3', '1x1'] as const;
function cardUrl(locale: string, slug: string, ratio: (typeof CARD_RATIOS)[number] = '16x9'): string {
  const base = `${MAGAZINE_BASE}/api/og/feed/${locale}/${slug}`;
  return ratio === '16x9' ? base : `${base}?ratio=${ratio}`;
}

// Same one-row-two-locale-columns shape as the /feed index page -- see
// 20260915180000_digest_items_es_columns.sql. Numbers in `stats` don't get a
// locale switch (EDITORIAL.md: numbers don't translate), only their labels do.
function localize(item: FeedItem, locale: string) {
  const isEs = locale === 'es';
  return {
    headline: isEs ? item.headline_es ?? item.headline : item.headline,
    our_summary: isEs ? item.our_summary_es ?? item.our_summary : item.our_summary,
    editor_note: isEs ? item.editor_note_es ?? item.editor_note : item.editor_note,
    editor_take: isEs ? item.editor_take_es ?? item.editor_take : item.editor_take,
    meta_description: isEs ? item.meta_description_es ?? item.meta_description : item.meta_description,
    stats: readFeaturedStats(item.stats).map((s) => ({
      value: s.value,
      label: isEs ? s.label_es ?? s.label : s.label,
      unit: isEs ? s.unit_es ?? s.unit : s.unit,
    })),
    faq: (item.faq ?? []).map((f) => ({
      q: isEs ? f.q_es ?? f.q : f.q,
      a: isEs ? f.a_es ?? f.a : f.a,
    })),
  };
}

async function getItem(slug: string): Promise<FeedItem | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_items')
    .select(
      `id, slug, source_name, source_url, headline, headline_es, our_summary, our_summary_es,
       entity_tags, published_at, created_at, editor_note, editor_note_es, editor_take, editor_take_es,
       internal_link_slug, stats, hook_deliver, faq, meta_description, meta_description_es,
       digest_issues!inner(status, series, slug)`
    )
    .eq('slug', slug)
    .eq('digest_issues.status', 'published')
    .eq('digest_issues.series', 'newsletter')
    .single();
  return data as FeedItem | null;
}

// internal_link_slug holds the EN article's slug, but ES/PT editions have their own slugs, so the
// link is resolved through translation_group_id: this locale's edition when there is one, else the
// EN article. A target with a path ("glossary/...", "feed/...") is the same slug in every locale.
// No published EN article → no link, rather than a 404.
async function getBriefLink(target: string, locale: string): Promise<{ href: string; en: boolean } | null> {
  if (target.includes('/')) return { href: `/${target}`, en: false };
  const supabase = createClient();
  const { data: en } = await supabase
    .from('articles')
    .select('translation_group_id')
    .eq('slug', target)
    .eq('locale', 'en')
    .eq('status', 'published')
    .maybeSingle();
  if (!en) return null;
  if (locale !== 'en' && en.translation_group_id) {
    const { data: local } = await supabase
      .from('articles')
      .select('slug')
      .eq('translation_group_id', en.translation_group_id)
      .eq('locale', locale)
      .eq('status', 'published')
      .maybeSingle();
    if (local) return { href: `/${local.slug}`, en: false };
  }
  return { href: `/${target}`, en: locale !== 'en' };
}

// Published Feed items from the earlier of "a week ago" and "two days before this story": enough
// for this week's mention counts and for the other stories of the same editorial day.
async function getNearby(publishedAt: string): Promise<NearbyItem[]> {
  const supabase = createClient();
  const from = new Date(Math.min(Date.now() - 7 * DAY_MS, new Date(publishedAt).getTime() - 2 * DAY_MS)).toISOString();
  const { data } = await supabase
    .from('digest_items')
    .select('id, slug, source_name, source_url, headline, headline_es, entity_tags, published_at, digest_issues!inner(status, series)')
    .gte('published_at', from)
    .eq('digest_issues.status', 'published')
    .eq('digest_issues.series', 'newsletter')
    .order('published_at', { ascending: false });
  return (data ?? []) as unknown as NearbyItem[];
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getItem(slug);
  if (!item) {
    const t = await getTranslations({ locale, namespace: 'notFound' });
    return { title: `${t('label')} — PaddockIntel`, robots: { index: false, follow: true } };
  }
  const text = localize(item, locale);
  const canonical = localeUrl(locale, `/feed/${slug}/`);
  return {
    title: `${text.headline} — PaddockIntel`,
    description: text.meta_description ?? text.our_summary.slice(0, 145),
    alternates: {
      canonical,
      languages: {
        en: localeUrl('en', `/feed/${slug}/`),
        es: localeUrl('es', `/feed/${slug}/`),
        'x-default': localeUrl('en', `/feed/${slug}/`),
      },
    },
    openGraph: { url: canonical, images: [{ url: cardUrl(locale, slug), width: 1200, height: 675, alt: text.headline }] },
    twitter: { card: 'summary_large_image', images: [cardUrl(locale, slug)] },
  };
}

export default async function FeedItemPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const item = await getItem(slug);
  if (!item) notFound();

  const t = await getTranslations('feed');
  const tArticle = await getTranslations('articleDusk');
  const format = await getFormatter();
  const text = localize(item, locale);

  const now = requestTime();
  const itemDayKey = easternDateKey(new Date(item.published_at));
  const todayKey = easternDateKey(new Date(now));
  const yesterdayKey = easternDateKey(new Date(now - DAY_MS));
  // Mention counts only cover the last 7 days, so they're shown for this week's stories only.
  const inCountWindow = itemDayKey >= easternDateKey(new Date(now - 7 * DAY_MS));

  const hookSpec = hookDeliverSpecForItem(item);
  const [hook, nearby, beagleCounts, briefLink] = await Promise.all([
    hookSpec ? resolveHookDeliver(hookSpec, locale, hookDeliverFallbacks(t)) : Promise.resolve(null),
    getNearby(item.published_at),
    inCountWindow ? getBeagleEntityCounts(createClient()) : Promise.resolve(new Map<string, number>()),
    item.internal_link_slug ? getBriefLink(item.internal_link_slug, locale) : Promise.resolve(null),
  ]);
  const counts = inCountWindow ? mergeEntityCounts(weeklyEntityCounts(nearby), beagleCounts) : new Map<string, number>();
  const whoRows = item.entity_tags
    .map((name) => ({ name, count: counts.get(name) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const sameDay = nearby
    .filter((n) => n.id !== item.id && easternDateKey(new Date(n.published_at)) === itemDayKey)
    .slice(0, 5);

  const dayDate = new Date(`${itemDayKey}T12:00:00Z`);
  const shortDate = format.dateTime(dayDate, {
    month: 'short',
    day: 'numeric',
    ...(itemDayKey.slice(0, 4) !== todayKey.slice(0, 4) ? { year: 'numeric' as const } : {}),
  });
  const dayLabel = itemDayKey === todayKey ? t('today') : itemDayKey === yesterdayKey ? t('yesterday') : shortDate;
  const pageUrl = localeUrl(locale, `/feed/${slug}/`);
  const issueVol = item.digest_issues.slug.match(/vol-(\d+)/i)?.[1]?.padStart(2, '0') ?? null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: text.headline,
    description: text.meta_description ?? text.our_summary,
    datePublished: item.published_at,
    // Re-ingesting an issue rewrites its rows, so created_at is the item's last edit.
    dateModified: item.created_at > item.published_at ? item.created_at : item.published_at,
    image: CARD_RATIOS.map((r) => cardUrl(locale, slug, r)),
    url: pageUrl,
    isBasedOn: item.source_url,
    author: { '@type': 'Person', name: 'Ismael Sandoval', url: `${MAGAZINE_BASE}/about/` },
    publisher: {
      '@type': 'Organization',
      name: 'PaddockIntel',
      url: MAGAZINE_BASE,
      logo: { '@type': 'ImageObject', url: `${MAGAZINE_BASE}/og-image.png` },
    },
  };

  const faqJsonLd =
    text.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: text.faq.map((f) => ({
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
      { '@type': 'ListItem', position: 1, name: 'Home', item: locale === 'en' ? `${MAGAZINE_BASE}/` : `${MAGAZINE_BASE}/${locale}/` },
      { '@type': 'ListItem', position: 2, name: t('title'), item: localeUrl(locale, '/feed/') },
      { '@type': 'ListItem', position: 3, name: text.headline },
    ],
  };

  const prose = 'font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-[1.1em]';
  const sheetH2 = 'dusk-display text-[clamp(1.25rem,1.9vw,1.5rem)] leading-tight tracking-[-0.01em] mt-8 mb-3 first:mt-0';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={tArticle('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {' / '}
            <Link href="/feed" className="hover:text-[color:var(--dusk-ink)]">{t('title')}</Link>
            {` / ${shortDate}`}
          </nav>

          {/* Cover */}
          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
              {t('itemKicker', { day: dayLabel, source: item.source_name })}
            </p>
            <h1 className="dusk-display m-0 text-[clamp(1.9rem,4.2vw,3.2rem)] leading-[1.04] tracking-[-0.02em] max-w-[24ch] text-balance [overflow-wrap:anywhere]">
              {text.headline}
            </h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{text.our_summary}</p>
            {item.entity_tags.length > 0 && (
              <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                {item.entity_tags.map((tag) => (
                  <li key={tag} className="px-3 py-1 rounded-full text-[12.5px] text-[color:var(--dusk-peach)] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)]">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
              <Link href="/about" className="hover:text-[color:var(--dusk-peach)]">{t('editedBy')}</Link>
              <time dateTime={item.published_at}>{format.dateTime(dayDate, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-[color:var(--dusk-peach)] hover:underline">
                {t('originallyReportedBy', { source: item.source_name })} ↗
              </a>
              <ShareButton url={pageUrl} title={text.headline} />
            </div>
          </header>

          {/* The numbers */}
          {text.stats.length > 0 && (
            <section aria-label={t('itemPage.theNumbers')} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {text.stats.map((stat) => (
                <div key={stat.label} className="dusk-card p-5 sm:p-6 flex flex-col gap-2.5">
                  <p className="dusk-display tabular-nums text-[2.5rem] leading-none tracking-[-0.03em] m-0">{stat.value}</p>
                  <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] m-0">{stat.label}</p>
                  {stat.unit && <p className="text-[13.5px] text-[color:var(--dusk-ink-2)] m-0">{stat.unit}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Reading sheet + rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
              <div className="max-w-[64ch] mx-auto">
                {hook && (
                  <div className="dusk-island dusk-card p-4 mb-8">
                    <HubContext
                      data={hook}
                      contextLabel={t('hookDeliver.context')}
                      sourceLabel={t('hookDeliver.source', { tables: hook.sources.join(' · ') })}
                      hubLabel={t('hookDeliver.hub', { name: hook.hub.name })}
                    />
                  </div>
                )}

                {text.editor_note && (
                  <>
                    <h2 className={sheetH2}>{t('dataAdds')}</h2>
                    <p className={prose}>{text.editor_note}</p>
                  </>
                )}

                {text.editor_take && (
                  <div className="my-8 rounded-2xl px-5 py-5 sm:px-6 bg-[color:var(--accent-dim)] border-l-4 border-[color:var(--accent)] text-[17px] leading-[1.55]">
                    <span className="block dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--accent)] mb-1.5">{t('editorsTake')}</span>
                    {text.editor_take}
                  </div>
                )}

                {briefLink &&
                  (briefLink.en ? (
                    // EN fallback from another locale: a plain link to the unprefixed EN URL (next-intl's
                    // Link with locale="en" renders /en/..., which 307s).
                    <a href={`${briefLink.href}/`} hrefLang="en" className="inline-block dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--accent)] hover:underline mb-6">
                      {t('ourBrief')}
                    </a>
                  ) : (
                    <Link href={briefLink.href} className="inline-block dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--accent)] hover:underline mb-6">
                      {t('ourBrief')}
                    </Link>
                  ))}

                {/* The issue this story ran in: the Weekly pages are otherwise linked only from /weekly/,
                    and Search Console (2026-10-16) had 80 of 81 of them unindexed. */}
                {issueVol && (
                  <Link
                    href={`/weekly/${item.digest_issues.slug}`}
                    className="block w-fit dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--accent)] hover:underline mb-6"
                  >
                    {t('itemPage.inIssue', { n: issueVol })}
                  </Link>
                )}

                {text.faq.length > 0 && (
                  <section aria-labelledby="feed-faq-title">
                    <h2 id="feed-faq-title" className={sheetH2}>{t('faqTitle')}</h2>
                    {text.faq.map((faq, i) => (
                      <details key={i} className="dusk-faq border-t border-[color:var(--border)]">
                        <summary className="flex justify-between gap-4 py-3.5 font-semibold text-[16px]">{faq.q}</summary>
                        <p className="m-0 mb-3.5 text-[16px] leading-[1.6] text-[color:var(--text-2)]">{faq.a}</p>
                      </details>
                    ))}
                  </section>
                )}

                <div className="mt-8 rounded-2xl px-5 py-4 bg-[color:var(--surface)] border border-[color:var(--border)] flex flex-wrap items-center justify-between gap-3 text-[15px]">
                  <span>{t('originallyReportedBy', { source: item.source_name })}</span>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[color:var(--accent)] hover:underline">
                    {t('readOriginal')}
                  </a>
                </div>

                <p className="mt-10 pt-6 border-t border-[color:var(--border-subtle)] font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-3)]">
                  {tArticle('writtenBy')}{' '}
                  <Link href="/about" className="text-[color:var(--text-1)] hover:text-[color:var(--accent)]">Ismael Sandoval</Link>
                  {' '}· PaddockIntel
                </p>
              </div>
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              {whoRows.length > 0 && (
                <section className="dusk-card p-5 flex flex-col gap-3" aria-labelledby="feed-who-title">
                  <div>
                    <h2 id="feed-who-title" className="dusk-label m-0 font-normal">{t('whoTitle')}</h2>
                    <p className="text-[13px] text-[color:var(--dusk-muted)] mt-1 mb-0">{t('whoSub')}</p>
                  </div>
                  <PressBars rows={whoRows} ariaLabel={t('whoTitle')} />
                </section>
              )}
              {sameDay.length > 0 && (
                <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="feed-more-title">
                  <h2 id="feed-more-title" className="dusk-label m-0 font-normal">{t('moreFrom', { date: shortDate })}</h2>
                  <ul className="m-0 p-0 list-none">
                    {sameDay.map((n) => {
                      const headline = locale === 'es' ? n.headline_es ?? n.headline : n.headline;
                      const inner = (
                        <>
                          {headline}
                          <small className="block dusk-mono uppercase text-[10.5px] tracking-[0.04em] text-[color:var(--dusk-muted)] mt-1">{n.source_name}</small>
                        </>
                      );
                      const cls = 'block py-2.5 text-[14px] leading-[1.35] hover:text-[color:var(--dusk-peach)]';
                      return (
                        <li key={n.id} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                          {n.slug ? (
                            <Link href={`/feed/${n.slug}`} className={cls}>{inner}</Link>
                          ) : (
                            <a href={n.source_url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Link href="/feed" className="dusk-link text-[13px]">{t('allFeed')}</Link>
                </section>
              )}
            </aside>
          </div>

          <NewsletterBand className="mt-2" />
        </div>
      </main>
    </>
  );
}

function hookDeliverFallbacks(t: Awaited<ReturnType<typeof getTranslations>>): HookDeliverFallbacks {
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
