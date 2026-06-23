import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'pt'] as const,
  defaultLocale: 'en',
  // 'en' drops its path prefix site-wide (Ghost slug parity) — see SKILL.md.
  localePrefix: 'as-needed'
});

export type Locale = (typeof routing.locales)[number];
