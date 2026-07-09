import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { fetchClosestChampionships, formatGap } from '@/lib/records';
import { PageHeader, SubBar } from '@/components/records/RecordPageChrome';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  const title = t('closestChampionships.title');
  return {
    title: `${t('metaTitle', { title })} — PaddockIntel`,
    description: t('metaDescription', { title }),
  };
}

export default async function ClosestChampionshipsPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  const fights = await fetchClosestChampionships(10);
  const title = t('closestChampionships.title');
  const gapUnit = t('closestChampionships.gapUnit');
  const vs = t('closestChampionships.vs');

  return (
    <main className="bg-bg">
      <PageHeader sectionCode="D" title={title} sub={t('top10')} />
      <SubBar t={t} updated />

      <div className="border-b border-border">
        {fights.map((f, i) => (
          <Link
            key={f.year}
            href={`/records/closest-championships/${f.year}`}
            className="flex items-center gap-3 md:gap-5 h-14 px-5 border-t border-border-subtle hover:bg-surface-raised transition-colors duration-150 no-underline"
          >
            <span className="font-mono text-[10px] text-text-3 tabular-nums w-7 shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-[13px] text-text-1 tabular-nums w-12 shrink-0">{f.year}</span>
            <span className="text-[13px] font-medium uppercase truncate text-text-1">
              {f.championName} <span className="text-text-3 normal-case">{vs}</span> {f.runnerUpName}
            </span>
            <span className="font-mono text-[13px] tabular-nums ml-auto shrink-0 text-red">
              {formatGap(f.gap, locale)} {gapUnit}
            </span>
            <span className="text-text-2 hidden sm:block">→</span>
          </Link>
        ))}
        {!fights.length && (
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em] px-5 py-6">—</p>
        )}
      </div>
    </main>
  );
}
