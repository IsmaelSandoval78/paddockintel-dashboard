import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import {
  RECORD_SLUGS,
  type RecordSlug,
  isRecordSlug,
  fetchRecord,
  formatRecordValue,
  CONSTRUCTOR_RECORD_SLUGS,
  type ConstructorRecordSlug,
  isConstructorRecordSlug,
  fetchConstructorRecord,
  formatConstructorRecordValue,
  SPECIAL_RECORD_SLUGS,
  isSpecialRecordSlug,
  fetchYoungestOldestWinners,
  fetchCircuitWinRecord,
  formatAgeYears,
} from '@/lib/records';
import { RecordScorecardButton } from '@/components/records/RecordScorecard';
import { RecordRankingDetail, type RecordRow } from '@/components/records/RecordRankingDetail';
import ShareButton from '@/components/ui/ShareButton';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

const ALL_SLUGS = [...RECORD_SLUGS, ...CONSTRUCTOR_RECORD_SLUGS, ...SPECIAL_RECORD_SLUGS];

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => ALL_SLUGS.map((slug) => ({ locale, slug })));
}

function isAnyRecordSlug(slug: string): boolean {
  return isRecordSlug(slug) || isConstructorRecordSlug(slug) || isSpecialRecordSlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAnyRecordSlug(slug)) return { title: 'Records — PaddockIntel' };
  const t = await getTranslations({ locale, namespace: 'records' });
  const title = t(`${slug}.title`);
  return {
    title: `${t('metaTitle', { title })} — PaddockIntel`,
    description: t('metaDescription', { title }),
  };
}

export default async function RecordDetailPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  if (!isAnyRecordSlug(slug)) notFound();

  const t = await getTranslations({ locale, namespace: 'records' });
  const title = t(`${slug}.title`);
  const sharePath = `${locale === 'en' ? '' : `/${locale}`}/records/${slug}/`;

  if (isRecordSlug(slug)) return renderDriverRecord(slug, locale, t, title, sharePath);
  if (isConstructorRecordSlug(slug)) return renderConstructorRecord(slug, locale, t, title, sharePath);
  if (slug === 'youngest-oldest-winner') return renderAgeRecord(locale, t, title, sharePath);
  return renderCircuitWinRecord(locale, t, title, sharePath);
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function PageHeader({ sectionCode, title, sub }: { sectionCode: string; title: string; sub?: string }) {
  return (
    <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-bg">
      <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] shrink-0">
        06 · {sectionCode} ·
      </span>
      <h1
        className="text-[clamp(1.15rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em] truncate"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {title}
      </h1>
      {sub && (
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1 shrink-0 hidden md:block">
          {sub}
        </span>
      )}
    </div>
  );
}

function SubBar({ t, updated }: { t: T; updated?: boolean }) {
  return (
    <div className="h-9 px-5 border-b border-border flex items-center bg-bg">
      <Link
        href="/records"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-red transition-colors duration-150 no-underline"
      >
        ← {t('back')}
      </Link>
      {updated && (
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto hidden md:block">
          {t('updated')}
        </span>
      )}
    </div>
  );
}

function OtherRecordsNav({
  t,
  title,
  siblings,
}: {
  t: T;
  title: string;
  siblings: { slug: string; title: string }[];
}) {
  return (
    <div className="border-t border-border px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">{title} ·</span>
      {siblings.map((s) => (
        <Link
          key={s.slug}
          href={`/records/${s.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-red transition-colors duration-150 no-underline"
        >
          {s.title}
        </Link>
      ))}
    </div>
  );
}

async function renderDriverRecord(slug: RecordSlug, locale: string, t: T, title: string, sharePath: string) {
  const entries = await fetchRecord(slug, 10);
  if (!entries.length) notFound();
  const unit = t(`${slug}.unit`);
  const categoryIndex = RECORD_SLUGS.indexOf(slug);

  const rows: RecordRow[] = entries.map((e) => ({
    key: `${e.driver_id}-${e.rank}`,
    rank: e.rank,
    name: e.name,
    code: e.code,
    nationality: e.nationality,
    era: e.era,
    valueDisplay: formatRecordValue(slug, e.value, locale),
    href: e.driver_ref ? `/drivers/${e.driver_ref}` : null,
  }));

  const scorecardData = {
    kicker: t('cardKicker'),
    title,
    unit,
    path: `records/${slug}`,
    entries: entries.slice(0, 5).map((e) => ({
      rank: e.rank,
      name: e.name,
      value: formatRecordValue(slug, e.value, locale),
      detail: e.era ?? undefined,
    })),
  };

  return (
    <main className="bg-bg">
      <PageHeader sectionCode={`A${String(categoryIndex + 1).padStart(2, '0')}`} title={title} sub={t('top10')} />
      <SubBar t={t} updated />
      <RecordRankingDetail
        leaderLabel={t('leader')}
        unitLabel={unit}
        entries={rows}
        scorecard={<RecordScorecardButton data={scorecardData} slug={slug} />}
        share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
      />
      <OtherRecordsNav
        t={t}
        title={t('sectionDrivers')}
        siblings={RECORD_SLUGS.filter((s) => s !== slug).map((s) => ({ slug: s, title: t(`${s}.title`) }))}
      />
    </main>
  );
}

async function renderConstructorRecord(
  slug: ConstructorRecordSlug,
  locale: string,
  t: T,
  title: string,
  sharePath: string
) {
  const entries = await fetchConstructorRecord(slug, 10);
  if (!entries.length) notFound();
  const unit = t(`${slug}.unit`);
  const categoryIndex = CONSTRUCTOR_RECORD_SLUGS.indexOf(slug);

  const rows: RecordRow[] = entries.map((e) => ({
    key: `${e.constructor_id}-${e.rank}`,
    rank: e.rank,
    name: e.name,
    nationality: e.nationality,
    era: e.era,
    valueDisplay: formatConstructorRecordValue(slug, e.value, locale),
    href: e.constructor_ref ? `/constructors/${e.constructor_ref}` : null,
  }));

  const scorecardData = {
    kicker: t('cardKicker'),
    title,
    unit,
    path: `records/${slug}`,
    entries: entries.slice(0, 5).map((e) => ({
      rank: e.rank,
      name: e.name,
      value: formatConstructorRecordValue(slug, e.value, locale),
      detail: e.era ?? undefined,
    })),
  };

  return (
    <main className="bg-bg">
      <PageHeader sectionCode={`B${String(categoryIndex + 1).padStart(2, '0')}`} title={title} sub={t('top10')} />
      <SubBar t={t} updated />
      <RecordRankingDetail
        leaderLabel={t('leader')}
        unitLabel={unit}
        entries={rows}
        scorecard={<RecordScorecardButton data={scorecardData} slug={slug} />}
        share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
      />
      <OtherRecordsNav
        t={t}
        title={t('sectionConstructors')}
        siblings={CONSTRUCTOR_RECORD_SLUGS.filter((s) => s !== slug).map((s) => ({
          slug: s,
          title: t(`${s}.title`),
        }))}
      />
    </main>
  );
}

async function renderAgeRecord(locale: string, t: T, title: string, sharePath: string) {
  const { youngest, oldest } = await fetchYoungestOldestWinners(10);
  if (!youngest.length && !oldest.length) notFound();
  const unit = t('youngest-oldest-winner.ageUnit');

  const toRows = (entries: typeof youngest): RecordRow[] =>
    entries.map((e) => ({
      key: `${e.driver_id}-${e.rank}`,
      rank: e.rank,
      name: e.name,
      code: e.code,
      nationality: e.nationality,
      era: e.era,
      valueDisplay: formatAgeYears(e.ageDays, locale),
      href: e.driver_ref ? `/drivers/${e.driver_ref}` : null,
    }));

  const toScorecard = (label: string, entries: typeof youngest, path: string) => ({
    kicker: t('cardKicker'),
    title: `${title} · ${label}`,
    unit,
    path,
    entries: entries.slice(0, 5).map((e) => ({
      rank: e.rank,
      name: e.name,
      value: formatAgeYears(e.ageDays, locale),
      detail: e.era,
    })),
  });

  const youngestLabel = t('youngest-oldest-winner.youngest');
  const oldestLabel = t('youngest-oldest-winner.oldest');

  return (
    <main className="bg-bg">
      <PageHeader sectionCode="C01" title={title} sub={t('top10')} />
      <SubBar t={t} updated />

      <div className="border-b border-border">
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] px-5 h-9 flex items-center border-b border-border-subtle">
          {youngestLabel}
        </p>
        <RecordRankingDetail
          leaderLabel={youngestLabel}
          unitLabel={unit}
          entries={toRows(youngest)}
          scorecard={
            <RecordScorecardButton
              data={toScorecard(youngestLabel, youngest, 'records/youngest-oldest-winner')}
              slug="youngest-oldest-winner-youngest"
            />
          }
          share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
        />
      </div>

      <div>
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] px-5 h-9 flex items-center border-b border-border-subtle">
          {oldestLabel}
        </p>
        <RecordRankingDetail
          leaderLabel={oldestLabel}
          unitLabel={unit}
          entries={toRows(oldest)}
          scorecard={
            <RecordScorecardButton
              data={toScorecard(oldestLabel, oldest, 'records/youngest-oldest-winner')}
              slug="youngest-oldest-winner-oldest"
            />
          }
          share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
        />
      </div>

      <OtherRecordsNav
        t={t}
        title={t('sectionSpecial')}
        siblings={SPECIAL_RECORD_SLUGS.filter((s) => s !== 'youngest-oldest-winner').map((s) => ({
          slug: s,
          title: t(`${s}.title`),
        }))}
      />
    </main>
  );
}

async function renderCircuitWinRecord(locale: string, t: T, title: string, sharePath: string) {
  const entries = await fetchCircuitWinRecord(10);
  if (!entries.length) notFound();
  const unit = t('most-wins-single-circuit.unit');

  const rows: RecordRow[] = entries.map((e) => ({
    key: `${e.driver_id}-${e.circuit_id}-${e.rank}`,
    rank: e.rank,
    name: e.name,
    code: e.code,
    nationality: e.nationality,
    era: e.era,
    valueDisplay: formatRecordValue('most-wins', e.value, locale),
    href: e.driver_ref ? `/drivers/${e.driver_ref}` : null,
  }));

  const scorecardData = {
    kicker: t('cardKicker'),
    title,
    unit,
    path: 'records/most-wins-single-circuit',
    entries: entries.slice(0, 5).map((e) => ({
      rank: e.rank,
      name: e.name,
      value: formatRecordValue('most-wins', e.value, locale),
      detail: e.era,
    })),
  };

  return (
    <main className="bg-bg">
      <PageHeader sectionCode="C02" title={title} sub={t('top10')} />
      <SubBar t={t} updated />
      <RecordRankingDetail
        leaderLabel={t('leader')}
        unitLabel={unit}
        entries={rows}
        scorecard={<RecordScorecardButton data={scorecardData} slug="most-wins-single-circuit" />}
        share={<ShareButton url={sharePath} title={`${title} · PaddockIntel`} />}
      />
      <OtherRecordsNav
        t={t}
        title={t('sectionSpecial')}
        siblings={SPECIAL_RECORD_SLUGS.filter((s) => s !== 'most-wins-single-circuit').map((s) => ({
          slug: s,
          title: t(`${s}.title`),
        }))}
      />
    </main>
  );
}
