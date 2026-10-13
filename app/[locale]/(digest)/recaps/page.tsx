import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('recaps');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

type Recap = { id: string; slug: string; published_at: string; intro_synthesis: string };
type RecapItem = { issue_id: string; published_at: string };

async function getData() {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('status', 'published')
    .eq('series', 'recap')
    .order('published_at', { ascending: false });
  const recaps = (data ?? []) as Recap[];
  if (!recaps.length) return { recaps, items: [] as RecapItem[] };
  const { data: items } = await supabase
    .from('digest_items')
    .select('issue_id, published_at')
    .in('issue_id', recaps.map((r) => r.id));
  return { recaps, items: (items ?? []) as RecapItem[] };
}

// Recap number from the slug ("recap-02-week-…" -> "02"), same rule as the recap page.
const recapNumber = (slug: string) => slug.match(/recap-(\d+)/i)?.[1]?.padStart(2, '0') ?? '01';
// "2026-08-13T…" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

export default async function RecapsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, tDigest, tCrumbs, format, { recaps, items }] = await Promise.all([
    getTranslations('recaps'),
    getTranslations('digest'),
    getTranslations('articleDusk'),
    getFormatter(),
    getData(),
  ]);

  const shortDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });
  // What a recap covers is the span of its own stories' dates -- never the week in its slug.
  const coverage = (id: string) => {
    const dates = items.filter((it) => it.issue_id === id).map((it) => it.published_at.slice(0, 10)).sort();
    if (!dates.length) return null;
    return format.dateTimeRange(dayDate(dates[0]), dayDate(dates[dates.length - 1]), { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const countFor = (id: string) => items.filter((it) => it.issue_id === id).length;

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{tDigest('crumbHome')}</Link>
          {' / '}
          <Link href="/weekly" className="hover:text-[color:var(--dusk-ink)]">{tDigest('kicker')}</Link>
          {` / ${t('kicker')}`}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="dusk-label m-0">{t('kicker')}</p>
            <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{t('headline')}</h1>
            <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('index.description')}</p>
          </div>
          {recaps.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="dusk-chip">
                <span className="dusk-chip-dot" aria-hidden="true" />
                {t('recapsCount', { count: recaps.length })}
              </span>
              <span className="dusk-chip">{tDigest('storiesCount', { count: items.length })}</span>
            </div>
          )}
        </header>

        <section className="dusk-card dusk-feed-lead p-6 sm:p-8 flex flex-col gap-3.5" aria-labelledby="recaps-howto">
          <h2 id="recaps-howto" className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0 font-normal">
            {t('howToTitle')}
          </h2>
          <p className="dusk-hero-dek m-0 pl-3.5 border-l-[3px] border-[color:var(--dusk-sunset)] text-[14.5px] leading-[1.55] max-w-[70ch]">{t('howToBody')}</p>
          <Link href="/weekly" className="dusk-pill self-start text-[14.5px]">{t('weeklyCta')}</Link>
        </section>

        {recaps.length === 0 ? (
          <p className="dusk-card p-6 dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--dusk-muted)]">{t('index.noIssues')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recaps.map((recap) => {
              const covers = coverage(recap.id);
              return (
                <Link key={recap.id} href={`/recaps/${recap.slug}`} className="dusk-card group p-5 sm:p-[22px] flex flex-col gap-3 min-w-0">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--dusk-muted)] min-w-0">
                      {covers ? t('coversRange', { range: covers }) : ''}
                    </span>
                    <span className="dusk-label whitespace-nowrap">{tDigest('storiesCount', { count: countFor(recap.id) })}</span>
                  </div>
                  <p className="dusk-display m-0 text-[2.2rem] leading-none tracking-[-0.02em]">{t('vol', { n: recapNumber(recap.slug) })}</p>
                  <p lang={locale === 'en' ? undefined : 'en'} className="m-0 text-[14.5px] text-[color:var(--dusk-ink-2)] line-clamp-4 group-hover:text-[color:var(--dusk-ink)]">{recap.intro_synthesis}</p>
                  <div className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)] flex items-end justify-between gap-3">
                    <span className="dusk-mono uppercase text-[10px] tracking-[0.07em] text-[color:var(--dusk-muted)]">
                      {t('publishedOn', { date: shortDate(recap.published_at) })}
                    </span>
                    <span className="dusk-mono text-[11px] text-[color:var(--dusk-ink-2)] whitespace-nowrap">{t('index.read')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
