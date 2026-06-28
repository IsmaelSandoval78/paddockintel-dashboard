// Run: npx ts-node --project scripts/tsconfig.json scripts/ingest-digest.ts <path-to-json>
import * as fs from 'fs';
import * as path from 'path';

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

type DigestItem = {
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
  entity_tags?: string[];
  published_at?: string;
};

type DigestIssue = {
  slug: string;
  published_at: string;
  status?: string;
  intro_synthesis: string;
  items: DigestItem[];
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ingest-digest.ts <path-to-json>');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const issue: DigestIssue = JSON.parse(raw);
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
  await supabase.from('digest_items').delete().eq('issue_id', issueId);

  // Insert items
  const rows = issue.items.map((item) => ({
    issue_id: issueId,
    source_name: item.source_name,
    source_url: item.source_url,
    headline: item.headline,
    our_summary: item.our_summary,
    published_at: item.published_at ?? issue.published_at,
  }));

  const { error: itemsErr } = await supabase.from('digest_items').insert(rows);

  if (itemsErr) {
    console.error('Items insert failed:', itemsErr.message);
    process.exit(1);
  }

  console.log(`Ingested ${rows.length} items for ${issue.slug}`);
}

main();
