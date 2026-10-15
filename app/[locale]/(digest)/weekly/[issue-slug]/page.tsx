import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { readFeaturedStats } from '@/lib/hookDeliver';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../../../(blog)/dusk-font';
import '../../../(blog)/dusk.css';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; 'issue-slug': string }>;

type DigestItem = {
  id: string;
  slug: string | null;
  source_name: string;
  source_url: string;
  headline: string;
  headline_es: string | null;
  our_summary: string;
  our_summary_es: string | null;
  stats: unknown;
  published_at: string;
};

async function getIssue(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('slug', slug)
    .eq('series', 'newsletter')
    .single();
  return data;
}

async function getItems(issueId: string): Promise<DigestItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_items')
    .select('id, slug, source_name, source_url, headline, headline_es, our_summary, our_summary_es, stats, published_at')
    .eq('issue_id', issueId)
    // Same order as the /weekly index (stories of one issue often share a timestamp).
    .order('published_at', { ascending: true })
    .order('id', { ascending: true });
  return (data ?? []) as DigestItem[];
}

// The published issues either side of this one, for the "More issues" navigation.
async function getNeighbours(publishedAt: string) {
  const supabase = createClient();
  const base = () =>
    supabase.from('digest_issues').select('slug').eq('status', 'published').eq('series', 'newsletter');
  const [{ data: older }, { data: newer }] = await Promise.all([
    base().lt('published_at', publishedAt).order('published_at', { ascending: false }).limit(1),
    base().gt('published_at', publishedAt).order('published_at', { ascending: true }).limit(1),
  ]);
  return { older: (older?.[0]?.slug as string | undefined) ?? null, newer: (newer?.[0]?.slug as string | undefined) ?? null };
}

function issueNumber(slug: string): string {
  const m = slug.match(/vol-(\d+)/i);
  return m ? m[1].padStart(2, '0') : '01';
}

const volOf = (slug: string) => Number(slug.match(/vol-(\d+)/i)?.[1] ?? 0);
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

function localeUrl(locale: string, path: string): string {
  return locale === 'en' ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, 'issue-slug': slug } = await params;
  const issue = await getIssue(slug);
  if (!issue) return { title: 'Weekly Digest — PaddockIntel' };
  const canonical = localeUrl(locale, `/weekly/${slug}/`);
  return {
    title: `Digest Vol.${issueNumber(slug as string)} — PaddockIntel`,
    description: (issue.intro_synthesis as string).slice(0, 145),
    alternates: { canonical },
    openGraph: openGraphFor(canonical),
  };
}

export default async function DigestIssuePage({ params }: { params: PageParams }) {
  const { locale, 'issue-slug': slug } = await params;

  const issue = await getIssue(slug);
  if (!issue) notFound();

  const [items, neighbours, t, tArticle, format] = await Promise.all([
    getItems(issue.id as string),
    getNeighbours(issue.published_at as string),
    getTranslations('digest'),
    getTranslations('articleDusk'),
    getFormatter(),
  ]);

  const isEs = locale === 'es';
  const stories = items.map((it, i) => {
    const s = readFeaturedStats(it.stats)[0];
    return {
      ...it,
      n: String(i + 1).padStart(2, '0'),
      headline: isEs ? it.headline_es ?? it.headline : it.headline,
      summary: isEs ? it.our_summary_es ?? it.our_summary : it.our_summary,
      stat: s ? { value: s.value, label: isEs ? s.label_es ?? s.label : s.label } : null,
    };
  });
  const numbers = stories.filter((s) => s.stat).slice(0, 4);
  const sources = new Set(items.map((it) => it.source_name)).size;
  const vol = volOf(slug);
  const longDate = format.dateTime(dayDate(issue.published_at as string), { month: 'short', day: 'numeric', year: 'numeric' });
  const shortDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric' });

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tArticle('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
          {' / '}
          <Link href="/weekly" className="hover:text-[color:var(--dusk-ink)]">{t('kicker')}</Link>
          {` / ${t('vol', { n: vol })}`}
        </nav>

        {/* Cover */}
        <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
          <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">{t('issueKicker', { date: longDate })}</p>
          <h1 className="dusk-display m-0 text-[clamp(3rem,8vw,5.6rem)] leading-[0.9] tracking-[-0.03em]">{t('vol', { n: vol })}</h1>
          <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{issue.intro_synthesis as string}</p>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
            <Link href="/about" className="hover:text-[color:var(--dusk-peach)]">{t('editedBy')}</Link>
            <span>{t('storiesCount', { count: items.length })}</span>
            <span>{t('sourcesCount', { count: sources })}</span>
          </div>
        </header>

        {/* The numbers in this issue: each links to its story below */}
        {numbers.length > 0 && (
          <section aria-label={t('numbersAria')} className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {numbers.map((s) => (
              <a key={s.id} href={`#story-${s.n}`} className="dusk-card p-4 sm:p-6 flex flex-col gap-2.5 group min-w-0">
                <p className="dusk-display tabular-nums text-[clamp(1.5rem,6vw,2.5rem)] leading-none tracking-[-0.03em] m-0 [overflow-wrap:anywhere]">{s.stat?.value}</p>
                <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] m-0">{s.stat?.label}</p>
                <p className="text-[13.5px] text-[color:var(--dusk-ink-2)] m-0 group-hover:text-[color:var(--dusk-ink)]">
                  {t('storyRef', { n: s.n, source: s.source_name })}
                </p>
              </a>
            ))}
          </section>
        )}

        {/* Stories on the light sheet + rail */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
            <div className="max-w-[64ch] mx-auto">
              {stories.map((s) => (
                <section
                  key={s.id}
                  id={`story-${s.n}`}
                  className="scroll-mt-20 py-7 border-t border-[color:var(--border)] first:border-t-0 first:pt-0"
                  aria-labelledby={`story-${s.n}-title`}
                >
                  <p className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] m-0 mb-1.5">
                    {s.n} · {s.source_name} · {shortDate(s.published_at)}
                  </p>
                  <h2 id={`story-${s.n}-title`} className="dusk-display m-0 mb-2 text-[clamp(1.25rem,1.9vw,1.5rem)] leading-tight tracking-[-0.01em]">
                    {s.slug ? (
                      <Link href={`/feed/${s.slug}`} className="hover:text-[color:var(--accent)]">{s.headline}</Link>
                    ) : (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--accent)]">{s.headline}</a>
                    )}
                  </h2>
                  {s.stat && (
                    <p className="flex flex-wrap items-baseline gap-2.5 m-0 mb-3">
                      <span className="dusk-display tabular-nums text-[1.6rem] leading-none text-[color:var(--accent)]">{s.stat.value}</span>
                      <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--text-3)]">{s.stat.label}</span>
                    </p>
                  )}
                  <p className="font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-4">{s.summary}</p>
                  <div className="flex flex-wrap gap-4 text-[14.5px] font-semibold">
                    {s.slug && (
                      <Link href={`/feed/${s.slug}`} className="text-[color:var(--accent)] hover:underline">{t('ourBrief')}</Link>
                    )}
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">
                      {t('readSource', { source: s.source_name })}
                    </a>
                  </div>
                </section>
              ))}

              <p className="mt-6 pt-6 border-t border-[color:var(--border-subtle)] font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-3)]">
                {tArticle('writtenBy')}{' '}
                <Link href="/about" className="text-[color:var(--text-1)] hover:text-[color:var(--accent)]">Ismael Sandoval</Link>
                {' '}· PaddockIntel
              </p>
            </div>
          </article>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            {stories.length > 0 && (
              <section className="dusk-card p-5 hidden lg:flex flex-col gap-2" aria-labelledby="weekly-toc-title">
                <h2 id="weekly-toc-title" className="dusk-label m-0 font-normal">{t('inIssue')}</h2>
                <ol className="m-0 p-0 list-none max-h-[50vh] overflow-y-auto">
                  {stories.map((s) => (
                    <li key={s.id} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                      <a href={`#story-${s.n}`} className="grid grid-cols-[26px_minmax(0,1fr)] gap-1.5 py-2 text-[13.5px] leading-[1.35] text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">
                        <span className="dusk-mono text-[11px] text-[color:var(--dusk-muted)]">{s.n}</span>
                        {s.headline}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <NewsletterBand title={t('subTitle')} />
            <section className="dusk-card p-5 flex flex-col gap-2.5" aria-labelledby="weekly-more-title">
              <h2 id="weekly-more-title" className="dusk-label m-0 font-normal">{t('moreIssues')}</h2>
              <div className="flex justify-between gap-3 text-[14px]">
                {neighbours.older ? (
                  <Link href={`/weekly/${neighbours.older}`} className="text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">
                    ← {t('vol', { n: volOf(neighbours.older) })}
                  </Link>
                ) : (
                  <span />
                )}
                {neighbours.newer && (
                  <Link href={`/weekly/${neighbours.newer}`} className="text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">
                    {t('vol', { n: volOf(neighbours.newer) })} →
                  </Link>
                )}
              </div>
              <Link href="/weekly" className="dusk-link text-[13px]">{t('allIssues')}</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
