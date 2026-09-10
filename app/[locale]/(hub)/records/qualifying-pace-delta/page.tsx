import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { fetchQualifyingPace, formatPctGap } from '@/lib/qualifying-pace';
import { RecordScorecardButton } from '@/components/records/RecordScorecard';
import { RecordRankingDetail, type RecordRow } from '@/components/records/RecordRankingDetail';
import { PageHeader, SubBar } from '@/components/records/RecordPageChrome';
import ShareButton from '@/components/ui/ShareButton';

// First metric of the "pure data" vertical (roadmap step 7) — season
// aggregate only for v1, see lib/qualifying-pace.ts and the migration that
// computes it (supabase/migrations/20260910200000_driver_qualifying_pace_view.sql).
export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  return {
    title: `${t('qualifyingPaceDelta.metaTitle')} — PaddockIntel`,
    description: t('qualifyingPaceDelta.metaDescription'),
  };
}

export default async function QualifyingPaceDeltaPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  const title = t('qualifyingPaceDelta.title');
  const unit = t('qualifyingPaceDelta.unit');
  const sharePath = `${locale === 'en' ? '' : `/${locale}`}/records/qualifying-pace-delta/`;

  const entries = await fetchQualifyingPace(20);

  const rows: RecordRow[] = entries.map((e) => ({
    key: String(e.driver_id),
    rank: e.rank,
    name: e.name,
    code: e.code,
    nationality: e.nationality,
    era: t('qualifyingPaceDelta.sessions', { count: e.sessions }),
    valueDisplay: formatPctGap(e.avgPctGap, locale),
    href: e.driver_ref ? `/drivers/${e.driver_ref}` : null,
  }));

  const scorecardData = {
    kicker: t('qualifyingPaceDelta.cardKicker'),
    title,
    unit,
    path: 'records/qualifying-pace-delta',
    entries: entries.slice(0, 5).map((e) => ({
      rank: e.rank,
      name: e.name,
      value: formatPctGap(e.avgPctGap, locale),
      detail: t('qualifyingPaceDelta.sessions', { count: e.sessions }),
    })),
  };

  return (
    <main className="bg-bg">
      <PageHeader sectionCode="E01" title={title} sub={t('qualifyingPaceDelta.subLabel')} />
      <SubBar t={t} updated />

      {entries.length > 0 ? (
        <RecordRankingDetail
          leaderLabel={t('qualifyingPaceDelta.leader')}
          unitLabel={unit}
          entries={rows}
          scorecard={<RecordScorecardButton data={scorecardData} slug="qualifying-pace-delta" />}
          share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
        />
      ) : (
        <p className="font-mono text-[12px] text-text-2 p-5">{t('qualifyingPaceDelta.empty')}</p>
      )}

      {/* Methodology — required before this metric can be cited anywhere,
          see docs/advisors/DATA-EXPERT.md. This page IS the methodology
          page for now; split into a dedicated route once the data vertical
          has more than one metric. */}
      <div className="border-t border-border px-5 py-6 max-w-[640px]">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-3">
          {t('qualifyingPaceDelta.methodologyTitle')}
        </p>
        <p className="text-[13px] leading-relaxed text-text-2">{t('qualifyingPaceDelta.methodologyBody')}</p>
      </div>
    </main>
  );
}
