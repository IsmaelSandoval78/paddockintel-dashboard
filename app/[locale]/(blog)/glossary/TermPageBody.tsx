import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { markdownToHtml } from '@/lib/markdown';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../dusk-font';
import '../dusk.css';
import {
  getGlossaryTerm,
  getGlossaryTermLayers,
  getGlossaryTermLocales,
  getGlossaryTerms,
  getRelatedGlossaryTerms,
} from './data';
import { DepthNav } from './DepthNav';
import type { GlossaryDepth } from './data';
import { openGraphFor } from '@/lib/seo';

export function termUrl(locale: string, slug: string, depth?: GlossaryDepth): string {
  const suffix = depth === 'technical' ? '/technical' : depth === 'fia' ? '/fia-regulation' : '';
  return locale === 'en'
    ? `${SITE_URL}/glossary/${slug}${suffix}/`
    : `${SITE_URL}/${locale}/glossary/${slug}${suffix}/`;
}

export async function getTermMetadata(locale: string, slug: string, depth: GlossaryDepth) {
  const term = await getGlossaryTerm(locale, slug, depth);
  if (!term) return { title: 'Glossary — PaddockIntel' };
  const canonical = termUrl(locale, term.slug, term.depth);
  // Depth variants share the same term -- without a depth-specific suffix
  // every variant renders an identical <title>, which Google folds together
  // as duplicates and drops two of every three pages from the index.
  const t = await getTranslations({ locale, namespace: 'glossary' });
  const titleSuffix = term.depth === 'eli5' ? '' : ` (${t(`depth.${term.depth}`)})`;
  // hreflang only for the locales where this page exists (pt carries a subset of the terms),
  // never pointing a search engine at a locale variant that has no row behind it.
  const present = await getGlossaryTermLocales(term.slug, depth);
  const languages: Record<string, string> = {};
  for (const l of ['en', 'es', 'pt']) if (present.includes(l)) languages[l] = termUrl(l, term.slug, term.depth);
  if (languages.en) languages['x-default'] = languages.en;
  return {
    title: `${term.term}${titleSuffix} — PaddockIntel Glossary`,
    description: term.short_definition,
    alternates: { canonical, languages },
    openGraph: openGraphFor(canonical),
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
  const [t, tCrumbs] = await Promise.all([getTranslations('glossary'), getTranslations('articleDusk')]);
  const term = await getGlossaryTerm(locale, slug, depth);
  if (!term) notFound();

  const [layers, related, allTerms] = await Promise.all([
    getGlossaryTermLayers(locale, slug),
    getRelatedGlossaryTerms(locale, term.related_terms),
    getGlossaryTerms(locale),
  ]);
  const html = markdownToHtml(term.body_markdown);
  const pageUrl = termUrl(locale, term.slug, term.depth);
  const sameCategory = allTerms.filter((x) => x.category === term.category && x.slug !== term.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.short_definition,
    url: pageUrl,
    inDefinedTermSet: locale === 'en' ? `${SITE_URL}/glossary/` : `${SITE_URL}/${locale}/glossary/`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {' / '}
            <Link href="/glossary" className="hover:text-[color:var(--dusk-ink)]">{t('backToGlossary')}</Link>
            {` / ${term.term}`}
          </nav>

          {/* Cover */}
          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
              {t('backToGlossary')} · {t(`categories.${term.category}`)}
            </p>
            <h1 className="dusk-display m-0 text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
              {term.term}
            </h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{term.short_definition}</p>
            <DepthNav slug={slug} activeDepth={term.depth} layers={layers} />
          </header>

          {/* Body on the light sheet + rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
              <div className="max-w-[64ch] mx-auto">
                <p className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] m-0 mb-2">{t(`depth.${term.depth}`)}</p>
                <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />

                {term.sources && term.sources.length > 0 && (
                  <section className="mt-8 pt-6 border-t border-[color:var(--border)]" aria-labelledby="glossary-sources">
                    <h2 id="glossary-sources" className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] m-0 mb-3 font-normal">
                      {t('sources')}
                    </h2>
                    <ol className="m-0 pl-5 list-decimal text-[15px] leading-[1.5]">
                      {term.sources.map((src, i) => (
                        <li key={i} className="mb-2">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[color:var(--accent)] hover:underline"
                          >
                            {src.name} ↗
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              {related.length > 0 && (
                <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="glossary-related">
                  <h2 id="glossary-related" className="dusk-label m-0 font-normal">{t('relatedTerms')}</h2>
                  <ul className="m-0 p-0 list-none">
                    {related.map((r) => (
                      <li key={r.slug} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                        <Link href={`/glossary/${r.slug}`} className="block py-2.5 text-[14px] leading-[1.35] hover:text-[color:var(--dusk-peach)]">
                          {r.term}
                          <span className="block dusk-mono uppercase text-[10.5px] tracking-[0.04em] text-[color:var(--dusk-muted)] mt-0.5">
                            {t(`categories.${r.category}`)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby={sameCategory.length > 0 ? 'glossary-more' : undefined}>
                {sameCategory.length > 0 && (
                  <>
                    <h2 id="glossary-more" className="dusk-label m-0 font-normal">
                      {t('moreIn', { category: t(`categories.${term.category}`) })}
                    </h2>
                    <ul className="m-0 p-0 list-none">
                      {sameCategory.map((x) => (
                        <li key={x.slug} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                          <Link href={`/glossary/${x.slug}`} className="block py-2.5 text-[14px] leading-[1.35] hover:text-[color:var(--dusk-peach)]">
                            {x.term}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <Link href="/glossary" className="dusk-link text-[13px]">{t('allTerms', { count: allTerms.length })}</Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
