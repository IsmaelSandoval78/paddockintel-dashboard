import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { EntityCount } from '@/lib/entityMentions';

// Third piece of the magazine-home redesign discussion (AI Weekly's
// "Attention This Week") — a plain snapshot, not a riser/faller %, see
// getMostCovered() in ./data.ts for why.
export default async function MostCoveredPanel({ entity }: { entity: EntityCount | null }) {
  if (!entity) return null;
  const t = await getTranslations('magazine.mostCovered');

  return (
    <section className="border-b border-border py-12 md:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-4">{t('title')}</p>
      <div className="flex items-baseline gap-4 flex-wrap">
        <span
          className="uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}
        >
          {entity.entity}
        </span>
        <span className="font-mono text-[13px] tabular-nums text-terracotta">
          {t('stories', { count: entity.count })}
        </span>
      </div>
      <Link
        href="/feed"
        className="inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-terracotta transition-colors duration-150 mt-4"
      >
        {t('seeAll')} →
      </Link>
    </section>
  );
}
