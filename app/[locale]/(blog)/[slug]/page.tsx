import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';
import ArticleHero from '@/components/blog/ArticleHero';
import ArticleTOC from '@/components/blog/ArticleTOC';
import NewsletterCard from '@/components/blog/NewsletterCard';
import { extractTOC, markdownToHtml, estimateReadTime } from '@/lib/markdown';

export const revalidate = 3600;

type Stat   = { value: string; label: string; unit?: string };
type FAQ    = { q: string; a: string };
type Source = { name: string; url: string };

type PageParams = Promise<{ locale: string; slug: string }>;

async function getArticle(locale: string, slug: string) {
  const supabase = createClient();

  const { data: core } = await supabase
    .from('articles')
    .select('title, meta_description, body_markdown, published_at, tags, translation_group_id')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

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

function localeUrl(locale: string, slug: string): string {
  return locale === 'en'
    ? `https://hub.paddockintel.com/${slug}/`
    : `https://hub.paddockintel.com/${locale}/${slug}/`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) return { title: 'Article — PaddockIntel' };

  const alternates: Record<string, string> = {};
  if (article.translation_group_id) {
    const versions = await getHreflangUrls(article.translation_group_id as string);
    for (const v of versions) {
      alternates[v.locale as string] = localeUrl(v.locale as string, v.slug as string);
    }
  }

  return {
    title: `${article.title as string} — PaddockIntel`,
    description: (article.meta_description as string) ?? undefined,
    alternates: Object.keys(alternates).length ? { languages: alternates } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) notFound();

  const body        = article.body_markdown as string;
  const title       = article.title as string;
  const publishedAt = article.published_at as string;
  const tags        = (article.tags as string[]) ?? [];
  const stats       = (article.stats as Stat[]) ?? [];
  const faqItems    = (article.faq_items as FAQ[]) ?? [];
  const sources     = (article.sources as Source[]) ?? [];

  const toc      = extractTOC(body);
  const html     = markdownToHtml(body);
  const readTime = estimateReadTime(body);
  const pageUrl  = localeUrl(locale, slug);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    datePublished: publishedAt,
    author: { '@type': 'Person', name: 'Ismael Sandoval', url: 'https://hub.paddockintel.com/about' },
    publisher: { '@type': 'Organization', name: 'PaddockIntel', url: 'https://hub.paddockintel.com' },
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

      <main className="bg-bg min-h-screen article-bg-grid">

        {/* Editorial hero — full-width, breaks out of content container */}
        <ArticleHero
          title={title}
          tags={tags}
          publishedAt={publishedAt}
          readTime={readTime}
          pageUrl={pageUrl}
          locale={locale}
          featuredStat={stats[0]}
        />

        <div className="px-5 py-12 max-w-5xl mx-auto">

          {/* Two-column layout */}
          <div className={`flex gap-12 items-start ${hasSidebar ? '' : 'max-w-2xl'}`}>

            {/* Main column — body + newsletter + FAQ + sources + author */}
            <div className="flex-1 min-w-0 max-w-2xl">

              {/* TOC — mobile collapsible (desktop version lives in sidebar) */}
              <ArticleTOC toc={toc} locale={locale} />

              {/* Body */}
              <article
                className="prose-article"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Newsletter card — after article body */}
              <NewsletterCard />

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
                        <dt className="font-sans font-semibold text-text-1 mb-1.5 text-sm">
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
                          className="font-mono text-[11px] text-text-2 hover:text-red transition-colors duration-150"
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
                  <Link
                    href="/about"
                    className="text-text-1 hover:text-red transition-colors duration-150"
                  >
                    Ismael Sandoval
                  </Link>
                  {' '}· PaddockIntel
                </p>
                <ShareButton url={pageUrl} title={title} />
              </div>
            </div>

            {/* Right sidebar — sticky TOC (desktop) + stat callouts */}
            {hasSidebar && (
              <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0 sticky top-8">

                {/* TOC — desktop sticky scrollspy */}
                {toc.length > 0 && (
                  <div>
                    <ArticleTOC toc={toc} locale={locale} />
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
