import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt'] as const,
  defaultLocale: 'en',
  // 'en' drops its path prefix site-wide (Ghost slug parity) — see SKILL.md.
  localePrefix: 'as-needed',
  // No hreflang `Link` response header from the middleware. It assumes every locale shares one
  // path, so for articles with translated slugs it declared URLs that 404 (e.g. the es page
  // /es/f1-costo-despido-team-principal-2026/ advertised /f1-costo-despido-team-principal-2026/ as
  // its en version) and a /pt/feed/ edition that doesn't exist, contradicting the correct hreflang
  // each page sets in its HTML. Search Console, 2026-10-16. The HTML alternates are the only ones.
  alternateLinks: false
});

export type Locale = (typeof routing.locales)[number];
