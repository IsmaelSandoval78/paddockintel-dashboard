import { routing } from '@/lib/i18n/routing';
import { SITE_URL, localeUrl } from '@/lib/site-url';
import { DATA_CARD_FILES } from '@/content/data-cards';

// Data cards: one shareable scorecard per file in content/data-cards/, each with its own
// indexable page (/data/[slug]/), a 1600x900 PNG built from the same file (app/data-cards/) and
// an entry in both sitemaps. The rows are written by scripts/data-cards/generate.ts from
// Supabase, never by hand; the text around them is edited in the file. A card that fails
// validateDataCard() breaks the build instead of shipping without a source or a method note.

export type CardLocale = (typeof routing.locales)[number];
export type Localized = Record<CardLocale, string>;

export type DataCardColumn = {
  key: string;
  label: Localized;
  numeric?: boolean;
  decimals?: number;
  // Prefix positive numbers with "+" (a change, not a total).
  signed?: boolean;
  // A finishing position read as "P9 or lower"; 0 means any finish, 11 means outside the points.
  kind?: 'finishOrLower';
};

export type DataCardRow = Record<string, string | number>;

// Image layouts. 'table' is the house card (Warm Studio). 'venue' is the race-week poster
// (frame, Anton headline, a strip of years and the team tallies), drawn in the host's palette.
export type DataCardLayout = 'table' | 'venue';
// Host palettes for race-week cards only; every other card is Warm Studio.
export type DataCardTheme = 'usa' | 'mexico' | 'brazil' | 'qatar' | 'uae';

// The venue poster's content. strip/tallies/years/races come from the generator; place, line1,
// line2 and footnote are written in the file. {years} and {races} are filled in at render time.
export type DataCardVenue = {
  place: Localized;
  line1: Localized;
  line2: Localized;
  footnote: Localized;
  years: string;
  races: number;
  strip: Array<{ label: string; sub: string }>;
  tallies: Array<{ label: string; value: number }>;
};

export type DataCard = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  // When the numbers were frozen, in words ("After round 17, Singapore GP").
  asOf: Localized;
  title: Localized;
  metaDescription: Localized;
  headline: Localized;
  subtitle: Localized;
  context: Localized;
  method: Record<CardLocale, string[]>;
  // Image alt text: the card's numbers in a sentence.
  alt: Localized;
  columns: DataCardColumn[];
  rows: DataCardRow[];
  highlightRow?: number;
  sources: Array<{ name: string; url: string }>;
  // EN slug of the PaddockIntel article that goes deeper, resolved per locale on the page.
  relatedArticle?: string;
  hubLinks?: Array<{ type: 'drivers' | 'constructors' | 'circuits'; ref: string; label: string }>;
  xPostUrl?: string;
  // Footer line of the image, crediting where the numbers come from.
  imageSource: Localized;
  layout?: DataCardLayout;
  theme?: DataCardTheme;
  venue?: DataCardVenue;
};

export const CARD_WIDTH = 1600;
export const CARD_HEIGHT = 900;
export const TITLE_MAX = 60;
export const META_MAX = 145;
export const MAX_ROWS = 6;
// A venue card's table lives on the page only, so it can list every edition.
export const MAX_PAGE_ROWS = 40;

export const LICENSE_NAME = 'CC BY 4.0';
export const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

export function validateDataCard(card: DataCard): DataCard {
  const fail = (msg: string) => {
    throw new Error(`data card "${card.slug}": ${msg}`);
  };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug)) fail('slug must be lowercase words joined by hyphens');
  for (const date of [card.publishedAt, card.updatedAt]) if (Number.isNaN(Date.parse(date))) fail(`bad date ${date}`);
  for (const locale of routing.locales) {
    for (const field of ['asOf', 'title', 'metaDescription', 'headline', 'subtitle', 'context', 'alt', 'imageSource'] as const) {
      if (!card[field]?.[locale]?.trim()) fail(`${field}.${locale} is empty`);
    }
    if (card.title[locale].length > TITLE_MAX) fail(`title.${locale} is over ${TITLE_MAX} characters`);
    if (card.metaDescription[locale].length > META_MAX) fail(`metaDescription.${locale} is over ${META_MAX} characters`);
    if (!card.method?.[locale]?.length) fail(`method.${locale} has no notes`);
    for (const col of card.columns) if (!col.label?.[locale]) fail(`column ${col.key} has no ${locale} label`);
  }
  if (!card.sources.length || card.sources.some((s) => !s.name || !/^https:\/\//.test(s.url))) fail('every card needs sources with https URLs');
  if (!card.columns.length || !card.rows.length) fail('no columns or no rows');
  const layout = card.layout ?? 'table';
  if (layout === 'table' && card.rows.length > MAX_ROWS) fail(`more than ${MAX_ROWS} rows do not fit the image`);
  if (card.rows.length > MAX_PAGE_ROWS) fail(`more than ${MAX_PAGE_ROWS} rows`);
  if (layout === 'venue') {
    const v = card.venue;
    if (!v || !card.theme) fail('a venue card needs venue content and a host theme');
    else {
      for (const locale of routing.locales) {
        for (const field of ['place', 'line1', 'line2', 'footnote'] as const) if (!v[field]?.[locale]?.trim()) fail(`venue.${field}.${locale} is empty`);
      }
      if (!v.strip.length || v.strip.length > 6) fail('venue strip needs 1-6 items');
      if (!v.tallies.length || v.tallies.length > 5) fail('venue tallies need 1-5 items');
    }
  } else if (card.theme) fail('host themes are for venue (race-week) cards only');
  for (const row of card.rows) {
    for (const col of card.columns) {
      const value = row[col.key];
      if (value === undefined || value === '') fail(`row is missing ${col.key}`);
      if (col.numeric && typeof value !== 'number') fail(`${col.key} must be a number`);
    }
  }
  if (card.highlightRow !== undefined && !card.rows[card.highlightRow]) fail('highlightRow points past the rows');
  return card;
}

const cards: DataCard[] = DATA_CARD_FILES.map(validateDataCard).sort(
  (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.slug.localeCompare(b.slug),
);

export function allDataCards(): DataCard[] {
  return cards;
}

export function getDataCard(slug: string): DataCard | undefined {
  return cards.find((c) => c.slug === slug);
}

export function asCardLocale(locale: string): CardLocale {
  return (routing.locales as readonly string[]).includes(locale) ? (locale as CardLocale) : routing.defaultLocale;
}

const FINISH: Record<CardLocale, { any: string; outside: string; orLower: (p: number) => string }> = {
  en: { any: 'Any finish', outside: 'Outside the points', orLower: (p) => `P${p} or lower` },
  es: { any: 'Cualquier resultado', outside: 'Fuera de los puntos', orLower: (p) => `P${p} o peor` },
  pt: { any: 'Qualquer resultado', outside: 'Fora dos pontos', orLower: (p) => `P${p} ou pior` },
};

export function formatCell(value: string | number, col: DataCardColumn, locale: CardLocale): string {
  if (typeof value === 'string') return value;
  if (col.kind === 'finishOrLower') {
    const f = FINISH[locale];
    return value === 0 ? f.any : value >= 11 ? f.outside : f.orLower(value);
  }
  const text = new Intl.NumberFormat(locale, {
    minimumFractionDigits: col.decimals ?? 0,
    maximumFractionDigits: col.decimals ?? 0,
  }).format(value);
  return col.signed && value > 0 ? `+${text}` : text;
}

export function formatCardDate(iso: string, locale: CardLocale): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
}

// The PNG's file name is the slug, with the locale as a suffix outside English:
// /data-cards/<slug>.png, /data-cards/<slug>.es.png, /data-cards/<slug>.pt.png.
export function cardImageFile(slug: string, locale: CardLocale): string {
  return locale === 'en' ? `${slug}.png` : `${slug}.${locale}.png`;
}

export function parseCardImageFile(file: string): { slug: string; locale: CardLocale } | null {
  const m = /^([a-z0-9-]+?)(?:\.(es|pt))?\.png$/.exec(file);
  if (!m) return null;
  return { slug: m[1], locale: (m[2] as CardLocale | undefined) ?? 'en' };
}

// Absolute and versioned: X and other unfurlers cache an image by URL, so a corrected card has to
// change the URL to be picked up. The query string doesn't change what the route renders.
export function cardImageUrl(card: DataCard, locale: CardLocale): string {
  return `${SITE_URL}/data-cards/${cardImageFile(card.slug, locale)}?v=${encodeURIComponent(card.updatedAt.slice(0, 10))}`;
}

// Same image, same-origin path: what the card's own page and the index display.
export function cardImagePath(card: DataCard, locale: CardLocale): string {
  return `/data-cards/${cardImageFile(card.slug, locale)}?v=${encodeURIComponent(card.updatedAt.slice(0, 10))}`;
}

// Unversioned absolute URL, for the image sitemap.
export function cardImageCanonicalUrl(slug: string, locale: CardLocale): string {
  return `${SITE_URL}/data-cards/${cardImageFile(slug, locale)}`;
}

export function cardPageUrl(slug: string, locale: CardLocale): string {
  return localeUrl(locale, `/data/${slug}/`);
}
