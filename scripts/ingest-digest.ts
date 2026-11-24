// Run: npx ts-node --project scripts/tsconfig.json scripts/ingest-digest.ts <path-to-json>
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
import { validateCorrections, type Correction } from '../lib/corrections';

type Stat = { value: string; label: string; label_es?: string | null; unit?: string | null; unit_es?: string | null };
type Faq = { q: string; a: string; q_es?: string | null; a_es?: string | null };

type DigestItem = {
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
  entity_tags?: string[];
  published_at?: string;
  editor_note?: string | null;
  editor_take?: string | null;
  internal_link_slug?: string | null;
  headline_es?: string | null;
  our_summary_es?: string | null;
  editor_note_es?: string | null;
  editor_take_es?: string | null;
  slug?: string | null;
  stats?: Stat[] | null;
  hook_deliver?: unknown;
  faq?: Faq[] | null;
  meta_description?: string | null;
  meta_description_es?: string | null;
  // Dated public corrections/updates shown under the byline (lib/corrections.ts):
  // [{ date: ISO 8601, note, note_es }]. Add one whenever a published fact changes.
  corrections?: Correction[];
};

type DigestIssue = {
  slug: string;
  published_at: string;
  status?: string;
  intro_synthesis: string;
  items: DigestItem[];
};

// The numbers an item features ("23 of 31" -> 23, 31; "$18M" -> 18), and whether one of them leads.
function dataLeadProblems(item: DigestItem): string[] {
  const name = item.slug ?? item.headline;
  // Separators stripped, so "2.927" (EN) and "2,927" (ES) count as the same number.
  const digits = (text: string) => (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/[.,]/g, ''));
  const numbers = new Set((item.stats ?? []).flatMap((s) => digits(s.value)));
  if (!numbers.size) return [`${name}: no stats; a Feed item needs at least one number of its own`];
  const firstSentence = (text: string | null | undefined) => (text ?? '').split(/(?<=[.!?]["”]?)\s+/)[0];
  const leads = (headline: string | null | undefined, summary: string | null | undefined) => {
    const tokens = new Set(digits(`${headline ?? ''} ${firstSentence(summary)}`));
    return [...numbers].some((n) => tokens.has(n));
  };
  const out: string[] = [];
  if (!leads(item.headline, item.our_summary)) out.push(`${name}: no stat number (${[...numbers].join(', ')}) in the EN headline or first sentence`);
  if (!leads(item.headline_es, item.our_summary_es)) out.push(`${name}: no stat number (${[...numbers].join(', ')}) in the ES headline or first sentence`);
  return out;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ingest-digest.ts <path-to-json>');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const issue: DigestIssue = JSON.parse(raw);

  // Data-first Feed format (EDITORIAL.md, "The Feed", decided 2026-11-24): from that date every item
  // features at least one stat, and one of those numbers appears in the headline or the first sentence
  // of the summary, in EN and in ES. Issues published earlier are exempt so they can still be
  // re-ingested for corrections.
  if (issue.published_at >= '2026-11-24') {
    const problems = issue.items.flatMap((item) => dataLeadProblems(item));
    if (problems.length) {
      console.error('Data-first check failed (EDITORIAL.md, "The Feed"):\n' + problems.map((p) => `  - ${p}`).join('\n'));
      process.exit(1);
    }
  }

  const supabase = createClient();

  // Upsert issue
  const { data: issueRow, error: issueErr } = await supabase
    .from('digest_issues')
    .upsert(
      {
        slug: issue.slug,
        published_at: issue.published_at,
        status: issue.status ?? 'published',
        intro_synthesis: issue.intro_synthesis,
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single();

  if (issueErr || !issueRow) {
    console.error('Issue upsert failed:', issueErr?.message);
    process.exit(1);
  }

  const issueId = issueRow.id as string;
  console.log(`Issue upserted: ${issue.slug} (id: ${issueId})`);

  // Delete existing items for this issue (full replace on re-ingest)
  const { error: deleteErr } = await supabase.from('digest_items').delete().eq('issue_id', issueId);

  if (deleteErr) {
    console.error('Delete of existing items failed, aborting before insert to avoid duplicates:', deleteErr.message);
    process.exit(1);
  }

  // Insert items
  const rows = issue.items.map((item) => ({
    issue_id: issueId,
    source_name: item.source_name,
    source_url: item.source_url,
    headline: item.headline,
    our_summary: item.our_summary,
    entity_tags: item.entity_tags ?? [],
    published_at: item.published_at ?? issue.published_at,
    editor_note: item.editor_note ?? null,
    editor_take: item.editor_take ?? null,
    internal_link_slug: item.internal_link_slug ?? null,
    headline_es: item.headline_es ?? null,
    our_summary_es: item.our_summary_es ?? null,
    editor_note_es: item.editor_note_es ?? null,
    editor_take_es: item.editor_take_es ?? null,
    slug: item.slug ?? null,
    stats: item.stats ?? null,
    hook_deliver: item.hook_deliver ?? null,
    faq: item.faq ?? null,
    meta_description: item.meta_description ?? null,
    meta_description_es: item.meta_description_es ?? null,
    // Always sent: a multi-row insert fills a key one row lacks with null, not the column default,
    // and corrections is NOT NULL (2026-11-09: a batch where only some items had corrections failed).
    corrections:
      item.corrections !== undefined
        ? validateCorrections(item.corrections, `item ${item.slug ?? item.headline}`, true)
        : [],
  }));

  const { error: itemsErr } = await supabase.from('digest_items').insert(rows);

  if (itemsErr) {
    console.error('Items insert failed:', itemsErr.message);
    process.exit(1);
  }

  console.log(`Ingested ${rows.length} items for ${issue.slug}`);
}

main();
