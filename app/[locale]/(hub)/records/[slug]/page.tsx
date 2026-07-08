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
} from '@/lib/records';
import { RecordScorecardButton } from '@/components/records/RecordScorecard';
import ShareButton from '@/components/ui/ShareButton';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    RECORD_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isRecordSlug(slug)) return { title: 'Records — PaddockIntel' };
  const t = await getTranslations({ locale, namespace: 'records' });
  const title = t(`${slug}.title`);
  return {
    title: `${t('metaTitle', { title })} — PaddockIntel`,
    description: t('metaDescription', { title }),
  };
}

export default async function RecordDetailPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  if (!isRecordSlug(slug)) notFound();

  const t = await getTranslations({ locale, namespace: 'records' });
  const entries = await fetchRecord(slug, 10);
  if (!entries.length) notFound();

  const leader = entries[0];
  const categoryIndex = RECORD_SLUGS.indexOf(slug);
  const title = t(`${slug}.title`);
  const unit = t(`${slug}.unit`);
  const sharePath = `${locale === 'en' ? '' : `/${locale}`}/records/${slug}/`;

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
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-bg">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] shrink-0">
          06 · {String(categoryIndex + 1).padStart(2, '0')} ·
        </span>
        <h1
          className="text-[clamp(1.15rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em] truncate"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {title}
        </h1>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1 shrink-0 hidden md:block">
          {t('top10')}
        </span>
      </div>

      {/* ── Sub bar — back link + freshness ──────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center bg-bg">
        <Link
          href="/records"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-red transition-colors duration-150 no-underline"
        >
          ← {t('back')}
        </Link>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto hidden md:block">
          {t('updated')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
        {/* ── Record holder panel ─────────────────────────────── */}
        <section className="border-b lg:border-b-0 lg:border-r border-border p-5 md:p-6 flex flex-col">
          <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
            {t('leader')}
          </p>

          <p
            className="text-[clamp(3.5rem,9vw,7.5rem)] leading-none tabular-nums text-red mt-4"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {formatRecordValue(slug, leader.value, locale)}
          </p>
          <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.15em] mt-2">
            {unit}
          </p>

          <div className="mt-6">
            {leader.driver_ref ? (
              <Link
                href={`/drivers/${leader.driver_ref}`}
                className="no-underline text-text-1 hover:text-red transition-colors duration-150"
              >
                <span
                  className="text-[clamp(1.6rem,3.4vw,2.4rem)] uppercase leading-none tracking-[-0.03em] block"
                  style={{ fontFamily: 'var(--pi-display)' }}
                >
                  {leader.name}
                </span>
              </Link>
            ) : (
              <span
                className="text-[clamp(1.6rem,3.4vw,2.4rem)] uppercase leading-none tracking-[-0.03em] block text-text-1"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {leader.name}
              </span>
            )}
            <p className="font-mono text-[11px] text-text-2 uppercase tracking-[0.1em] mt-2">
              {leader.code && <span>{leader.code} · </span>}
              {leader.nationality}
              {leader.era && <span className="text-text-3"> · {leader.era}</span>}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 mt-auto pt-8">
            <RecordScorecardButton data={scorecardData} slug={slug} />
            <ShareButton url={sharePath} title={`${title} · PaddockIntel`} />
          </div>
        </section>

        {/* ── Full top 10 ─────────────────────────────────────── */}
        <section>
          {entries.map((e) => {
            const isFirst = e.rank === 1;
            const row = (
              <>
                <span className="font-mono text-[10px] text-text-3 tabular-nums w-7 shrink-0">
                  {String(e.rank).padStart(2, '0')}
                </span>
                <span className="text-[13px] font-medium uppercase truncate text-text-1">
                  {e.name}
                </span>
                {e.era && (
                  <span className="font-mono text-[10px] text-text-3 tabular-nums hidden sm:block">
                    {e.era}
                  </span>
                )}
                <span
                  className={[
                    'font-mono text-[13px] tabular-nums ml-auto shrink-0',
                    isFirst ? 'text-red' : 'text-text-1',
                  ].join(' ')}
                >
                  {formatRecordValue(slug, e.value, locale)}
                </span>
              </>
            );
            const rowClass =
              'flex items-center gap-3 h-12 px-5 border-b border-border-subtle no-underline';
            return e.driver_ref ? (
              <Link
                key={`${e.driver_id}-${e.rank}`}
                href={`/drivers/${e.driver_ref}`}
                className={`${rowClass} hover:bg-surface-raised transition-colors duration-150`}
              >
                {row}
              </Link>
            ) : (
              <div key={`${e.driver_id}-${e.rank}`} className={rowClass}>
                {row}
              </div>
            );
          })}
        </section>
      </div>

      {/* ── Other records ────────────────────────────────────── */}
      <div className="border-t border-border px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">
          {t('title')} ·
        </span>
        {RECORD_SLUGS.filter((s) => s !== slug).map((s: RecordSlug) => (
          <Link
            key={s}
            href={`/records/${s}`}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-red transition-colors duration-150 no-underline"
          >
            {t(`${s}.title`)}
          </Link>
        ))}
      </div>
    </main>
  );
}
