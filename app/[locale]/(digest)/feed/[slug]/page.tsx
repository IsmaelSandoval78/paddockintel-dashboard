import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import ShareButton from '@/components/ui/ShareButton';

export const revalidate = 3600;

type Stat = { value: string; label: string; label_es?: string | null; unit?: string | null; unit_es?: string | null };
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
  editor_note: string | null;
  editor_note_es: string | null;
  editor_take: string | null;
  editor_take_es: string | null;
  internal_link_slug: string | null;
  stats: Stat[] | null;
  faq: Faq[] | null;
  meta_description: string | null;
  meta_description_es: string | null;
};

type PageParams = Promise<{ locale: string; slug: string }>;

const MAGAZINE_BASE = 'https://paddockintel.com';

function localeUrl(locale: string, path: string): string {
  return locale === 'en' ? `${MAGAZINE_BASE}${path}` : `${MAGAZINE_BASE}/${locale}${path}`;
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
    stats: (item.stats ?? []).map((s) => ({
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
       entity_tags, published_at, editor_note, editor_note_es, editor_take, editor_take_es,
       internal_link_slug, stats, faq, meta_description, meta_description_es,
       digest_issues!inner(status, series)`
    )
    .eq('slug', slug)
    .eq('digest_issues.status', 'published')
    .eq('digest_issues.series', 'newsletter')
    .single();
  return data as FeedItem | null;
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
  };
}

export default async function FeedItemPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const item = await getItem(slug);
  if (!item) notFound();

  const t = await getTranslations('feed');
  const format = await getFormatter();
  const text = localize(item, locale);
  const pageUrl = localeUrl(locale, `/feed/${slug}/`);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: text.headline,
    description: text.meta_description ?? text.our_summary,
    datePublished: item.published_at,
    url: pageUrl,
    isBasedOn: item.source_url,
    author: { '@type': 'Person', name: 'Ismael Sandoval', url: 'https://hub.paddockintel.com/about' },
    publisher: {
      '@type': 'Organization',
      name: 'PaddockIntel',
      url: 'https://hub.paddockintel.com',
      logo: { '@type': 'ImageObject', url: 'https://hub.paddockintel.com/opengraph-image' },
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

  const hasStats = text.stats.length > 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="bg-bg min-h-screen">
        <div className="h-12 border-b border-border flex items-center px-5">
          <Link href="/feed" className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2 hover:text-terracotta transition-colors duration-150">
            {t('itemPage.backToFeed')}
          </Link>
        </div>

        <div className="px-5 py-10 md:py-14 max-w-5xl mx-auto">
          <div className={`flex gap-12 items-start ${hasStats ? '' : 'max-w-2xl'}`}>
            <div className="flex-1 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">{item.source_name}</span>
                <span className="text-text-3">·</span>
                <span className="font-mono text-[10px] text-text-3">
                  {format.dateTime(new Date(item.published_at), { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h1
                className="uppercase leading-none tracking-[-0.02em] text-text-1 mb-6"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
              >
                {text.headline}
              </h1>

              <p className="font-prose text-text-2 leading-relaxed" style={{ fontSize: '0.9375rem', lineHeight: '1.7' }}>
                {text.our_summary}
              </p>

              {text.editor_note && (
                <p className="font-prose text-text-2 leading-relaxed mt-5" style={{ fontSize: '0.9375rem', lineHeight: '1.7' }}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-1 mr-1.5">{t('editorsNote')}:</span>
                  {text.editor_note}
                </p>
              )}

              {text.editor_take && (
                <p className="font-prose text-text-2 leading-relaxed mt-5" style={{ fontSize: '0.9375rem', lineHeight: '1.7' }}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] mr-1.5" style={{ color: 'var(--terracotta)' }}>
                    {t('editorsTake')}:
                  </span>
                  {text.editor_take}
                </p>
              )}

              {/* Stats -- mobile horizontal strip, hidden on desktop (sidebar owns it there) */}
              {hasStats && (
                <div className="lg:hidden mt-8 pt-6 border-t border-border-subtle overflow-x-auto border border-border flex gap-0">
                  {text.stats.map((stat, i) => (
                    <div key={i} className={`p-4 shrink-0 ${i > 0 ? 'border-l border-border-subtle' : ''}`}>
                      <p className="font-display text-[1.5rem] text-text-1 tabular-nums leading-none">{stat.value}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-1.5">{stat.label}</p>
                      {stat.unit && <p className="font-mono text-[10px] text-text-3 mt-0.5">{stat.unit}</p>}
                    </div>
                  ))}
                </div>
              )}

              {item.internal_link_slug && (
                <Link
                  href={`/${item.internal_link_slug}`}
                  className="block font-mono text-[10px] uppercase tracking-[0.1em] hover:underline mt-6"
                  style={{ color: 'var(--terracotta)' }}
                >
                  {t('ourBrief')}
                </Link>
              )}

              {text.faq.length > 0 && (
                <section className="mt-12 pt-8 border-t border-border">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-6">
                    Frequently Asked Questions
                  </p>
                  <dl>
                    {text.faq.map((faq, i) => (
                      <div key={i} className={`py-4 ${i > 0 ? 'border-t border-border-subtle' : ''}`}>
                        <dt className="font-prose font-semibold text-text-1 mb-1.5 text-sm">{faq.q}</dt>
                        <dd className="font-prose text-sm text-text-2 leading-relaxed">{faq.a}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <div className="mt-8 pt-6 border-t border-border-subtle">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] hover:underline"
                  style={{ color: 'var(--terracotta)' }}
                >
                  {t('originallyReportedBy', { source: item.source_name })} · {t('readOriginal')}
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
                  Written by{' '}
                  <Link href="/about" className="text-text-1 hover:text-terracotta transition-colors duration-150">
                    Ismael Sandoval
                  </Link>
                  {' '}· PaddockIntel
                </p>
                <ShareButton url={pageUrl} title={text.headline} />
              </div>
            </div>

            {hasStats && (
              <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0 sticky top-8">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mb-3">{t('itemPage.theNumbers')}</p>
                  <div className="border border-border">
                    {text.stats.map((stat, i) => (
                      <div key={i} className={`p-4 ${i > 0 ? 'border-t border-border-subtle' : ''}`}>
                        <p className="font-display text-[2rem] text-text-1 tabular-nums leading-none">{stat.value}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mt-2">{stat.label}</p>
                        {stat.unit && <p className="font-mono text-[10px] text-text-3 mt-0.5">{stat.unit}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
