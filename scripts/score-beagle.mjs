// Beagle significance score v0 writer.
//
// Reads beagle_items in the same 7-day window as lib/beagleCounts.ts and upserts
// beagle_item_scores (rubric_version = v0). It does not fetch RSS, does not edit
// the pool, and does not insert into digest_items or articles.
//
//   node scripts/score-beagle.mjs --self-test
//   node scripts/score-beagle.mjs --dry-run --top 20
//   node scripts/score-beagle.mjs
//   node scripts/score-beagle.mjs --list --top 20
//
// Contract and formula: docs/BEAGLE-SCORE-V0.md

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RUBRIC_VERSION,
  WINDOW_DAYS,
  judgeItems,
  listTopScores,
  loadWindowItems,
  selfTest,
  upsertScoreRows,
} from '../lib/beagleScoreV0.mjs';

const HELP = `Beagle score v0 — upserts beagle_item_scores only.

  node scripts/score-beagle.mjs --self-test       formula fixtures, no database
  node scripts/score-beagle.mjs --dry-run         score the ${WINDOW_DAYS}-day pool, print top N, write nothing
  node scripts/score-beagle.mjs                   upsert rubric ${RUBRIC_VERSION}, then print top N
  node scripts/score-beagle.mjs --list            print stored ${RUBRIC_VERSION} rows, do not rescore

  --top N    how many rows to print (1–100, default 20)

Does not publish. Does not insert into digest_items or articles. Does not change FEEDS.
`;

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
  let dryRun = false;
  let list = false;
  let check = false;
  let top = 20;
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--list') list = true;
    else if (arg === '--self-test') check = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else if (arg === '--top') {
      const raw = argv[i + 1];
      i += 1;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        throw new Error('--top must be an integer from 1 to 100');
      }
      top = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (dryRun && list) throw new Error('Use either --dry-run or --list, not both');
  if (check && (dryRun || list)) throw new Error('--self-test does not take --dry-run or --list');
  return { dryRun, list, check, top, help };
}

function relatedItem(row) {
  const rel = row.beagle_items;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

function printJudged(judged, top) {
  const ranked = [...judged].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.independentOutletCount !== a.independentOutletCount) {
      return b.independentOutletCount - a.independentOutletCount;
    }
    return a.title.localeCompare(b.title);
  });
  const slice = ranked.slice(0, top);
  console.log(`Top ${slice.length} of ${ranked.length}`);
  for (const row of slice) {
    const hint = row.signals.economic_title_hint.hint ?? '—';
    const tier = row.signals.source_tier ?? 'null';
    const { tierPoints, hintPoints, coveragePoints } = row.parts;
    console.log(
      `  ${row.score}  outlets=${row.independentOutletCount}  tier=${tier}  hint=${hint}  [${row.sourceName}]`,
    );
    console.log(`      ${tierPoints} tier + ${hintPoints} hint + ${coveragePoints} coverage`);
    console.log(`      ${row.title}`);
    if (row.link) console.log(`      ${row.link}`);
  }
}

function printStored(rows) {
  console.log(`Top ${rows.length} stored ${RUBRIC_VERSION} rows`);
  for (const row of rows) {
    const item = relatedItem(row);
    const signals = row.signals ?? {};
    const hint = signals.economic_title_hint?.hint ?? '—';
    const tier = signals.source_tier ?? 'null';
    const title = item?.title ?? '(pool row missing)';
    const source = item?.source_name ?? '';
    console.log(
      `  ${row.score}  outlets=${row.independent_outlet_count}  tier=${tier}  hint=${hint}  payoff=${row.economic_payoff_flag}  [${source}]`,
    );
    console.log(`      ${title}`);
    if (item?.link) console.log(`      ${item.link}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.check) {
    selfTest();
    console.log('beagle score v0 self-test ok');
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (env or .env.local).');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);

  if (args.list) {
    const rows = await listTopScores(supabase, args.top);
    printStored(rows);
    return;
  }

  const pool = await loadWindowItems(supabase);
  const judged = judgeItems(pool);
  if (args.dryRun) {
    console.log(`Beagle score ${RUBRIC_VERSION} — dry run, nothing written`);
  } else {
    const written = await upsertScoreRows(supabase, judged);
    console.log(`Beagle score ${RUBRIC_VERSION} — upserted ${written} rows into beagle_item_scores`);
    console.log('digest_items written: 0');
  }
  console.log(`Pool rows in the ${WINDOW_DAYS}-day window: ${pool.length}`);
  console.log(`Judged: ${judged.length}`);
  printJudged(judged, args.top);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
