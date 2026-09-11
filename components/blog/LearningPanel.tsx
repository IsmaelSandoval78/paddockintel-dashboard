import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { LearningTerm } from '@/app/[locale]/(blog)/magazine-home/data';

// Fourth piece of the magazine-home redesign discussion (AI Weekly's
// "Learning AI" module) — teases the existing glossary, doesn't duplicate it.
export default async function LearningPanel({ terms }: { terms: LearningTerm[] }) {
  if (terms.length === 0) return null;
  const t = await getTranslations('magazine.learning');

  return (
    <section className="py-10 md:py-14 border-t border-border">
      <h2
        className="font-display uppercase text-text-1 tracking-[-0.02em] mb-6"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        {t('title')}
      </h2>
      <div className="flex flex-col divide-y divide-border-subtle border-t border-b border-border-subtle">
        {terms.map((term) => (
          <Link
            key={term.slug}
            href={`/glossary/${term.slug}`}
            className="group py-4 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-6"
          >
            <span className="font-prose font-semibold text-text-1 group-hover:text-terracotta transition-colors duration-150 md:w-56 shrink-0">
              {term.term}
            </span>
            <span className="font-prose text-sm text-text-2 leading-relaxed line-clamp-1">
              {term.short_definition}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/glossary"
        className="inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-terracotta transition-colors duration-150 mt-5"
      >
        {t('seeAll')} →
      </Link>
    </section>
  );
}
