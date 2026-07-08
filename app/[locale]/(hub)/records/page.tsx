import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { RECORD_SLUGS, fetchAllRecords, formatRecordValue } from '@/lib/records';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;

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

export default async function RecordsPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records' });
  const records = await fetchAllRecords(3);

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
          {t('count', { count: RECORD_SLUGS.length })}
        </span>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-auto hidden md:block">
          {t('allTime')} · 1950–2026
        </span>
      </div>

      {/* ── Record cards — bento grid, border-per-cell ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-border">
        {RECORD_SLUGS.map((slug, i) => {
          const entries = records[slug];
          const leader = entries[0];
          return (
            <Link
              key={slug}
              href={`/records/${slug}`}
              className="group flex flex-col border-r border-b border-border p-5 no-underline hover:bg-surface-raised transition-colors duration-150"
            >
              {/* Category label */}
              <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-5">
                {String(i + 1).padStart(2, '0')} · {t(`${slug}.title`)}
              </p>

              {leader ? (
                <>
                  {/* Record holder */}
                  <p
                    className="text-[2.6rem] leading-none tabular-nums text-red"
                    style={{ fontFamily: 'var(--pi-display)' }}
                  >
                    {formatRecordValue(slug, leader.value, locale)}
                  </p>
                  <p
                    className="text-[clamp(1.1rem,1.6vw,1.35rem)] uppercase leading-tight tracking-[-0.02em] text-text-1 mt-2"
                    style={{ fontFamily: 'var(--pi-display)' }}
                  >
                    {leader.name}
                  </p>
                  <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mt-1.5">
                    {t(`${slug}.unit`)}
                    {leader.era && <span className="text-text-3"> · {leader.era}</span>}
                  </p>

                  {/* Ranks 02–03 */}
                  <div className="mt-5">
                    {entries.slice(1).map((e) => (
                      <div
                        key={`${e.driver_id}-${e.rank}`}
                        className="flex items-baseline gap-3 h-8 border-t border-border-subtle"
                      >
                        <span className="font-mono text-[10px] text-text-3 tabular-nums self-center">
                          {String(e.rank).padStart(2, '0')}
                        </span>
                        <span className="font-sans text-[13px] font-medium text-text-1 uppercase self-center truncate">
                          {e.name}
                        </span>
                        <span className="font-mono text-[13px] text-text-1 tabular-nums ml-auto self-center">
                          {formatRecordValue(slug, e.value, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">—</p>
              )}

              {/* CTA */}
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 group-hover:text-red transition-colors duration-150 mt-auto pt-5">
                {t('fullRanking')} →
              </p>
            </Link>
          );
        })}

        {/* Filler cell — keeps the technical grid closed on xl (7 cards, 3 cols) */}
        <div className="hidden xl:flex xl:col-span-2 border-r border-b border-border p-5 flex-col justify-end">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">
            {t('updated')}
          </p>
        </div>
      </div>
    </main>
  );
}
