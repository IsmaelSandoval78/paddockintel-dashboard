// DigOps editorial queue v0.
//
// Default is a dry run. --apply inserts digest_items under one draft issue:
//   slug digops-queue, series digops_queue, status draft,
//   published_at null, sent_at null.
//
// It does not publish. It does not update digest_issues. It does not set
// editor_take, slug, faq, meta_description, or internal_link_slug.
// our_summary is the fixed stub, never the wire text.
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
const QUEUE_SLUG = 'digops-queue';
const QUEUE_SERIES = 'digops_queue';
const SUMMARY_STUB = '[DIGOPS DRAFT] Pending human rewrite \u2014 do not publish.';
const INTRO_STUB = '[DIGOPS DRAFT] Holder issue for the score queue. Not a newsletter. Do not publish.';
const EDITOR_NOTE = 'digops-queue';

const ITEM_KEYS = [
  'issue_id',
  'source_name',
  'source_url',
  'headline',
  'our_summary',
  'published_at',
  'entity_tags',
  'editor_note',
  'stats',
];

const STATS_KEYS = ['digops_candidate', 'beagle_item_id', 'score', 'rubric_version', 'economic_payoff_flag'];

const HELP = `DigOps queue v0 — dry run unless --apply. Inserts digest_items on draft issue ${QUEUE_SLUG} only.

  node scripts/queue-digest-candidates-v0.mjs --self-test    fixtures, no database
  node scripts/queue-digest-candidates-v0.mjs                top ${TOP_N} rubric ${RUBRIC_VERSION} scores, write nothing
  node scripts/queue-digest-candidates-v0.mjs --apply        insert missing candidates under ${QUEUE_SLUG}

Service role only (SUPABASE_SERVICE_ROLE_KEY).
Series ${QUEUE_SERIES}, status draft, published_at null, sent_at null.
Does not publish, does not set editor_take, does not fill a public slug.
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

function queueIssueRow() {
  return {
    slug: QUEUE_SLUG,
    series: QUEUE_SERIES,
    status: 'draft',
    published_at: null,
    sent_at: null,
    intro_synthesis: INTRO_STUB,
  };
}

function isHoldableQueueIssue(issue) {
  return Boolean(
    issue
    && issue.slug === QUEUE_SLUG
    && issue.status === 'draft'
    && issue.series === QUEUE_SERIES
    && issue.published_at == null
    && issue.sent_at == null,
  );
}

function itemPublishedAt(pool, nowIso) {
  if (typeof pool.published_at === 'string' && pool.published_at.length > 0) return pool.published_at;
  if (typeof pool.fetched_at === 'string' && pool.fetched_at.length > 0) return pool.fetched_at;
  return nowIso;
}

function traceStats(scoreRow) {
  if (scoreRow.rubric_version !== RUBRIC_VERSION) {
    throw new Error(`Refusing rubric ${scoreRow.rubric_version}. This queue only copies ${RUBRIC_VERSION}.`);
  }
  if (typeof scoreRow.beagle_item_id !== 'string' || scoreRow.beagle_item_id.length === 0) {
    throw new Error('Score row is missing beagle_item_id.');
  }
  const score = Number(scoreRow.score);
  if (!Number.isFinite(score)) throw new Error(`Score for ${scoreRow.beagle_item_id} is not a number.`);
  if (typeof scoreRow.economic_payoff_flag !== 'boolean') {
    throw new Error(`economic_payoff_flag for ${scoreRow.beagle_item_id} is not a boolean.`);
  }
  const stats = {
    digops_candidate: true,
    beagle_item_id: scoreRow.beagle_item_id,
    score,
    rubric_version: RUBRIC_VERSION,
    economic_payoff_flag: scoreRow.economic_payoff_flag,
  };
  const keys = Object.keys(stats);
  if (keys.length !== STATS_KEYS.length || STATS_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(stats, key))) {
    throw new Error('Trace stats drifted from the allowlist.');
  }
  return stats;
}

function buildCandidate(scoreRow, pool, nowIso) {
  if (!pool) return null;
  const sourceName = typeof pool.source_name === 'string' ? pool.source_name.trim() : '';
  const sourceUrl = typeof pool.link === 'string' ? pool.link.trim() : '';
  const headline = typeof pool.title === 'string' ? pool.title.trim() : '';
  if (!sourceName || !sourceUrl || !headline) return null;
  const tags = Array.isArray(pool.entity_tags)
    ? pool.entity_tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
    : [];
  return {
    source_name: sourceName,
    source_url: sourceUrl,
    headline,
    our_summary: SUMMARY_STUB,
    published_at: itemPublishedAt(pool, nowIso),
    entity_tags: tags,
    editor_note: EDITOR_NOTE,
    stats: traceStats(scoreRow),
  };
}

function itemInsert(candidate, issueId) {
  const row = {
    issue_id: issueId,
    source_name: candidate.source_name,
    source_url: candidate.source_url,
    headline: candidate.headline,
    our_summary: SUMMARY_STUB,
    published_at: candidate.published_at,
    entity_tags: candidate.entity_tags,
    editor_note: EDITOR_NOTE,
    stats: candidate.stats,
  };
  if (row.our_summary !== SUMMARY_STUB) throw new Error('our_summary drifted from the stub.');
  if (row.headline === row.our_summary) throw new Error('Refusing to store the wire headline as our_summary.');
  const keys = Object.keys(row);
  if (keys.length !== ITEM_KEYS.length || ITEM_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(row, key))) {
    throw new Error('Item payload drifted from the allowlist.');
  }
  return row;
}

function planInserts(candidates, existingUrls) {
  const seen = new Set(existingUrls);
  const insert = [];
  const skip = [];
  for (const row of candidates) {
    if (seen.has(row.source_url)) {
      skip.push(row);
      continue;
    }
    seen.add(row.source_url);
    insert.push(row);
  }
  return { insert, skip };
}

function assertScriptShape(source) {
  const updateCall = `.${'update'}(`;
  if (source.includes(updateCall)) throw new Error('Queue writer must not update rows.');
  const articles = `.from('${'articles'}')`;
  if (source.includes(articles) || source.includes(`.from("${'articles'}")`)) {
    throw new Error('Queue writer must not touch articles.');
  }
}

async function loadTopScores(supabase) {
  const { data, error } = await supabase
    .from('beagle_item_scores')
    .select('id, beagle_item_id, score, independent_outlet_count, economic_payoff_flag, rubric_version, scored_at')
    .eq('rubric_version', RUBRIC_VERSION)
    .order('score', { ascending: false })
    .order('independent_outlet_count', { ascending: false })
    .order('scored_at', { ascending: false })
    .order('beagle_item_id', { ascending: true })
    .limit(TOP_N);
  if (error) throw new Error(error.message);
  return topN(data ?? []);
}

async function loadPoolRows(supabase, ids) {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from('beagle_items')
    .select('id, source_name, title, link, entity_tags, published_at, fetched_at')
    .in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function loadQueueIssue(supabase) {
  const { data, error } = await supabase
    .from('digest_issues')
    .select('id, slug, status, series, published_at, sent_at')
    .eq('slug', QUEUE_SLUG)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function loadExistingUrls(supabase, issueId) {
  const urls = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('digest_items')
      .select('source_url')
      .eq('issue_id', issueId)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    for (const row of page) {
      if (typeof row.source_url === 'string' && row.source_url.length > 0) urls.push(row.source_url);
    }
    if (page.length < pageSize) break;
  }
  return urls;
}

function refuseUnholdable(issue) {
  if (!issue || isHoldableQueueIssue(issue)) return;
  throw new Error(
    `Refusing to write. ${QUEUE_SLUG} exists as status=${issue.status} series=${issue.series} published_at=${issue.published_at ?? 'null'} sent_at=${issue.sent_at ?? 'null'}. The queue only attaches to a draft ${QUEUE_SERIES} issue with both timestamps null.`,
  );
}

function migrationHint(error) {
  const text = error instanceof Error ? error.message : String(error);
  if (/digest_issues_series_check|digops_queue_stays_draft|digops_queue/.test(text)) {
    return `${text} Apply supabase/migrations/20260923020000_digest_issues_digops_queue_series.sql in the Supabase SQL editor, then re-run.`;
  }
  return text;
}

async function insertQueueIssue(supabase) {
  const payload = queueIssueRow();
  const { error } = await supabase.from('digest_issues').insert(payload);
  if (error && error.code !== '23505') throw new Error(migrationHint(error));
  const issue = await loadQueueIssue(supabase);
  refuseUnholdable(issue);
  if (!isHoldableQueueIssue(issue)) {
    throw new Error(`Issue ${QUEUE_SLUG} was not created as a holdable draft.`);
  }
  return issue;
}

function printPlan(rankedCandidates, plan, issue) {
  const issueLine = issue
    ? `Issue ${QUEUE_SLUG} exists (${issue.series}, ${issue.status})`
    : `Issue ${QUEUE_SLUG} is missing — would insert a draft ${QUEUE_SERIES} holder`;
  console.log(issueLine);
  console.log(`our_summary stub: ${SUMMARY_STUB}`);
  console.log('slug, faq, meta_description, meta_description_es, editor_take, editor_take_es, internal_link_slug: null');
  console.log(`Insert ${plan.insert.length}, skip ${plan.skip.length} (source_url already queued)`);
  const inserting = new Set(plan.insert);
  for (const row of rankedCandidates) {
    const action = inserting.has(row) ? 'insert' : 'skip';
    const score = row.stats.score;
    console.log(`  ${score}  ${action}  [${row.source_name}]`);
    console.log(`      ${row.headline}`);
    console.log(`      ${row.source_url}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function selfTest() {
  const source = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  assertScriptShape(source);
  assert(SUMMARY_STUB === '[DIGOPS DRAFT] Pending human rewrite \u2014 do not publish.', 'stub text');
  assert(SUMMARY_STUB.includes('\u2014'), 'stub uses an em dash');

  const issue = queueIssueRow();
  assert(issue.slug === 'digops-queue', 'slug');
  assert(issue.series === 'digops_queue', 'series');
  assert(issue.status === 'draft', 'status');
  assert(issue.published_at === null && issue.sent_at === null, 'timestamps');
  assert(isHoldableQueueIssue({ id: 'x', ...issue }), 'holder accepts itself');
  assert(!isHoldableQueueIssue({ ...issue, series: 'newsletter' }), 'newsletter is not the queue');
  assert(!isHoldableQueueIssue({ ...issue, status: 'published' }), 'published is refused');
  assert(!isHoldableQueueIssue({ ...issue, published_at: '2026-09-23T00:00:00Z' }), 'published_at is refused');

  const nowIso = '2026-09-23T03:00:00.000Z';
  const scoreRow = {
    id: 'score-1',
    beagle_item_id: 'beagle-1',
    score: '80',
    independent_outlet_count: 3,
    economic_payoff_flag: false,
    rubric_version: 'v0',
    scored_at: '2026-09-23T00:00:00.000Z',
  };
  const pool = {
    source_name: 'The Race',
    title: '  Verstappen cost cap hearing  ',
    link: ' https://example.test/a ',
    entity_tags: ['Max Verstappen', '', 3],
    published_at: null,
    fetched_at: '2026-09-22T00:00:00.000Z',
  };
  const candidate = buildCandidate(scoreRow, pool, nowIso);
  assert(candidate.headline === 'Verstappen cost cap hearing', 'headline is the wire title');
  assert(candidate.our_summary === SUMMARY_STUB, 'summary is the stub');
  assert(candidate.our_summary !== candidate.headline, 'wire is not editorial');
  assert(candidate.source_url === 'https://example.test/a', 'link trimmed');
  assert(candidate.published_at === '2026-09-22T00:00:00.000Z', 'fetched_at fills a null published_at');
  assert(candidate.entity_tags.join('|') === 'Max Verstappen', 'tags');
  assert(candidate.editor_note === 'digops-queue', 'editor note marker');
  assert(candidate.stats.digops_candidate === true, 'marker');
  assert(candidate.stats.score === 80, 'score number');
  assert(candidate.stats.economic_payoff_flag === false, 'flag copied, not invented true');
  assert(candidate.stats.rubric_version === 'v0', 'rubric');
  assert(!('verified' in candidate.stats), 'no verified payoff');

  const withPublished = buildCandidate(scoreRow, { ...pool, published_at: '2026-09-21T00:00:00.000Z' }, nowIso);
  assert(withPublished.published_at === '2026-09-21T00:00:00.000Z', 'published_at wins');
  const withNeither = buildCandidate(scoreRow, { ...pool, published_at: null, fetched_at: null }, nowIso);
  assert(withNeither.published_at === nowIso, 'now fills both');

  const row = itemInsert(candidate, 'issue-1');
  for (const key of ['slug', 'faq', 'meta_description', 'meta_description_es', 'editor_take', 'editor_take_es', 'editor_note_es', 'headline_es', 'our_summary_es', 'internal_link_slug']) {
    assert(!(key in row), `payload must not include ${key}`);
  }
  assert(row.issue_id === 'issue-1', 'issue');
  assert(row.our_summary === SUMMARY_STUB, 'insert restates the stub');

  const lower = buildCandidate(
    { ...scoreRow, beagle_item_id: 'beagle-2', score: 10 },
    { ...pool, title: 'Same link, lower score', link: 'https://example.test/a' },
    nowIso,
  );
  const other = buildCandidate(
    { ...scoreRow, beagle_item_id: 'beagle-3', score: 70 },
    { ...pool, title: 'Other story', link: 'https://example.test/b' },
    nowIso,
  );
  const plan = planInserts([candidate, lower, other], ['https://example.test/b']);
  assert(plan.insert.length === 1 && plan.insert[0].headline.startsWith('Verstappen'), 'first URL wins, existing URL skipped');
  assert(plan.skip.length === 2, 'duplicate and existing are skips');

  let refused = false;
  try {
    traceStats({ ...scoreRow, rubric_version: 'v1' });
  } catch {
    refused = true;
  }
  assert(refused, 'v1 is not queued');

  const ranked = topN([
    { score: '9', independent_outlet_count: 8, scored_at: '2026-09-23T02:00:00.000Z', beagle_item_id: 'low' },
    { score: 10, independent_outlet_count: 1, scored_at: '2026-09-23T00:00:00.000Z', beagle_item_id: 'high-low-outlets' },
    { score: 10, independent_outlet_count: 4, scored_at: '2026-09-23T01:00:00.000Z', beagle_item_id: 'b' },
    { score: 10, independent_outlet_count: 4, scored_at: '2026-09-23T01:00:00.000Z', beagle_item_id: 'a' },
  ], 3);
  assert(ranked.map((row) => row.beagle_item_id).join('|') === 'a|b|high-low-outlets', 'numeric score, then outlets, then id');
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
    console.log('digest_issues updated: 0');
    console.log('editor_take written: 0');
    return;
  }

  const nowIso = new Date().toISOString();
  const pool = await loadPoolRows(supabase, ranked.map((row) => row.beagle_item_id));
  const candidates = [];
  for (const scoreRow of ranked) {
    const candidate = buildCandidate(scoreRow, pool.get(scoreRow.beagle_item_id), nowIso);
    if (candidate) candidates.push(candidate);
  }

  const existingIssue = await loadQueueIssue(supabase);
  refuseUnholdable(existingIssue);
  const existingUrls = existingIssue ? await loadExistingUrls(supabase, existingIssue.id) : [];
  const plan = planInserts(candidates, existingUrls);
  if (candidates.length < ranked.length) {
    console.log(`Skipped ${ranked.length - candidates.length} scores with no usable title, link, or source_name`);
  }

  if (!args.apply) {
    console.log(`DigOps queue ${RUBRIC_VERSION} — dry run, nothing written`);
    printPlan(candidates, plan, existingIssue);
    return;
  }

  if (plan.insert.length === 0) {
    console.log(`DigOps queue ${RUBRIC_VERSION} — nothing new to insert`);
    console.log('digest_issues updated: 0');
    console.log('editor_take written: 0');
    printPlan(candidates, plan, existingIssue);
    return;
  }

  const issue = existingIssue ?? await insertQueueIssue(supabase);
  const writes = plan.insert.map((candidate) => itemInsert(candidate, issue.id));
  const { error } = await supabase.from('digest_items').insert(writes);
  if (error) throw new Error(error.message);

  const confirmed = await loadQueueIssue(supabase);
  refuseUnholdable(confirmed);

  console.log(`DigOps queue ${RUBRIC_VERSION} — inserted ${writes.length} draft items on ${QUEUE_SLUG}`);
  console.log('digest_issues status left draft: 1');
  console.log('digest_issues updated: 0');
  console.log('editor_take written: 0');
  console.log('public slugs written: 0');
  printPlan(candidates, plan, confirmed);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
