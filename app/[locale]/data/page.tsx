import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import NewsletterBand from '@/components/home-dusk/NewsletterBand';
import { SITE_URL, localeUrl } from '@/lib/site-url';
import { localizedPageMeta } from '@/lib/seo';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  allDataCards,
  asCardLocale,
  cardImagePath,
  cardImageUrl,
  cardPageUrl,
  formatCardDate,
} from '@/lib/dataCards';
import { duskSans } from '../(blog)/dusk-font';
import '../(blog)/dusk.css';

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const locale = asCardLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'dataCards' });
  const meta = localizedPageMeta(locale, '/data/');
  const latest = allDataCards()[0];
  return {
    ...meta,
    title: `${t('indexMetaTitle')} — PaddockIntel`,
    description: t('indexMetaDescription'),
    // The newest card stands in as the index's share image.
    ...(latest
      ? {
          openGraph: { ...meta.openGraph, images: [{ url: cardImageUrl(latest, locale), width: CARD_WIDTH, height: CARD_HEIGHT, alt: latest.alt[locale] }] },
          twitter: { card: 'summary_large_image', images: [cardImageUrl(latest, locale)] },
        }
      : {}),
  };
}

export default async function DataIndexPage({ params }: { params: PageParams }) {
  const locale = asCardLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'dataCards' });
  const cards = allDataCards();

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('indexTitle'),
      description: t('indexMetaDescription'),
      url: localeUrl(locale, '/data/'),
      inLanguage: locale,
      publisher: { '@type': 'Organization', name: 'PaddockIntel', url: `${SITE_URL}/` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: cards.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: cardPageUrl(c.slug, locale), name: c.headline[locale] })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('crumbHome'), item: localeUrl(locale, '/') },
        { '@type': 'ListItem', position: 2, name: t('indexTitle') },
      ],
    },
  ];

  return (
    <>
      {ld.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={t('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {' / '}
            {t('indexTitle')}
          </nav>

          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">
              {t('indexKicker')} · {t('cardCount', { count: cards.length })}
            </p>
            <h1 className="dusk-display m-0 text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.02em]">{t('indexTitle')}</h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{t('indexIntro')}</p>
          </header>

          <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <li key={card.slug} className="dusk-card p-3 flex flex-col gap-3">
                <Link href={`/data/${card.slug}`} className="flex flex-col gap-3 group">
                  <Image
                    src={cardImagePath(card, locale)}
                    alt={card.alt[locale]}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    unoptimized
                    loading="lazy"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="block w-full h-auto rounded-[var(--radius-md)]"
                  />
                  <span className="px-2 dusk-mono uppercase text-[11px] tracking-[0.08em] text-[color:var(--dusk-sunset)]">
                    {card.asOf[locale]}
                  </span>
                  <span className="px-2 pb-2 dusk-display text-[1.25rem] leading-[1.2] group-hover:text-[color:var(--dusk-peach)]">
                    {card.headline[locale]}
                  </span>
                </Link>
                <time dateTime={card.publishedAt} className="px-2 pb-1 dusk-mono text-[11px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
                  {formatCardDate(card.publishedAt, locale)}
                </time>
              </li>
            ))}
          </ul>

          <NewsletterBand className="mt-2" />
        </div>
      </main>
    </>
  );
}
