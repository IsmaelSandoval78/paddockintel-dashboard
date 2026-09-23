import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { AttentionThisWeek } from '@/app/[locale]/(blog)/magazine-home/data';

// Next entities in the same merged press/digest counts the Feed badges use.
// Skips anyone already named in the riser / covered / fall rows so the card
// doesn't repeat a metric. count > 1 matches /feed's "most mentioned" gate.
function alsoMentioned(scores: Map<string, number>, attention: AttentionThisWeek, limit = 4) {
  const shown = new Set(
    [attention.mostCovered?.entity, attention.fastestRiser?.entity, attention.biggestFall?.entity].filter(
      (name): name is string => Boolean(name),
    ),
  );
  return [...scores.entries()]
    .filter(([entity, count]) => count > 1 && !shown.has(entity))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([entity, count]) => ({ entity, count }));
}

// Third piece of the magazine-home redesign discussion (AI Weekly's
// "Attention This Week") — see getAttentionThisWeek() in ./data.ts for the
// sample-size gates behind each row. Any row can be null independently; the
// whole panel hides only if every row comes back null.
export default async function AttentionThisWeekPanel({
  attention,
  scores,
}: {
  attention: AttentionThisWeek;
  /** Merged beagle + digest entity counts already loaded for the Feed teaser. */
  scores?: Map<string, number>;
}) {
  const { mostCovered, fastestRiser, biggestFall, dominantTheme } = attention;
  if (!mostCovered && !fastestRiser && !biggestFall && !dominantTheme) return null;
  const t = await getTranslations('magazine.attention');
  const locale = await getLocale();
  const mentioned = scores ? alsoMentioned(scores, attention) : [];
  const homePath = locale === 'en' ? '/' : `/${locale}/`;

  return (
    <section className="soft-card flex h-full flex-col p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('title')}</p>
      <p className="font-sans text-xs text-text-2 mb-4">{t('subtitle')}</p>

      <div className="flex flex-col divide-y divide-border-subtle">
        {fastestRiser && (
          <div className="flex items-baseline justify-between gap-4 py-2.5">
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
          <div className="flex items-baseline justify-between gap-4 py-2.5">
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
          <div className="flex items-baseline justify-between gap-4 py-2.5">
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
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('dominantTheme')}</p>
              <a
                href={`${homePath}?tag=${encodeURIComponent(dominantTheme.slug)}`}
                className="font-sans font-semibold text-text-1 hover:text-accent transition-colors duration-150"
              >
                {dominantTheme.label}
              </a>
            </div>
            <p className="font-mono text-[11px] tabular-nums text-text-2 text-right shrink-0">
              {t('ofStoriesThisWeek', { count: dominantTheme.count, total: dominantTheme.total })}
            </p>
          </div>
        )}
      </div>

      {mentioned.length > 0 && (
        <div className="mt-4 border-t border-border-subtle pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-3 mb-1">{t('alsoMentioned')}</p>
          <div className="flex flex-col divide-y divide-border-subtle">
            {mentioned.map((row) => (
              <div key={row.entity} className="flex items-baseline justify-between gap-4 py-2">
                <p className="font-sans text-sm font-semibold text-text-1 min-w-0 truncate">{row.entity}</p>
                <p className="font-mono text-[11px] tabular-nums text-text-2 shrink-0">×{row.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/feed"
        className="mt-auto inline-block pt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:text-text-1 transition-colors duration-150"
      >
        {t('seeAll')} →
      </Link>
    </section>
  );
}
