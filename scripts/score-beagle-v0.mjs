// Beagle significance score v0.
//
// Default is a dry run: read the 7-day beagle_items window, print the top 25, write nothing.
// --apply upserts beagle_item_scores only (rubric_version = v0), then prints the same top 25.
//
// Uses SUPABASE_SERVICE_ROLE_KEY. Does not fetch RSS. Does not publish.
// Formula: docs/BEAGLE-SCORE-V0.md
//
//   node scripts/score-beagle-v0.mjs --self-test
//   node scripts/score-beagle-v0.mjs
//   node scripts/score-beagle-v0.mjs --apply

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RUBRIC_VERSION,
  TOP_N,
  WINDOW_DAYS,
  judgeItems,
  loadWindowItems,
  selfTest,
  upsertScoreRows,
} from '../lib/beagleScoreV0.mjs';

const HELP = `Beagle score v0 — dry run unless --apply. Upserts beagle_item_scores only.

  node scripts/score-beagle-v0.mjs --self-test    fixtures, no database
  node scripts/score-beagle-v0.mjs                score the ${WINDOW_DAYS}-day pool, print top ${TOP_N}, write nothing
  node scripts/score-beagle-v0.mjs --apply        upsert rubric ${RUBRIC_VERSION}, then print top ${TOP_N}

Service role only (SUPABASE_SERVICE_ROLE_KEY). No digest_items, no articles, no FEEDS change.
`;

const SYNDICATION_LITERAL = "[/^Motorsport\\.com/, 'Motorsport Network']";

function loadEnvLocal() {
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

function parseArgs(argv) {
  let apply = false;
  let dryRun = false;
  let check = false;
  let help = false;
  for (const arg of argv) {
    if (arg === '--apply') apply = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--self-test') check = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (apply && dryRun) throw new Error('Pass --apply to write. Dry run is the default; do not combine them.');
  if (check && apply) throw new Error('--self-test does not write; drop --apply');
  return { apply, check, help };
}

function assertSyndicationCopy() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const radar = fs.readFileSync(path.join(root, 'scripts/beagle.mjs'), 'utf8');
  const scorer = fs.readFileSync(path.join(root, 'lib/beagleScoreV0.mjs'), 'utf8');
  if (!radar.includes(SYNDICATION_LITERAL) || !scorer.includes(SYNDICATION_LITERAL)) {
    throw new Error('SYNDICATION_GROUPS drifted from scripts/beagle.mjs');
  }
}

function printTop(judged) {
  const ranked = [...judged].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.independentOutletCount !== a.independentOutletCount) {
      return b.independentOutletCount - a.independentOutletCount;
    }
    return a.title.localeCompare(b.title);
  });
  const slice = ranked.slice(0, TOP_N);
  console.log(`Top ${slice.length} of ${ranked.length} by score`);
  for (const row of slice) {
    const hint = row.signals.economic_title_hint?.hint ?? '—';
    const { base, hintPoints, party } = row.parts;
    console.log(
      `  ${row.score}  outlets=${row.independentOutletCount}  tier=${row.signals.source_tier}  hint=${hint}  [${row.sourceName}]`,
    );
    console.log(`      base ${base} + hint ${hintPoints} + party ${party}`);
    console.log(`      ${row.title}`);
    if (row.link) console.log(`      ${row.link}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.check) {
    assertSyndicationCopy();
    selfTest();
    console.log('beagle score v0 self-test ok');
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (env or .env.local). The anon key is not accepted.');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);
  const pool = await loadWindowItems(supabase);
  const judged = judgeItems(pool);

  if (!args.apply) {
    console.log(`Beagle score ${RUBRIC_VERSION} — dry run, nothing written`);
  } else {
    const written = await upsertScoreRows(supabase, judged);
    console.log(`Beagle score ${RUBRIC_VERSION} — upserted ${written} rows into beagle_item_scores`);
    console.log('digest_items written: 0');
  }
  console.log(`Pool rows with coalesce(published_at, fetched_at) in the last ${WINDOW_DAYS} days: ${pool.length}`);
  console.log(`Judged: ${judged.length}`);
  printTop(judged);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
