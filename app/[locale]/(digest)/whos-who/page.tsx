import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { SITE_URL } from '@/lib/site-url';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

const WHOS_WHO_URLS = {
  en: `${SITE_URL}/whos-who/`,
  es: `${SITE_URL}/es/whos-who/`,
  pt: `${SITE_URL}/pt/whos-who/`,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('whosWho');
  const canonical = WHOS_WHO_URLS[locale as keyof typeof WHOS_WHO_URLS] ?? WHOS_WHO_URLS.en;
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
    alternates: {
      canonical,
      languages: { ...WHOS_WHO_URLS, 'x-default': WHOS_WHO_URLS.en },
    },
  };
}

export const revalidate = 3600;

type Category = 'investigation' | 'construction' | 'critique' | 'context' | 'data';

const CATEGORY_ORDER: Category[] = ['investigation', 'construction', 'critique', 'context', 'data'];

type PickRow = {
  expert_id: string;
  post_url: string;
  topic: string | null;
  takeaway: string;
  locale: string;
  created_at: string;
  experts: {
    name: string;
    slug: string;
    category: Category;
    role: string;
    credibility_note: string | null;
    x_handle: string | null;
  } | null;
};

type ExpertRow = { id: string; name: string; category: Category; x_handle: string | null };

async function getData() {
  const supabase = createClient();
  const [{ data: picks }, { data: experts }] = await Promise.all([
    supabase
      .from('expert_picks')
      .select('expert_id, post_url, topic, takeaway, locale, created_at, experts(name, slug, category, role, credibility_note, x_handle)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .returns<PickRow[]>(),
    supabase
      .from('experts')
      .select('id, name, category, x_handle')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .returns<ExpertRow[]>(),
  ]);
  return { picks: (picks ?? []).filter((p) => p.experts), experts: experts ?? [] };
}

// "2026-10-01T19:11:03…" -> a Date at noon UTC, so formatting never shifts the calendar day.
const dayDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

export default async function WhosWhoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [{ picks, experts }, t, tCategories, tCrumbs, format] = await Promise.all([
    getData(),
    getTranslations('whosWho'),
    getTranslations('whosWho.categories'),
    getTranslations('articleDusk'),
    getFormatter(),
  ]);

  const longDate = (iso: string) => format.dateTime(dayDate(iso), { month: 'short', day: 'numeric', year: 'numeric' });
  const latest = picks[0];
  const rest = picks.slice(1);
  const quoted = new Set(picks.map((p) => p.expert_id));
  const countByCategory = new Map<Category, number>();
  for (const p of picks) countByCategory.set(p.experts!.category, (countByCategory.get(p.experts!.category) ?? 0) + 1);
  const byCategory = new Map<Category, PickRow[]>();
  for (const p of rest) byCategory.set(p.experts!.category, [...(byCategory.get(p.experts!.category) ?? []), p]);

  const handle = (h: string | null, cls: string) =>
    h ? (
      <a href={`https://x.com/${h}`} target="_blank" rel="noopener noreferrer" className={cls}>
        @{h}
      </a>
    ) : null;
  // A pick written in another language than the page keeps its original text, marked as such.
  const langTag = (p: PickRow) =>
    p.locale !== locale ? (
      <span className="dusk-mono text-[10.5px] tracking-[0.06em] px-2 py-[3px] rounded-full border border-[rgba(143,211,255,0.35)] text-[color:var(--dusk-ice)] whitespace-nowrap">
        {t('inLanguage', { lang: p.locale })}
      </span>
    ) : null;
  const topicTag = (p: PickRow) =>
    p.topic ? (
      <span className="dusk-mono text-[11px] px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.06)] border border-[color:var(--dusk-line)] text-[color:var(--dusk-ink-2)] whitespace-nowrap">
        {p.topic.replace(/-/g, ' ')}
      </span>
    ) : null;

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
        <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
          <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link> / {t('kicker')}
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            {latest && <p className="dusk-label m-0">{t('kicker')} · {t('updated', { date: longDate(latest.created_at) })}</p>}
            <h1 className="dusk-display mt-1.5 mb-0 text-[clamp(2rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em]">{t('title')}</h1>
            <p className="mt-2.5 mb-0 text-[color:var(--dusk-ink-2)] max-w-[62ch]">{t('description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="dusk-chip">
              <span className="dusk-chip-dot" aria-hidden="true" />
              {t('picksCount', { count: picks.length })}
            </span>
            <span className="dusk-chip">{t('quotedCount', { count: quoted.size })}</span>
            <span className="dusk-chip">{t('trackedCount', { count: experts.length })}</span>
          </div>
        </header>

        {picks.length > 0 && (
          <nav aria-label={t('lensesAria')} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {CATEGORY_ORDER.map((c) => (
              <a key={c} href={`#${c}`} className="dusk-card group p-3.5 sm:p-[18px] flex flex-col gap-2 min-w-0">
                <span className="dusk-display tabular-nums text-[1.6rem] sm:text-[2rem] leading-none text-[color:var(--dusk-sunset)]">
                  {format.number(countByCategory.get(c) ?? 0)}
                </span>
                <span className="text-[16px] font-semibold group-hover:text-[color:var(--dusk-peach)]">{tCategories(`${c}.label`)}</span>
                <span className="hidden md:block text-[13px] leading-[1.4] text-[color:var(--dusk-ink-2)]">{tCategories(`${c}.lens`)}</span>
              </a>
            ))}
          </nav>
        )}

        {latest && (
          <article className="dusk-card dusk-feed-lead p-6 sm:p-8 flex flex-col gap-3.5">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
              {t('latestPick', { lens: tCategories(`${latest.experts!.category}.label`), date: longDate(latest.created_at) })}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2 className="dusk-display m-0 text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.05] tracking-[-0.02em]">{latest.experts!.name}</h2>
              {handle(latest.experts!.x_handle, 'dusk-mono text-[12px] text-[color:var(--dusk-sunset)] hover:text-[color:var(--dusk-peach)]')}
            </div>
            <p className="m-0 text-[13px] text-[#E2CEC6]">{latest.experts!.role}</p>
            <p lang={latest.locale} className="dusk-hero-dek m-0 pl-3.5 border-l-[3px] border-[color:var(--dusk-sunset)] text-[16px] md:text-[18.5px] leading-[1.6] max-w-[72ch]">
              {latest.takeaway}
            </p>
            <div className="flex flex-wrap gap-2">
              {topicTag(latest)}
              {langTag(latest)}
            </div>
            <a href={latest.post_url} target="_blank" rel="noopener noreferrer" className="dusk-pill self-start text-[14.5px]">
              {t('readOriginal')}
            </a>
          </article>
        )}

        {CATEGORY_ORDER.map((category) => {
          const list = byCategory.get(category);
          if (!list || list.length === 0) return null;
          return (
            <section key={category} id={category} aria-labelledby={`voices-${category}`} className="scroll-mt-20 flex flex-col gap-4 mt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-2 border-b border-[color:var(--dusk-line)]">
                <h2 id={`voices-${category}`} className="dusk-display m-0 text-[1.35rem] leading-tight">{tCategories(`${category}.label`)}</h2>
                <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">{tCategories(`${category}.lens`)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((pick) => {
                  const expert = pick.experts!;
                  return (
                    <article key={pick.post_url} className="dusk-card p-5 sm:p-[22px] flex flex-col gap-3 min-w-0">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="dusk-mono uppercase text-[11px] tracking-[0.06em] text-[color:var(--dusk-muted)]">{longDate(pick.created_at)}</span>
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {langTag(pick)}
                          {topicTag(pick)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h3 className="m-0 text-[18px] font-semibold">{expert.name}</h3>
                        {handle(expert.x_handle, 'dusk-mono text-[12px] text-[color:var(--dusk-sunset)] hover:text-[color:var(--dusk-peach)]')}
                      </div>
                      <p className="m-0 text-[13px] text-[color:var(--dusk-muted)]">{expert.role}</p>
                      <p lang={pick.locale} className="m-0 pl-3.5 border-l-[3px] border-[color:var(--dusk-warm)] text-[15px] leading-[1.6]">
                        {pick.takeaway}
                      </p>
                      <div className="mt-auto pt-2.5 border-t border-[color:var(--dusk-line)]">
                        <a
                          href={pick.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] font-semibold text-[color:var(--dusk-peach)] hover:text-[color:var(--dusk-ink)]"
                        >
                          {t('readOriginal')}
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {experts.length > 0 && (
          <section className="dusk-card p-5 sm:p-6 flex flex-col gap-4 mt-2" aria-labelledby="voices-roster">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-2 border-b border-[color:var(--dusk-line)]">
              <h2 id="voices-roster" className="dusk-display m-0 text-[1.35rem] leading-tight">{t('rosterTitle')}</h2>
              <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)] max-w-[70ch]">{t('rosterNote', { count: experts.length })}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-6 gap-y-5">
              {CATEGORY_ORDER.map((c) => {
                const group = experts.filter((x) => x.category === c);
                if (group.length === 0) return null;
                return (
                  <div key={c} className="min-w-0">
                    <p className="dusk-label m-0">{tCategories(`${c}.label`)} · {format.number(group.length)}</p>
                    <ul className="mt-1.5 mb-0 p-0 list-none">
                      {group.map((x) => (
                        <li key={x.id} className="flex justify-between gap-2 py-1.5 border-t border-[color:var(--dusk-line)] first:border-t-0 text-[14px]">
                          {x.x_handle ? (
                            <a href={`https://x.com/${x.x_handle}`} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:text-[color:var(--dusk-peach)]">
                              {x.name}
                            </a>
                          ) : (
                            <span className="min-w-0">{x.name}</span>
                          )}
                          {quoted.has(x.id) && (
                            <span className="dusk-mono text-[10.5px] text-[color:var(--dusk-sunset)] whitespace-nowrap">{t('quoted')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
