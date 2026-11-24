// Companies House watcher — lists new filings by the UK companies behind the F1 teams (accounts,
// ownership, directors, borrowing, new shares) since the last run, from the public filing-history
// pages of find-and-update.company-information.service.gov.uk. No API key needed: the pages and
// the PDFs they link to are public. The 2025 team-accounts piece was built from these filings
// (articles/f1-team-accounts-2025-revenue-profit-mclaren-mercedes-red-bull.*.md).
//
// Read-only: it never writes to Supabase. The state file only remembers which filings were
// already reported. One request per company per run, half a second apart.
//
// Usage: node scripts/companies-house.mjs [--state <file>] [--all]
//   --state  JSON file of filings already seen (default: none, so everything counts as new)
//   --all    print every listed filing, not only the new newsworthy ones
// The scanned PDFs need OCR (tesseract) and every figure checked against the page image before
// it is published (DATA-EXPERT.md).

import fs from 'fs';

// Company numbers checked on Companies House, 2026-11-24.
const COMPANIES = [
  ['00787446', 'Mercedes-Benz Grand Prix Ltd'],
  ['01760288', 'Mercedes AMG High Performance Powertrains Ltd'],
  ['01517478', 'McLaren Racing Ltd'],
  ['10720174', 'McLaren Group Ltd'],
  ['05202976', 'Red Bull Technology Ltd'],
  ['03120645', 'Red Bull Racing Ltd'],
  ['13204421', 'Red Bull Powertrains Ltd'],
  ['14131067', 'Red Bull Powertrains 2026 Ltd'],
  ['01297497', 'Williams Grand Prix Engineering Ltd'],
  ['11496673', 'AMR GP Ltd'],
  ['13814807', 'AMR GP Holdings Ltd'],
  ['01806337', 'Alpine Racing Ltd'],
  ['09152405', 'Haas Formula UK Ltd'],
  ['14194212', 'TWG Cadillac Formula 1 Team Ltd'],
];

// Filing types that can carry a story: accounts, ownership (persons with significant control),
// directors, charges (secured borrowing), share allotments and capital changes, name changes.
const NEWSWORTHY = /^(AA|PSC0[1-9]|AP0[1-4]|TM0[12]|MR0[1-5]|SH0[1-9]|SH1\d|NM0[1-6]|RES\d+|CERTNM)/;

const BASE = 'https://find-and-update.company-information.service.gov.uk';
const args = process.argv.slice(2);
const statePath = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;
const showAll = args.includes('--all');
const seen = new Set(statePath && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : []);
const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const all = [];
let failed = 0;
for (const [number, name] of COMPANIES) {
  const res = await fetch(`${BASE}/company/${number}/filing-history`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PaddockIntel research)' },
  });
  if (!res.ok) {
    console.error(`${name} (${number}): filing history answered ${res.status}`);
    failed++;
    continue;
  }
  const html = await res.text();
  for (const row of html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cells.length < 3) continue;
    const pdf = row.match(/href="(\/company\/[^"]+\/document\?format=pdf)/)?.[1];
    const filing = { company: name, number, date: clean(cells[0]), type: clean(cells[1]), description: clean(cells[2]), url: pdf ? BASE + pdf : '' };
    filing.key = `${number}|${filing.date}|${filing.type}|${filing.description}`;
    all.push(filing);
  }
  await new Promise((r) => setTimeout(r, 500));
}

const fresh = all.filter((f) => !seen.has(f.key));
const shown = showAll ? all : fresh.filter((f) => NEWSWORTHY.test(f.type));
console.log(`${COMPANIES.length - failed}/${COMPANIES.length} companies read: ${all.length} recent filings, ${fresh.length} new, ${fresh.filter((f) => NEWSWORTHY.test(f.type)).length} newsworthy`);
for (const f of shown) {
  const mark = seen.has(f.key) ? '    ' : 'NEW ';
  const flag = NEWSWORTHY.test(f.type) ? '*' : ' ';
  console.log(`${mark}${flag} ${f.date}  ${f.company}  ${f.type}  ${f.description}${f.url ? `\n        ${f.url}` : ''}`);
}
if (statePath && !failed) fs.writeFileSync(statePath, JSON.stringify([...new Set([...seen, ...all.map((f) => f.key)])]));
if (failed) process.exitCode = 1;
