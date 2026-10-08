// Reads Search Console data directly via the API instead of pasting
// screenshots into chat. Run:
//   npx ts-node --project scripts/tsconfig.json scripts/gsc-report.ts
//   npx ts-node --project scripts/tsconfig.json scripts/gsc-report.ts --dimension page --days 90
//
// Requires GSC_SERVICE_ACCOUNT_KEY in .env.local (a compact-JSON service
// account key) and that service account added as a user on the Search
// Console property (Settings -> Users and permissions).
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

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    dimension: get('--dimension', 'query') as 'query' | 'page',
    days: Number.parseInt(get('--days', '28'), 10),
    limit: Number.parseInt(get('--limit', '25'), 10),
    site: get('--site', ''),
  };
}

async function getClient(): Promise<JWT> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GSC_SERVICE_ACCOUNT_KEY not set in .env.local');
  const key = JSON.parse(raw);
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  await client.authorize();
  return client;
}

async function listSites(client: JWT): Promise<string[]> {
  const res = await client.request<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>({
    url: 'https://www.googleapis.com/webmasters/v3/sites',
  });
  return (res.data.siteEntry ?? []).map((s) => s.siteUrl);
}

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function queryAnalytics(client: JWT, siteUrl: string, dimension: string, days: number, limit: number): Promise<Row[]> {
  const end = new Date();
  end.setDate(end.getDate() - 2); // GSC data lags ~2 days
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await client.request<{ rows?: Row[] }>({
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: 'POST',
    data: {
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: [dimension],
      rowLimit: limit,
    },
  });
  return res.data.rows ?? [];
}

async function main() {
  const { dimension, days, limit, site } = parseArgs();
  const client = await getClient();

  const sites = await listSites(client);
  if (sites.length === 0) {
    console.error('No sites visible to this service account -- confirm it was added under Search Console > Settings > Users and permissions.');
    process.exit(1);
  }

  const siteUrl = site || sites.find((s) => s.includes('paddockintel.com')) || sites[0];
  console.log(`Site: ${siteUrl}  (available: ${sites.join(', ')})`);
  console.log(`Window: last ${days} days, by ${dimension}, top ${limit}\n`);

  const rows = await queryAnalytics(client, siteUrl, dimension, days, limit);
  if (rows.length === 0) {
    console.log('No data returned for this window/dimension.');
    return;
  }

  const header = `${dimension.padEnd(60)} clicks  impr.    ctr    pos`;
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const r of rows) {
    const key = r.keys[0].slice(0, 58).padEnd(60);
    const clicks = String(r.clicks).padStart(6);
    const impr = String(r.impressions).padStart(8);
    const ctr = `${(r.ctr * 100).toFixed(1)}%`.padStart(6);
    const pos = r.position.toFixed(1).padStart(6);
    console.log(`${key}${clicks}${impr}${ctr}${pos}`);
  }
}

main().catch((err) => {
  console.error('GSC report failed:', err?.response?.data ?? err.message ?? err);
  process.exit(1);
});
