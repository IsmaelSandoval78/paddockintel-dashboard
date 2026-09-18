import { getTranslations, getFormatter } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { significanceScore } from '@/lib/entityMentions';
import type { FeedTeaserItem } from '@/app/[locale]/(blog)/magazine-home/data';

// Band B's right column (Option 1 of the magazine-home redesign discussion) -- a compact
// slice of the full /feed page, same significance badge (lib/entityMentions.ts +
// lib/beagleCounts.ts), same scoreHint copy, reused from the `feed` i18n namespace instead
// of duplicating it under `magazine`.
export default async function FeedTeaserPanel({
  items,
  scores,
  title,
  showBadge = true,
}: {
  items: FeedTeaserItem[];
  scores: Map<string, number>;
  /** Column header -- Band B and Band D's "F1 News" column show different labels for the
   * same underlying data, so the caller names it rather than this component guessing. */
  title: string;
  /** Band D's "F1 News" column reuses this same list shape without the badge -- Band B
   * already carries the significance signal, repeating it there would just be noise. */
  showBadge?: boolean;
}) {
  if (items.length === 0) return null;
  const t = await getTranslations('feed');
  const tMagazine = await getTranslations('magazine');
  const format = await getFormatter();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2">{title}</p>
        <Link
          href="/feed"
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2 hover:text-terracotta transition-colors duration-150 shrink-0"
        >
          {tMagazine('feed.seeAll')} →
        </Link>
      </div>
      {showBadge && <p className="font-mono text-[9px] text-text-3 leading-relaxed mb-4 max-w-[38ch]">{t('scoreHint')}</p>}

      <div className={`flex flex-col divide-y divide-border-subtle border-t border-b border-border-subtle ${showBadge ? 'mt-4' : 'mt-4'}`}>
        {items.map((item) => {
          const score = significanceScore(item, scores);
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-prose font-semibold text-text-1 leading-snug line-clamp-2 flex-1 min-w-0">
                  {item.headline}
                </span>
                {showBadge && (
                  <span
                    className="font-mono text-[11px] tabular-nums shrink-0 font-medium"
                    style={{ color: score > 1 ? 'var(--terracotta)' : 'var(--text-3)' }}
                    title={t('scoreHint')}
                  >
                    {score}
                  </span>
                )}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-3 mt-1.5 block">
                {item.source_name} · {format.dateTime(new Date(item.published_at), { month: 'short', day: 'numeric' })}
              </span>
            </>
          );
          return (
            <div key={item.id} className="py-3">
              {item.slug ? (
                <Link href={`/feed/${item.slug}`} className="group block hover:text-terracotta transition-colors duration-150">
                  {body}
                </Link>
              ) : (
                <div>{body}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
