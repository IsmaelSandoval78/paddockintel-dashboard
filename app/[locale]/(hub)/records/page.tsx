import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  RECORD_SLUGS,
  CONSTRUCTOR_RECORD_SLUGS,
  SPECIAL_RECORD_SLUGS,
  fetchAllRecords,
  fetchAllConstructorRecords,
  fetchYoungestOldestWinners,
  fetchCircuitWinRecord,
  formatRecordValue,
  formatConstructorRecordValue,
  formatAgeYears,
} from '@/lib/records';
import { RecordCard, type RecordCardRow } from '@/components/records/RecordCard';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;

const TOTAL_CATEGORIES =
  RECORD_SLUGS.length + CONSTRUCTOR_RECORD_SLUGS.length + SPECIAL_RECORD_SLUGS.length;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  return {
    title: `${t('indexMetaTitle')} — PaddockIntel`,
    description: t('indexMetaDescription'),
  };
}

function SectionHeader({ number, label, count }: { number: string; label: string; count: string }) {
  return (
    <div className="h-10 px-5 border-b border-border flex items-center gap-3 bg-bg">
      <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">{number} ·</span>
      <h2
        className="text-[1rem] uppercase leading-none tracking-[-0.02em]"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {label}
      </h2>
      <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-auto">{count}</span>
    </div>
  );
}

export default async function RecordsPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });

  const [driverRecords, constructorRecords, { youngest, oldest }, circuitWins] = await Promise.all([
    fetchAllRecords(3),
    fetchAllConstructorRecords(3),
    fetchYoungestOldestWinners(3),
    fetchCircuitWinRecord(3),
  ]);

  const youngestLeader = youngest[0];
  const oldestLeader = oldest[0];
  const circuitLeader = circuitWins[0];

  return (
    <main className="bg-bg">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-bg">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] shrink-0">06 ·</span>
        <h1
          className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {t('title')}
        </h1>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: TOTAL_CATEGORIES })}
        </span>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-auto hidden md:block">
          {t('allTime')} · 1950–2026
        </span>
      </div>

      {/* ── Drivers ──────────────────────────────────────────── */}
      <SectionHeader number="A" label={t('sectionDrivers')} count={t('count', { count: RECORD_SLUGS.length })} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-border">
        {RECORD_SLUGS.map((slug, i) => {
          const entries = driverRecords[slug];
          const leader: RecordCardRow | undefined = entries[0]
            ? {
                key: `${entries[0].driver_id}-${entries[0].rank}`,
                rank: entries[0].rank,
                name: entries[0].name,
                valueDisplay: formatRecordValue(slug, entries[0].value, locale),
                era: entries[0].era,
              }
            : undefined;
          const rest: RecordCardRow[] = entries.slice(1).map((e) => ({
            key: `${e.driver_id}-${e.rank}`,
            rank: e.rank,
            name: e.name,
            valueDisplay: formatRecordValue(slug, e.value, locale),
          }));
          return (
            <RecordCard
              key={slug}
              index={i}
              href={`/records/${slug}`}
              categoryLabel={t(`${slug}.title`)}
              unitLabel={t(`${slug}.unit`)}
              fullRankingLabel={t('fullRanking')}
              leader={leader}
              rest={rest}
            />
          );
        })}
        <div className="hidden xl:flex xl:col-span-2 border-r border-b border-border p-5 flex-col justify-end">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">{t('updated')}</p>
        </div>
      </div>

      {/* ── Constructors ─────────────────────────────────────── */}
      <SectionHeader
        number="B"
        label={t('sectionConstructors')}
        count={t('count', { count: CONSTRUCTOR_RECORD_SLUGS.length })}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-border">
        {CONSTRUCTOR_RECORD_SLUGS.map((slug, i) => {
          const entries = constructorRecords[slug];
          const leader: RecordCardRow | undefined = entries[0]
            ? {
                key: `${entries[0].constructor_id}-${entries[0].rank}`,
                rank: entries[0].rank,
                name: entries[0].name,
                valueDisplay: formatConstructorRecordValue(slug, entries[0].value, locale),
                era: entries[0].era,
              }
            : undefined;
          const rest: RecordCardRow[] = entries.slice(1).map((e) => ({
            key: `${e.constructor_id}-${e.rank}`,
            rank: e.rank,
            name: e.name,
            valueDisplay: formatConstructorRecordValue(slug, e.value, locale),
          }));
          return (
            <RecordCard
              key={slug}
              index={i}
              href={`/records/${slug}`}
              categoryLabel={t(`${slug}.title`)}
              unitLabel={t(`${slug}.unit`)}
              fullRankingLabel={t('fullRanking')}
              leader={leader}
              rest={rest}
            />
          );
        })}
        <div className="hidden xl:flex xl:col-span-2 border-r border-b border-border p-5 flex-col justify-end">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">{t('updated')}</p>
        </div>
      </div>

      {/* ── Special ──────────────────────────────────────────── */}
      <SectionHeader
        number="C"
        label={t('sectionSpecial')}
        count={t('count', { count: SPECIAL_RECORD_SLUGS.length })}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 border-l border-border">
        {/* Youngest / Oldest winner card — two stat blocks, not a ranked list */}
        <a
          href={`/records/${SPECIAL_RECORD_SLUGS[0]}`}
          className="group flex flex-col border-r border-b border-border p-5 no-underline hover:bg-surface-raised transition-colors duration-150"
        >
          <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-5">
            01 · {t(`${SPECIAL_RECORD_SLUGS[0]}.title`)}
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
                {t(`${SPECIAL_RECORD_SLUGS[0]}.youngest`)}
              </p>
              {youngestLeader ? (
                <>
                  <p
                    className="text-[2rem] leading-none tabular-nums text-red mt-3"
                    style={{ fontFamily: 'var(--pi-display)' }}
                  >
                    {formatAgeYears(youngestLeader.ageDays, locale)}
                  </p>
                  <p className="text-[13px] uppercase leading-tight text-text-1 mt-2 truncate">
                    {youngestLeader.name}
                  </p>
                </>
              ) : (
                <p className="font-mono text-[11px] text-text-3 mt-3">—</p>
              )}
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
                {t(`${SPECIAL_RECORD_SLUGS[0]}.oldest`)}
              </p>
              {oldestLeader ? (
                <>
                  <p
                    className="text-[2rem] leading-none tabular-nums text-red mt-3"
                    style={{ fontFamily: 'var(--pi-display)' }}
                  >
                    {formatAgeYears(oldestLeader.ageDays, locale)}
                  </p>
                  <p className="text-[13px] uppercase leading-tight text-text-1 mt-2 truncate">
                    {oldestLeader.name}
                  </p>
                </>
              ) : (
                <p className="font-mono text-[11px] text-text-3 mt-3">—</p>
              )}
            </div>
          </div>
          <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mt-5">
            {t(`${SPECIAL_RECORD_SLUGS[0]}.ageUnit`)}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 group-hover:text-red transition-colors duration-150 mt-auto pt-5">
            {t('fullRanking')} →
          </p>
        </a>

        {/* Most wins at a single circuit — standard leader/ranked-list card */}
        <RecordCard
          index={1}
          href={`/records/${SPECIAL_RECORD_SLUGS[1]}`}
          categoryLabel={t(`${SPECIAL_RECORD_SLUGS[1]}.title`)}
          unitLabel={t(`${SPECIAL_RECORD_SLUGS[1]}.unit`)}
          fullRankingLabel={t('fullRanking')}
          leader={
            circuitLeader
              ? {
                  key: `${circuitLeader.driver_id}-${circuitLeader.rank}`,
                  rank: circuitLeader.rank,
                  name: circuitLeader.name,
                  valueDisplay: formatRecordValue('most-wins', circuitLeader.value, locale),
                  era: circuitLeader.era,
                }
              : undefined
          }
          rest={circuitWins.slice(1).map((e) => ({
            key: `${e.driver_id}-${e.rank}`,
            rank: e.rank,
            name: e.name,
            valueDisplay: formatRecordValue('most-wins', e.value, locale),
          }))}
        />
      </div>
    </main>
  );
}
