// Canonical magazine origin. The apex (https://paddockintel.com) 308s to www,
// so absolute URLs the magazine emits — canonical, hreflang, og:url, JSON-LD —
// must use this host. Shared with app/sitemap.ts.

export const MAGAZINE_BASE = 'https://www.paddockintel.com';

export function magazinePublisherJsonLd(): {
  '@type': 'Organization';
  name: 'PaddockIntel';
  url: string;
  logo: { '@type': 'ImageObject'; url: string };
} {
  return {
    '@type': 'Organization',
    name: 'PaddockIntel',
    url: `${MAGAZINE_BASE}/`,
    logo: { '@type': 'ImageObject', url: `${MAGAZINE_BASE}/opengraph-image` },
  };
}

/** Feed is EN + ES only. /pt/feed/ is not a published locale yet. */
export const FEED_LOCALES = ['en', 'es'] as const;

export function magazinePath(locale: string, path: string): string {
  const withSlash = ensureSlash(path);
  return locale === 'en' ? `${MAGAZINE_BASE}${withSlash}` : `${MAGAZINE_BASE}/${locale}${withSlash}`;
}

/** Same path, relative, for in-document links. Default locale has no prefix. */
export function localePath(locale: string, path: string): string {
  const withSlash = ensureSlash(path);
  return locale === 'en' ? withSlash : `/${locale}${withSlash}`;
}

/**
 * hreflang map. `x-default` follows the English URL when English is present.
 * Callers must only pass locales that have a real route — do not add `pt` for Feed.
 */
export function withXDefault(languages: Record<string, string>): Record<string, string> {
  if (languages['x-default'] || !languages.en) return languages;
  return { ...languages, 'x-default': languages.en };
}

export function feedLanguageUrls(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of FEED_LOCALES) {
    languages[locale] = magazinePath(locale, path);
  }
  return withXDefault(languages);
}

/** Non-Spanish Feed requests stay on the English URL. There is no PT Feed. */
export function feedContentLocale(locale: string): 'en' | 'es' {
  return locale === 'es' ? 'es' : 'en';
}

function ensureSlash(path: string): string {
  const withLead = path.startsWith('/') ? path : `/${path}`;
  return withLead.endsWith('/') ? withLead : `${withLead}/`;
}
