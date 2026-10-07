// Queries Google's own public Trends dataset in BigQuery
// (bigquery-public-data.google_trends.international_top_rising_terms)
// instead of guessing at what's trending. Run:
//   npx ts-node --project scripts/tsconfig.json scripts/trends-report.ts
//   npx ts-node --project scripts/tsconfig.json scripts/trends-report.ts --days 7 --countries IT,MY,GB
//   npx ts-node --project scripts/tsconfig.json scripts/trends-report.ts --terms "verstappen,hamilton"
//
// Requires BQ_SERVICE_ACCOUNT_KEY in .env.local (a compact-JSON service
// account key, role: BigQuery Job User on the `paddockintel` project --
// deliberately a *separate* credential from GSC_SERVICE_ACCOUNT_KEY, not
// reused, so a Search-Console-only key never carries BigQuery billing
// scope). Public datasets need no extra grant beyond that role.
//
// Cost guardrail: this table isn't partitioned narrowly, so every query
// below filters on `refresh_date` first -- never remove that filter or a
// loose query can scan tens of GB. The script prints bytes processed after
// every run so cost is visible, not assumed.
import * as fs from 'fs';
import * as path from 'path';
import { JWT } from 'google-auth-library';

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}
loadEnvLocal();

// F1-relevant default so a plain run is useful without flags -- override
// with --terms for anything else entirely (not F1-specific runs).
const DEFAULT_TERMS = [
  'f1', 'formula 1', 'formula1', 'grand prix',
  'verstappen', 'hamilton', 'leclerc', 'norris', 'piastri', 'russell',
  'antonelli', 'alonso', 'sainz', 'bottas',
  'mercedes f1', 'ferrari f1', 'red bull racing', 'mclaren f1', 'aston martin f1',
];

// PaddockIntel's EN/ES/PT markets plus Italy, which showed real F1 signal
// in this dataset the first time it was queried (2026-10-07) -- override
// with --countries, or --countries all to drop the filter (expect a much
// bigger bytes-processed number if you do).
const DEFAULT_COUNTRIES = ['US', 'GB', 'ES', 'MX', 'AR', 'BR', 'PT', 'IT'];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const countriesRaw = get('--countries', DEFAULT_COUNTRIES.join(','));
  const termsRaw = get('--terms', DEFAULT_TERMS.join(','));
  return {
    days: Number.parseInt(get('--days', '14'), 10),
    limit: Number.parseInt(get('--limit', '30'), 10),
    countries: countriesRaw.toLowerCase() === 'all' ? null : countriesRaw.split(',').map((c) => c.trim().toUpperCase()),
    terms: termsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
}

async function getClient(): Promise<{ client: JWT; projectId: string }> {
  const raw = process.env.BQ_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('BQ_SERVICE_ACCOUNT_KEY not set in .env.local');
  const key = JSON.parse(raw);
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/bigquery.readonly'],
  });
  await client.authorize();
  return { client, projectId: key.project_id as string };
}

type Row = { term: string; week: string; score: number | null; rank: number; percent_gain: number | null; country_name: string };

async function queryTrends(client: JWT, projectId: string, days: number, countries: string[] | null, terms: string[], limit: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const termFilter = terms.map((t) => `LOWER(term) LIKE '%${t.replace(/'/g, "''")}%'`).join(' OR ');
  const countryFilter = countries ? `AND country_code IN (${countries.map((c) => `'${c}'`).join(',')})` : '';

  const query = `
    SELECT term, week, MAX(score) AS score, MIN(rank) AS rank, MAX(percent_gain) AS percent_gain, country_name
    FROM \`bigquery-public-data.google_trends.international_top_rising_terms\`
    WHERE refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND week >= '${sinceStr}'
    ${countryFilter}
    AND (${termFilter})
    GROUP BY term, week, country_name
    ORDER BY score DESC NULLS LAST, week DESC
    LIMIT ${limit}
  `;

  const res = await client.request<{
    rows?: { f: { v: string | null }[] }[];
    totalBytesProcessed?: string;
  }>({
    url: `https://www.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
    method: 'POST',
    data: { query, useLegacySql: false },
  });

  const rows: Row[] = (res.data.rows ?? []).map((r) => ({
    term: r.f[0].v as string,
    week: r.f[1].v as string,
    score: r.f[2].v === null ? null : Number(r.f[2].v),
    rank: Number(r.f[3].v),
    percent_gain: r.f[4].v === null ? null : Number(r.f[4].v),
    country_name: r.f[5].v as string,
  }));

  return { rows, bytesProcessed: Number(res.data.totalBytesProcessed ?? 0) };
}

async function main() {
  const { days, limit, countries, terms } = parseArgs();
  const { client, projectId } = await getClient();

  console.log(`Window: last ${days} days  |  Countries: ${countries ? countries.join(', ') : 'ALL (no filter -- expect a large scan)'}`);
  console.log(`Terms: ${terms.join(', ')}\n`);

  const { rows, bytesProcessed } = await queryTrends(client, projectId, days, countries, terms, limit);

  if (rows.length === 0) {
    console.log('No rising terms matched this window/country/term combination.');
  } else {
    const header = `${'term'.padEnd(30)}${'country'.padEnd(16)}${'week'.padEnd(12)}score  rank  %gain`;
    console.log(header);
    console.log('-'.repeat(header.length));
    for (const r of rows) {
      const term = r.term.slice(0, 28).padEnd(30);
      const country = r.country_name.slice(0, 14).padEnd(16);
      const week = r.week.padEnd(12);
      const score = String(r.score ?? '—').padStart(5);
      const rank = String(r.rank).padStart(6);
      const gain = r.percent_gain === null ? 'n/a' : `+${r.percent_gain}%`;
      console.log(`${term}${country}${week}${score}${rank}  ${gain}`);
    }
  }

  console.log(`\nBytes processed: ${(bytesProcessed / 1e9).toFixed(2)} GB (BigQuery free tier: 1 TB/month)`);
}

main().catch((err) => {
  console.error('Trends report failed:', err?.response?.data?.error ?? err.message ?? err);
  process.exit(1);
});
