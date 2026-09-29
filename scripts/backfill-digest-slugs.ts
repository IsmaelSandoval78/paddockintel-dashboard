// Backfill digest_items.slug so newsletter items can be crawled at /feed/[slug].
// Writes the slug column only. Does not invent or update faq, stats, or meta_description.
//
// Dry-run (default — prints id, headline, proposed slug; no writes):
//   npx ts-node --project scripts/tsconfig.json scripts/backfill-digest-slugs.ts
// Apply (slug column only):
//   npx ts-node --project scripts/tsconfig.json scripts/backfill-digest-slugs.ts --apply
//
// Env, from .env.local (same names as scripts/ingest-digest.ts):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Selects digest_items joined to digest_issues where series = newsletter,
// status = published, and slug is null or blank. Slug is the full English
// headline (headline_es only when headline is blank), made URL-safe.
// Uniqueness is table-wide (partial unique index digest_items_slug_key).
// A collision takes -2, then -3, and so on. The earliest published_at, then id,
// keeps the unsuffixed slug. Rows that already have a slug are left alone.
import * as fs from 'fs';
import * as path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1');
  }
}
loadEnvLocal();

import { createClient } from '../lib/supabase/server';

const PAGE = 1000;

type Candidate = {
  id: string;
  headline: string | null;
  headline_es: string | null;
  slug: string | null;
  published_at: string;
};

type Planned = {
  id: string;
  headline: string;
  slug: string;
  currentSlug: string | null;
};

type Skipped = {
  id: string;
  reason: string;
};

type QueryError = { message: string } | null;

function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

/** URL-safe slug from a headline. Apostrophes drop; other punctuation becomes a hyphen. */
function slugifyHeadline(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’ʼ‘]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function preferredHeadline(row: Candidate): { text: string; from: 'en' | 'es' } | null {
  const en = (row.headline ?? '').trim();
  if (en) return { text: en, from: 'en' };
  const es = row.headline_es?.trim() ?? '';
  if (es) return { text: es, from: 'es' };
  return null;
}

function allocateSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  let candidate = `${base}-${n}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  taken.add(candidate);
  return candidate;
}

function planSlugBackfill(rows: Candidate[], existingSlugs: Iterable<string>): { updates: Planned[]; skips: Skipped[] } {
  const taken = new Set<string>();
  for (const slug of existingSlugs) {
    if (!isBlank(slug)) taken.add(slug.trim());
  }

  const pending = rows
    .filter((row) => isBlank(row.slug))
    .slice()
    .sort((a, b) => {
      const byDate = a.published_at.localeCompare(b.published_at);
      if (byDate !== 0) return byDate;
      return a.id.localeCompare(b.id);
    });

  const updates: Planned[] = [];
  const skips: Skipped[] = [];

  for (const row of pending) {
    const source = preferredHeadline(row);
    if (!source) {
      skips.push({ id: row.id, reason: 'blank headline' });
      continue;
    }
    const base = slugifyHeadline(source.text);
    if (!base) {
      skips.push({ id: row.id, reason: 'headline produced an empty slug' });
      continue;
    }
    updates.push({
      id: row.id,
      headline: source.from === 'es' ? `[es] ${source.text}` : source.text,
      slug: allocateSlug(base, taken),
      currentSlug: row.slug,
    });
  }

  return { updates, skips };
}

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

function selfCheck() {
  assertEqual(
    slugifyHeadline('Apple TV pays $140M/year for exclusive U.S. F1 rights through 2030'),
    'apple-tv-pays-140m-year-for-exclusive-u-s-f1-rights-through-2030',
    'dollars and slash',
  );
  assertEqual(slugifyHeadline("F1's 2026 cost cap"), 'f1s-2026-cost-cap', 'apostrophe');
  assertEqual(slugifyHeadline('André & Co.'), 'andre-and-co', 'accent and ampersand');
  assertEqual(slugifyHeadline('  ---  '), '', 'punctuation only');

  const rows: Candidate[] = [
    { id: 'b', headline: 'Same Story', headline_es: 'Otra', slug: null, published_at: '2026-02-01T00:00:00Z' },
    { id: 'a', headline: 'Same Story', headline_es: null, slug: '  ', published_at: '2026-01-01T00:00:00Z' },
    { id: 'c', headline: '   ', headline_es: 'Título único', slug: null, published_at: '2026-03-01T00:00:00Z' },
    { id: 'd', headline: '   ', headline_es: '   ', slug: null, published_at: '2026-03-02T00:00:00Z' },
    { id: 'e', headline: 'Kept', headline_es: null, slug: 'already-set', published_at: '2026-01-01T00:00:00Z' },
  ];
  const { updates, skips } = planSlugBackfill(rows, ['same-story-2', 'already-set']);
  if (updates.map((u) => `${u.id}:${u.slug}`).join(',') !== 'a:same-story,b:same-story-3,c:titulo-unico') {
    throw new Error(`plan mismatch: ${JSON.stringify(updates)}`);
  }
  if (skips.length !== 1 || skips[0].id !== 'd') {
    throw new Error(`skip mismatch: ${JSON.stringify(skips)}`);
  }
  console.log('self-check ok');
}

function printUsage() {
  console.log('Usage: scripts/backfill-digest-slugs.ts [--apply] [--self-check]');
  console.log('Default is a dry-run. --apply updates digest_items.slug only.');
  console.log('Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

function parseArgs(argv: string[]): { apply: boolean; selfCheck: boolean } {
  const args = argv.slice(2);
  if (args.some((arg) => arg === '--help' || arg === '-h')) {
    printUsage();
    process.exit(0);
  }
  const unknown = args.filter((arg) => arg !== '--apply' && arg !== '--self-check');
  if (unknown.length > 0) {
    console.error(`Unknown argument: ${unknown.join(' ')}`);
    printUsage();
    process.exit(1);
  }
  return { apply: args.includes('--apply'), selfCheck: args.includes('--self-check') };
}

async function fetchPages<T>(
  load: (from: number, to: number) => Promise<{ data: T[] | null; error: QueryError }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await load(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < PAGE) return out;
  }
}

async function main() {
  const { apply, selfCheck: checkOnly } = parseArgs(process.argv);
  if (checkOnly) {
    selfCheck();
    return;
  }

  const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing ${missing.join(' and ')}.`);
    console.error('Put them in .env.local (same names as scripts/ingest-digest.ts). Nothing was written.');
    process.exit(1);
  }

  const supabase = createClient();

  const candidates = await fetchPages<Candidate>(async (from, to) => {
    const { data, error } = await supabase
      .from('digest_items')
      .select('id, headline, headline_es, slug, published_at, digest_issues!inner(status, series)')
      .eq('digest_issues.status', 'published')
      .eq('digest_issues.series', 'newsletter')
      .order('id', { ascending: true })
      .range(from, to);
    return { data: (data ?? null) as Candidate[] | null, error };
  });

  const slugRows = await fetchPages<{ slug: string | null }>(async (from, to) => {
    const { data, error } = await supabase
      .from('digest_items')
      .select('slug')
      .not('slug', 'is', null)
      .order('id', { ascending: true })
      .range(from, to);
    return { data: (data ?? null) as { slug: string | null }[] | null, error };
  });

  const { updates, skips } = planSlugBackfill(
    candidates,
    slugRows.map((row) => row.slug ?? ''),
  );

  const mode = apply ? 'APPLY' : 'DRY RUN';
  console.log(`${mode} — ${updates.length} newsletter-published digest_items ${apply ? 'to update' : 'would get a slug'}.`);

  for (const row of updates) {
    console.log(`${row.id}\t${row.slug}`);
    console.log(`  ${row.headline.replace(/\s+/g, ' ')}`);
  }
  for (const skip of skips) {
    console.log(`SKIP ${skip.id}\t${skip.reason}`);
  }

  if (!apply) {
    console.log('No rows written. Re-run with --apply to update the slug column only.');
    if (skips.length > 0) process.exit(1);
    return;
  }

  let updated = 0;
  let raced = 0;
  let failed = 0;
  for (const row of updates) {
    let query = supabase.from('digest_items').update({ slug: row.slug }).eq('id', row.id);
    query = row.currentSlug == null ? query.is('slug', null) : query.eq('slug', row.currentSlug);
    const { data, error } = await query.select('id');
    if (error) {
      console.error(`failed ${row.id}: ${error.message}`);
      failed += 1;
      continue;
    }
    const written = (data ?? []) as { id: string }[];
    if (written.length === 0) {
      console.log(`skipped ${row.id} (slug changed since read)`);
      raced += 1;
      continue;
    }
    updated += 1;
  }

  console.log(`updated ${updated}, skipped ${raced + skips.length}, failed ${failed}.`);
  if (failed > 0 || skips.length > 0) process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
