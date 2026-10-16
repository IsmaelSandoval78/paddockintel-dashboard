import type { Metadata } from 'next';
import { routing } from '@/lib/i18n/routing';
import { hubLocaleUrl, localeUrl } from '@/lib/site-url';

// Site-wide default share image (app/og-image.png/route.tsx), resolved against metadataBase.
export const DEFAULT_OG_IMAGES = [{ url: '/og-image.png', width: 1200, height: 630, type: 'image/png' }];

// og:url for a page. A page's `openGraph` replaces the root layout's whole object rather than
// merging into it, so the default image travels with the url.
export function openGraphFor(url: string): NonNullable<Metadata['openGraph']> {
  return { url, images: DEFAULT_OG_IMAGES };
}

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
  return { alternates: { canonical, languages }, openGraph: openGraphFor(canonical) };
}
