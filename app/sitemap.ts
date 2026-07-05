import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

const HUB_BASE = 'https://hub.paddockintel.com';
const MAGAZINE_BASE = 'https://paddockintel.com';
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

function localeUrl(base: string, locale: string, path: string): string {
  return locale === 'en' ? `${base}${path}` : `${base}/${locale}${path}`;
}

// A sitemap must only list URLs on its own host — both domains share this one
// deployment, so /sitemap.xml emits a different URL set depending on which
// domain requested it (Hub content vs. Blog/Digest/Book/About content).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  const isMagazine = MAGAZINE_HOSTS.has(host);

  if (isMagazine) {
    const supabase = createClient();

    const { data: articles } = await supabase
      .from('articles')
      .select('slug, locale, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const { data: issues } = await supabase
      .from('digest_issues')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const staticRoutes: MetadataRoute.Sitemap = [
      { url: `${MAGAZINE_BASE}/`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
      { url: `${MAGAZINE_BASE}/weekly/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/about/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/es/`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
      { url: `${MAGAZINE_BASE}/pt/`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    ];

    const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
      url: localeUrl(MAGAZINE_BASE, a.locale as string, `/${a.slug as string}/`),
      lastModified: a.published_at ? new Date(a.published_at as string) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }));

    const issueRoutes: MetadataRoute.Sitemap = (issues ?? []).map((i) => ({
      url: `${MAGAZINE_BASE}/weekly/${i.slug as string}/`,
      lastModified: i.published_at ? new Date(i.published_at as string) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...articleRoutes, ...issueRoutes];
  }

  return [
    { url: `${HUB_BASE}/`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${HUB_BASE}/circuits/`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/drivers/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/constructors/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/compare/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${HUB_BASE}/es/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${HUB_BASE}/pt/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  ];
}
