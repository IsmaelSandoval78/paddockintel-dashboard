import { getTranslations, getFormatter } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { LatestIssueSummary } from '@/app/[locale]/(blog)/magazine-home/data';

// Band D's left column (Option 1 of the magazine-home redesign discussion) -- the weekly
// synthesis leads the band instead of another news grid, since the editorial angle (not
// the raw feed) is PaddockIntel's actual differentiation.
export default async function LatestIssuePanel({ issue }: { issue: LatestIssueSummary }) {
  if (!issue) return null;
  const t = await getTranslations('magazine.latestIssue');
  const format = await getFormatter();

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-1">{t('title')}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-3 mb-4">
        {format.dateTime(new Date(issue.publishedAt), { month: 'short', day: 'numeric' })}
      </p>
      <p className="font-prose text-sm text-text-2 leading-relaxed line-clamp-6">{issue.introSynthesis}</p>
      <Link
        href={`/weekly/${issue.slug}`}
        className="inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-terracotta hover:opacity-80 transition-opacity duration-150 mt-4"
      >
        {t('readFull')} →
      </Link>
    </div>
  );
}
