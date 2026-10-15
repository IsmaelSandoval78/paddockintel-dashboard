// Single source of truth for the magazine's public base URL. The apex
// (paddockintel.com) 308s to www at the platform level (Vercel + the
// Cloudflare middleware fallback - see middleware.ts) -- canonical URLs,
// hreflang alternates, and JSON-LD must never be built against the apex,
// or Google is handed a self-referencing redirect as "the real URL".
//
// Both bases come from NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_HUB_URL (set in the
// Cloudflare deploy workflow, inlined at build time) with the production
// values as the fallback, so a build without them still emits real URLs.
// SITE_URL is also `metadataBase` in app/layout.tsx -- see the note there.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paddockintel.com').replace(/\/+$/, '');

// hub.paddockintel.com is a separate product (the map-driven Hub dashboard)
// on its own subdomain -- circuits/drivers/constructors/season pages live
// here, not under SITE_URL, and must not canonicalize to the magazine host.
export const HUB_URL = (process.env.NEXT_PUBLIC_HUB_URL || 'https://hub.paddockintel.com').replace(/\/+$/, '');

export function localeUrl(locale: string, path: string): string {
  return locale === 'en' ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

export function hubLocaleUrl(locale: string, path: string): string {
  return locale === 'en' ? `${HUB_URL}${path}` : `${HUB_URL}/${locale}${path}`;
}
