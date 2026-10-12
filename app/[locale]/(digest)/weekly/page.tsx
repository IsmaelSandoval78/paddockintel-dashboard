import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { readFeaturedStats } from '@/lib/hookDeliver';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

export const revalidate = 3600;

type Issue = { id: string; slug: string; published_at: string; intro_synthesis: string };
type IssueItem = {
  id: string;
  issue_id: string;
  slug: string | null;
  source_name: string;
  source_url: string;
  headline: string;
  headline_es: string | null;
  stats: unknown;
  published_at: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('digest');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

async function getData() {
  const supabase = createClient();
  const [{ data: issues }, { count: recaps }] = await Promise.all([
    supabase
      .from('digest_issues')
      .select('id, slug, published_at, intro_synthesis')
      .eq('status', 'published')
      .eq('series', 'newsletter')
      .order('published_at', { ascending: false }),
    supabase
      .from('digest_issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('series', 'recap'),
  ]);
  const issueRows = (issues ?? []) as Issue[];
  if (!issueRows.length) return { issues: issueRows, items: [] as IssueItem[], recaps: recaps ?? 0 };
  const { data: items } = await supabase
    .from('digest_items')
    .select('id, issue_id, slug, source_name, source_url, headline, headline_es, stats, published_at')
    .in('issue_id', issueRows.map((i) => i.id))
    .order('published_at', { ascending: true })
    .order('id', { ascending: true });
  return { issues: issueRows, items: (items ?? []) as IssueItem[], recaps: recaps ?? 0 };
}

// Volume number from the slug ("vol-22-week-…" -> 22), same rule as the issue page title.
const volOf = (slug: string) => Number(slug.match(/vol-(\d+)/i)?.[1] ?? 0);
// "2026-10-12T…" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

export default async function DigestIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('digest');
  const tCrumbs = await getTranslations('articleDusk');
  const format = await getFormatter();
  const { issues, items, recaps } = await getData();

  const isEs = locale === 'es';
  const itemsByIssue = new Map<string, IssueItem[]>();
  for (const it of items) itemsByIssue.set(it.issue_id, [...(itemsByIssue.get(it.issue_id) ?? []), it]);
  const statOf = (it: IssueItem) => {
    const s = readFeaturedStats(it.stats)[0];
    return s ? { value: s.value, label: isEs ? s.label_es ?? s.label : s.label } : null;
  };
  const longDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });

  const latest = issues[0];
  const latestItems = latest ? itemsByIssue.get(latest.id) ?? [] : [];
  const older = issues.slice(1);
  const sourcesCited = new Set(items.map((it) => it.source_name)).size;
  const withNumbers = items.filter((it) => statOf(it)).length;

  // Older issues by calendar month (issues arrive newest first).
  const months: { key: string; label: string; issues: Issue[] }[] = [];
  for (const issue of older) {
    const key = issue.published_at.slice(0, 7);
    const current = months[months.length - 1];
    if (current && current.key === key) current.issues.push(issue);
    else months.push({ key, label: format.dateTime(dayDate(issue.published_at), { month: 'long', year: 'numeric' }), issues: [issue] });
  }

  const storyHref = (it: IssueItem) => (it.slug ? { internal: `/feed/${it.slug}` } : { external: it.source_url });
  const source = 'dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0';

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('kicker')}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            {issues.length > 0 && <p className="dusk-label m-0">{t('since', { date: longDate(issues[issues.length - 1].published_at) })}</p>}
            <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{t('headline')}</h1>
            <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('index.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/about" className="dusk-chip hover:text-[color:var(--dusk-ink)]">
              <span className="dusk-chip-dot" aria-hidden="true" />
              {t('editedBy')}
            </Link>
            {issues.length > 0 && <span className="dusk-chip">{t('issuesCount', { count: issues.length })}</span>}
            {items.length > 0 && <span className="dusk-chip">{t('storiesCount', { count: items.length })}</span>}
          </div>
        </header>

        {!latest ? (
          <>
            <p className="dusk-card p-6 dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--dusk-muted)]">{t('index.noIssues')}</p>
            <NewsletterBand title={t('subTitle')} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <article className="dusk-card dusk-feed-lead p-6 sm:p-8 flex flex-col gap-3.5 lg:col-span-8">
                <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
                  {t('latestKicker', { date: longDate(latest.published_at), stories: t('storiesCount', { count: latestItems.length }) })}
                </p>
                <h2 className="dusk-display m-0 text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.9] tracking-[-0.03em]">
                  <Link href={`/weekly/${latest.slug}`} className="hover:text-[color:var(--dusk-peach)]">{t('vol', { n: volOf(latest.slug) })}</Link>
                </h2>
                <p className="dusk-hero-dek m-0 text-[16.5px] leading-[1.55] max-w-[68ch]">{latest.intro_synthesis}</p>
                {latestItems.length > 0 && (
                  <ol className="m-0 p-0 list-none">
                    {latestItems.slice(0, 5).map((it, i) => {
                      const stat = statOf(it);
                      const href = storyHref(it);
                      const headline = isEs ? it.headline_es ?? it.headline : it.headline;
                      const cls = 'min-w-0 hover:text-[color:var(--dusk-peach)]';
                      return (
                        <li key={it.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-2.5 items-baseline py-2.5 border-t border-[rgba(255,255,255,0.12)] first:border-t-0 text-[15px]">
                          <span className="dusk-mono text-[11px] text-[color:var(--dusk-peach)]">{String(i + 1).padStart(2, '0')}</span>
                          {href.internal ? (
                            <Link href={href.internal} className={cls}>{headline}</Link>
                          ) : (
                            <a href={href.external} target="_blank" rel="noopener noreferrer" className={cls}>{headline}</a>
                          )}
                          <span className="dusk-display tabular-nums text-[color:var(--dusk-sunset)] whitespace-nowrap">{stat?.value ?? ''}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <Link href={`/weekly/${latest.slug}`} className="dusk-pill self-start text-[14.5px]">{t('readIssue')}</Link>
              </article>

              <NewsletterBand className="lg:col-span-4" title={t('subTitle')} />

              <section className="dusk-card p-5 sm:p-6 flex flex-col gap-3 lg:col-span-12" aria-labelledby="weekly-glance-title">
                <h2 id="weekly-glance-title" className="dusk-label m-0 font-normal">{t('glanceTitle')}</h2>
                <div className="flex flex-wrap gap-x-7 gap-y-3">
                  {[
                    { v: issues.length, l: t('glanceIssues'), warm: false },
                    { v: items.length, l: t('glanceStories'), warm: false },
                    { v: sourcesCited, l: t('glanceSources'), warm: false },
                    { v: withNumbers, l: t('glanceData'), warm: true },
                  ].map((k) => (
                    <div key={k.l}>
                      <p className={`dusk-display tabular-nums text-[2.4rem] leading-none tracking-[-0.03em] m-0 ${k.warm ? 'text-[color:var(--dusk-sunset)]' : ''}`}>
                        {format.number(k.v)}
                      </p>
                      <p className={`${source} mt-1.5`}>{k.l}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {months.map((m) => (
              <section key={m.key} aria-labelledby={`weekly-${m.key}`} className="flex flex-col gap-4 mt-2">
                <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--dusk-line)]">
                  <h2 id={`weekly-${m.key}`} className="dusk-display m-0 text-[1.35rem] leading-tight first-letter:uppercase">{m.label}</h2>
                  <span className="dusk-label">{t('issuesCount', { count: m.issues.length })}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {m.issues.map((issue) => {
                    const its = itemsByIssue.get(issue.id) ?? [];
                    const stat = its.map(statOf).find(Boolean) ?? null;
                    return (
                      <Link key={issue.id} href={`/weekly/${issue.slug}`} className="dusk-card group p-5 sm:p-[22px] flex flex-col gap-3 min-w-0">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--dusk-muted)]">{longDate(issue.published_at)}</span>
                          <span className="dusk-label">{t('storiesCount', { count: its.length })}</span>
                        </div>
                        <p className="dusk-display m-0 text-[2.2rem] leading-none tracking-[-0.02em]">{t('vol', { n: volOf(issue.slug) })}</p>
                        <p className="m-0 text-[14.5px] text-[color:var(--dusk-ink-2)] line-clamp-4 group-hover:text-[color:var(--dusk-ink)]">{issue.intro_synthesis}</p>
                        <div className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)] flex items-end justify-between gap-3">
                          {stat ? (
                            <div className="min-w-0">
                              <p className="dusk-display tabular-nums text-[1.35rem] leading-none m-0 text-[color:var(--dusk-sunset)]">{stat.value}</p>
                              <p className="dusk-mono uppercase text-[10px] tracking-[0.07em] text-[color:var(--dusk-muted)] mt-1.5 mb-0">{stat.label}</p>
                            </div>
                          ) : (
                            <span />
                          )}
                          <span className="dusk-mono text-[11px] text-[color:var(--dusk-ink-2)] whitespace-nowrap">{t('index.read')}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            {recaps > 0 && (
              <Link href="/recaps" className="dusk-card p-5 sm:p-6 mt-2 flex flex-wrap items-center justify-between gap-4 group">
                <div className="min-w-0">
                  <p className="dusk-label m-0">{t('recapsLabel')}</p>
                  <p className="mt-1 mb-0 text-[17px] font-semibold group-hover:text-[color:var(--dusk-peach)]">
                    {t('recapsTitle')} · {t('recapsCount', { count: recaps })}
                  </p>
                </div>
                <span className="dusk-pill text-[14.5px]">{t('recapsCta')}</span>
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
