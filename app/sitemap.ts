import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

const BASE = 'https://hub.paddockintel.com';

function articleUrl(locale: string, slug: string): string {
  return locale === 'en' ? `${BASE}/${slug}/` : `${BASE}/${locale}/${slug}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, locale, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/circuits/`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/drivers/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/constructors/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/compare/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about/`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/es/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/pt/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: articleUrl(a.locale as string, a.slug as string),
    lastModified: a.published_at ? new Date(a.published_at as string) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...articleRoutes];
}
