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
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}
loadEnvLocal();

import { createClient } from '../lib/supabase/server';

type Stat = { value: string; label: string; unit?: string };
type FAQ  = { q: string; a: string };
type Source = { name: string; url: string };
type Chart = Record<string, unknown>; // dispatched by `type` — see components/blog/ArticleCharts.tsx

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
  paywalled?: boolean;
  stats?: Stat[];
  faq?: FAQ[];
  sources?: Source[];
  charts?: Chart[];
  voices?: string[];
};

function readArticle(filePath: string): { frontmatter: Frontmatter; body: string } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  for (const field of ['slug', 'title', 'locale'] as const) {
    if (!data[field]) {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`);
    }
  }

  // EDITORIAL.md's sourcing rule and DATA-EXPERT.md's source hierarchy are both
  // non-negotiable, but neither was ever enforced at the one place that actually
  // writes to the `articles` table — an audit found 44 of 97 pre-September
  // articles published with zero traceable source, structured or inline. This is
  // the actual gate: a `published` article without a real `sources` array never
  // reaches the database. Ingesting as `draft` with no sources is still allowed
  // (a source-verification pass can happen before flipping status later).
  if (data.status === 'published' && (!data.sources || (data.sources as unknown[]).length === 0)) {
    throw new Error(
      `Refusing to ingest ${filePath} as status: published with no "sources" — ` +
        `EDITORIAL.md's sourcing rule requires every claim traceable to a primary source. ` +
        `Add real sources or ingest as status: draft first.`
    );
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

  // published_at has no DB default and EDITORIAL.md's own frontmatter template
  // doesn't show the field — omitting it silently left new articles with a
  // null published_at, which sorts last (nullsFirst: false everywhere it's
  // queried) and makes a "published" article invisible on any listing/recent
  // feed while still resolving at its direct URL. Default it to now() for a
  // genuinely new row; never touch it on re-ingest of an existing article
  // (that would silently bump its real publish date, a distinct problem this
  // project has flagged before as a Ghost-slug integrity issue).
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('locale', frontmatter.locale)
    .eq('slug', frontmatter.slug)
    .maybeSingle();
  const isNew = !existing;

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
        paywalled: frontmatter.paywalled ?? false,
        ...(frontmatter.published_at !== undefined
          ? { published_at: frontmatter.published_at }
          : isNew
            ? { published_at: new Date().toISOString() }
            : {}),
        ...(frontmatter.stats    !== undefined ? { stats:     frontmatter.stats }     : {}),
        ...(frontmatter.faq      !== undefined ? { faq_items: frontmatter.faq }       : {}),
        ...(frontmatter.sources  !== undefined ? { sources:   frontmatter.sources }   : {}),
        ...(frontmatter.charts   !== undefined ? { charts:    frontmatter.charts }    : {}),
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

  // Voices: frontmatter lists expert slugs (docs/WHOS-WHO-FASE0-CANDIDATES.md),
  // resolved here to each expert's current active pick -- same
  // idempotent delete-then-insert semantics as tags above. Fails loudly
  // (unknown slug, no active pick, or more than one active pick for the
  // same expert) rather than guessing which quote to show.
  const voiceSlugs = frontmatter.voices ?? [];
  await supabase.from('article_expert_picks').delete().eq('article_id', article.id);
  if (voiceSlugs.length) {
    const { data: expertRows } = await supabase
      .from('experts')
      .select('id, slug, name')
      .in('slug', voiceSlugs);
    const unknownExperts = voiceSlugs.filter((slug) => !expertRows?.some((e) => e.slug === slug));
    if (unknownExperts.length) {
      console.error(`Unknown expert slug(s), not in the "experts" table: ${unknownExperts.join(', ')}`);
      process.exit(1);
    }

    const expertIds = expertRows!.map((e) => e.id);
    const { data: pickRows } = await supabase
      .from('expert_picks')
      .select('id, expert_id')
      .in('expert_id', expertIds)
      .eq('is_active', true);

    const rows = voiceSlugs.map((slug, i) => {
      const expert = expertRows!.find((e) => e.slug === slug)!;
      const picks = pickRows?.filter((p) => p.expert_id === expert.id) ?? [];
      if (picks.length === 0) {
        console.error(`"${expert.name}" (${slug}) has no active pick in expert_picks -- curate one first (scripts/whos-who-pick.ts) before linking them as a voice.`);
        process.exit(1);
      }
      if (picks.length > 1) {
        console.error(`"${expert.name}" (${slug}) has ${picks.length} active picks -- ambiguous which one this article should link. Deactivate all but one first.`);
        process.exit(1);
      }
      return { article_id: article.id, expert_pick_id: picks[0].id, position: i + 1 };
    });

    const { error: voicesError } = await supabase.from('article_expert_picks').insert(rows);
    if (voicesError) {
      console.error('Voice linking failed:', voicesError.message);
      process.exit(1);
    }
  }

  console.log(`Ingested ${frontmatter.locale}/${frontmatter.slug}`);
}

main();
