import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { AttentionThisWeek } from '@/app/[locale]/(blog)/magazine-home/data';

// Third piece of the magazine-home redesign discussion (AI Weekly's
// "Attention This Week") — see getAttentionThisWeek() in ./data.ts for the
// sample-size gates behind each row. Any row can be null independently; the
// whole panel hides only if every row comes back null.
export default async function AttentionThisWeekPanel({ attention }: { attention: AttentionThisWeek }) {
  const { mostCovered, fastestRiser, biggestFall, dominantTheme } = attention;
  if (!mostCovered && !fastestRiser && !biggestFall && !dominantTheme) return null;
  const t = await getTranslations('magazine.attention');

  return (
    <section className="soft-card p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('title')}</p>
      <p className="font-sans text-sm text-text-2 mb-6">{t('subtitle')}</p>

      <div className="flex flex-col divide-y divide-border-subtle">
        {fastestRiser && (
          <div className="flex items-baseline justify-between gap-6 py-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('fastestRiser')}</p>
              <p className="font-sans font-semibold text-text-1">{fastestRiser.entity}</p>
            </div>
            <p className="font-mono text-[11px] tabular-nums text-right shrink-0" style={{ color: 'var(--green)' }}>
              ▲ +{fastestRiser.pctChange}% · {t('vsLastWeek', { count: fastestRiser.count, prevCount: fastestRiser.prevCount })}
            </p>
          </div>
        )}

        {mostCovered && (
          <div className="flex items-baseline justify-between gap-6 py-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('mostCovered')}</p>
              <p className="font-sans font-semibold text-text-1">{mostCovered.entity}</p>
            </div>
            <p className="font-mono text-[11px] tabular-nums text-text-2 text-right shrink-0">
              {t('storiesThisWeek', { count: mostCovered.count })}
            </p>
          </div>
        )}

        {biggestFall && (
          <div className="flex items-baseline justify-between gap-6 py-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('biggestFall')}</p>
              <p className="font-sans font-semibold text-text-1">{biggestFall.entity}</p>
            </div>
            <p className="font-mono text-[11px] tabular-nums text-right shrink-0" style={{ color: 'var(--accent-2)' }}>
              ▼ {biggestFall.pctChange}% · {t('vsLastWeek', { count: biggestFall.count, prevCount: biggestFall.prevCount })}
            </p>
          </div>
        )}

        {dominantTheme && (
          <div className="flex items-baseline justify-between gap-6 py-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('dominantTheme')}</p>
              <p className="font-sans font-semibold text-text-1">{dominantTheme.label}</p>
            </div>
            <p className="font-mono text-[11px] tabular-nums text-text-2 text-right shrink-0">
              {t('ofStoriesThisWeek', { count: dominantTheme.count, total: dominantTheme.total })}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/feed"
        className="inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-accent transition-colors duration-150 mt-5"
      >
        {t('seeAll')} →
      </Link>
    </section>
  );
}
