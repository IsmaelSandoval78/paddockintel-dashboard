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

type Frontmatter = {
  slug: string;
  title: string;
  locale: 'en' | 'es' | 'pt';
  meta_description?: string;
  cover_image_url?: string;
  tags?: string[];
  translation_group_id?: string;
  status?: 'draft' | 'published';
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

  const { error } = await supabase
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
        tags: frontmatter.tags ?? [],
        status: frontmatter.status ?? 'draft',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'locale,slug' }
    );

  if (error) {
    console.error('Ingestion failed:', error.message);
    process.exit(1);
  }

  console.log(`Ingested ${frontmatter.locale}/${frontmatter.slug}`);
}

main();
