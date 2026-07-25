// Some content (articles) has a different slug per locale — EDITORIAL.md's
// translation rule translates the slug itself, not just the copy. A naive
// "keep the same pathname, swap the locale prefix" switch 404s for that
// content. Pages with locale-variant URLs already declare the correct
// per-locale path via `alternates.languages` in generateMetadata, which
// Next.js renders as <link rel="alternate" hreflang="…"> tags in <head>.
// Reading that tag at switch-time gives the right target without having to
// prop-drill page data into the nav. Returns null when no alternate exists
// (the common case — most routes share one slug across locales), so callers
// should fall back to the plain pathname-swap.
export function getAlternateLocaleHref(locale: string): string | null {
  if (typeof document === 'undefined') return null;
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${locale}"]`);
  return link?.href ?? null;
}

// A full navigation (needed because the hreflang href can point at a
// different origin/path shape than next-intl's router expects) bypasses
// next-intl's own router, which normally updates the NEXT_LOCALE cookie as
// part of switching. Without that update, the *next* request still carries
// the old locale's cookie — the proxy's locale-detection middleware reads
// it, decides this "prefix-less" request actually wants the old locale, and
// redirects, re-prefixing the URL while keeping this locale's slug. That
// produces a 404 (the old locale's slug doesn't exist in the new locale).
// Setting the cookie ourselves before navigating keeps the middleware from
// second-guessing where we just told the browser to go.
export function goToAlternateLocale(locale: string, href: string): void {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  window.location.href = href;
}
