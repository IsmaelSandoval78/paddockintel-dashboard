import { getTranslations } from 'next-intl/server';
import type { TeamTagCount } from '@/app/[locale]/(blog)/magazine-home/data';

// Fifth piece of the magazine-home redesign discussion (AI Weekly's
// "Track by company" list) — reuses the existing ?tag= filter mechanism
// already wired into this page (see ArticlePreviewCard/FeaturedArticleCard),
// so clicking a team here already works end-to-end without new plumbing.
export default async function TrackByTeamPanel({
  teams,
  locale,
  compact = false,
}: {
  teams: TeamTagCount[];
  locale: string;
  /** Narrow-column rendering for the home sidebar — same chip content,
   * no full-width section chrome. */
  compact?: boolean;
}) {
  if (teams.length === 0) return null;
  const t = await getTranslations('magazine.trackByTeam');
  const base = locale === 'en' ? '/' : `/${locale}/`;

  const chips = (
    <div className="flex flex-wrap gap-2">
      {teams.map((team) => (
        <a
          key={team.slug}
          href={`${base}?tag=${encodeURIComponent(team.slug)}`}
          className="font-mono text-[11px] uppercase tracking-[0.04em] border border-border-subtle rounded-sm px-2.5 py-1 text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
        >
          {team.name} <span className="text-text-3">×{team.count}</span>
        </a>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-2 mb-3">{t('title')}</p>
        {chips}
      </div>
    );
  }

  return (
    <section className="py-10 md:py-14 border-t border-border">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mb-4">{t('title')}</p>
      {chips}
    </section>
  );
}
