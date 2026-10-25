import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site-url';

// Google News sitemap: the articles published in the last two days, every locale. Google only
// reads news:news entries from that window, so older articles stay in /sitemap.xml alone. Listed
// in robots.txt on the magazine host only; the Hub host answers 404, since a sitemap may only list
// URLs on its own host.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function articleUrl(locale: string, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/${slug}/` : `${SITE_URL}/${locale}/${slug}/`;
}

export async function GET() {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  if (!MAGAZINE_HOSTS.has(host)) return new Response('Not found', { status: 404 });

  const now = Date.now();
  const { data } = await createClient()
    .from('articles')
    .select('slug, locale, title, published_at')
    .eq('status', 'published')
    .gte('published_at', new Date(now - WINDOW_MS).toISOString())
    .lte('published_at', new Date(now).toISOString())
    .order('published_at', { ascending: false });

  const urls = (data ?? []).map(
    (a) =>
      `  <url>\n    <loc>${escapeXml(articleUrl(a.locale as string, a.slug as string))}</loc>\n` +
      '    <news:news>\n' +
      `      <news:publication>\n        <news:name>PaddockIntel</news:name>\n        <news:language>${a.locale as string}</news:language>\n      </news:publication>\n` +
      `      <news:publication_date>${a.published_at as string}</news:publication_date>\n` +
      `      <news:title>${escapeXml(a.title as string)}</news:title>\n` +
      '    </news:news>\n  </url>',
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
    (urls.length ? `${urls.join('\n')}\n` : '') +
    '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
}
