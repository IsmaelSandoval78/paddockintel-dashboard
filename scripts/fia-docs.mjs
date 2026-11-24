// FIA documents watcher — lists the decision documents the FIA has published for the current
// F1 event (stewards' decisions, penalties, pit-lane starts, classifications), newest first, and
// which of them are new since the last run. The outlets write their penalty stories from these
// PDFs 15-60 minutes after they appear; reading them first is how a Feed item gets out before the
// rewrite (EDITORIAL.md, "Data-first format"; DATA-EXPERT.md source tier 5).
//
// Read-only: it never writes to Supabase. The state file only remembers which documents were
// already reported.
//
// Usage: node scripts/fia-docs.mjs [--state <file>] [--all]
//   --state  JSON file of documents already seen (default: none, so everything counts as new)
//   --all    print every document on the page, not only the new ones

import fs from 'fs';

const SEASON_URL =
  'https://www.fia.com/documents/championships/fia-formula-one-world-championship-14/season/season-2026-2072';
// Documents that usually become news: decisions, penalties, summonses, grid and pit-lane changes.
const NEWSWORTHY = /infringement|decision|offence|summons|penalt|pit lane|grid|reprimand|disqualif|appeal|right of review|classification/i;

const args = process.argv.slice(2);
const statePath = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;
const showAll = args.includes('--all');

const res = await fetch(SEASON_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PaddockIntel FIA docs watcher)' } });
if (!res.ok) {
  console.error(`FIA documents page answered ${res.status}`);
  process.exit(1);
}
const html = await res.text();
const event = html.match(/event-title active">([^<]+)</)?.[1]?.trim() ?? '(unknown event)';
const docs = [...html.matchAll(/<a href="(\/system\/files\/decision-document\/[^"]+)"[\s\S]*?<div class="title">\s*([\s\S]*?)\s*<\/div>[\s\S]*?date-display-single">([^<]+)</g)].map(
  ([, href, title, published]) => ({
    url: `https://www.fia.com${href}`,
    title: title.replace(/\s+/g, ' ').trim(),
    published: `${published.trim()} CET`,
  }),
);
if (!docs.length) {
  console.error('No documents parsed: the FIA page layout may have changed');
  process.exit(1);
}

const seen = new Set(statePath && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : []);
const fresh = docs.filter((d) => !seen.has(d.url));

console.log(`${event}: ${docs.length} documents, ${fresh.length} new`);
for (const d of showAll ? docs : fresh) {
  const mark = !seen.has(d.url) ? 'NEW ' : '    ';
  const flag = NEWSWORTHY.test(d.title) ? '*' : ' ';
  console.log(`${mark}${flag} ${d.published}  ${d.title}\n        ${d.url}`);
}
if (statePath) fs.writeFileSync(statePath, JSON.stringify(docs.map((d) => d.url)));
