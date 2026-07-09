import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { fetchSeasonTitleFight, fetchSeasonBattle, fetchTitleFightYears, formatGap } from '@/lib/records';
import { PageHeader, SubBar } from '@/components/records/RecordPageChrome';
import { SeasonBattleChart } from '@/components/records/SeasonBattleChart';
import { SeasonBattleScorecardButton } from '@/components/records/SeasonBattleScorecard';
import ShareButton from '@/components/ui/ShareButton';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; year: string }>;

export async function generateStaticParams() {
  const years = await fetchTitleFightYears();
  return routing.locales.flatMap((locale) => years.map((year) => ({ locale, year: String(year) })));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, year } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  const title = `${year} · ${t('closestChampionships.title')}`;
  return {
    title: `${t('metaTitle', { title })} — PaddockIntel`,
    description: t('metaDescription', { title }),
  };
}

export default async function ClosestChampionshipYearPage({ params }: { params: PageParams }) {
  const { locale, year } = await params;
  const yearNum = Number(year);
  if (!Number.isInteger(yearNum)) notFound();

  const t = await getTranslations({ locale, namespace: 'records' });
  const fight = await fetchSeasonTitleFight(yearNum);
  if (!fight) notFound();

  const rounds = await fetchSeasonBattle(yearNum, fight.championId, fight.runnerUpId);
  const title = `${yearNum} · ${t('closestChampionships.title')}`;
  const sharePath = `${locale === 'en' ? '' : `/${locale}`}/records/closest-championships/${yearNum}/`;
  const gapDisplay = formatGap(fight.gap, locale);
  const gapUnit = t('closestChampionships.gapUnit');
  const vs = t('closestChampionships.vs');

  const scorecardData = {
    kicker: t('cardKicker'),
    year: String(yearNum),
    path: `records/closest-championships/${yearNum}`,
    championName: fight.championName,
    runnerUpName: fight.runnerUpName,
    gapValue: gapDisplay,
    gapUnit,
    rounds: rounds.map((r) => ({ championPoints: r.championPoints, runnerUpPoints: r.runnerUpPoints })),
  };

  return (
    <main className="bg-bg">
      <PageHeader sectionCode="D" title={title} sub={t('top10')} />
      <SubBar t={t} updated />

      {/* ── Season headline ──────────────────────────────────── */}
      <div className="p-5 md:p-6 border-b border-border">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">{t('leader')}</p>
        <p
          className="text-[clamp(2.4rem,6vw,4rem)] leading-none tabular-nums text-red mt-4"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {gapDisplay}
        </p>
        <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.15em] mt-2">{gapUnit}</p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {fight.championRef ? (
            <Link
              href={`/drivers/${fight.championRef}`}
              className="no-underline hover:opacity-80 transition-opacity duration-150"
            >
              <span
                className="text-[clamp(1.3rem,2.6vw,1.9rem)] uppercase leading-none tracking-[-0.02em] text-red"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {fight.championName}
              </span>
            </Link>
          ) : (
            <span
              className="text-[clamp(1.3rem,2.6vw,1.9rem)] uppercase leading-none tracking-[-0.02em] text-red"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {fight.championName}
            </span>
          )}
          <span className="font-mono text-[12px] text-text-3 uppercase">{vs}</span>
          {fight.runnerUpRef ? (
            <Link
              href={`/drivers/${fight.runnerUpRef}`}
              className="no-underline text-text-1 hover:text-red transition-colors duration-150"
            >
              <span
                className="text-[clamp(1.3rem,2.6vw,1.9rem)] uppercase leading-none tracking-[-0.02em]"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {fight.runnerUpName}
              </span>
            </Link>
          ) : (
            <span
              className="text-[clamp(1.3rem,2.6vw,1.9rem)] uppercase leading-none tracking-[-0.02em] text-text-1"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {fight.runnerUpName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 mt-6">
          <SeasonBattleScorecardButton data={scorecardData} year={yearNum} />
          <ShareButton url={sharePath} title={`${title} · PaddockIntel`} />
        </div>
      </div>

      {/* ── Progression chart ────────────────────────────────── */}
      <div className="p-5 md:p-6 border-b border-border">
        <SeasonBattleChart rounds={rounds} championName={fight.championName} runnerUpName={fight.runnerUpName} />
      </div>

      {/* ── Round-by-round table ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 h-9 px-5 border-b border-border bg-surface-raised">
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-7 shrink-0">
            {t('closestChampionships.round')}
          </span>
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] flex-1">
            {t('closestChampionships.race')}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] w-20 text-right shrink-0 truncate text-red">
            {fight.championName}
          </span>
          <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] w-20 text-right shrink-0 truncate">
            {fight.runnerUpName}
          </span>
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] w-16 text-right shrink-0 hidden sm:block">
            {t('closestChampionships.gapColumn')}
          </span>
        </div>
        {rounds.map((r) => (
          <div key={r.round} className="flex items-center gap-3 h-11 px-5 border-b border-border-subtle">
            <span className="font-mono text-[10px] text-text-3 tabular-nums w-7 shrink-0">
              {String(r.round).padStart(2, '0')}
            </span>
            <span className="text-[12px] uppercase truncate text-text-1 flex-1">{r.raceName}</span>
            <span className="font-mono text-[12px] tabular-nums text-red w-20 text-right shrink-0">
              {r.championPoints}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-text-1 w-20 text-right shrink-0">
              {r.runnerUpPoints}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-text-3 w-16 text-right shrink-0 hidden sm:block">
              {formatGap(r.gap, locale)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Back link ────────────────────────────────────────── */}
      <div className="border-t border-border px-5 py-4">
        <Link
          href="/records/closest-championships"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-red transition-colors duration-150 no-underline"
        >
          ← {t('sectionSeasonBattles')}
        </Link>
      </div>
    </main>
  );
}
