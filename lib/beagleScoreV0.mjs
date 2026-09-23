// Beagle significance score v0.
// judgeItems is pure. upsertScoreRows writes beagle_item_scores only.
// Formula and window: docs/BEAGLE-SCORE-V0.md.
//
// score = min(100, base + hint + party)
//   base  = 10 * min(independent_outlet_count, 8)
//   hint  = 15 if economic_title_hint is present, else 0
//   party = 10 if source_tier is first_party, else 0
//
// Outlet count is distinct collapsed outlets among window rows that share
// at least one entity_tags value with this row. Empty entity_tags → 1, this
// row's own outlet. economic_payoff_flag is always false. verified is never true.

export const RUBRIC_VERSION = 'v0';
export const WINDOW_DAYS = 7;
export const TOP_N = 25;

const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const WRITE_CHUNK = 200;

// Copied from scripts/beagle.mjs. Do not add a group here without adding it there.
const SYNDICATION_GROUPS = [[/^Motorsport\.com/, 'Motorsport Network']];

const FIRST_PARTY = new Set(['FIA', 'Formula1.com', 'Liberty Media']);

// Longest first. "TV rights" beats "rights", "sponsorship" beats "sponsor".
// fine / penalty are separate: they count only when the title also has a
// currency symbol, "%", or a digit.
const HINT_PHRASES = [
  ['tv rights', 'TV rights'],
  ['prize money', 'prize money'],
  ['prize fund', 'prize fund'],
  ['budget cap', 'budget cap'],
  ['cost cap', 'cost cap'],
  ['sponsorship', 'sponsorship'],
  ['valuation', 'valuation'],
  ['buyout', 'buyout'],
  ['revenue', 'revenue'],
  ['sponsor', 'sponsor'],
  ['salary', 'salary'],
  ['contract', 'contract'],
  ['equity', 'equity'],
  ['rights', 'rights'],
  ['stake', 'stake'],
  ['ipo', 'IPO'],
];

const FORBIDDEN_SIGNAL_KEYS = new Set(['story_mode', 'drama_data_contradiction']);

export function outletOf(sourceName) {
  for (const [pattern, outlet] of SYNDICATION_GROUPS) {
    if (pattern.test(sourceName)) return outlet;
  }
  return sourceName;
}

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
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function paddedTitle(title) {
  const normalized = decodeTitle(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return ` ${normalized} `;
}

function hintInTitle(title) {
  const padded = paddedTitle(title);
  for (const [needle, label] of HINT_PHRASES) {
    if (padded.includes(` ${needle} `)) return label;
  }
  const decoded = decodeTitle(title);
  if (!/[$£€¥%]|\d/.test(decoded)) return null;
  if (padded.includes(' penalty ')) return 'penalty';
  if (padded.includes(' fine ')) return 'fine';
  return null;
}

function sourceTier(outlet) {
  if (FIRST_PARTY.has(outlet)) return 'first_party';
  if (outlet === 'Motorsport Network') return 'syndicated';
  return 'wire';
}

function scoreParts(independentOutletCount, tier, hint) {
  const base = 10 * Math.min(independentOutletCount, 8);
  const hintPoints = hint ? 15 : 0;
  const party = tier === 'first_party' ? 10 : 0;
  return {
    base,
    hintPoints,
    party,
    score: Math.min(100, base + hintPoints + party),
  };
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
  };
}

function collapseSources(sources) {
  const outletSet = new Set();
  const rawByOutlet = new Map();
  for (const source of sources) {
    const trimmed = source.trim();
    if (!trimmed) continue;
    const outlet = outletOf(trimmed);
    outletSet.add(outlet);
    if (outlet !== trimmed) {
      const bucket = rawByOutlet.get(outlet) ?? new Set();
      bucket.add(trimmed);
      rawByOutlet.set(outlet, bucket);
    }
  }
  const outlets = [...outletSet].sort((a, b) => a.localeCompare(b));
  const collapse = {};
  for (const label of [...rawByOutlet.keys()].sort((a, b) => a.localeCompare(b))) {
    collapse[label] = [...rawByOutlet.get(label)].sort((a, b) => a.localeCompare(b));
  }
  return { outlets, collapse };
}

function buildSignals(outlets, collapse, tier, hint) {
  const signals = {
    independent_outlets: outlets,
    source_tier: tier,
    primary_source: null,
    economic_mechanism: null,
    named_expert: null,
    eeat_incomplete: true,
  };
  if (Object.keys(collapse).length > 0) signals.syndication_collapse = collapse;
  if (hint) signals.economic_title_hint = { verified: false, hint };
  return signals;
}

/**
 * Judge pool rows. Does not fetch RSS and does not write.
 * A tagged row's outlets are the collapsed source names of window rows that
 * share at least one entity tag with it (including itself). That is direct
 * overlap, not a transitive component: Hamilton-only rows stay out of a
 * Verstappen-only count. Empty entity_tags stay at one outlet, this row's own.
 */
export function judgeItems(rows) {
  const prepared = [];
  for (const row of rows) {
    const item = normalizeRow(row);
    if (item) prepared.push(item);
  }

  const byTag = new Map();
  for (let index = 0; index < prepared.length; index += 1) {
    for (const tag of prepared[index].tags) {
      const bucket = byTag.get(tag);
      if (bucket) bucket.push(index);
      else byTag.set(tag, [index]);
    }
  }

  return prepared.map((item) => {
    const seen = new Set();
    const sources = [];
    if (item.tags.length === 0) {
      sources.push(item.sourceName);
    } else {
      for (const tag of item.tags) {
        for (const other of byTag.get(tag) ?? []) {
          if (seen.has(other)) continue;
          seen.add(other);
          sources.push(prepared[other].sourceName);
        }
      }
    }

    let { outlets, collapse } = collapseSources(sources);
    if (item.tags.length === 0 && outlets.length === 0) {
      outlets = [outletOf(item.sourceName.trim())];
    }

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
  // coalesce(published_at, fetched_at) >= now() - 7 days.
  // Same shape as lib/beagleCounts.ts: a real published_at wins, otherwise fetched_at.
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function byId(judged, id) {
  const row = judged.find((item) => item.id === id);
  if (!row) throw new Error(`missing judged row ${id}`);
  return row;
}

export function selfTest() {
  assert(outletOf('Motorsport.com') === 'Motorsport Network', 'Motorsport.com collapses');
  assert(outletOf('Motorsport.com ES') === 'Motorsport Network', 'locale feed collapses');
  assert(outletOf('Motorsport.com IT') === 'Motorsport Network', 'IT feed collapses');
  assert(outletOf('Autosport') === 'Autosport', 'Autosport is not Motorsport Network');
  assert(outletOf('Motorsport Week') === 'Motorsport Week', 'Motorsport Week is not the network');
  assert(outletOf('Motorsport-Total') === 'Motorsport-Total', 'Motorsport-Total is not the network');

  const shared = [
    row('ms', 'Motorsport.com', 'Verstappen cost cap hearing looms', ['Outlet Fixture']),
    row('ms-es', 'Motorsport.com ES', 'Verstappen cost cap hearing explained', ['Outlet Fixture']),
    row('race', 'The Race', 'Verstappen cost cap hearing set for Paris', ['Outlet Fixture']),
    row('auto', 'Autosport', 'Hamilton wins Monaco', ['Other Fixture']),
    row('bare-a', 'BBC Sport', 'Paddock notebook', []),
    row('bare-b', 'ESPN', 'Another notebook', []),
    row('bare-ms', 'Motorsport.com', 'Translated notebook', []),
    row('fia', 'FIA', 'FIA publishes cost cap findings', []),
    row('f1', 'Formula1.com', 'Weekend schedule', ['Max Verstappen']),
    row('liberty', 'Liberty Media', 'Quarterly letter', []),
    row('week', 'Motorsport Week', 'Friday notes', []),
    row('fine-plain', 'BBC Sport', 'A fine drive from Hamilton', ['Lewis Hamilton']),
    row('fine-money', 'BBC Sport', 'FIA issues a $100,000 fine', ['Lewis Hamilton']),
    row('penalty-plain', 'ESPN', 'A penalty awaits', ['Max Verstappen']),
    row('penalty-pct', 'ESPN', 'The stewards gave a 10% penalty', ['Max Verstappen']),
    row('defined', 'RACER', 'A defined boundary on track limits', []),
    row('mistake', 'Sky Sports', 'Verstappen mistake in qualifying', ['Max Verstappen']),
    row('stake', 'BBC Sport', 'Cadillac takes a stake in the team', []),
    row('sponsor', 'PlanetF1', 'Ferrari signs a title sponsor', []),
    row('ship', 'SportsPro', 'Airlines double down on sponsorship', []),
    row('rights', 'BBC Sport', 'Broadcast rights row continues', []),
    row('tv', 'ESPN', 'TV rights auction opens', []),
    row('ipo', 'Forbes SportsMoney', 'The IPO window', []),
    row('a', 'BBC Sport', 'Verstappen only', ['Driver A']),
    row('b', 'ESPN', 'Both drivers', ['Driver A', 'Driver B']),
    row('c', 'Sky Sports', 'Hamilton only', ['Driver B']),
  ];

  const wide = [row('fia-wide', 'FIA', 'FIA opens a cost cap review', ['Red Bull'])];
  for (let n = 1; n <= 8; n += 1) {
    wide.push(row(`w${n}`, `Wire ${n}`, `Red Bull notebook ${n}`, ['Red Bull']));
  }

  const judged = judgeItems([...shared, ...wide, { source_name: 'FIA', title: 'no id', link: '' }]);
  const ms = byId(judged, 'ms');
  const race = byId(judged, 'race');
  const auto = byId(judged, 'auto');
  const fia = byId(judged, 'fia');
  const a = byId(judged, 'a');
  const b = byId(judged, 'b');
  const c = byId(judged, 'c');

  assert(ms.independentOutletCount === 2, `motorsport locales are one outlet, got ${ms.independentOutletCount}`);
  assert(ms.signals.independent_outlets.join('|') === 'Motorsport Network|The Race', ms.signals.independent_outlets.join('|'));
  assert(ms.signals.independent_outlets.length === ms.independentOutletCount, 'length matches count');
  assert(
    ms.signals.syndication_collapse['Motorsport Network'].join('|') === 'Motorsport.com|Motorsport.com ES',
    'collapse lists raw Motorsport.com names',
  );
  assert(ms.signals.source_tier === 'syndicated', 'motorsport row is syndicated');
  assert(ms.signals.economic_title_hint.hint === 'cost cap', 'cost cap hint');
  assert(ms.signals.economic_title_hint.verified === false, 'hint is not verified');
  assert(ms.economicPayoffFlag === false, 'payoff flag false');
  // count 2 → base 20, hint 15, not first party
  assert(ms.score === 35, `motorsport score ${ms.score}`);
  assert(race.signals.source_tier === 'wire', 'The Race is wire');
  assert(race.score === 35, `the race score ${race.score}`);
  assert(auto.independentOutletCount === 1, 'Hamilton cluster is not Verstappen');
  assert(!('syndication_collapse' in auto.signals), 'no collapse when the group did not fire');
  assert(auto.score === 10, `lone wire ${auto.score}`);

  assert(byId(judged, 'bare-a').independentOutletCount === 1, 'empty tags do not cluster');
  assert(byId(judged, 'bare-b').independentOutletCount === 1, 'second empty-tag row is also 1');
  assert(byId(judged, 'bare-a').signals.independent_outlets.join('|') === 'BBC Sport', 'own outlet only');
  const bareMs = byId(judged, 'bare-ms');
  assert(bareMs.independentOutletCount === 1, 'one motorsport notebook is one outlet');
  assert(bareMs.signals.independent_outlets[0] === 'Motorsport Network', 'own outlet collapsed');
  assert(bareMs.signals.syndication_collapse['Motorsport Network'][0] === 'Motorsport.com', 'own collapse recorded');
  assert(bareMs.signals.source_tier === 'syndicated', 'collapsed own outlet is syndicated');

  assert(fia.signals.source_tier === 'first_party', 'FIA');
  assert(fia.independentOutletCount === 1, 'untagged FIA is its own outlet');
  assert(fia.score === 35, `FIA cost cap ${fia.score}`);
  assert(byId(judged, 'f1').signals.source_tier === 'first_party', 'Formula1.com');
  assert(byId(judged, 'liberty').signals.source_tier === 'first_party', 'Liberty Media');
  assert(byId(judged, 'week').signals.source_tier === 'wire', 'Motorsport Week is wire');

  assert(!('economic_title_hint' in byId(judged, 'fine-plain').signals), 'fine without a number is omitted');
  assert(byId(judged, 'fine-money').signals.economic_title_hint.hint === 'fine', 'fine with $');
  assert(!('economic_title_hint' in byId(judged, 'penalty-plain').signals), 'penalty without a number is omitted');
  assert(byId(judged, 'penalty-pct').signals.economic_title_hint.hint === 'penalty', 'penalty with %');
  assert(!('economic_title_hint' in byId(judged, 'defined').signals), 'defined is not fine');
  assert(!('economic_title_hint' in byId(judged, 'mistake').signals), 'mistake is not stake');
  assert(byId(judged, 'stake').signals.economic_title_hint.hint === 'stake', 'stake');
  assert(byId(judged, 'sponsor').signals.economic_title_hint.hint === 'sponsor', 'sponsor');
  assert(byId(judged, 'ship').signals.economic_title_hint.hint === 'sponsorship', 'sponsorship wins over sponsor');
  assert(byId(judged, 'rights').signals.economic_title_hint.hint === 'rights', 'rights');
  assert(byId(judged, 'tv').signals.economic_title_hint.hint === 'TV rights', 'TV rights beats rights');
  assert(byId(judged, 'ipo').signals.economic_title_hint.hint === 'IPO', 'IPO');

  assert(!a.signals.independent_outlets.includes('Sky Sports'), 'Verstappen-only does not absorb Hamilton-only');
  assert(a.signals.independent_outlets.includes('ESPN'), 'bridge row is shared');
  assert(!c.signals.independent_outlets.includes('BBC Sport'), 'Hamilton-only does not absorb the Verstappen-only wire');
  assert(b.independentOutletCount >= 3, 'dual-tagged row sees both sides');

  const fiaWide = byId(judged, 'fia-wide');
  assert(fiaWide.independentOutletCount === 9, `nine outlets got ${fiaWide.independentOutletCount}`);
  assert(fiaWide.parts.base === 80, 'base caps at 8 outlets');
  assert(fiaWide.parts.hintPoints === 15, 'hint points');
  assert(fiaWide.parts.party === 10, 'first party points');
  assert(fiaWide.score === 100, `capped score ${fiaWide.score}`);
  assert(byId(judged, 'w1').score === 80, 'wire in the same tag set, no hint, base only');

  for (const item of judged) {
    assert(item.economicPayoffFlag === false, 'flag');
    assert(item.signals.primary_source === null, 'primary_source');
    assert(item.signals.economic_mechanism === null, 'economic_mechanism');
    assert(item.signals.named_expert === null, 'named_expert');
    assert(item.signals.eeat_incomplete === true, 'eeat');
    assert(item.signals.economic_title_hint?.verified !== true, 'never verified');
    assert(item.signals.independent_outlets.length === item.independentOutletCount, 'count');
    for (const key of FORBIDDEN_SIGNAL_KEYS) {
      assert(!(key in item.signals), key);
    }
  }

  assert(judgeItems([{ source_name: 'FIA', title: 'cost cap', link: 'x' }]).length === 0, 'skip rows without id');
  assert(hintInTitle('the team&#8217;s cost cap appeal') === 'cost cap', 'numeric entity');
}

function row(id, sourceName, title, tags) {
  return {
    id,
    source_name: sourceName,
    title,
    link: `https://example.test/${id}`,
    entity_tags: tags,
    published_at: '2026-09-20T00:00:00Z',
    fetched_at: '2026-09-20T00:00:00Z',
  };
}
