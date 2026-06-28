import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

const BASE = 'https://hub.paddockintel.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = createClient();

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, meta_description, published_at')
    .eq('locale', 'en')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(25);

  const items = (articles ?? [])
    .map((a) => {
      const url = `${BASE}/${a.slug as string}/`;
      const pubDate = a.published_at
        ? new Date(a.published_at as string).toUTCString()
        : new Date().toUTCString();
      return `
    <item>
      <title><![CDATA[${a.title as string}]]></title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>${a.meta_description ? `\n      <description><![CDATA[${a.meta_description as string}]]></description>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PaddockIntel</title>
    <link>${BASE}</link>
    <description>F1 economic and performance intelligence — verified sources, original analysis.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
