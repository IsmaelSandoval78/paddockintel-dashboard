// Run: npx ts-node --project scripts/tsconfig.json scripts/ingest-article.ts <path-to-md>
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { randomUUID } from 'crypto';

// Next.js loads .env.local automatically; a plain ts-node script does not.
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

import { createClient } from '../lib/supabase/server';

type Stat = { value: string; label: string; unit?: string };
type FAQ  = { q: string; a: string };
type Source = { name: string; url: string };

type Frontmatter = {
  slug: string;
  title: string;
  locale: 'en' | 'es' | 'pt';
  meta_description?: string;
  cover_image_url?: string;
  tags?: string[];
  translation_group_id?: string;
  status?: 'draft' | 'published';
  published_at?: string;
  stats?: Stat[];
  faq?: FAQ[];
  sources?: Source[];
};

function readArticle(filePath: string): { frontmatter: Frontmatter; body: string } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  for (const field of ['slug', 'title', 'locale'] as const) {
    if (!data[field]) {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`);
    }
  }

  return { frontmatter: data as Frontmatter, body: content.trim() };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ingest-article.ts <path-to-md>');
    process.exit(1);
  }

  const { frontmatter, body } = readArticle(path.resolve(filePath));
  const supabase = createClient();

  const { data: article, error } = await supabase
    .from('articles')
    .upsert(
      {
        translation_group_id: frontmatter.translation_group_id ?? randomUUID(),
        locale: frontmatter.locale,
        slug: frontmatter.slug,
        title: frontmatter.title,
        meta_description: frontmatter.meta_description ?? null,
        cover_image_url: frontmatter.cover_image_url ?? null,
        body_markdown: body,
        status: frontmatter.status ?? 'draft',
        ...(frontmatter.published_at !== undefined ? { published_at: frontmatter.published_at } : {}),
        ...(frontmatter.stats    !== undefined ? { stats:     frontmatter.stats }     : {}),
        ...(frontmatter.faq      !== undefined ? { faq_items: frontmatter.faq }       : {}),
        ...(frontmatter.sources  !== undefined ? { sources:   frontmatter.sources }   : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'locale,slug' }
    )
    .select('id')
    .single();

  if (error || !article) {
    console.error('Ingestion failed:', error?.message);
    process.exit(1);
  }

  // Tags are canonical slugs from the `tags` table (e.g. "race-analysis",
  // "ferrari") — re-ingesting an article replaces its full tag set rather
  // than merging, same idempotent semantics as the upsert above.
  const tagSlugs = frontmatter.tags ?? [];
  await supabase.from('article_tags').delete().eq('article_id', article.id);
  if (tagSlugs.length) {
    const { data: tagRows } = await supabase.from('tags').select('id, slug').in('slug', tagSlugs);
    const unknown = tagSlugs.filter((slug) => !tagRows?.some((t) => t.slug === slug));
    if (unknown.length) {
      console.error(`Unknown tag slug(s), not in the "tags" table: ${unknown.join(', ')}`);
      process.exit(1);
    }
    const rows = tagSlugs.map((slug, i) => ({
      article_id: article.id,
      tag_id: tagRows!.find((t) => t.slug === slug)!.id,
      position: i + 1,
    }));
    const { error: tagError } = await supabase.from('article_tags').insert(rows);
    if (tagError) {
      console.error('Tag linking failed:', tagError.message);
      process.exit(1);
    }
  }

  console.log(`Ingested ${frontmatter.locale}/${frontmatter.slug}`);
}

main();
