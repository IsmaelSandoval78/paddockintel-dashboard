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
