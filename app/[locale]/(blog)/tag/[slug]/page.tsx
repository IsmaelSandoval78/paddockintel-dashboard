import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import ArticlePreviewCard from '@/components/blog/ArticlePreviewCard';
import { localeUrl } from '@/lib/site-url';

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

type PageParams = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ page?: string }>;

async function getTaggedArticles(locale: string, tagSlug: string, page: number) {
  const supabase = createClient();
  const ids = await getArticleIdsForTagSlug(supabase, tagSlug);
  if (!ids.length) return { articles: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from('articles')
    .select('id, slug, title, meta_description, published_at, stats', { count: 'exact' })
    .eq('locale', locale)
    .eq('status', 'published')
    .in('id', ids)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = data ?? [];
  const [tTags, slugsByArticle] = await Promise.all([
    getTranslations('articleTags'),
    getArticleTagSlugs(supabase, rows.map((r) => r.id as string)),
  ]);
  const articles = rows.map((r) => ({
    ...r,
    tags: (slugsByArticle.get(r.id as string) ?? []).map((s): TagRef => ({ slug: s, label: tTags(s) })),
  }));

  return { articles, total: count ?? 0 };
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

  return {
    title: t('title', { tag: label }),
    description: t('metaDescription', { tag: label }),
    alternates: {
      canonical: localeUrl(locale, `/tag/${slug}/`),
      languages: { ...languages, 'x-default': languages.en },
    },
  };
}

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

  const t = await getTranslations('tagArchive');
  const tMagazine = await getTranslations('magazine');
  const label = tArticleTags(slug);
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const { articles, total } = await getTaggedArticles(locale, slug, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const basePath = locale === 'en' ? `/tag/${slug}` : `/${locale}/tag/${slug}`;
  const pageHref = (p: number) => (p > 1 ? `${basePath}?page=${p}` : basePath);

  return (
    <main className="bg-bg min-h-screen">
      <div className="border-b border-border px-5 py-12 md:py-16 max-w-[1400px] mx-auto">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 hover:text-accent transition-colors duration-150"
        >
          {t('backToArchive')}
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mt-6 mb-3">
          {t('kicker')}
        </p>
        <h1 className="font-sans font-bold text-text-1 tracking-[-0.02em] leading-[1.1] text-3xl md:text-4xl text-balance">
          {label}
        </h1>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-10 md:py-14">
        {articles.length === 0 ? (
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
            {tMagazine('noArticles')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticlePreviewCard
                key={a.slug as string}
                slug={a.slug as string}
                title={a.title as string}
                metaDescription={a.meta_description as string | null}
                tags={a.tags}
                publishedAt={a.published_at as string}
                locale={locale}
                featuredStat={((a.stats as { value: string; label: string; unit?: string }[]) ?? [])[0]}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-between mt-10 pt-5 border-t border-border-subtle">
            {page > 1 ? (
              <a href={pageHref(page - 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150">
                {tMagazine('pagination.newer')}
              </a>
            ) : (
              <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{tMagazine('pagination.newer')}</span>
            )}
            <span className="font-mono text-[11px] tracking-[0.1em] text-text-3 tabular-nums">
              {tMagazine('pagination.page', { current: page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <a href={pageHref(page + 1)} className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-150">
                {tMagazine('pagination.older')}
              </a>
            ) : (
              <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-3 opacity-40">{tMagazine('pagination.older')}</span>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
