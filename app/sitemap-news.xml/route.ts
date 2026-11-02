import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site-url';

// Google News sitemap: the articles and Feed items published in the last two days, every locale
// they exist in (Feed items are EN/ES only, see EDITORIAL.md). Google only reads news:news entries
// from that window, so older pages stay in /sitemap.xml alone. Listed in robots.txt on the magazine
// host only; the Hub host answers 404, since a sitemap may only list URLs on its own host.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

type NewsEntry = { url: string; locale: string; title: string; publishedAt: string };

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function articleUrl(locale: string, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/${slug}/` : `${SITE_URL}/${locale}/${slug}/`;
}

function feedUrl(locale: string, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/feed/${slug}/` : `${SITE_URL}/${locale}/feed/${slug}/`;
}

export async function GET() {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  if (!MAGAZINE_HOSTS.has(host)) return new Response('Not found', { status: 404 });

  const now = Date.now();
  const from = new Date(now - WINDOW_MS).toISOString();
  const to = new Date(now).toISOString();
  const supabase = createClient();
  const [{ data: articles }, { data: feedItems }] = await Promise.all([
    supabase
      .from('articles')
      .select('slug, locale, title, published_at')
      .eq('status', 'published')
      .gte('published_at', from)
      .lte('published_at', to),
    // Same filter as the Feed item page and /sitemap.xml: published newsletter issues, items with
    // a slug. The ES entry falls back to the EN headline exactly as the page's own title does.
    supabase
      .from('digest_items')
      .select('slug, headline, headline_es, published_at, digest_issues!inner(status, series)')
      .eq('digest_issues.status', 'published')
      .eq('digest_issues.series', 'newsletter')
      .not('slug', 'is', null)
      .gte('published_at', from)
      .lte('published_at', to),
  ]);

  const entries: NewsEntry[] = [
    ...(articles ?? []).map((a) => ({
      url: articleUrl(a.locale as string, a.slug as string),
      locale: a.locale as string,
      title: a.title as string,
      publishedAt: a.published_at as string,
    })),
    ...(feedItems ?? []).flatMap((f) => [
      { url: feedUrl('en', f.slug as string), locale: 'en', title: f.headline as string, publishedAt: f.published_at as string },
      {
        url: feedUrl('es', f.slug as string),
        locale: 'es',
        title: (f.headline_es as string | null) ?? (f.headline as string),
        publishedAt: f.published_at as string,
      },
    ]),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const urls = entries.map(
    (e) =>
      `  <url>\n    <loc>${escapeXml(e.url)}</loc>\n` +
      '    <news:news>\n' +
      `      <news:publication>\n        <news:name>PaddockIntel</news:name>\n        <news:language>${e.locale}</news:language>\n      </news:publication>\n` +
      `      <news:publication_date>${e.publishedAt}</news:publication_date>\n` +
      `      <news:title>${escapeXml(e.title)}</news:title>\n` +
      '    </news:news>\n  </url>',
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
    (urls.length ? `${urls.join('\n')}\n` : '') +
    '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
}
