import type { Metadata } from 'next';
import { routing } from '@/lib/i18n/routing';
import { HUB_URL, SITE_URL, hubLocaleUrl, localeUrl } from '@/lib/site-url';

// The publication's identity for Google (site name, publisher logo). Google News builds a
// publication's page automatically, taking its name from the site name (WebSite structured data
// on the home page) and its logo from the favicon; the same square mark is the publisher logo in
// every NewsArticle, instead of the rectangular share image.
export const SITE_NAME = 'PaddockIntel';
export const PUBLISHER_LOGO = { '@type': 'ImageObject', url: `${SITE_URL}/api/pwa-icon/?size=512`, width: 512, height: 512 };
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const CONTACT_EMAIL = 'info@paddockintel.com';

// Google's "preferred sources" deeplink (developers.google.com/search/docs/appearance/preferred-sources):
// opens Google's source preferences tool on our domain. Used on articles, Feed items, the footer
// (components/blog/PreferredSourceLink.tsx) and the weekly digest email.
export const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=paddockintel.com';

// WebSite + Organization for a home page (the magazine's, in each locale).
export function siteJsonLd(homeUrl: string, locale: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: 'Paddock Intel',
        url: homeUrl,
        inLanguage: locale,
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'NewsMediaOrganization',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: PUBLISHER_LOGO,
        email: CONTACT_EMAIL,
        publishingPrinciples: `${SITE_URL}/about/`,
        correctionsPolicy: `${SITE_URL}/about/#corrections`,
        founder: { '@type': 'Person', name: 'Ismael Sandoval', url: `${SITE_URL}/about/` },
      },
    ],
  };
}

// Site-wide default share image (app/og-image.png/route.tsx), resolved against metadataBase.
export const DEFAULT_OG_IMAGES = [{ url: '/og-image.png', width: 1200, height: 630, type: 'image/png' }];

// The Hub's own share image (app/og-hub.png/route.tsx), absolute because metadataBase is the
// magazine's www host and the Hub is a separate product on hub.paddockintel.com.
export const HUB_OG_IMAGES = [{ url: `${HUB_URL}/og-hub.png`, width: 1200, height: 630, type: 'image/png' }];

// og:url for a page, with the share image of the host the url lives on. A page's `openGraph`
// replaces the root layout's whole object rather than merging into it, so the image travels with
// the url.
export function openGraphFor(url: string): NonNullable<Metadata['openGraph']> {
  return { url, images: url.startsWith(HUB_URL) ? HUB_OG_IMAGES : DEFAULT_OG_IMAGES };
}

// Hub pages also replace the root layout's twitter image, which is the magazine's.
export const HUB_TWITTER: NonNullable<Metadata['twitter']> = {
  card: 'summary_large_image',
  images: [HUB_OG_IMAGES[0].url],
};

// A tag archive is indexable (and listed in app/sitemap.ts) only with at least this many published
// articles in its locale. Search Console, 2026-10-16: 0 of 93 tag pages indexed, nearly all
// "Discovered - currently not indexed"; thin archives spend crawl attention the articles need.
// 'featured' is a home-page placement, not a topic, so it is never indexed.
export const MIN_TAG_ARTICLES_TO_INDEX = 5;
export function isIndexableTag(slug: string, articleCount: number): boolean {
  return slug !== 'featured' && articleCount >= MIN_TAG_ARTICLES_TO_INDEX;
}

// canonical + hreflang (every locale, x-default = en) + og:url for a page that exists in all
// locales at the same path, on the magazine host or the Hub host.
export function localizedPageMeta(locale: string, path: string, host: 'site' | 'hub' = 'site'): Metadata {
  const url = host === 'hub' ? hubLocaleUrl : localeUrl;
  const canonical = url(locale, path);
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, url(l, path)]));
  languages['x-default'] = url('en', path);
  return {
    alternates: { canonical, languages },
    openGraph: openGraphFor(canonical),
    ...(host === 'hub' ? { twitter: HUB_TWITTER } : {}),
  };
}
