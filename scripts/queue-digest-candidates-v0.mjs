// DigOps editorial queue v0.
//
// Default is a dry run: read the top 25 beagle_item_scores where rubric_version
// is v0, and print what would be inserted, refreshed, or left alone.
// --apply upserts digest_item_candidates only.
//
// Uses SUPABASE_SERVICE_ROLE_KEY. Does not publish. Does not write digest_items,
// digest_issues, or articles. Does not set editor_take. Does not change FEEDS.
//
//   node scripts/queue-digest-candidates-v0.mjs --self-test
//   node scripts/queue-digest-candidates-v0.mjs
//   node scripts/queue-digest-candidates-v0.mjs --apply
//
// Contract: docs/DIGOPS-QUEUE-V0.md

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RUBRIC_VERSION = 'v0';
const TOP_N = 25;

const SNAPSHOT_KEYS = [
  'beagle_item_id',
  'score_id',
  'rubric_version',
  'score',
  'independent_outlet_count',
  'economic_payoff_flag',
  'signals',
  'scored_at',
  'updated_at',
];

const HELP = `DigOps queue v0 — dry run unless --apply. Upserts digest_item_candidates only.

  node scripts/queue-digest-candidates-v0.mjs --self-test    fixtures, no database
  node scripts/queue-digest-candidates-v0.mjs                top ${TOP_N} rubric ${RUBRIC_VERSION} scores, write nothing
  node scripts/queue-digest-candidates-v0.mjs --apply        upsert those candidates, then print the same plan

Service role only (SUPABASE_SERVICE_ROLE_KEY). No digest_items, no articles, no issue flipped to published.
Scores first: node scripts/score-beagle-v0.mjs --apply
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

function compareScoreRows(a, b) {
  const scoreDelta = Number(b.score) - Number(a.score);
  if (scoreDelta !== 0) return scoreDelta;
  const outletDelta = Number(b.independent_outlet_count) - Number(a.independent_outlet_count);
  if (outletDelta !== 0) return outletDelta;
  const timeDelta = Date.parse(b.scored_at) - Date.parse(a.scored_at);
  if (Number.isFinite(timeDelta) && timeDelta !== 0) return timeDelta;
  return String(a.beagle_item_id).localeCompare(String(b.beagle_item_id));
}

function topN(rows, n = TOP_N) {
  return [...rows].sort(compareScoreRows).slice(0, n);
}

function snapshotPayload(row, updatedAt) {
  if (row.rubric_version !== RUBRIC_VERSION) {
    throw new Error(`Refusing rubric ${row.rubric_version}. This queue only copies ${RUBRIC_VERSION}.`);
  }
  if (typeof row.beagle_item_id !== 'string' || row.beagle_item_id.length === 0) {
    throw new Error('Score row is missing beagle_item_id.');
  }
  if (typeof row.id !== 'string' || row.id.length === 0) {
    throw new Error(`Score row for ${row.beagle_item_id} is missing id.`);
  }
  const score = Number(row.score);
  if (!Number.isFinite(score)) throw new Error(`Score for ${row.beagle_item_id} is not a number.`);
  const outlets = Number(row.independent_outlet_count);
  if (!Number.isInteger(outlets) || outlets < 0) {
    throw new Error(`Outlet count for ${row.beagle_item_id} is not a non-negative integer.`);
  }
  if (typeof row.economic_payoff_flag !== 'boolean') {
    throw new Error(`economic_payoff_flag for ${row.beagle_item_id} is not a boolean.`);
  }
  if (row.signals === null || typeof row.signals !== 'object' || Array.isArray(row.signals)) {
    throw new Error(`signals for ${row.beagle_item_id} is not an object.`);
  }
  if (typeof row.scored_at !== 'string' || row.scored_at.length === 0) {
    throw new Error(`scored_at for ${row.beagle_item_id} is missing.`);
  }

  const payload = {
    beagle_item_id: row.beagle_item_id,
    score_id: row.id,
    rubric_version: RUBRIC_VERSION,
    score,
    independent_outlet_count: outlets,
    economic_payoff_flag: row.economic_payoff_flag,
    signals: row.signals,
    scored_at: row.scored_at,
    updated_at: updatedAt,
  };
  const keys = Object.keys(payload);
  if (keys.length !== SNAPSHOT_KEYS.length || SNAPSHOT_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(payload, key))) {
    throw new Error('Snapshot payload drifted from the allowlist.');
  }
  return payload;
}

function planQueue(ranked, existing) {
  const statusByItem = new Map(existing.map((row) => [row.beagle_item_id, row.status]));
  const insert = [];
  const refresh = [];
  const skip = [];
  for (const row of ranked) {
    const status = statusByItem.get(row.beagle_item_id);
    if (status === undefined) insert.push(row);
    else if (status === 'queued') refresh.push(row);
    else skip.push({ row, status });
  }
  return { insert, refresh, skip };
}

function assertNoPublishPath(source) {
  for (const table of ['digest_items', 'digest_issues', 'articles']) {
    const single = `.from('${table}')`;
    const double = `.from("${table}")`;
    if (source.includes(single) || source.includes(double)) {
      throw new Error(`Refusing a query against ${table}.`);
    }
  }
}

async function loadTopScores(supabase) {
  const { data, error } = await supabase
    .from('beagle_item_scores')
    .select('id, beagle_item_id, score, independent_outlet_count, economic_payoff_flag, signals, rubric_version, scored_at')
    .eq('rubric_version', RUBRIC_VERSION)
    .order('score', { ascending: false })
    .order('independent_outlet_count', { ascending: false })
    .order('scored_at', { ascending: false })
    .order('beagle_item_id', { ascending: true })
    .limit(TOP_N);
  if (error) throw new Error(error.message);
  return topN(data ?? []);
}

async function loadExisting(supabase, ids) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('digest_item_candidates')
    .select('beagle_item_id, status')
    .in('beagle_item_id', ids);
  if (error) {
    const missing = /digest_item_candidates|schema cache|PGRST205/i.test(error.message)
      ? ' Apply supabase/migrations/20260923020000_digest_item_candidates.sql in the Supabase SQL editor, then re-run.'
      : '';
    throw new Error(`${error.message}.${missing}`);
  }
  return data ?? [];
}

async function loadPoolRows(supabase, ids) {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from('beagle_items')
    .select('id, source_name, title, link')
    .in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id, row]));
}

function printPlan(ranked, plan, itemsById) {
  console.log(`Top ${ranked.length} of rubric ${RUBRIC_VERSION} by score`);
  console.log(`Insert ${plan.insert.length}, refresh queued ${plan.refresh.length}, leave decided ${plan.skip.length}`);
  const action = new Map();
  for (const row of plan.insert) action.set(row.beagle_item_id, 'insert');
  for (const row of plan.refresh) action.set(row.beagle_item_id, 'refresh');
  for (const entry of plan.skip) action.set(entry.row.beagle_item_id, `skip ${entry.status}`);
  for (const row of ranked) {
    const item = itemsById.get(row.beagle_item_id);
    const source = item?.source_name ?? '—';
    const title = item?.title ?? row.beagle_item_id;
    console.log(
      `  ${row.score}  ${action.get(row.beagle_item_id)}  outlets=${row.independent_outlet_count}  [${source}]`,
    );
    console.log(`      ${title}`);
    if (item?.link) console.log(`      ${item.link}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function selfTest() {
  const source = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  assertNoPublishPath(source);

  const scoredAt = '2026-09-23T00:00:00.000Z';
  const later = '2026-09-23T01:00:00.000Z';
  const signals = { eeat_incomplete: true, primary_source: null };
  const rows = [
    { id: 's-low', beagle_item_id: 'b-low', score: '9', independent_outlet_count: 8, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: later },
    { id: 's-high', beagle_item_id: 'b-high', score: '10', independent_outlet_count: 1, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: scoredAt },
    { id: 's-tie-out', beagle_item_id: 'b-tie-out', score: 10, independent_outlet_count: 4, economic_payoff_flag: true, signals, rubric_version: 'v0', scored_at: scoredAt },
    { id: 's-tie-new', beagle_item_id: 'b-tie-new', score: 10, independent_outlet_count: 4, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: later },
    { id: 's-tie-old', beagle_item_id: 'b-tie-old', score: 10, independent_outlet_count: 4, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: scoredAt },
    { id: 's-id-b', beagle_item_id: 'b-id-b', score: 10, independent_outlet_count: 4, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: later },
    { id: 's-id-a', beagle_item_id: 'b-id-a', score: 10, independent_outlet_count: 4, economic_payoff_flag: false, signals, rubric_version: 'v0', scored_at: later },
  ];
  const ranked = topN(rows, 6);
  assert(ranked.length === 6, 'topN drops the lowest score');
  // score desc, then outlets desc, then scored_at desc, then beagle_item_id asc.
  // String "9" is numeric 9, so it loses to every 10 even with more outlets.
  // Among the three newest outlet-4 rows, id asc is b-id-a, b-id-b, b-tie-new.
  assert(
    ranked.map((row) => row.beagle_item_id).join('|') === 'b-id-a|b-id-b|b-tie-new|b-tie-old|b-tie-out|b-high',
    `rank ${ranked.map((row) => row.beagle_item_id).join('|')}`,
  );

  const plan = planQueue(ranked, [
    { beagle_item_id: 'b-tie-new', status: 'queued' },
    { beagle_item_id: 'b-id-a', status: 'accepted' },
    { beagle_item_id: 'b-id-b', status: 'rejected' },
  ]);
  assert(plan.refresh.length === 1 && plan.refresh[0].beagle_item_id === 'b-tie-new', 'queued refreshes');
  assert(plan.skip.map((entry) => entry.status).sort().join('|') === 'accepted|rejected', 'decisions are left alone');
  assert(plan.insert.length === 3, 'missing rows insert');
  assert(!plan.insert.some((row) => row.beagle_item_id === 'b-id-a'), 'accepted is not an insert');

  const payload = snapshotPayload(ranked.find((row) => row.beagle_item_id === 'b-tie-out'), '2026-09-23T02:00:00.000Z');
  assert(payload.economic_payoff_flag === true, 'snapshot copies the flag');
  assert(payload.score === 10, 'snapshot stores a number');
  assert(payload.rubric_version === 'v0', 'snapshot is v0');
  for (const key of ['editor_note', 'editor_take', 'stats', 'slug', 'faq', 'status', 'issue_id', 'headline', 'our_summary']) {
    assert(!(key in payload), `payload must not include ${key}`);
  }
  assert(Object.keys(payload).length === SNAPSHOT_KEYS.length, 'payload is the allowlist');

  let refused = false;
  try {
    snapshotPayload({ ...rows[0], rubric_version: 'v1' }, later);
  } catch {
    refused = true;
  }
  assert(refused, 'v1 is not queued by this writer');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.check) {
    selfTest();
    console.log('digops queue v0 self-test ok');
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (env or .env.local). The anon key is not accepted.');
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is the anon key. Refusing to run.');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);
  const ranked = await loadTopScores(supabase);
  if (ranked.length === 0) {
    console.log(args.apply ? `DigOps queue ${RUBRIC_VERSION} — nothing to write` : `DigOps queue ${RUBRIC_VERSION} — dry run, nothing written`);
    console.log(`No rubric ${RUBRIC_VERSION} rows in beagle_item_scores.`);
    console.log('Run: node scripts/score-beagle-v0.mjs --apply');
    console.log('digest_items written: 0');
    console.log('digest_issues published: 0');
    console.log('editor_take written: 0');
    return;
  }

  const ids = ranked.map((row) => row.beagle_item_id);
  const [existing, itemsById] = await Promise.all([
    loadExisting(supabase, ids),
    loadPoolRows(supabase, ids),
  ]);
  const plan = planQueue(ranked, existing);

  if (!args.apply) {
    console.log(`DigOps queue ${RUBRIC_VERSION} — dry run, nothing written`);
  } else {
    const updatedAt = new Date().toISOString();
    const writes = [...plan.insert, ...plan.refresh].map((row) => snapshotPayload(row, updatedAt));
    if (writes.length > 0) {
      const { error } = await supabase
        .from('digest_item_candidates')
        .upsert(writes, { onConflict: 'beagle_item_id' });
      if (error) throw new Error(error.message);
    }
    console.log(
      `DigOps queue ${RUBRIC_VERSION} — inserted ${plan.insert.length}, refreshed ${plan.refresh.length}, skipped ${plan.skip.length}`,
    );
    console.log('digest_items written: 0');
    console.log('digest_issues published: 0');
    console.log('editor_take written: 0');
  }
  printPlan(ranked, plan, itemsById);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
