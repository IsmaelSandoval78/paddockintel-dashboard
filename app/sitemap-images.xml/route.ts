import { headers } from 'next/headers';
import { routing } from '@/lib/i18n/routing';
import { allDataCards, cardImageCanonicalUrl, cardPageUrl } from '@/lib/dataCards';

// Image sitemap for the data cards: each card page (every locale) with its PNG. Listed in
// robots.txt on the magazine host only; the Hub host answers 404, since a sitemap may only list
// URLs on its own host. Google reads image:loc only (the caption/title/license tags were retired
// in 2022); the license itself is declared in each page's ImageObject JSON-LD.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  if (!MAGAZINE_HOSTS.has(host)) return new Response('Not found', { status: 404 });

  const urls = allDataCards().flatMap((card) =>
    routing.locales.map(
      (locale) =>
        `  <url>\n    <loc>${escapeXml(cardPageUrl(card.slug, locale))}</loc>\n    <lastmod>${card.updatedAt.slice(0, 10)}</lastmod>\n` +
        `    <image:image>\n      <image:loc>${escapeXml(cardImageCanonicalUrl(card.slug, locale))}</image:loc>\n    </image:image>\n  </url>`,
    ),
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
