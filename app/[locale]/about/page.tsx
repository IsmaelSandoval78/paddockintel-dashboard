import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { SITE_URL, localeUrl } from '@/lib/site-url';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { duskSans } from '../(blog)/dusk-font';
import '../(blog)/dusk.css';
import { openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;
type Stat = { value: string; label: string; unit?: string };
type Principle = { title: string; body: string };
type ReadItem = { name: string; desc: string; href: string };

// The three numbers under "Why this perspective matters" come from our own published analysis,
// read live from each article (in the reader's locale) -- never typed into this page.
// The publication's contact address, also on the privacy page; Google News looks for one on a
// publisher's About page.
const CONTACT_EMAIL = 'info@paddockintel.com';

const WHY_SLUGS = [
  'f1-cost-cap-midfield-podiums-vowles-data-2026',
  'f1-team-principal-firing-cost-2026',
  'f1-2026-qatar-abu-dhabi-hosting-fee-standoff',
];

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, '/about/');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: localeUrl(locale, '/about/'),
      languages: { ...languages, 'x-default': languages.en },
    },
    openGraph: openGraphFor(localeUrl(locale, '/about/')),
  };
}

// Today as YYYY-MM-DD, kept out of the component body (react-hooks/purity).
const today = () => new Date().toISOString().slice(0, 10);

async function getData(locale: string) {
  const supabase = createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [author, articlesEn, articlesAll, enSources, feed, issues, firstIssue, races, results, glossary, whyEn] = await Promise.all([
    supabase.from('authors').select('name, bio').eq('slug', 'ismael-sandoval').maybeSingle(),
    count(supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('locale', 'en')),
    count(supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    supabase.from('articles').select('sources').eq('status', 'published').eq('locale', 'en'),
    count(supabase.from('digest_items').select('id', { count: 'exact', head: true }).not('slug', 'is', null)),
    count(supabase.from('digest_issues').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('series', 'newsletter')),
    supabase.from('digest_issues').select('published_at').eq('status', 'published').eq('series', 'newsletter').order('published_at').limit(1).maybeSingle(),
    count(supabase.from('races').select('id', { count: 'exact', head: true }).lte('date', today())),
    count(supabase.from('results').select('id', { count: 'exact', head: true })),
    supabase.from('glossary_terms').select('slug').eq('locale', 'en').eq('status', 'published'),
    supabase.from('articles').select('slug, translation_group_id').eq('locale', 'en').in('slug', WHY_SLUGS),
  ]);

  const groups = (whyEn.data ?? []) as { slug: string; translation_group_id: string }[];
  const { data: whyRows } = groups.length
    ? await supabase
        .from('articles')
        .select('slug, title, stats, translation_group_id')
        .eq('locale', locale)
        .eq('status', 'published')
        .in('translation_group_id', groups.map((g) => g.translation_group_id))
    : { data: [] };
  const why = WHY_SLUGS.map((s) => {
    const group = groups.find((g) => g.slug === s)?.translation_group_id;
    const row = (whyRows ?? []).find((r) => r.translation_group_id === group) as
      | { slug: string; title: string; stats: Stat[] | null }
      | undefined;
    const stat = row?.stats?.[0];
    return row && stat ? { slug: row.slug, title: row.title, stat } : null;
  }).filter((w): w is { slug: string; title: string; stat: Stat } => Boolean(w));

  return {
    author: author.data as { name: string; bio: string | null } | null,
    articlesEn,
    articlesAll,
    sourcesEn: ((enSources.data ?? []) as { sources: unknown[] | null }[]).reduce((n, a) => n + (a.sources?.length ?? 0), 0),
    feed,
    issues,
    firstIssue: (firstIssue.data?.published_at as string | undefined) ?? null,
    races,
    results,
    glossary: new Set(((glossary.data ?? []) as { slug: string }[]).map((g) => g.slug)).size,
    why,
  };
}

export default async function AboutPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const [t, tDisclaimer, tCrumbs, format, d] = await Promise.all([
    getTranslations('about'),
    getTranslations('aboutDisclaimer'),
    getTranslations('articleDusk'),
    getFormatter(),
    getData(locale),
  ]);

  const n = (v: number) => format.number(v);
  const name = d.author?.name ?? 'Ismael Sandoval';
  // English reads the bio from the authors table (editable without a deploy); Spanish and
  // Portuguese use the translated paragraphs in the locale files.
  const bio: string[] =
    locale === 'en' ? (d.author?.bio ?? '').split('\n\n').filter(Boolean) : (t.raw('who.bio') as string[]);
  const principles = t.raw('how.principles') as Principle[];
  const readItems = t.raw('read.items') as ReadItem[];
  const pillars = t.raw('cover.pillars') as Principle[];

  const stats = [
    { v: n(d.articlesEn), l: t('stats.articles'), u: t('stats.articlesUnit', { count: n(d.articlesAll) }) },
    { v: n(d.sourcesEn), l: t('stats.sources'), u: t('stats.sourcesUnit') },
    { v: n(d.feed), l: t('stats.feed'), u: t('stats.feedUnit') },
    {
      v: n(d.issues),
      l: t('stats.issues'),
      u: d.firstIssue
        ? t('stats.issuesUnit', { date: format.dateTime(new Date(`${d.firstIssue.slice(0, 10)}T12:00:00Z`), { month: 'long', year: 'numeric' }) })
        : '',
    },
    { v: n(d.races), l: t('stats.races'), u: t('stats.racesUnit', { count: n(d.results) }) },
    { v: n(d.glossary), l: t('stats.glossary'), u: t('stats.glossaryUnit') },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: localeUrl(locale, '/about/'),
    name: t('metaTitle'),
    mainEntity: {
      '@type': 'Person',
      name,
      url: `${SITE_URL}/about/`,
      jobTitle: 'Onboarding & Estimating Coordinator',
      worksFor: { '@type': 'Organization', name: 'Verst Logistics' },
      knowsAbout: ['Formula 1', 'Supply chain operations', 'Sports business'],
    },
    publisher: {
      '@type': 'Organization',
      name: 'PaddockIntel',
      url: SITE_URL,
      email: CONTACT_EMAIL,
      contactPoint: { '@type': 'ContactPoint', contactType: 'editorial', email: CONTACT_EMAIL },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('crumb')}
          </nav>

          {/* Cover */}
          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">{t('kicker')}</p>
            <h1 className="dusk-display m-0 text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.02em] max-w-[22ch] text-balance">{t('headline')}</h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{t('dek')}</p>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
              <span>
                {t('byline')} <span className="text-[color:var(--dusk-ink)] font-medium">{name}</span>
              </span>
              <span>{t('independent')}</span>
            </div>
          </header>

          {/* PaddockIntel in numbers -- live counts */}
          <section aria-label={t('stats.aria')} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div key={s.l} className="dusk-card p-4 sm:p-6 flex flex-col gap-2.5 min-w-0">
                <p className="dusk-display tabular-nums text-[clamp(1.6rem,4vw,2.4rem)] leading-none tracking-[-0.03em] m-0">{s.v}</p>
                <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] m-0">{s.l}</p>
                {s.u && <p className="text-[13px] text-[color:var(--dusk-ink-2)] m-0">{s.u}</p>}
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
              <div className="max-w-[64ch] mx-auto">
                <p className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--text-3)] m-0 mb-2">{t('who.label')}</p>
                <h2 className="dusk-display m-0 text-[clamp(1.35rem,2vw,1.6rem)] leading-tight tracking-[-0.01em]">{t('who.heading')}</h2>

                <dl className="my-6 rounded-[14px] overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] text-[15px]">
                  {[
                    [t('who.current'), t('who.currentValue')],
                    [t('who.previous'), t('who.previousValue')],
                    [t('who.clients'), t('who.clientsValue')],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)] gap-3 px-3.5 py-2.5 border-t border-[color:var(--border)] first:border-t-0">
                      <dt className="dusk-mono uppercase text-[11px] tracking-[0.07em] text-[color:var(--text-3)] pt-0.5">{k}</dt>
                      <dd className="m-0">{v}</dd>
                    </div>
                  ))}
                </dl>

                {bio.map((p, i) => (
                  <p key={i} className="font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-4">{p}</p>
                ))}

                {d.why.length > 0 && (
                  <section aria-labelledby="about-why" className="mt-10">
                    <h2 id="about-why" className="dusk-display m-0 mb-2 text-[clamp(1.35rem,2vw,1.6rem)] leading-tight tracking-[-0.01em]">{t('why.heading')}</h2>
                    <p className="font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-3">{t('why.intro')}</p>
                    <ul className="m-0 p-0 list-none">
                      {d.why.map((w) => (
                        <li key={w.slug} className="grid grid-cols-1 sm:grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-1 py-3.5 border-t border-[color:var(--border)] first:border-t-0 items-baseline">
                          <span className="dusk-display tabular-nums text-[1.35rem] leading-tight text-[color:var(--accent)]">{w.stat.value}</span>
                          <div className="min-w-0">
                            <p className="m-0 text-[16px] leading-[1.5] font-semibold">{w.title}</p>
                            <p className="m-0 mt-1 dusk-mono uppercase text-[10.5px] tracking-[0.05em] text-[color:var(--text-3)]">
                              {w.stat.label}{w.stat.unit ? ` · ${w.stat.unit}` : ''}
                            </p>
                            <Link href={`/${w.slug}`} className="inline-block mt-1.5 text-[14px] font-semibold text-[color:var(--accent)] hover:underline">{t('why.read')}</Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section aria-labelledby="about-how" className="mt-10">
                  <h2 id="about-how" className="dusk-display m-0 mb-2 text-[clamp(1.35rem,2vw,1.6rem)] leading-tight tracking-[-0.01em]">{t('how.heading')}</h2>
                  <ol className="m-0 p-0 list-none">
                    {principles.map((p, i) => (
                      <li key={p.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-2 py-3.5 border-t border-[color:var(--border)] first:border-t-0">
                        <span className="dusk-mono text-[12px] text-[color:var(--accent)] pt-1">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="m-0 text-[16.5px] font-semibold">{p.title}</p>
                          <p className="m-0 mt-1 text-[15.5px] leading-[1.55] text-[color:var(--text-2)]">{p.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              <section id="contact" className="dusk-card p-5 flex flex-col gap-2 scroll-mt-20" aria-labelledby="about-contact">
                <h2 id="about-contact" className="dusk-label m-0 font-normal">{t('contact.title')}</h2>
                <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{t('contact.body')}</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[15px] font-semibold hover:text-[color:var(--dusk-peach)] break-all">
                  {CONTACT_EMAIL}
                </a>
              </section>
              <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="about-read">
                <h2 id="about-read" className="dusk-label m-0 font-normal">{t('read.title')}</h2>
                <ul className="m-0 p-0 list-none">
                  {readItems.map((r) => (
                    <li key={r.name} className="py-3 border-t border-[color:var(--dusk-line)] first:border-t-0">
                      <Link href={r.href} className="text-[15px] font-semibold hover:text-[color:var(--dusk-peach)]">{r.name}</Link>
                      <p className="m-0 mt-1 text-[13.5px] text-[color:var(--dusk-ink-2)]">{r.desc}</p>
                    </li>
                  ))}
                </ul>
              </section>
              <NewsletterBand title={t('subTitle')} />
            </aside>
          </div>

          <section aria-labelledby="about-cover" className="flex flex-col gap-4 mt-2">
            <div className="pb-2 border-b border-[color:var(--dusk-line)]">
              <h2 id="about-cover" className="dusk-display m-0 text-[1.35rem] leading-tight">{t('cover.heading')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pillars.map((p) => (
                <div key={p.title} className="dusk-card p-5 sm:p-[22px] flex flex-col gap-2">
                  <h3 className="m-0 text-[17px] font-semibold">{p.title}</h3>
                  <p className="m-0 text-[14.5px] text-[color:var(--dusk-ink-2)]">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="dusk-card p-5 sm:p-6 flex flex-col gap-3" aria-labelledby="about-disclaimer">
            <h2 id="about-disclaimer" className="dusk-label m-0 font-normal">{tDisclaimer('heading')}</h2>
            <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{tDisclaimer('affiliation')}</p>
            <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{tDisclaimer('accuracy')}</p>
          </section>
        </div>
      </main>
    </>
  );
}
