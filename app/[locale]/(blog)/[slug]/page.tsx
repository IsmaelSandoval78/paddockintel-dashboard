import { notFound } from 'next/navigation';
import { draftMode, cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import { ArticleScorecardButton } from '@/components/scorecards/ArticleScorecard';
import ArticleHero from '@/components/blog/ArticleHero';
import ArticleTOC from '@/components/blog/ArticleTOC';
import NewsletterCard from '@/components/blog/NewsletterCard';
import ArticlePaywallGate from '@/components/blog/ArticlePaywallGate';
import { extractTOC, markdownToHtml, estimateReadTime, splitMarkdownAtSection } from '@/lib/markdown';
import { getArticleTagSlugs, getRelatedArticles } from '@/lib/blog/tags';
import { getCurrentAuthUser } from '@/lib/auth/getCurrentAuthUser';
import { getDefaultEditorialAuthor } from '@/lib/editorialAuthor';
import { MAGAZINE_BASE, articleAlternates, localePath, magazinePath, magazinePublisherJsonLd } from '@/lib/magazineUrl';

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

async function getArticle(locale: string, slug: string, isDraft: boolean) {
  const supabase = createClient();

  let query = supabase
    .from('articles')
    .select('id, title, meta_description, body_markdown, published_at, translation_group_id, paywalled, cover_image_url')
    .eq('locale', locale)
    .eq('slug', slug);

  if (!isDraft) query = query.eq('status', 'published');

  const { data: core } = await query.single();

  if (!core) return null;

  const { data: ext } = await supabase
    .from('articles')
    .select('stats, faq_items, sources')
    .eq('locale', locale)
    .eq('slug', slug)
    .single();

  return { ...core, ...(ext ?? {}) };
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

function articleOgImage(locale: string, slug: string, cover: string | null): string {
  return cover ?? `${MAGAZINE_BASE}/api/og/article/${locale}/${slug}`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const article = await getArticle(locale, slug, isDraft);
  // Missing slugs 404. Returning metadata here used to render the noindex
  // "Did Not Finish" page on a 200, because the response had already succeeded.
  if (!article) notFound();

  const versions = article.translation_group_id
    ? await getHreflangUrls(article.translation_group_id as string)
    : [];
  const { canonical: pageUrl, languages } = articleAlternates(
    locale,
    slug,
    versions.map((version) => ({ locale: version.locale as string, slug: version.slug as string })),
  );

  const ogImage = articleOgImage(locale, slug, article.cover_image_url as string | null);

  return {
    title: `${article.title as string} — PaddockIntel`,
    description: (article.meta_description as string) ?? undefined,
    alternates: {
      canonical: pageUrl,
      ...(Object.keys(languages).length ? { languages } : {}),
    },
    openGraph: { url: pageUrl, images: [ogImage] },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  };
}

export default async function ArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const article = await getArticle(locale, slug, isDraft);
  // No loading.tsx beside this page. That file is a Suspense boundary, so Next
  // commits 200 as soon as the fallback streams and a later notFound() cannot
  // change the status. The existence check stays here, before any Suspense.
  if (!article) notFound();

  const fullBody    = article.body_markdown as string;
  const title       = article.title as string;
  const publishedAt = article.published_at as string;
  const allStats    = (article.stats as Stat[]) ?? [];
  const allFaqItems = (article.faq_items as FAQ[]) ?? [];
  const allSources  = (article.sources as Source[]) ?? [];

  const cookieStore = await cookies();
  const hasSubscribedCookie = cookieStore.get('pi_subscribed')?.value === '1';
  const authUser = hasSubscribedCookie ? null : await getCurrentAuthUser();
  const isSubscribed = hasSubscribedCookie || !!authUser;

  // Draft-mode preview (reached via /api/draft?secret=...) is already
  // trusted — never gate a piece Ismael is reviewing before it's even live.
  const isGated = Boolean(article.paywalled) && !isSubscribed && !isDraft;
  const body = isGated ? splitMarkdownAtSection(fullBody, FREE_SECTIONS).free : fullBody;

  // Stat callouts, FAQ, and sources all draw from sections past the free
  // preview — hold them back too, not just the body text, or the sidebar
  // spoils the numbers the wall is supposed to gate.
  const stats    = isGated ? [] : allStats;
  const faqItems = isGated ? [] : allFaqItems;
  const sources  = isGated ? [] : allSources;

  const tTags = await getTranslations('articleTags');
  const tagSlugs = (await getArticleTagSlugs(createClient(), [article.id as string])).get(article.id as string) ?? [];
  const tags = tagSlugs.map((slug) => tTags(slug));
  const relatedArticles = await getRelatedArticles(createClient(), article.id as string, locale, 3);

  const toc      = extractTOC(body);
  const html     = markdownToHtml(body);
  const readTime = estimateReadTime(fullBody);
  const author   = await getDefaultEditorialAuthor();
  const pageUrl  = magazinePath(locale, `/${slug}/`);
  const authorUrl = magazinePath(locale, '/about/');

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
    image: articleOgImage(locale, slug, article.cover_image_url as string | null),
    author: { '@type': 'Person', name: author.name, url: authorUrl },
    publisher: magazinePublisherJsonLd(),
    url: pageUrl,
    '@id': pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
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
        item: magazinePath(locale, '/'),
      },
      { '@type': 'ListItem', position: 2, name: title, item: pageUrl },
    ],
  };

  const hasSidebar = toc.length > 0 || stats.length > 0;

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

      <main className="bg-bg min-h-screen article-bg-grid">

        {/* Editorial hero — full-width, breaks out of content container */}
        <ArticleHero
          title={title}
          tags={tags}
          publishedAt={publishedAt}
          readTime={readTime}
          pageUrl={pageUrl}
          locale={locale}
          featuredStat={allStats[0]}
        />

        <div className="px-5 py-12 max-w-5xl mx-auto">

          {/* Two-column layout */}
          <div className={`flex gap-12 items-start ${hasSidebar ? '' : 'max-w-2xl'}`}>

            {/* Main column — body + newsletter + FAQ + sources + author */}
            <div className="flex-1 min-w-0 max-w-2xl">

              {/* TOC — mobile collapsible only (desktop version lives in sidebar) */}
              <ArticleTOC toc={toc} locale={locale} mobileOnly />

              {/* Body */}
              <article
                className="prose-article"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Registration wall (gated) or the normal newsletter card —
                  never both, the wall already asks for an email itself */}
              {isGated ? <ArticlePaywallGate /> : <NewsletterCard />}

              {/* FAQ */}
              {faqItems.length > 0 && (
                <section className="mt-12 pt-8 border-t border-border">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-6">
                    Frequently Asked Questions
                  </p>
                  <dl>
                    {faqItems.map((faq, i) => (
                      <div
                        key={i}
                        className={`py-4 ${i > 0 ? 'border-t border-border-subtle' : ''}`}
                      >
                        <dt className="font-prose font-semibold text-text-1 mb-1.5 text-sm">
                          {faq.q}
                        </dt>
                        <dd className="font-prose text-sm text-text-2 leading-relaxed">
                          {faq.a}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <section className="mt-8 pt-6 border-t border-border-subtle">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-3">
                    Documented Sources
                  </p>
                  <ul className="space-y-1.5">
                    {sources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-text-2 hover:text-terracotta transition-colors duration-150"
                        >
                          {src.name} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Author + share footer */}
              <div className="mt-12 pt-6 border-t border-border-subtle flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
                  Written by{' '}
                  <a href={localePath(locale, '/about/')} className="text-text-1 hover:text-terracotta transition-colors duration-150">
                    {author.name}
                  </a>
                  {' '}· PaddockIntel
                </p>
                <div className="flex items-center gap-2">
                  {articleCardData && <ArticleScorecardButton data={articleCardData} />}
                  <ShareButton url={pageUrl} title={title} />
                </div>
              </div>

              {/* Related coverage — same-tag articles first, backfilled with
                  the most recent others so this is never empty */}
              {relatedArticles.length > 0 && (
                <section className="mt-12 pt-8 border-t border-border">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-5">
                    Keep Reading
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/${rel.slug}`}
                        className="block border border-border-subtle p-4 hover:border-terracotta transition-colors duration-150 group"
                      >
                        <p className="font-prose text-sm text-text-1 leading-snug group-hover:text-terracotta transition-colors duration-150">
                          {rel.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar — sticky TOC (desktop) + stat callouts */}
            {hasSidebar && (
              <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0 sticky top-8">

                {/* TOC — desktop sticky scrollspy */}
                {toc.length > 0 && (
                  <div>
                    <ArticleTOC toc={toc} locale={locale} desktopOnly />
                  </div>
                )}

                {/* Stat callouts */}
                {stats.length > 0 && (
                  <div className="border border-border">
                    {stats.map((stat, i) => (
                      <div
                        key={i}
                        className={`p-4 ${i > 0 ? 'border-t border-border-subtle' : ''}`}
                      >
                        <p className="font-display text-[2rem] text-text-1 tabular-nums leading-none">
                          {stat.value}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-2">
                          {stat.label}
                        </p>
                        {stat.unit && (
                          <p className="font-mono text-[10px] text-text-3 mt-0.5">{stat.unit}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            )}
          </div>

          {/* Stats horizontal strip — mobile only */}
          {stats.length > 0 && (
            <div className="lg:hidden mt-8 pt-6 border-t border-border-subtle overflow-x-auto border border-border flex gap-0">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`p-4 shrink-0 ${i > 0 ? 'border-l border-border-subtle' : ''}`}
                >
                  <p className="font-display text-[1.5rem] text-text-1 tabular-nums leading-none">
                    {stat.value}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-1.5">
                    {stat.label}
                  </p>
                  {stat.unit && (
                    <p className="font-mono text-[10px] text-text-3 mt-0.5">{stat.unit}</p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
