import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { SITE_URL, hubLocaleUrl, localeUrl } from '@/lib/site-url';
import { localizedPageMeta } from '@/lib/seo';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  allDataCards,
  asCardLocale,
  cardImagePath,
  cardCopyright,
  cardImageUrl,
  cardPageUrl,
  formatCardDate,
  formatCell,
  getDataCard,
  type DataCard,
} from '@/lib/dataCards';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

export const dynamicParams = false;

type PageParams = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => allDataCards().map((card) => ({ locale, slug: card.slug })));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const card = getDataCard(slug);
  if (!card) return {};
  const locale = asCardLocale(raw);
  const meta = localizedPageMeta(locale, `/data/${slug}/`);
  const image = { url: cardImageUrl(card, locale), width: CARD_WIDTH, height: CARD_HEIGHT, alt: card.alt[locale], type: 'image/png' };
  return {
    ...meta,
    title: `${card.title[locale]} — PaddockIntel`,
    description: card.metaDescription[locale],
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      title: card.title[locale],
      description: card.metaDescription[locale],
      publishedTime: card.publishedAt,
      modifiedTime: card.updatedAt,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: card.title[locale], description: card.metaDescription[locale], images: [image.url] },
  };
}

// relatedArticle is the EN slug; ES/PT editions have their own, found through translation_group_id
// (same lookup as the Feed's brief link). No published article -> no link rather than a 404.
async function relatedLink(enSlug: string, locale: string): Promise<{ href: string; en: boolean } | null> {
  const supabase = createClient();
  const { data: en } = await supabase
    .from('articles')
    .select('translation_group_id')
    .eq('slug', enSlug)
    .eq('locale', 'en')
    .eq('status', 'published')
    .maybeSingle();
  if (!en) return null;
  if (locale !== 'en' && en.translation_group_id) {
    const { data: local } = await supabase
      .from('articles')
      .select('slug')
      .eq('translation_group_id', en.translation_group_id)
      .eq('locale', locale)
      .eq('status', 'published')
      .maybeSingle();
    if (local) return { href: `/${local.slug}`, en: false };
  }
  return { href: `/${enSlug}`, en: locale !== 'en' };
}

function jsonLd(card: DataCard, locale: ReturnType<typeof asCardLocale>, crumbs: { home: string; index: string }) {
  const url = cardPageUrl(card.slug, locale);
  const org = { '@type': 'Organization', name: 'PaddockIntel', url: `${SITE_URL}/` };
  const image = {
    '@type': 'ImageObject',
    contentUrl: cardImageUrl(card, locale),
    url: cardImageUrl(card, locale),
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    caption: card.alt[locale],
    creditText: 'PaddockIntel',
    creator: org,
    copyrightNotice: cardCopyright(card),
  };
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: card.headline[locale],
      description: card.metaDescription[locale],
      inLanguage: locale,
      url,
      mainEntityOfPage: url,
      datePublished: card.publishedAt,
      dateModified: card.updatedAt,
      author: { ...org, url: `${SITE_URL}/about/` },
      publisher: { ...org, logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` } },
      image,
      copyrightHolder: org,
      copyrightYear: Number(card.publishedAt.slice(0, 4)),
      isBasedOn: card.sources.map((s) => s.url),
      citation: card.sources.map((s) => ({ '@type': 'CreativeWork', name: s.name, url: s.url })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: crumbs.home, item: localeUrl(locale, '/') },
        { '@type': 'ListItem', position: 2, name: crumbs.index, item: localeUrl(locale, '/data/') },
        { '@type': 'ListItem', position: 3, name: card.headline[locale] },
      ],
    },
  ];
}

export default async function DataCardPage({ params }: { params: PageParams }) {
  const { locale: raw, slug } = await params;
  const card = getDataCard(slug);
  if (!card) notFound();
  const locale = asCardLocale(raw);
  const t = await getTranslations({ locale, namespace: 'dataCards' });
  const related = card.relatedArticle ? await relatedLink(card.relatedArticle, locale) : null;

  const updated = card.updatedAt.slice(0, 10) !== card.publishedAt.slice(0, 10);

  const sheetH2 = 'dusk-display text-[clamp(1.25rem,1.9vw,1.5rem)] leading-tight tracking-[-0.01em] mt-9 mb-3 first:mt-0';
  const prose = 'font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0';
  const linkCls = 'font-semibold text-[color:var(--accent)] hover:underline';

  return (
    <>
      {jsonLd(card, locale, { home: t('crumbHome'), index: t('indexTitle') }).map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={t('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {' / '}
            <Link href="/data" className="hover:text-[color:var(--dusk-ink)]">{t('indexTitle')}</Link>
          </nav>

          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
              {t('kicker', { asOf: card.asOf[locale] })}
            </p>
            <h1 className="dusk-display m-0 text-[clamp(1.8rem,3.8vw,3rem)] leading-[1.06] tracking-[-0.02em] max-w-[28ch] text-balance [overflow-wrap:anywhere]">
              {card.headline[locale]}
            </h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18px] leading-[1.55] max-w-[64ch]">{card.subtitle[locale]}</p>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
              <Link href="/about" className="hover:text-[color:var(--dusk-peach)]">{t('by')}</Link>
              <time dateTime={card.publishedAt}>{t('published', { date: formatCardDate(card.publishedAt, locale) })}</time>
              {updated && <time dateTime={card.updatedAt}>{t('updated', { date: formatCardDate(card.updatedAt, locale) })}</time>}
              {card.xPostUrl && (
                <a href={card.xPostUrl} target="_blank" rel="noopener noreferrer" className="text-[color:var(--dusk-peach)] hover:underline">
                  {t('xPost')} ↗
                </a>
              )}
            </div>
          </header>

          <figure className="m-0 dusk-card p-2 sm:p-3">
            <Image
              src={cardImagePath(card, locale)}
              alt={card.alt[locale]}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              unoptimized
              priority
              sizes="(min-width: 1180px) 1140px, 100vw"
              className="block w-full h-auto rounded-[var(--radius-md)]"
            />
          </figure>

          <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
            <div className="max-w-[72ch] mx-auto">
              <h2 className={sheetH2}>{t('numbers')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[15px] sm:text-[16px] tabular-nums">
                  <caption className="sr-only">{`${card.subtitle[locale]} — ${card.asOf[locale]}`}</caption>
                  <thead>
                    <tr className="border-b-2 border-[color:var(--border)]">
                      {card.columns.map((col) => (
                        <th
                          key={col.key}
                          scope="col"
                          className={`py-2.5 px-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-2)] font-medium ${col.numeric ? 'text-right' : 'text-left'}`}
                        >
                          {col.label[locale]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {card.rows.map((row, r) => (
                      <tr
                        key={r}
                        className={`border-b border-[color:var(--border-subtle)] ${r === card.highlightRow ? 'bg-[color:var(--accent-dim)] font-semibold' : ''}`}
                      >
                        {card.columns.map((col, i) =>
                          i === 0 ? (
                            <th key={col.key} scope="row" className="py-3 px-2 text-left font-semibold">
                              {formatCell(row[col.key], col, locale)}
                            </th>
                          ) : (
                            <td key={col.key} className={`py-3 px-2 ${col.numeric ? 'text-right' : 'text-left'}`}>
                              {formatCell(row[col.key], col, locale)}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-3)]">{card.asOf[locale]}</p>

              <h2 className={sheetH2}>{t('context')}</h2>
              <p className={prose}>{card.context[locale]}</p>
              {related &&
                (related.en ? (
                  // EN fallback from another locale: a plain link to the unprefixed EN URL.
                  <a href={`${related.href}/`} hrefLang="en" className={`inline-block mt-4 ${linkCls}`}>
                    {t('readAnalysisEn')} →
                  </a>
                ) : (
                  <Link href={related.href} className={`inline-block mt-4 ${linkCls}`}>
                    {t('readAnalysis')} →
                  </Link>
                ))}

              <h2 className={sheetH2}>{t('method')}</h2>
              <ul className="m-0 pl-5 flex flex-col gap-2 text-[16px] leading-[1.6] text-[color:var(--text-2)]">
                {card.method[locale].map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>

              <h2 className={sheetH2}>{t('sources')}</h2>
              <ul className="m-0 pl-5 flex flex-col gap-2 text-[16px] leading-[1.5]">
                {card.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>

              {card.hubLinks && card.hubLinks.length > 0 && (
                <>
                  <h2 className={sheetH2}>{t('onHub')}</h2>
                  <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                    {card.hubLinks.map((h) => (
                      <li key={`${h.type}-${h.ref}`}>
                        <a
                          href={hubLocaleUrl(locale, `/${h.type}/${h.ref}/`)}
                          className="inline-block px-3 py-1.5 rounded-full text-[14px] bg-[color:var(--surface)] border border-[color:var(--border)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                        >
                          {h.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}


              <p className="mt-10 pt-6 border-t border-[color:var(--border-subtle)] font-mono text-[11px] uppercase tracking-[0.06em] text-[color:var(--text-3)]">
                <Link href="/data" className="text-[color:var(--text-1)] hover:text-[color:var(--accent)]">{t('allCards')}</Link>
                {' · '}
                <Link href="/about" className="text-[color:var(--text-1)] hover:text-[color:var(--accent)]">{cardCopyright(card)}</Link>
              </p>
            </div>
          </article>

          <NewsletterBand className="mt-2" />
        </div>
      </main>
    </>
  );
}
