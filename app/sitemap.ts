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
      .order('published_at', { ascending: false, nullsFirst: false });

    const { data: issues } = await supabase
      .from('digest_issues')
      .select('slug, published_at')
      .eq('status', 'published')
      .eq('series', 'newsletter')
      .order('published_at', { ascending: false });

    const { data: recaps } = await supabase
      .from('digest_issues')
      .select('slug, published_at')
      .eq('status', 'published')
      .eq('series', 'recap')
      .order('published_at', { ascending: false });

    // EN/ES only, matching the site-wide PT scope-down — see the shell-page
    // fix above this one. glossary_terms has no 'status' column value other
    // than 'published' in practice but the filter is kept explicit anyway.
    const { data: glossaryTerms } = await supabase
      .from('glossary_terms')
      .select('slug, locale, depth, published_at')
      .eq('status', 'published')
      .in('locale', ['en', 'es']);

    const staticRoutes: MetadataRoute.Sitemap = [
      { url: `${MAGAZINE_BASE}/`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
      { url: `${MAGAZINE_BASE}/es/`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
      { url: `${MAGAZINE_BASE}/glossary/`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/es/glossary/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/weekly/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/es/weekly/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/recaps/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/es/recaps/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/feed/`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
      { url: `${MAGAZINE_BASE}/es/feed/`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
      { url: `${MAGAZINE_BASE}/whos-who/`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
      { url: `${MAGAZINE_BASE}/es/whos-who/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
      { url: `${MAGAZINE_BASE}/about/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/es/about/`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/privacy/`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
      { url: `${MAGAZINE_BASE}/es/privacy/`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
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

    const recapRoutes: MetadataRoute.Sitemap = (recaps ?? []).map((r) => ({
      url: `${MAGAZINE_BASE}/recaps/${r.slug as string}/`,
      lastModified: r.published_at ? new Date(r.published_at as string) : new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    }));

    // URL segment per depth — 'eli5' has none (it's the base /glossary/[slug]
    // URL), matching app/[locale]/(blog)/glossary/[slug]/[depth]/page.tsx's
    // URL_DEPTH map exactly (note: 'fia-regulation' in the URL, not 'fia').
    const DEPTH_PATH: Record<string, string> = { eli5: '', technical: '/technical', fia: '/fia-regulation' };
    const glossaryRoutes: MetadataRoute.Sitemap = (glossaryTerms ?? []).map((g) => ({
      url: localeUrl(
        MAGAZINE_BASE,
        g.locale as string,
        `/glossary/${g.slug as string}${DEPTH_PATH[g.depth as string] ?? ''}/`
      ),
      lastModified: g.published_at ? new Date(g.published_at as string) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...articleRoutes, ...issueRoutes, ...recapRoutes, ...glossaryRoutes];
  }

  const recordSlugs = [
    'most-wins',
    'most-poles',
    'most-podiums',
    'most-fastest-laps',
    'most-championships',
    'most-points',
    'longest-win-streak',
  ];

  const supabase = createClient();
  const [{ data: circuits }, { data: drivers }, { data: constructors }] = await Promise.all([
    supabase.from('circuits').select('circuit_ref'),
    supabase.from('drivers').select('driver_ref'),
    supabase.from('constructors').select('constructor_ref'),
  ]);

  // Same EN/ES pattern as the magazine side — one row per ref, no locale
  // filter needed (generateStaticParams on these [slug] pages doesn't filter
  // by locale either, every ref is valid in both).
  const entityRoutes = (
    refs: (string | null)[],
    path: 'circuits' | 'drivers' | 'constructors',
    priority: number
  ): MetadataRoute.Sitemap =>
    refs.flatMap((ref) => {
      if (!ref) return [];
      return [
        { url: `${HUB_BASE}/${path}/${ref}/`,     lastModified: new Date(), changeFrequency: 'monthly' as const, priority },
        { url: `${HUB_BASE}/es/${path}/${ref}/`,  lastModified: new Date(), changeFrequency: 'monthly' as const, priority: priority - 0.05 },
      ];
    });

  const circuitRoutes = entityRoutes((circuits ?? []).map((c) => c.circuit_ref as string), 'circuits', 0.6);
  const driverRoutes = entityRoutes((drivers ?? []).map((d) => d.driver_ref as string), 'drivers', 0.6);
  const constructorRoutes = entityRoutes(
    (constructors ?? []).map((c) => c.constructor_ref as string),
    'constructors',
    0.6
  );

  return [
    { url: `${HUB_BASE}/`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${HUB_BASE}/circuits/`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/drivers/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/constructors/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${HUB_BASE}/compare/`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${HUB_BASE}/records/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    ...recordSlugs.map((slug) => ({
      url: `${HUB_BASE}/records/${slug}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    { url: `${HUB_BASE}/es/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    ...circuitRoutes,
    ...driverRoutes,
    ...constructorRoutes,
  ];
}
