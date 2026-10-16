import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt'] as const,
  defaultLocale: 'en',
  // 'en' drops its path prefix site-wide (Ghost slug parity) — see SKILL.md.
  localePrefix: 'as-needed',
  // The locale comes from the URL only, never from the browser's language or the NEXT_LOCALE
  // cookie. With detection on, an es/pt browser asking for an unprefixed (en) URL was 307'd to the
  // same path under /es/ or /pt/: a 404 for every article (translated slugs differ) and, combined
  // with the magazine-home rewrite in middleware.ts, a 404 on www.paddockintel.com/ itself.
  // Verified live 2026-10-16. Readers still switch with the locale switcher.
  localeDetection: false,
  // No hreflang `Link` response header from the middleware. It assumes every locale shares one
  // path, so for articles with translated slugs it declared URLs that 404 (e.g. the es page
  // /es/f1-costo-despido-team-principal-2026/ advertised /f1-costo-despido-team-principal-2026/ as
  // its en version) and a /pt/feed/ edition that doesn't exist, contradicting the correct hreflang
  // each page sets in its HTML. Search Console, 2026-10-16. The HTML alternates are the only ones.
  alternateLinks: false
});

export type Locale = (typeof routing.locales)[number];
