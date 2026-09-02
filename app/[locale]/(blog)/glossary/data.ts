import { createClient } from '@/lib/supabase/server';

export type GlossarySource = { name: string; url: string };
export type GlossaryDepth = 'eli5' | 'technical' | 'fia';

export type GlossaryTermRow = {
  slug: string;
  term: string;
  category: string;
  depth: GlossaryDepth;
  short_definition: string;
  body_markdown: string;
  related_terms: string[];
  sources: GlossarySource[] | null;
  published_at: string | null;
  translation_group_id: string;
};

const TERM_SELECT =
  'slug, term, category, depth, short_definition, body_markdown, related_terms, sources, published_at, translation_group_id';

// Terms list = one row per term (the entry-level depth only), for the index page.
export async function getGlossaryTerms(locale: string): Promise<GlossaryTermRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .in('depth', ['eli5', 'technical'])
    .order('term', { ascending: true });
  const rows = (data as GlossaryTermRow[] | null) ?? [];
  // A term may have both an eli5 and a technical row (dedupe by slug, prefer eli5).
  const bySlug = new Map<string, GlossaryTermRow>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing || row.depth === 'eli5') bySlug.set(row.slug, row);
  }
  return Array.from(bySlug.values()).sort((a, b) => a.term.localeCompare(b.term));
}

// A term's base URL (/glossary/[slug]) resolves to its eli5 layer if one
// exists, falling back to 'technical' for the 6 legacy flat-format terms
// that predate the depth-layer strategy and have no eli5/fia rows.
export async function getGlossaryTerm(
  locale: string,
  slug: string,
  depth: GlossaryDepth = 'eli5'
): Promise<GlossaryTermRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .in('depth', depth === 'eli5' ? ['eli5', 'technical'] : [depth])
    .order('depth', { ascending: true }) // 'eli5' < 'technical' alphabetically
    .limit(1)
    .maybeSingle();
  return (data as GlossaryTermRow | null) ?? null;
}

// All published layers for a term, to build the eli5/technical/fia nav on each page.
export async function getGlossaryTermLayers(locale: string, slug: string): Promise<GlossaryTermRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published');
  return (data as GlossaryTermRow[] | null) ?? [];
}

// Related-term chips link to each term's base URL, so this returns one row
// per slug (eli5 preferred, technical as fallback) — same dedupe as getGlossaryTerms.
export async function getRelatedGlossaryTerms(locale: string, slugs: string[]): Promise<GlossaryTermRow[]> {
  if (slugs.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select(TERM_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .in('slug', slugs)
    .in('depth', ['eli5', 'technical']);
  const rows = (data as GlossaryTermRow[] | null) ?? [];
  const bySlug = new Map<string, GlossaryTermRow>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing || row.depth === 'eli5') bySlug.set(row.slug, row);
  }
  return slugs.map((s) => bySlug.get(s)).filter((r): r is GlossaryTermRow => Boolean(r));
}
