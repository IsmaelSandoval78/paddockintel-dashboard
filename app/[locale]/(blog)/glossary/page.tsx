import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { getGlossaryTerms } from './data';

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

type PageParams = Promise<{ locale: string }>;

function termUrl(locale: string, slug: string): string {
  return locale === 'en'
    ? `https://paddockintel.com/glossary/${slug}/`
    : `https://paddockintel.com/${locale}/glossary/${slug}/`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'glossary' });
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
  };
}

export default async function GlossaryIndexPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations('glossary');
  const terms = await getGlossaryTerms(locale);

  const byCategory = new Map<string, typeof terms>();
  for (const term of terms) {
    const list = byCategory.get(term.category) ?? [];
    list.push(term);
    byCategory.set(term.category, list);
  }

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

      <main className="bg-bg min-h-screen">
        <div className="border-b border-border px-5 py-12 md:py-16 max-w-5xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2">
            {t('kicker')}
          </p>
          <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mt-3 mb-5">
            {t('title')}
          </h1>
          <p className="font-prose text-text-2 leading-relaxed max-w-lg">
            {t('description')}
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
          {CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((category) => (
            <section key={category} className="mb-14 last:mb-0">
              <h2
                className="font-display uppercase text-text-1 tracking-[-0.02em] mb-6"
                style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
              >
                {t(`categories.${category}`)}
              </h2>
              <div className="flex flex-col divide-y divide-border-subtle border-t border-b border-border-subtle">
                {byCategory.get(category)!.map((term) => (
                  <Link
                    key={term.slug}
                    href={`/glossary/${term.slug}`}
                    className="group py-5 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-6"
                  >
                    <span className="font-prose font-semibold text-text-1 group-hover:text-terracotta transition-colors duration-150 md:w-64 shrink-0">
                      {term.term}
                    </span>
                    <span className="font-prose text-sm text-text-2 leading-relaxed">
                      {term.short_definition}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
