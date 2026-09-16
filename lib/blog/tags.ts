import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = ReturnType<typeof createClient>;

export type TagRef = { slug: string; label: string };

type ArticleTagRow = {
  article_id: string;
  position: number | null;
  tags: { slug: string } | null;
};

/** Ordered (by original tag order) canonical tag slugs per article id. */
export async function getArticleTagSlugs(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!articleIds.length) return map;

  const { data } = await supabase
    .from('article_tags')
    .select('article_id, position, tags(slug)')
    .in('article_id', articleIds)
    .order('position', { ascending: true, nullsFirst: false });

  for (const row of (data as unknown as ArticleTagRow[] | null) ?? []) {
    const slug = row.tags?.slug;
    if (!slug) continue;
    const list = map.get(row.article_id) ?? [];
    list.push(slug);
    map.set(row.article_id, list);
  }
  return map;
}

/** Article ids carrying a given canonical tag slug (e.g. 'featured', 'data-desk'). */
export async function getArticleIdsForTagSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<string[]> {
  const { data: tagRow } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tagRow) return [];

  const { data } = await supabase
    .from('article_tags')
    .select('article_id')
    .eq('tag_id', tagRow.id as string);
  return (data ?? []).map((r) => r.article_id as string);
}

export type RelatedArticle = { slug: string; title: string; published_at: string | null };

/**
 * Other published articles in the same locale, ranked by number of shared
 * tags with `articleId` (most overlap first, ties broken by recency), then
 * backfilled with the most recent other articles if tag overlap alone
 * doesn't reach `limit` -- an article with only one or two tags shouldn't
 * end up with an empty "related" section.
 */
export async function getRelatedArticles(
  supabase: SupabaseClient,
  articleId: string,
  locale: string,
  limit = 3
): Promise<RelatedArticle[]> {
  const { data: ownTagRows } = await supabase
    .from('article_tags')
    .select('tag_id')
    .eq('article_id', articleId);
  const tagIds = (ownTagRows ?? []).map((r) => r.tag_id as string);

  const counts = new Map<string, number>();
  if (tagIds.length > 0) {
    const { data: sharedRows } = await supabase
      .from('article_tags')
      .select('article_id')
      .in('tag_id', tagIds)
      .neq('article_id', articleId);
    for (const row of sharedRows ?? []) {
      const id = row.article_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const candidateIds = Array.from(counts.keys());
  const byId = new Map<string, RelatedArticle>();

  if (candidateIds.length > 0) {
    const { data: candidates } = await supabase
      .from('articles')
      .select('id, slug, title, published_at')
      .in('id', candidateIds)
      .eq('locale', locale)
      .eq('status', 'published');
    for (const row of candidates ?? []) {
      byId.set(row.id as string, {
        slug: row.slug as string,
        title: row.title as string,
        published_at: row.published_at as string | null,
      });
    }
  }

  const ranked = Array.from(byId.keys())
    .sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
      if (diff !== 0) return diff;
      const aDate = byId.get(a)?.published_at ?? '';
      const bDate = byId.get(b)?.published_at ?? '';
      return bDate.localeCompare(aDate);
    })
    .map((id) => byId.get(id) as RelatedArticle);

  if (ranked.length >= limit) return ranked.slice(0, limit);

  // Backfill with the most recent other published articles, excluding the
  // current one and anything already picked above.
  const excludeSlugs = new Set(ranked.map((r) => r.slug));
  const { data: recent } = await supabase
    .from('articles')
    .select('id, slug, title, published_at')
    .eq('locale', locale)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit + ranked.length + 5);

  for (const row of recent ?? []) {
    if (ranked.length >= limit) break;
    const slug = row.slug as string;
    if (excludeSlugs.has(slug)) continue;
    ranked.push({ slug, title: row.title as string, published_at: row.published_at as string | null });
    excludeSlugs.add(slug);
  }

  return ranked.slice(0, limit);
}
