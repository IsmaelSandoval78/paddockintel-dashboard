import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { HUB_URL, SITE_URL } from '@/lib/site-url';
import { isIndexableTag } from '@/lib/seo';
import { allDataCards } from '@/lib/dataCards';

export const revalidate = 3600;

const HUB_BASE = HUB_URL;
// Canonical magazine host. The apex 308s to www, so locs must not use the apex.
const MAGAZINE_BASE = SITE_URL;
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
      .select('id, slug, locale, published_at')
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

    // Feed items with a slug get their own indexable page
    // (app/[locale]/(digest)/feed/[slug]/page.tsx) -- items not yet backfilled
    // with a slug are left out here, they still only live inside /feed/.
    const { data: feedItems } = await supabase
      .from('digest_items')
      .select('slug, published_at, digest_issues!inner(status, series)')
      .eq('digest_issues.status', 'published')
      .eq('digest_issues.series', 'newsletter')
      .not('slug', 'is', null);

    // All three locales -- glossary_terms carries real published pt rows
    // (confirmed 2026-10-06), they were just never queried here. glossary_terms
    // has no 'status' column value other than 'published' in practice but the
    // filter is kept explicit anyway.
    const { data: glossaryTerms } = await supabase
      .from('glossary_terms')
      .select('slug, locale, depth, published_at')
      .eq('status', 'published');

    // Canonical tag slugs only -- app/[locale]/(blog)/tag/[slug]/page.tsx
    // validates against the articleTags translation namespace, not this
    // table directly, but every tag here has a translation (confirmed
    // 2026-10-06), so the row set and the page's own validation agree.
    const { data: tags } = await supabase.from('tags').select('slug');

    // Published-article count per (tag, locale). Only archives that isIndexableTag accepts are
    // listed; the rest render noindexed (tag/[slug]/page.tsx), so they stay out of here.
    // article_tags is read in pages: it is past PostgREST's 1,000-row default cap.
    const localeById = new Map((articles ?? []).map((a) => [a.id as string, a.locale as string]));
    const taggedCounts = new Map<string, number>();
    for (let from = 0; ; from += 1000) {
      const { data: rows } = await supabase
        .from('article_tags')
        .select('article_id, tags(slug)')
        .range(from, from + 999);
      for (const row of (rows as unknown as { article_id: string; tags: { slug: string } | null }[] | null) ?? []) {
        const locale = localeById.get(row.article_id);
        if (locale && row.tags?.slug) {
          const key = `${row.tags.slug}|${locale}`;
          taggedCounts.set(key, (taggedCounts.get(key) ?? 0) + 1);
        }
      }
      if (!rows || rows.length < 1000) break;
    }

    // Feed is deliberately EN/ES only (no pt edition exists at all — see
    // EDITORIAL.md's "The Feed" section), so its two root/item routes below
    // stay two-locale on purpose. Every other section here has a live pt
    // page (confirmed via direct fetch, 2026-10-06) and must list all three.
    const staticRoutes: MetadataRoute.Sitemap = [
      { url: `${MAGAZINE_BASE}/`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
      { url: `${MAGAZINE_BASE}/es/`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
      { url: `${MAGAZINE_BASE}/pt/`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
      { url: `${MAGAZINE_BASE}/glossary/`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/es/glossary/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/pt/glossary/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/weekly/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/es/weekly/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/pt/weekly/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${MAGAZINE_BASE}/recaps/`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/es/recaps/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/pt/recaps/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
      { url: `${MAGAZINE_BASE}/feed/`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
      { url: `${MAGAZINE_BASE}/es/feed/`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
      { url: `${MAGAZINE_BASE}/whos-who/`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
      { url: `${MAGAZINE_BASE}/es/whos-who/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
      { url: `${MAGAZINE_BASE}/pt/whos-who/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
      { url: `${MAGAZINE_BASE}/about/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/es/about/`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/pt/about/`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${MAGAZINE_BASE}/methodology/delta-ribbon/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${MAGAZINE_BASE}/es/methodology/delta-ribbon/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${MAGAZINE_BASE}/pt/methodology/delta-ribbon/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${MAGAZINE_BASE}/privacy/`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
      { url: `${MAGAZINE_BASE}/es/privacy/`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
      { url: `${MAGAZINE_BASE}/pt/privacy/`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ];

    const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
      url: localeUrl(MAGAZINE_BASE, a.locale as string, `/${a.slug as string}/`),
      lastModified: a.published_at ? new Date(a.published_at as string) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }));

    // Each issue/recap row renders on all three locales (unlike feed items,
    // these aren't paired rows) -- confirmed the en/es/pt page all live and
    // return 200 for the same slug, but only the bare (en) URL was ever
    // listed here, leaving the es/pt page of every single issue unlisted.
    const issueRoutes: MetadataRoute.Sitemap = (issues ?? []).flatMap((i) =>
      ['en', 'es', 'pt'].map((locale) => ({
        url: localeUrl(MAGAZINE_BASE, locale, `/weekly/${i.slug as string}/`),
        lastModified: i.published_at ? new Date(i.published_at as string) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: locale === 'en' ? 0.7 : 0.65,
      }))
    );

    const recapRoutes: MetadataRoute.Sitemap = (recaps ?? []).flatMap((r) =>
      ['en', 'es', 'pt'].map((locale) => ({
        url: localeUrl(MAGAZINE_BASE, locale, `/recaps/${r.slug as string}/`),
        lastModified: r.published_at ? new Date(r.published_at as string) : new Date(),
        changeFrequency: 'yearly' as const,
        priority: locale === 'en' ? 0.5 : 0.45,
      }))
    );

    // EN + ES for each item, same slug both locales -- one row per story,
    // not a locale-paired row like articles (see 20260915180000).
    const feedItemRoutes: MetadataRoute.Sitemap = (feedItems ?? []).flatMap((f) => [
      {
        url: `${MAGAZINE_BASE}/feed/${f.slug as string}/`,
        lastModified: f.published_at ? new Date(f.published_at as string) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${MAGAZINE_BASE}/es/feed/${f.slug as string}/`,
        lastModified: f.published_at ? new Date(f.published_at as string) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      },
    ]);

    // One URL per term and locale: the base /glossary/[slug]/ page (the eli5 depth). The technical
    // and fia-regulation depths stay live, indexable and linked from the term page, but out of the
    // sitemap -- Search Console, 2026-10-16: 0 of 159 depth pages indexed, nearly all "Discovered -
    // currently not indexed", so the sitemap points Google at the 81 base pages instead.
    const glossaryRoutes: MetadataRoute.Sitemap = (glossaryTerms ?? []).filter((g) => g.depth === 'eli5').map((g) => ({
      url: localeUrl(MAGAZINE_BASE, g.locale as string, `/glossary/${g.slug as string}/`),
      lastModified: g.published_at ? new Date(g.published_at as string) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // Tags aren't locale-paired rows -- one tag, three locale variants of the
    // same archive page (en/es/pt all validated live, 2026-10-06).
    const tagRoutes: MetadataRoute.Sitemap = (tags ?? []).flatMap((tg) =>
      ['en', 'es', 'pt']
        .filter((locale) => isIndexableTag(tg.slug as string, taggedCounts.get(`${tg.slug as string}|${locale}`) ?? 0))
        .map((locale) => ({
        url: localeUrl(MAGAZINE_BASE, locale, `/tag/${tg.slug as string}/`),
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: locale === 'en' ? 0.5 : 0.45,
      }))
    );

    // Data cards (content/data-cards/, see lib/dataCards.ts): index, license and one page per card,
    // all three locales. Their images are listed in /sitemap-images.xml.
    const dataRoutes: MetadataRoute.Sitemap = ['en', 'es', 'pt'].flatMap((locale) => [
      { url: localeUrl(MAGAZINE_BASE, locale, '/data/'), lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
      { url: localeUrl(MAGAZINE_BASE, locale, '/data/license/'), lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
      ...allDataCards().map((c) => ({
        url: localeUrl(MAGAZINE_BASE, locale, `/data/${c.slug}/`),
        lastModified: new Date(c.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: locale === 'en' ? 0.7 : 0.65,
      })),
    ]);

    return [
      ...staticRoutes,
      ...dataRoutes,
      ...articleRoutes,
      ...issueRoutes,
      ...recapRoutes,
      ...feedItemRoutes,
      ...glossaryRoutes,
      ...tagRoutes,
    ];
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
