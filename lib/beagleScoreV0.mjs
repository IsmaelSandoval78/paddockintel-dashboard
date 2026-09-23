// Beagle significance score v0. judgeItems is pure. upsertScoreRows writes
// beagle_item_scores only. See docs/BEAGLE-SCORE-V0.md.
//
// score = tierPoints + hintPoints + coveragePoints
//
//   tierPoints       first_party 3, wire 1, syndicated 0, null 0
//   hintPoints       3 when this title matches an economic-mechanism phrase, else 0
//   coveragePoints   only when hintPoints > 0: min(independent_outlet_count - 1, 2) * 2
//
// Coverage is zero without a title hint, so a widely repeated non-economic
// story does not climb. The hint is not verification: economic_payoff_flag
// stays false, economic_mechanism stays null, eeat_incomplete stays true.
// Maximum is 10.

import { outletOf, SYNDICATION_GROUPS } from './beagleSyndication.mjs';

export const RUBRIC_VERSION = 'v0';

// Same span as lib/beagleCounts.ts getBeagleEntityCounts: coalesce(published_at, fetched_at)
// inside the last 7 days. The scorer does not widen or shrink that window.
export const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

// PostgREST on this project caps a response at 1,000 rows. Page on id, same as beagleCounts.
const PAGE_SIZE = 1000;
const WRITE_CHUNK = 200;

const FIRST_PARTY_OUTLETS = new Set(['FIA', 'Formula1.com', 'Liberty Media']);
const SYNDICATED_LABELS = new Set(SYNDICATION_GROUPS.map(([, label]) => label));

const TIER_POINTS = { first_party: 3, wire: 1, syndicated: 0 };
const HINT_POINTS = 3;
const COVERAGE_PER_CORROBORATING_OUTLET = 2;
const CORROBORATING_OUTLET_CAP = 2;

// Both rows tagged and sharing an entity: this overlap is "the same story".
const SHARED_ENTITY_JACCARD = 0.34;
// Either row has no entity tag: require a closer title so generic words don't merge.
const UNTAGGED_JACCARD = 0.5;
// Two shared tokens is often just a name plus "wins". Three keeps Monaco and Monza apart.
const MIN_SHARED_TOKENS = 3;

// Longest first so "concorde agreement" wins over "concorde" and "title sponsorship" wins over "title sponsor".
// Mechanism phrases only. Not "sounds expensive" (no million, budget, deal, contract, bare "sponsorship").
const ECONOMIC_HINTS = [
  'aerodynamic testing restriction',
  'financial regulations',
  'concorde agreement',
  'anti-dilution',
  'title sponsorship',
  'broadcast rights',
  'commercial rights',
  'media rights',
  'title sponsor',
  'revenue share',
  'prize money',
  'prize fund',
  'hosting fee',
  'budget cap',
  'salary cap',
  'cost cap',
  'entry fee',
  'concorde',
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'as',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'into', 'over', 'after', 'before',
  'than', 'that', 'this', 'these', 'those', 'his', 'her', 'their', 'who', 'what', 'how', 'why',
  'when', 'will', 'has', 'have', 'had', 'not', 'but', 'via', 'per', 'vs', 'versus', 'amid',
  'says', 'say', 'said', 'new', 'set', 'out', 'off', 'about',
]);

const SIGNAL_KEYS = new Set([
  'independent_outlets',
  'syndication_collapse',
  'source_tier',
  'economic_title_hint',
  'primary_source',
  'economic_mechanism',
  'named_expert',
  'eeat_incomplete',
]);

function decodeTitle(title) {
  return title
    .replace(/&#(\d+);/g, (_, digits) => {
      const code = Number(digits);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function titleTokens(title) {
  const words = decodeTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
  return new Set(words);
}

function jaccard(a, b) {
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  const union = a.size + b.size - shared;
  return { shared, score: union === 0 ? 0 : shared / union };
}

function sameStory(a, b) {
  const tagsA = a.tags;
  const tagsB = b.tags;
  const bothTagged = tagsA.length > 0 && tagsB.length > 0;
  if (bothTagged) {
    const share = tagsA.some((tag) => tagsB.includes(tag));
    if (!share) return false;
  }
  const overlap = jaccard(a.tokens, b.tokens);
  if (overlap.shared < MIN_SHARED_TOKENS) return false;
  const bar = bothTagged ? SHARED_ENTITY_JACCARD : UNTAGGED_JACCARD;
  return overlap.score >= bar;
}

function sourceTier(outlet) {
  if (!outlet) return null;
  if (FIRST_PARTY_OUTLETS.has(outlet)) return 'first_party';
  if (SYNDICATED_LABELS.has(outlet)) return 'syndicated';
  return 'wire';
}

function hintInTitle(title) {
  const normalized = decodeTitle(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const padded = ` ${normalized} `;
  for (const phrase of ECONOMIC_HINTS) {
    const needle = phrase.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (padded.includes(` ${needle} `)) return phrase;
  }
  return null;
}

function collapsedNeighborhood(prepared, indexes) {
  const outletSet = new Set();
  const rawByOutlet = new Map();
  for (const index of indexes) {
    const source = prepared[index].sourceName.trim();
    if (!source) continue;
    const outlet = outletOf(source);
    if (!outlet) continue;
    outletSet.add(outlet);
    if (outlet !== source) {
      const bucket = rawByOutlet.get(outlet) ?? new Set();
      bucket.add(source);
      rawByOutlet.set(outlet, bucket);
    }
  }
  const outlets = [...outletSet].sort((a, b) => a.localeCompare(b));
  const collapse = {};
  const labels = [...rawByOutlet.keys()].sort((a, b) => a.localeCompare(b));
  for (const label of labels) {
    collapse[label] = [...rawByOutlet.get(label)].sort((a, b) => a.localeCompare(b));
  }
  return { outlets, collapse };
}

function normalizeRow(row) {
  if (!row || typeof row.id !== 'string' || row.id.length === 0) return null;
  const tags = Array.isArray(row.entity_tags)
    ? row.entity_tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
    : [];
  return {
    id: row.id,
    sourceName: typeof row.source_name === 'string' ? row.source_name : '',
    title: typeof row.title === 'string' ? row.title : '',
    link: typeof row.link === 'string' ? row.link : '',
    tags,
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    fetchedAt: typeof row.fetched_at === 'string' ? row.fetched_at : '',
  };
}

function scoreParts(independentOutletCount, tier, hint) {
  const tierPoints = tier ? TIER_POINTS[tier] : 0;
  const hintPoints = hint ? HINT_POINTS : 0;
  const corroboration = Math.max(0, independentOutletCount - 1);
  const coveragePoints = hintPoints > 0
    ? Math.min(corroboration, CORROBORATING_OUTLET_CAP) * COVERAGE_PER_CORROBORATING_OUTLET
    : 0;
  return {
    tierPoints,
    hintPoints,
    coveragePoints,
    score: tierPoints + hintPoints + coveragePoints,
  };
}

function buildSignals(outlets, collapse, tier, hint) {
  const signals = {
    independent_outlets: outlets,
    source_tier: tier,
    economic_title_hint: hint ? { verified: false, hint } : { verified: false },
    primary_source: null,
    economic_mechanism: null,
    named_expert: null,
    eeat_incomplete: true,
  };
  if (Object.keys(collapse).length > 0) {
    signals.syndication_collapse = collapse;
  }
  return signals;
}

/**
 * Judge pool rows already stored by refresh-beagle. Does not fetch RSS and
 * does not write. Neighborhood is direct title overlap, not a transitive cluster.
 */
export function judgeItems(rows) {
  const prepared = [];
  for (const row of rows) {
    const item = normalizeRow(row);
    if (!item) continue;
    prepared.push({
      ...item,
      tokens: titleTokens(item.title),
    });
  }

  const neighbors = prepared.map(() => []);
  for (let i = 0; i < prepared.length; i += 1) {
    neighbors[i].push(i);
    for (let j = i + 1; j < prepared.length; j += 1) {
      if (!sameStory(prepared[i], prepared[j])) continue;
      neighbors[i].push(j);
      neighbors[j].push(i);
    }
  }

  return prepared.map((item, index) => {
    const { outlets, collapse } = collapsedNeighborhood(prepared, neighbors[index]);
    const tier = sourceTier(outletOf(item.sourceName.trim()));
    const hint = hintInTitle(item.title);
    const parts = scoreParts(outlets.length, tier, hint);
    return {
      id: item.id,
      title: item.title,
      link: item.link,
      sourceName: item.sourceName,
      independentOutletCount: outlets.length,
      economicPayoffFlag: false,
      score: parts.score,
      parts,
      signals: buildSignals(outlets, collapse, tier, hint),
    };
  });
}

export async function loadWindowItems(supabase, now = Date.now()) {
  const cutoff = new Date(now - WINDOW_MS).toISOString();
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('beagle_items')
      .select('id, source_name, title, link, entity_tags, published_at, fetched_at')
      .or(`published_at.gte.${cutoff},and(published_at.is.null,fetched_at.gte.${cutoff})`)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function upsertScoreRows(supabase, judged, scoredAt = new Date().toISOString()) {
  let written = 0;
  for (let i = 0; i < judged.length; i += WRITE_CHUNK) {
    const chunk = judged.slice(i, i + WRITE_CHUNK).map((row) => ({
      beagle_item_id: row.id,
      independent_outlet_count: row.independentOutletCount,
      economic_payoff_flag: false,
      score: row.score,
      signals: row.signals,
      rubric_version: RUBRIC_VERSION,
      scored_at: scoredAt,
    }));
    const { error } = await supabase
      .from('beagle_item_scores')
      .upsert(chunk, { onConflict: 'beagle_item_id,rubric_version' });
    if (error) throw new Error(error.message);
    written += chunk.length;
  }
  return written;
}

export async function listTopScores(supabase, limit) {
  const { data, error } = await supabase
    .from('beagle_item_scores')
    .select('score, independent_outlet_count, economic_payoff_flag, signals, scored_at, beagle_item_id, beagle_items(title, source_name, link)')
    .eq('rubric_version', RUBRIC_VERSION)
    .order('score', { ascending: false })
    .order('independent_outlet_count', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function byId(judged, id) {
  const row = judged.find((item) => item.id === id);
  if (!row) throw new Error(`missing judged row ${id}`);
  return row;
}

export function selfTest() {
  const pool = [
    {
      id: '1',
      source_name: 'Motorsport.com',
      title: 'Verstappen cost cap hearing looms',
      link: 'https://example.test/1',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T00:00:00Z',
      fetched_at: '2026-09-20T00:00:00Z',
    },
    {
      id: '2',
      source_name: 'Motorsport.com ES',
      title: 'Verstappen cost cap hearing explained',
      link: 'https://example.test/2',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T01:00:00Z',
      fetched_at: '2026-09-20T01:00:00Z',
    },
    {
      id: '3',
      source_name: 'The Race',
      title: 'Verstappen cost cap hearing set for Paris',
      link: 'https://example.test/3',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T02:00:00Z',
      fetched_at: '2026-09-20T02:00:00Z',
    },
    {
      id: '4',
      source_name: 'Autosport',
      title: 'Hamilton wins Monaco thriller',
      link: 'https://example.test/4',
      entity_tags: ['Lewis Hamilton'],
      published_at: '2026-09-20T03:00:00Z',
      fetched_at: '2026-09-20T03:00:00Z',
    },
    {
      id: '5',
      source_name: 'FIA',
      title: 'FIA publishes cost cap findings',
      link: 'https://example.test/5',
      entity_tags: [],
      published_at: '2026-09-20T04:00:00Z',
      fetched_at: '2026-09-20T04:00:00Z',
    },
    {
      id: '6',
      source_name: 'BBC Sport',
      title: 'Red Bull unveils livery for 2026',
      link: 'https://example.test/6',
      entity_tags: ['Red Bull'],
      published_at: '2026-09-20T05:00:00Z',
      fetched_at: '2026-09-20T05:00:00Z',
    },
    {
      id: '7',
      source_name: 'ESPN',
      title: 'Red Bull unveils livery for 2026',
      link: 'https://example.test/7',
      entity_tags: ['Red Bull'],
      published_at: '2026-09-20T06:00:00Z',
      fetched_at: '2026-09-20T06:00:00Z',
    },
    {
      id: '8',
      source_name: 'RACER',
      title: 'Red Bull unveils livery for 2026',
      link: 'https://example.test/8',
      entity_tags: ['Red Bull'],
      published_at: '2026-09-20T07:00:00Z',
      fetched_at: '2026-09-20T07:00:00Z',
    },
    {
      id: '9',
      source_name: 'Formula1.com',
      title: 'Verstappen takes Monaco pole',
      link: 'https://example.test/9',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T08:00:00Z',
      fetched_at: '2026-09-20T08:00:00Z',
    },
    {
      id: '10',
      source_name: 'BBC Sport',
      title: 'Hamilton takes Monaco pole',
      link: 'https://example.test/10',
      entity_tags: ['Lewis Hamilton'],
      published_at: '2026-09-20T09:00:00Z',
      fetched_at: '2026-09-20T09:00:00Z',
    },
    {
      id: '11',
      source_name: 'Liberty Media',
      title: 'Liberty Media notes a $2 million hospitality bump',
      link: 'https://example.test/11',
      entity_tags: [],
      published_at: '2026-09-20T10:00:00Z',
      fetched_at: '2026-09-20T10:00:00Z',
    },
    {
      id: '12',
      source_name: 'Motorsport Week',
      title: 'Paddock notebook from a quiet Friday',
      link: 'https://example.test/12',
      entity_tags: [],
      published_at: '2026-09-20T11:00:00Z',
      fetched_at: '2026-09-20T11:00:00Z',
    },
    {
      id: 'a',
      source_name: 'BBC Sport',
      title: 'Ferrari cost cap appeal lodged quietly',
      link: 'https://example.test/a',
      entity_tags: ['Ferrari'],
      published_at: '2026-09-20T12:00:00Z',
      fetched_at: '2026-09-20T12:00:00Z',
    },
    {
      id: 'b',
      source_name: 'ESPN',
      title: 'Ferrari factory update cost cap',
      link: 'https://example.test/b',
      entity_tags: ['Ferrari'],
      published_at: '2026-09-20T13:00:00Z',
      fetched_at: '2026-09-20T13:00:00Z',
    },
    {
      id: 'c',
      source_name: 'RACER',
      title: 'Ferrari factory update visitor day',
      link: 'https://example.test/c',
      entity_tags: ['Ferrari'],
      published_at: '2026-09-20T14:00:00Z',
      fetched_at: '2026-09-20T14:00:00Z',
    },
    {
      id: 'monaco-win',
      source_name: 'BBC Sport',
      title: 'Verstappen wins in Monaco',
      link: 'https://example.test/monaco-win',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T16:00:00Z',
      fetched_at: '2026-09-20T16:00:00Z',
    },
    {
      id: 'monza-win',
      source_name: 'ESPN',
      title: 'Verstappen wins in Monza',
      link: 'https://example.test/monza-win',
      entity_tags: ['Max Verstappen'],
      published_at: '2026-09-20T17:00:00Z',
      fetched_at: '2026-09-20T17:00:00Z',
    },
    {
      id: 'blank',
      source_name: '   ',
      title: '',
      link: '',
      entity_tags: null,
      published_at: null,
      fetched_at: '2026-09-20T15:00:00Z',
    },
  ];

  const judged = judgeItems(pool);
  const motorsport = byId(judged, '1');
  const race = byId(judged, '3');
  const autosport = byId(judged, '4');
  const fia = byId(judged, '5');
  const livery = byId(judged, '6');
  const verstappenPole = byId(judged, '9');
  const hamiltonPole = byId(judged, '10');
  const liberty = byId(judged, '11');
  const week = byId(judged, '12');
  const ferrariA = byId(judged, 'a');
  const ferrariC = byId(judged, 'c');
  const blank = byId(judged, 'blank');

  assert(motorsport.independentOutletCount === 2, 'motorsport locales collapse to one outlet beside The Race');
  assert(
    motorsport.signals.independent_outlets.join('|') === 'Motorsport Network|The Race',
    'collapsed outlet list',
  );
  assert(motorsport.signals.independent_outlets.length === motorsport.independentOutletCount, 'count matches list');
  assert(
    motorsport.signals.syndication_collapse['Motorsport Network'].join('|') === 'Motorsport.com|Motorsport.com ES',
    'raw motorsport names folded',
  );
  assert(motorsport.signals.source_tier === 'syndicated', 'collapsed motorsport item is syndicated');
  assert(race.signals.source_tier === 'wire', 'The Race stays wire');
  assert(motorsport.signals.economic_title_hint.verified === false, 'hint is unverified');
  assert(motorsport.signals.economic_title_hint.hint === 'cost cap', 'cost cap phrase');
  assert(motorsport.economicPayoffFlag === false, 'payoff flag stays false');
  // syndicated 0 + hint 3 + one corroborating outlet 2
  assert(motorsport.score === 5, `motorsport score ${motorsport.score}`);
  // wire 1 + hint 3 + one corroborating outlet 2
  assert(race.score === 6, `the race score ${race.score}`);

  assert(autosport.independentOutletCount === 1, 'autosport is not folded into Motorsport Network');
  assert(autosport.signals.source_tier === 'wire', 'autosport is wire');
  assert(!('syndication_collapse' in autosport.signals), 'no collapse key when no group fired');
  assert(autosport.score === 1, 'lone wire with no hint is tier points only');

  assert(fia.signals.source_tier === 'first_party', 'FIA is first party');
  assert(fia.signals.economic_title_hint.hint === 'cost cap', 'FIA hint');
  assert(fia.independentOutletCount === 1, 'lone FIA');
  assert(fia.score === 6, 'first party + hint, no corroboration');
  assert(fia.economicPayoffFlag === false, 'FIA flag still false');

  assert(livery.independentOutletCount === 3, 'three wires on the livery story');
  assert(livery.score === 1, 'virality alone does not raise the score');
  assert(livery.parts.coveragePoints === 0, 'coverage gated off without a hint');

  assert(byId(judged, 'monaco-win').independentOutletCount === 1, 'Monaco win is not the Monza win');
  assert(byId(judged, 'monza-win').independentOutletCount === 1, 'Monza win stays separate');
  assert(verstappenPole.independentOutletCount === 1, 'different drivers do not share a story');
  assert(hamiltonPole.independentOutletCount === 1, 'hamilton pole stands alone');
  assert(verstappenPole.signals.source_tier === 'first_party', 'Formula1.com is first party');

  assert(liberty.signals.source_tier === 'first_party', 'Liberty Media is first party');
  assert(!liberty.signals.economic_title_hint.hint, 'a dollar figure is not a mechanism hint');
  assert(liberty.score === 3, 'first party without a hint');

  assert(week.signals.source_tier === 'wire', 'Motorsport Week is not the Motorsport Network collapse');

  assert(ferrariA.independentOutletCount === 2, 'direct neighbor only: A sees B, not C');
  assert(
    ferrariA.signals.independent_outlets.join('|') === 'BBC Sport|ESPN',
    'A outlets are BBC and ESPN',
  );
  assert(!ferrariA.signals.independent_outlets.includes('RACER'), 'transitive C is not on A');
  assert(ferrariC.independentOutletCount === 2, 'C sees B only, plus itself');

  assert(blank.signals.source_tier === null, 'blank source is unclassified');
  assert(blank.independentOutletCount === 0, 'blank source adds no outlet');
  assert(blank.score === 0, 'blank row scores 0');

  for (const row of judged) {
    assert(row.economicPayoffFlag === false, 'flag false on every row');
    assert(row.signals.primary_source === null, 'primary_source null');
    assert(row.signals.economic_mechanism === null, 'economic_mechanism null');
    assert(row.signals.named_expert === null, 'named_expert null');
    assert(row.signals.eeat_incomplete === true, 'eeat stays incomplete');
    assert(!('story_mode' in row.signals), 'story_mode is not a scorer field');
    assert(!('drama_data_contradiction' in row.signals), 'v0.1 key is not written');
    for (const key of Object.keys(row.signals)) {
      assert(SIGNAL_KEYS.has(key), `unexpected signal ${key}`);
    }
    assert(row.signals.independent_outlets.length === row.independentOutletCount, 'length matches count');
  }

  assert(judgeItems([{ source_name: 'FIA', title: 'x', link: 'y' }]).length === 0, 'rows without id are skipped');
  assert(hintInTitle('anti-dilution fee rises') === 'anti-dilution', 'hyphenated phrase');
  assert(hintInTitle('airlines doubling down on sponsorship') === null, 'bare sponsorship is not a mechanism');
  assert(hintInTitle('McLaren title sponsor for 2027') === 'title sponsor', 'title sponsor is the phrase');
  assert(hintInTitle('the team&#8217;s cost cap appeal') === 'cost cap', 'numeric entity does not hide the phrase');
  assert(hintInTitle('costcape story') === null, 'cost cap needs a word break');
  assert(hintInTitle('Concorde Agreement talks') === 'concorde agreement', 'longer phrase wins');
}
