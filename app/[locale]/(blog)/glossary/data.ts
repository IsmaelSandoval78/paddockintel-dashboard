import { createClient } from '@/lib/supabase/server';

export type GlossarySource = { name: string; url: string };

export type GlossaryTermRow = {
  slug: string;
  term: string;
  category: string;
  short_definition: string;
  body_markdown: string;
  related_terms: string[];
  sources: GlossarySource[] | null;
  published_at: string | null;
  translation_group_id: string;
};

const TERM_SELECT =
  'slug, term, category, short_definition, body_markdown, related_terms, sources, published_at, translation_group_id';

export async function getGlossaryTerms(locale: string): Promise<GlossaryTermRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('term', { ascending: true });
  return (data as GlossaryTermRow[] | null) ?? [];
}

export async function getGlossaryTerm(locale: string, slug: string): Promise<GlossaryTermRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return (data as GlossaryTermRow | null) ?? null;
}

export async function getRelatedGlossaryTerms(locale: string, slugs: string[]): Promise<GlossaryTermRow[]> {
  if (slugs.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .in('slug', slugs);
  return (data as GlossaryTermRow[] | null) ?? [];
}
