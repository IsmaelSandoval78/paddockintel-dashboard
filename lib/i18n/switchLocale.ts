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
