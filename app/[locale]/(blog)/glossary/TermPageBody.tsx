import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { markdownToHtml } from '@/lib/markdown';
import { getGlossaryTerm, getGlossaryTermLayers, getRelatedGlossaryTerms } from './data';
import { DepthNav } from './DepthNav';
import type { GlossaryDepth } from './data';

export function termUrl(locale: string, slug: string, depth?: GlossaryDepth): string {
  const suffix = depth === 'technical' ? '/technical' : depth === 'fia' ? '/fia-regulation' : '';
  return locale === 'en'
    ? `https://paddockintel.com/glossary/${slug}${suffix}/`
    : `https://paddockintel.com/${locale}/glossary/${slug}${suffix}/`;
}

export async function getTermMetadata(locale: string, slug: string, depth: GlossaryDepth) {
  const term = await getGlossaryTerm(locale, slug, depth);
  if (!term) return { title: 'Glossary — PaddockIntel' };
  return {
    title: `${term.term} — PaddockIntel Glossary`,
    description: term.short_definition,
  };
}

export async function TermPageBody({
  locale,
  slug,
  depth,
}: {
  locale: string;
  slug: string;
  depth: GlossaryDepth;
}) {
  const t = await getTranslations('glossary');
  const term = await getGlossaryTerm(locale, slug, depth);
  if (!term) notFound();

  const layers = await getGlossaryTermLayers(locale, slug);
  const related = await getRelatedGlossaryTerms(locale, term.related_terms);
  const html = markdownToHtml(term.body_markdown);
  const pageUrl = termUrl(locale, term.slug, term.depth);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.short_definition,
    url: pageUrl,
    inDefinedTermSet: locale === 'en' ? 'https://paddockintel.com/glossary/' : `https://paddockintel.com/${locale}/glossary/`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="bg-bg min-h-screen">
        <div className="border-b border-border px-5 py-12 md:py-16 max-w-2xl mx-auto">
          <Link
            href="/glossary"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 hover:text-text-1 transition-colors duration-150"
          >
            ← {t('backToGlossary')}
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mt-6">
            {t(`categories.${term.category}`)}
          </p>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-[0.95] tracking-[-0.02em] text-text-1 mt-3 mb-5">
            {term.term}
          </h1>
          <p className="font-prose text-lg text-text-1 leading-relaxed">
            {term.short_definition}
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-10 md:py-14">
          <DepthNav slug={slug} activeDepth={term.depth} layers={layers} />

          <article
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {related.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-4">
                {t('relatedTerms')}
              </p>
              <div className="flex flex-wrap gap-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="font-prose text-sm text-text-1 border border-border px-3 py-1.5 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
                  >
                    {r.term}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {term.sources && term.sources.length > 0 && (
            <section className="mt-8 pt-6 border-t border-border-subtle">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 mb-3">
                {t('sources')}
              </p>
              <ul className="space-y-1.5">
                {term.sources.map((src, i) => (
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
        </div>
      </main>
    </>
  );
}
