import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import { Link, redirect } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs } from '@/lib/blog/tags';
import { localeUrl } from '@/lib/site-url';
import { duskSans } from '../../dusk-font';
import '../../dusk.css';

export const revalidate = 3600;

const PAGE_SIZE = 20;

// Old Ghost tag slugs that were renamed when the canonical tag taxonomy
// moved into Supabase -- confirmed still live-404ing in Search Console's
// crawl export (2026-10-06). Anything not listed here either never had a
// canonical-tag equivalent (per-race-weekend Ghost tags like "miami-gp")
// or has no confident match, so it 404s like any other unknown tag.
const TAG_ALIASES: Record<string, string> = {
  'cadillac-formula-1-team': 'cadillac',
  'atlassian-williams-f1-team': 'williams',
  'red-bull-racing': 'red-bull',
};

// Editorial flag, not a topic: never offered as a "often tagged with" link.
const HIDDEN_CO_TAGS = new Set(['featured']);

type PageParams = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ page?: string }>;
type Stat = { value: string; label: string; unit?: string };
type TaggedArticle = {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  published_at: string;
  stats: Stat[] | null;
};

// Every published article in this locale carrying the tag, newest first. Tag archives are small
// (tens of articles), so the page slices this list instead of paging in the query -- the counts,
// first date and co-tags need the full set anyway.
async function getTaggedArticles(locale: string, tagSlug: string): Promise<TaggedArticle[]> {
  const supabase = createClient();
  const ids = await getArticleIdsForTagSlug(supabase, tagSlug);
  if (!ids.length) return [];
  const { data } = await supabase
    .from('articles')
    .select('id, slug, title, meta_description, published_at, stats')
    .eq('locale', locale)
    .eq('status', 'published')
    .in('id', ids)
    .order('published_at', { ascending: false, nullsFirst: false });
  return (data ?? []) as TaggedArticle[];
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = TAG_ALIASES[rawSlug] ?? rawSlug;

  const tArticleTags = await getTranslations({ locale, namespace: 'articleTags' });
  if (!tArticleTags.has(slug)) {
    return { title: 'PaddockIntel', robots: { index: false, follow: true } };
  }

  const t = await getTranslations({ locale, namespace: 'tagArchive' });
  const label = tArticleTags(slug);
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, `/tag/${slug}/`);
  // A tag with nothing published in this locale is an empty page: keep it reachable, keep it out
  // of the index (app/sitemap.ts leaves it out too).
  const articles = await getTaggedArticles(locale, slug);

  return {
    title: t('title', { tag: label }),
    description: t('metaDescription', { tag: label }),
    alternates: {
      canonical: localeUrl(locale, `/tag/${slug}/`),
      languages: { ...languages, 'x-default': languages.en },
    },
    ...(articles.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

// "2026-10-13T…" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

export default async function TagArchivePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const { locale, slug: rawSlug } = await params;
  const { page: pageParam } = await searchParams;

  if (TAG_ALIASES[rawSlug]) {
    redirect({ href: `/tag/${TAG_ALIASES[rawSlug]}`, locale });
  }
  const slug = rawSlug;

  const tArticleTags = await getTranslations('articleTags');
  if (!tArticleTags.has(slug)) notFound();

  const [t, tMagazine, tCrumbs, format, all] = await Promise.all([
    getTranslations('tagArchive'),
    getTranslations('magazine'),
    getTranslations('articleDusk'),
    getFormatter(),
    getTaggedArticles(locale, slug),
  ]);
  const label = tArticleTags(slug);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1));
  const shown = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const supabase = createClient();
  const slugsByArticle = await getArticleTagSlugs(supabase, all.map((a) => a.id));
  const coCounts = new Map<string, number>();
  for (const a of all) {
    for (const s of slugsByArticle.get(a.id) ?? []) {
      if (s === slug || HIDDEN_CO_TAGS.has(s) || !tArticleTags.has(s)) continue;
      coCounts.set(s, (coCounts.get(s) ?? 0) + 1);
    }
  }
  const coTags = [...coCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const shortDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });
  const lead = page === 1 ? shown[0] : undefined;
  const rest = lead ? shown.slice(1) : shown;
  const months: { key: string; label: string; articles: TaggedArticle[] }[] = [];
  for (const a of rest) {
    const key = a.published_at.slice(0, 7);
    const current = months[months.length - 1];
    if (current && current.key === key) current.articles.push(a);
    else months.push({ key, label: format.dateTime(dayDate(a.published_at), { month: 'long', year: 'numeric' }), articles: [a] });
  }

  const basePath = locale === 'en' ? `/tag/${slug}/` : `/${locale}/tag/${slug}/`;
  const pageHref = (p: number) => (p > 1 ? `${basePath}?page=${p}` : basePath);
  const leadStat = lead?.stats?.[0];

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('crumbTags')} / {label}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="dusk-label m-0">{t('kicker')}</p>
            <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em] [overflow-wrap:anywhere]">{label}</h1>
            <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('description', { tag: label })}</p>
          </div>
          {all.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="dusk-chip">
                <span className="dusk-chip-dot" aria-hidden="true" />
                {t('articlesCount', { count: all.length })}
              </span>
              <span className="dusk-chip">{t('since', { date: shortDate(all[all.length - 1].published_at) })}</span>
              <span className="dusk-chip">{t('latestChip', { date: shortDate(all[0].published_at) })}</span>
            </div>
          )}
        </header>

        {all.length === 0 ? (
          <p className="dusk-card p-6 dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--dusk-muted)]">{tMagazine('noArticles')}</p>
        ) : (
          <>
            {lead && (
              <article className="dusk-card dusk-feed-lead p-6 sm:p-8 flex flex-col gap-3.5">
                <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
                  {t('latestKicker', { date: shortDate(lead.published_at) })}
                </p>
                <h2 className="dusk-display m-0 text-[clamp(1.7rem,3.2vw,2.6rem)] leading-[1.04] tracking-[-0.02em] text-balance">
                  <Link href={`/${lead.slug}`} className="hover:text-[color:var(--dusk-peach)]">{lead.title}</Link>
                </h2>
                {lead.meta_description && <p className="dusk-hero-dek m-0 text-[16.5px] leading-[1.55] max-w-[68ch]">{lead.meta_description}</p>}
                {leadStat && (
                  <div className="self-start rounded-2xl px-4 py-3.5 bg-[rgba(14,13,18,0.35)] border border-[rgba(255,255,255,0.1)]">
                    <p className="dusk-display tabular-nums text-[1.9rem] leading-none tracking-[-0.02em] m-0">{leadStat.value}</p>
                    <p className="dusk-mono uppercase text-[10.5px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] mt-2 mb-0">{leadStat.label}</p>
                    {leadStat.unit && <p className="text-[13px] text-[#E2CEC6] mt-1 mb-0">{leadStat.unit}</p>}
                  </div>
                )}
                <Link href={`/${lead.slug}`} className="dusk-pill self-start text-[14.5px]">{t('readArticle')}</Link>
              </article>
            )}

            {coTags.length > 0 && (
              <section className="dusk-card p-5 sm:p-6 flex flex-col gap-3" aria-labelledby="tag-cotags">
                <h2 id="tag-cotags" className="dusk-label m-0 font-normal">{t('oftenWith')}</h2>
                <div className="flex flex-wrap gap-2">
                  {coTags.map(([s, n]) => (
                    <Link key={s} href={`/tag/${s}`} className="dusk-chip hover:text-[color:var(--dusk-ink)] hover:border-[color:var(--dusk-sunset)]">
                      {tArticleTags(s)}
                      <span className="tabular-nums text-[color:var(--dusk-sunset)]">{format.number(n)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {months.map((m) => (
              <section key={m.key} aria-labelledby={`tag-${m.key}`} className="flex flex-col gap-4 mt-2">
                <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--dusk-line)]">
                  <h2 id={`tag-${m.key}`} className="dusk-display m-0 text-[1.35rem] leading-tight first-letter:uppercase">{m.label}</h2>
                  <span className="dusk-label">{t('articlesCount', { count: m.articles.length })}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {m.articles.map((a) => {
                    const stat = a.stats?.[0];
                    const otherTags = (slugsByArticle.get(a.id) ?? [])
                      .filter((s) => s !== slug && !HIDDEN_CO_TAGS.has(s) && tArticleTags.has(s))
                      .slice(0, 2);
                    return (
                      <Link key={a.id} href={`/${a.slug}`} className="dusk-card group p-5 sm:p-[22px] flex flex-col gap-3 min-w-0">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--dusk-muted)] whitespace-nowrap">{shortDate(a.published_at)}</span>
                          <span className="flex flex-wrap justify-end gap-x-2 dusk-mono uppercase text-[10.5px] tracking-[0.04em] text-[color:var(--dusk-muted)] min-w-0">
                            {otherTags.map((s) => <span key={s}>{tArticleTags(s)}</span>)}
                          </span>
                        </div>
                        <h3 className="m-0 text-[17px] leading-[1.3] font-semibold text-balance group-hover:text-[color:var(--dusk-peach)]">{a.title}</h3>
                        {a.meta_description && <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)] line-clamp-3">{a.meta_description}</p>}
                        <div className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)] flex items-end justify-between gap-3">
                          {stat ? (
                            <div className="min-w-0">
                              <p className="dusk-display tabular-nums text-[1.35rem] leading-none m-0 text-[color:var(--dusk-sunset)] [overflow-wrap:anywhere]">{stat.value}</p>
                              <p className="dusk-mono uppercase text-[10px] tracking-[0.07em] text-[color:var(--dusk-muted)] mt-1.5 mb-0">{stat.label}</p>
                            </div>
                          ) : (
                            <span />
                          )}
                          <span className="dusk-mono text-[11px] text-[color:var(--dusk-ink-2)] whitespace-nowrap">{t('read')}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            {totalPages > 1 && (
              <nav aria-label={t('pagesAria')} className="flex items-center justify-between gap-3 pt-3.5 mt-2 border-t border-[color:var(--dusk-line)] dusk-mono uppercase text-[12px] tracking-[0.06em] text-[color:var(--dusk-muted)]">
                {page > 1 ? (
                  <a href={pageHref(page - 1)} className="text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">{tMagazine('pagination.newer')}</a>
                ) : (
                  <span aria-hidden="true" className="opacity-40">{tMagazine('pagination.newer')}</span>
                )}
                <span className="tabular-nums">{tMagazine('pagination.page', { current: page, total: totalPages })}</span>
                {page < totalPages ? (
                  <a href={pageHref(page + 1)} className="text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">{tMagazine('pagination.older')}</a>
                ) : (
                  <span aria-hidden="true" className="opacity-40">{tMagazine('pagination.older')}</span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
