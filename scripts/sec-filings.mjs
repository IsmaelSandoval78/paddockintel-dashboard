// SEC filings watcher — lists Liberty Media's recent SEC filings (Formula 1's owner) and which are
// new since the last run, marking the ones that carry F1 numbers or material events: quarterly and
// annual reports (10-Q, 10-K), current reports (8-K, with their item codes: 2.02 results, 1.01
// material agreements, 2.01 acquisitions, 5.02 executive changes...) and proxy or merger documents.
// Insider trades (Forms 3/4/5, 144) and registration paperwork are listed with --all only.
// These filings are the primary source behind F1 revenue and team payments stories
// (articles/f1-team-payments-2026-prize-money-liberty-media-q3.*.md; DATA-EXPERT.md source tier 4).
//
// Read-only: it never writes to Supabase. The state file only remembers which filings were
// already reported. SEC asks automated clients to identify themselves in the User-Agent and to stay
// under 10 requests per second; this makes one request per run.
//
// Usage: node scripts/sec-filings.mjs [--state <file>] [--all] [--cik <number>]
//   --state  JSON file of accession numbers already seen (default: none, so everything counts as new)
//   --all    print every recent filing, not only the new ones
//   --cik    another filer (default 1560385, Liberty Media Corporation)

import fs from 'fs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const cik = String(opt('--cik') ?? '1560385');
const statePath = opt('--state');
const showAll = args.includes('--all');

const NEWSWORTHY = /^(10-K|10-Q|8-K|20-F|6-K|DEF 14A|DEFM14A|PREM14A|S-4|425|SC TO-T|SC 13E3)/;
const ITEMS = {
  '1.01': 'material agreement',
  '1.02': 'agreement terminated',
  '2.01': 'acquisition or disposal',
  '2.02': 'results of operations',
  '2.03': 'new debt',
  '5.02': 'executive or director change',
  '5.07': 'shareholder vote',
  '7.01': 'Regulation FD disclosure',
  '8.01': 'other events',
};

const res = await fetch(`https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`, {
  headers: { 'User-Agent': 'PaddockIntel filings watcher' },
});
if (!res.ok) {
  console.error(`SEC submissions API answered ${res.status}`);
  process.exit(1);
}
const data = await res.json();
const r = data.filings.recent;
const filings = r.form.slice(0, 40).map((form, i) => {
  const accession = r.accessionNumber[i];
  const items = (r.items[i] || '').split(',').filter((code) => ITEMS[code]).map((code) => `${code} ${ITEMS[code]}`);
  return {
    accession,
    form,
    date: r.filingDate[i],
    period: r.reportDate[i] || '',
    items,
    url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, '')}/${r.primaryDocument[i]}`,
  };
});

const seen = new Set(statePath && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf-8')) : []);
const fresh = filings.filter((f) => !seen.has(f.accession));
const shown = (showAll ? filings : fresh).filter((f) => showAll || NEWSWORTHY.test(f.form));

console.log(`${data.name}: ${filings.length} recent filings, ${fresh.length} new, ${fresh.filter((f) => NEWSWORTHY.test(f.form)).length} newsworthy`);
for (const f of shown) {
  const mark = seen.has(f.accession) ? '    ' : 'NEW ';
  const flag = NEWSWORTHY.test(f.form) ? '*' : ' ';
  const detail = [f.period && `period ${f.period}`, ...f.items].filter(Boolean).join('; ');
  console.log(`${mark}${flag} ${f.date}  ${f.form}${detail ? `  (${detail})` : ''}\n        ${f.url}`);
}
if (statePath) fs.writeFileSync(statePath, JSON.stringify(filings.map((f) => f.accession)));
