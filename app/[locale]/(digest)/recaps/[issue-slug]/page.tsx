import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../../../(blog)/dusk-font';
import '../../../(blog)/dusk.css';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; 'issue-slug': string }>;

type DigestItem = {
  id: string;
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
  published_at: string;
};

type Recap = { id: string; slug: string; published_at: string; intro_synthesis: string };

async function getRecap(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('slug', slug)
    .eq('series', 'recap')
    .eq('status', 'published')
    .maybeSingle();
  return data as Recap | null;
}

async function getItems(issueId: string): Promise<DigestItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_items')
    .select('id, source_name, source_url, headline, our_summary, published_at')
    .eq('issue_id', issueId)
    .order('published_at', { ascending: true })
    .order('id', { ascending: true });
  return (data ?? []) as DigestItem[];
}

async function getOtherRecaps(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('slug, published_at')
    .eq('status', 'published')
    .eq('series', 'recap')
    .neq('slug', slug)
    .order('published_at', { ascending: false });
  return (data ?? []) as { slug: string; published_at: string }[];
}

function recapNumber(slug: string): string {
  const m = slug.match(/recap-(\d+)/i);
  return m ? m[1].padStart(2, '0') : '01';
}

// "2026-08-13T…" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

function localeUrl(locale: string, path: string): string {
  return locale === 'en' ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, 'issue-slug': slug } = await params;
  const [recap, t] = await Promise.all([getRecap(slug), getTranslations({ locale, namespace: 'recaps' })]);
  if (!recap) return { title: t('metaTitle') };
  const canonical = localeUrl(locale, `/recaps/${slug}/`);
  return {
    title: t('detail.metaTitle', { n: recapNumber(slug) }),
    description: recap.intro_synthesis.slice(0, 145),
    alternates: { canonical },
    openGraph: openGraphFor(canonical),
  };
}

export default async function RecapIssuePage({ params }: { params: PageParams }) {
  const { locale, 'issue-slug': slug } = await params;
  const recap = await getRecap(slug);
  if (!recap) notFound();

  const [items, others, t, tDigest, tArticle, format] = await Promise.all([
    getItems(recap.id),
    getOtherRecaps(slug),
    getTranslations('recaps'),
    getTranslations('digest'),
    getTranslations('articleDusk'),
    getFormatter(),
  ]);

  const volNum = recapNumber(slug);
  const longDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'long', day: 'numeric', year: 'numeric' });
  const shortDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });
  // What a recap covers is the span of its own stories' dates -- never the week in its slug.
  const dates = items.map((it) => it.published_at.slice(0, 10)).sort();
  const covers = dates.length
    ? format.dateTimeRange(dayDate(dates[0]), dayDate(dates[dates.length - 1]), { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const stories = items.map((it, i) => ({ ...it, n: String(i + 1).padStart(2, '0') }));
  const sources = new Set(items.map((it) => it.source_name)).size;
  // Recap syntheses and stories exist only in English; mark them so on /es/ and /pt/.
  const contentLang = locale === 'en' ? undefined : 'en';

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tArticle('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{tDigest('crumbHome')}</Link>
          {' / '}
          <Link href="/recaps" className="hover:text-[color:var(--dusk-ink)]">{t('kicker')}</Link>
          {` / ${t('vol', { n: volNum })}`}
        </nav>

        {/* Cover */}
        <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
          <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">{t('detail.kicker')}</p>
          <h1 className="dusk-display m-0 text-[clamp(3rem,8vw,5.6rem)] leading-[0.9] tracking-[-0.03em]">{t('vol', { n: volNum })}</h1>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 m-0">
            {covers && (
              <div className="rounded-[14px] px-3 py-2.5 bg-[rgba(14,13,18,0.35)] border border-[rgba(255,255,255,0.1)]">
                <dt className="dusk-mono uppercase text-[10.5px] tracking-[0.08em] text-[#CDB8B4]">{t('detail.coversLabel')}</dt>
                <dd className="m-0 mt-1 text-[14.5px]">{covers}</dd>
              </div>
            )}
            <div className="rounded-[14px] px-3 py-2.5 bg-[rgba(14,13,18,0.35)] border border-[rgba(255,255,255,0.1)]">
              <dt className="dusk-mono uppercase text-[10.5px] tracking-[0.08em] text-[#CDB8B4]">{t('detail.publishedLabel')}</dt>
              <dd className="m-0 mt-1 text-[14.5px]">
                <time dateTime={recap.published_at}>{longDate(recap.published_at)}</time>
              </dd>
            </div>
          </dl>
          <p lang={contentLang} className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{recap.intro_synthesis}</p>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
            <span>
              {t('detail.curatedBy')}{' '}
              <Link href="/about" className="text-[color:var(--dusk-ink)] font-medium hover:text-[color:var(--dusk-peach)]">Ismael Sandoval</Link>
            </span>
            <span>{tDigest('storiesCount', { count: items.length })}</span>
            <span>{tDigest('sourcesCount', { count: sources })}</span>
          </div>
        </header>

        {/* Stories on the light sheet + rail */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
            <div className="max-w-[64ch] mx-auto">
              <p className="m-0 mb-6 pb-6 border-b border-[color:var(--border)] text-[clamp(17px,1.4vw,19.5px)] leading-[1.6]">
                <span className="block dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] mb-2">{t('detail.retroLabel')}</span>
                {t('detail.retroBody', { date: longDate(recap.published_at) })}
              </p>
              {stories.map((s) => (
                <section
                  key={s.id}
                  lang={contentLang}
                  id={`story-${s.n}`}
                  className="scroll-mt-20 py-7 border-t border-[color:var(--border)] first-of-type:border-t-0 first-of-type:pt-0"
                  aria-labelledby={`story-${s.n}-title`}
                >
                  <p className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] m-0 mb-1.5">
                    {s.n} · {s.source_name} · {shortDate(s.published_at)}
                  </p>
                  <h2 id={`story-${s.n}-title`} className="dusk-display m-0 mb-2 text-[clamp(1.25rem,1.9vw,1.5rem)] leading-tight tracking-[-0.01em]">
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--accent)]">{s.headline}</a>
                  </h2>
                  <p className="font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-4">{s.our_summary}</p>
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-[14.5px] font-semibold text-[color:var(--accent)] hover:underline">
                    {tDigest('readSource', { source: s.source_name })}
                  </a>
                </section>
              ))}
            </div>
          </article>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            {stories.length > 0 && (
              <section className="dusk-card p-5 hidden lg:flex flex-col gap-2" aria-labelledby="recap-toc-title">
                <h2 id="recap-toc-title" className="dusk-label m-0 font-normal">{t('detail.inRecap')}</h2>
                <ol className="m-0 p-0 list-none">
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
            {others.length > 0 && (
              <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="recap-more-title">
                <h2 id="recap-more-title" className="dusk-label m-0 font-normal">{t('detail.moreRecaps')}</h2>
                <ul className="m-0 p-0 list-none">
                  {others.map((o) => (
                    <li key={o.slug} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                      <Link href={`/recaps/${o.slug}`} className="block py-2.5 text-[14px] hover:text-[color:var(--dusk-peach)]">
                        {t('vol', { n: recapNumber(o.slug) })}
                        <span className="block dusk-mono uppercase text-[10.5px] tracking-[0.04em] text-[color:var(--dusk-muted)] mt-0.5">
                          {t('publishedOn', { date: shortDate(o.published_at) })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/recaps" className="dusk-link text-[13px]">{t('detail.allRecaps')}</Link>
              </section>
            )}
            <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="recap-live-title">
              <h2 id="recap-live-title" className="dusk-label m-0 font-normal">{t('detail.liveTitle')}</h2>
              <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">{t('detail.liveBody')}</p>
              <Link href="/weekly" className="dusk-link text-[13px]">{t('detail.liveCta')}</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
