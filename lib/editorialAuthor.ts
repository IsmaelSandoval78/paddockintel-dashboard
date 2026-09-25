import { createClient } from '@/lib/supabase/server';

// Article templates hardcode this name. It is also the only row in `authors`
// (slug ismael-sandoval), and the migration that created that table backfilled
// articles.author_id to it. Feed items have no author column, so they use this
// same default. If the row cannot be read, the hardcoded article name is the
// fallback — never a guessed byline.

export const DEFAULT_EDITORIAL_AUTHOR_NAME = 'Ismael Sandoval';
export const DEFAULT_EDITORIAL_AUTHOR_SLUG = 'ismael-sandoval';

export type EditorialAuthor = {
  name: string;
  slug: string;
};

export const DEFAULT_EDITORIAL_AUTHOR: EditorialAuthor = {
  name: DEFAULT_EDITORIAL_AUTHOR_NAME,
  slug: DEFAULT_EDITORIAL_AUTHOR_SLUG,
};

export async function getDefaultEditorialAuthor(): Promise<EditorialAuthor> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('authors')
      .select('name, slug')
      .eq('slug', DEFAULT_EDITORIAL_AUTHOR_SLUG)
      .maybeSingle();
    if (error || !data) return DEFAULT_EDITORIAL_AUTHOR;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const slug = typeof data.slug === 'string' ? data.slug.trim() : '';
    if (!name) return DEFAULT_EDITORIAL_AUTHOR;
    return { name, slug: slug || DEFAULT_EDITORIAL_AUTHOR_SLUG };
  } catch {
    return DEFAULT_EDITORIAL_AUTHOR;
  }
}
