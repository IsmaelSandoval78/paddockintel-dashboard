// Run: npx ts-node --project scripts/tsconfig.json scripts/whos-who-pick.ts <path-to-pick.md>
//
// Fase 2 semi-manual del paso 4 "Who's Who": vos elegís el post y escribís el
// takeaway (a mano, o con ayuda de un LLM para redactar a partir del texto real
// del post que ya leíste) -- este script solo lo carga en Supabase.
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

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
  expert_slug: string;
  post_url: string;
  topic?: string;
  locale?: 'en' | 'es' | 'pt';
};

function readPick(filePath: string): { frontmatter: Frontmatter; takeaway: string } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  for (const field of ['expert_slug', 'post_url'] as const) {
    if (!data[field]) {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`);
    }
  }

  const takeaway = content.trim();
  if (!takeaway) {
    throw new Error(`Missing takeaway body in ${filePath}`);
  }

  return { frontmatter: data as Frontmatter, takeaway };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: whos-who-pick.ts <path-to-pick.md>');
    process.exit(1);
  }

  const { frontmatter, takeaway } = readPick(path.resolve(filePath));
  const supabase = createClient();

  const { data: expert, error: expertError } = await supabase
    .from('experts')
    .select('id, name, is_active')
    .eq('slug', frontmatter.expert_slug)
    .single();

  if (expertError || !expert) {
    console.error(`Unknown expert slug: "${frontmatter.expert_slug}" — check docs/WHOS-WHO-FASE0-CANDIDATES.md`);
    process.exit(1);
  }
  if (!expert.is_active) {
    console.error(`Expert "${expert.name}" is marked is_active=false — reactivate before picking a post of theirs.`);
    process.exit(1);
  }

  const { error } = await supabase.from('expert_picks').insert({
    expert_id: expert.id,
    post_url: frontmatter.post_url,
    topic: frontmatter.topic ?? null,
    takeaway,
    locale: frontmatter.locale ?? 'en',
  });

  if (error) {
    console.error('Pick ingestion failed:', error.message);
    process.exit(1);
  }

  console.log(`Picked ${expert.name}: ${frontmatter.post_url}`);
}

main();
