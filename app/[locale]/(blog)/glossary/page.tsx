import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../dusk-font';
import '../dusk.css';
import { getGlossaryDepths, getGlossaryTerms } from './data';
import type { GlossaryDepth } from './data';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

const CATEGORY_ORDER = [
  'strategy',
  'rules-format',
  'technical',
  'tyres',
  'regulations',
  'revenue',
  'sponsorship',
] as const;

const DEPTH_ORDER: GlossaryDepth[] = ['eli5', 'technical', 'fia'];

const GLOSSARY_URLS = {
  en: `${SITE_URL}/glossary/`,
  es: `${SITE_URL}/es/glossary/`,
  pt: `${SITE_URL}/pt/glossary/`,
};

type PageParams = Promise<{ locale: string }>;

function termUrl(locale: string, slug: string): string {
  return locale === 'en'
    ? `${SITE_URL}/glossary/${slug}/`
    : `${SITE_URL}/${locale}/glossary/${slug}/`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'glossary' });
  const canonical = GLOSSARY_URLS[locale as keyof typeof GLOSSARY_URLS] ?? GLOSSARY_URLS.en;
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
    alternates: {
      canonical,
      languages: { ...GLOSSARY_URLS, 'x-default': GLOSSARY_URLS.en },
    },
    openGraph: openGraphFor(canonical),
  };
}

export default async function GlossaryIndexPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const [t, tCrumbs, format, terms, depths] = await Promise.all([
    getTranslations('glossary'),
    getTranslations('articleDusk'),
    getFormatter(),
    getGlossaryTerms(locale),
    getGlossaryDepths(locale),
  ]);

  const byCategory = new Map<string, typeof terms>();
  for (const term of terms) {
    const list = byCategory.get(term.category) ?? [];
    list.push(term);
    byCategory.set(term.category, list);
  }
  const categories = CATEGORY_ORDER.filter((cat) => byCategory.has(cat));
  const allDepths = terms.filter((term) => depths.get(term.slug)?.size === DEPTH_ORDER.length).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: t('title'),
    description: t('description'),
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.term,
      description: term.short_definition,
      url: termUrl(locale, term.slug),
    })),
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
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('backToGlossary')}
          </nav>

          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <p className="dusk-label m-0">{t('kicker')}</p>
              <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{t('title')}</h1>
              <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('description')}</p>
            </div>
            {terms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="dusk-chip">
                  <span className="dusk-chip-dot" aria-hidden="true" />
                  {t('termsCount', { count: terms.length })}
                </span>
                <span className="dusk-chip">{t('categoriesCount', { count: categories.length })}</span>
                {allDepths > 0 && <span className="dusk-chip">{t('allDepthsCount', { count: format.number(allDepths) })}</span>}
              </div>
            )}
          </header>

          <section className="dusk-card dusk-feed-lead p-5 sm:p-7 flex flex-col gap-3.5" aria-labelledby="glossary-ladder">
            <h2 id="glossary-ladder" className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0 font-normal">
              {t('ladderTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEPTH_ORDER.map((d) => (
                <div key={d} className="rounded-2xl px-4 py-3.5 bg-[rgba(14,13,18,0.35)] border border-[rgba(255,255,255,0.1)]">
                  <p className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--dusk-sunset)] m-0">{t(`depth.${d}`)}</p>
                  <p className="dusk-hero-dek text-[14px] mt-1.5 mb-0">{t(`depthDesc.${d}`)}</p>
                </div>
              ))}
            </div>
          </section>

          {categories.length > 1 && (
            <nav aria-label={t('categoriesAria')} className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <a key={category} href={`#${category}`} className="dusk-chip hover:text-[color:var(--dusk-ink)] hover:border-[color:var(--dusk-sunset)]">
                  {t(`categories.${category}`)}
                  <span className="tabular-nums text-[color:var(--dusk-sunset)]">{format.number(byCategory.get(category)!.length)}</span>
                </a>
              ))}
            </nav>
          )}

          {categories.map((category) => (
            <section key={category} id={category} aria-labelledby={`glossary-${category}`} className="scroll-mt-20 flex flex-col gap-4 mt-2">
              <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--dusk-line)]">
                <h2 id={`glossary-${category}`} className="dusk-display m-0 text-[1.35rem] leading-tight">{t(`categories.${category}`)}</h2>
                <span className="dusk-label">{t('termsCount', { count: byCategory.get(category)!.length })}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {byCategory.get(category)!.map((term) => {
                  const has = depths.get(term.slug);
                  return (
                    <Link key={term.slug} href={`/glossary/${term.slug}`} className="dusk-card group p-5 sm:p-[22px] flex flex-col gap-3 min-w-0">
                      <h3 className="m-0 text-[18px] font-semibold group-hover:text-[color:var(--dusk-peach)]">{term.term}</h3>
                      <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)] line-clamp-3">{term.short_definition}</p>
                      <ul aria-label={t('depthsAvailable')} className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)] flex flex-wrap gap-1.5 m-0 p-0 list-none">
                        {DEPTH_ORDER.filter((d) => has?.has(d)).map((d) => (
                          <li
                            key={d}
                            className="dusk-mono uppercase text-[10.5px] tracking-[0.05em] px-2 py-[3px] rounded-full border border-[rgba(242,163,94,0.5)] text-[color:var(--dusk-sunset)]"
                          >
                            {t(`depth.${d}`)}
                          </li>
                        ))}
                      </ul>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
