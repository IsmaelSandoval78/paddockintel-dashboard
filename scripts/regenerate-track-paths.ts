// Regenerates data/circuits-svg/track-paths.json from the locally-committed
// data/circuits-svg/circuits.json + data/circuits-svg/svg/*.svg — never fetches
// anything over the network. This is the offline step behind lib/trackSvg.ts,
// which only ever reads the already-generated track-paths.json at runtime.
//
// Why this exists at all (2026-09-09): fetchTrackPathData() used to fetch both
// files from https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main on
// every call. Two of its four call sites had no ISR/revalidate, so that request
// ran on every real page view / API call — confirmed in Cloudflare Workers
// Metrics as a ~145ms subrequest per invocation (the Workers runtime doesn't
// persist Next.js's `fetch(..., {cache:'force-cache'})` the way Vercel's Data
// Cache does, so every cold invocation re-fetched from scratch). Moved to a
// local, pre-computed JSON so there is no per-request network dependency on
// any platform, ever.
//
// When to run this again: only if a real circuit's layout changes (rare — a
// physical redesign of the track, not a routine data update). Steps:
//   1. Download the updated circuits.json from
//      https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits.json
//      and overwrite data/circuits-svg/circuits.json.
//   2. Download the new/changed layout SVG(s) from
//      https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits/minimal/black-outline/<layoutId>.svg
//      into data/circuits-svg/svg/<layoutId>.svg (same filename as the layoutId).
//   3. Run:  npx ts-node --project scripts/tsconfig.json scripts/regenerate-track-paths.ts
//   4. Commit the changed files under data/circuits-svg/ (circuits.json, the new/
//      changed .svg, and the regenerated track-paths.json).
// This is deliberately a manual, one-off process — not automated in CI or at
// build time, since real circuit layout changes are rare enough that
// automating this would add more maintenance surface than it saves.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DATA_DIR = path.resolve(__dirname, '../data/circuits-svg');

// Same mapping this project's circuit_ref values use to reach the external
// repo's circuit ids — kept here (not in lib/trackSvg.ts) since it's only
// needed when regenerating, never at runtime.
const OVERRIDES: Record<string, string> = {
  albert_park:      'melbourne',
  americas:         'austin',
  red_bull_ring:    'spielberg',
  spa:              'spa-francorchamps',
  losail:           'lusail',
  rodriguez:        'mexico-city',
  vegas:            'las-vegas',
  villeneuve:       'montreal',
  magny_cours:      'magny-cours',
  brands_hatch:     'brands-hatch',
  long_beach:       'long-beach',
  paul_ricard:      'paul-ricard',
  ricard:           'paul-ricard',
  east_london:      'east-london',
  ain_diab:         'ain-diab',
  buenos_aires:     'buenos-aires',
  caesars_palace:   'caesars-palace',
  clermont_ferrand: 'clermont-ferrand',
  marina_bay:       'marina-bay',
  watkins_glen:     'watkins-glen',
  yas_marina:       'yas-marina',
  mont_tremblant:   'mont-tremblant',
  tremblant:        'mont-tremblant',
};

function toRepoId(circuitRef: string): string {
  return OVERRIDES[circuitRef] ?? circuitRef.replace(/_/g, '-');
}

interface RepoLayout { layoutId: string; seasons: string }
interface RepoCircuitEntry { id: string; layouts: RepoLayout[] }

function latestLayoutId(entry: RepoCircuitEntry): string {
  let best = entry.layouts[0].layoutId;
  let bestYear = -1;
  for (const layout of entry.layouts) {
    const years = layout.seasons.match(/\d{4}/g) ?? [];
    if (years.length) {
      const max = Math.max(...years.map(Number));
      if (max > bestYear) { bestYear = max; best = layout.layoutId; }
    }
  }
  return best;
}

interface TrackPathData { path: string; viewBox: string }

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: circuits, error } = await supabase
    .from('circuits')
    .select('circuit_ref')
    .order('circuit_ref');
  if (error) throw error;

  const index: RepoCircuitEntry[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'circuits.json'), 'utf-8')
  );
  const byId = new Map(index.map((e) => [e.id, e]));

  const result: Record<string, TrackPathData> = {};
  const missing: string[] = [];

  for (const row of circuits ?? []) {
    const circuitRef = row.circuit_ref as string;
    const entry = byId.get(toRepoId(circuitRef));
    if (!entry) { missing.push(`${circuitRef} (not in circuits.json index)`); continue; }

    const layoutId = latestLayoutId(entry);
    const svgPath = path.join(DATA_DIR, 'svg', `${layoutId}.svg`);
    if (!fs.existsSync(svgPath)) { missing.push(`${circuitRef} -> ${layoutId}.svg (file not downloaded)`); continue; }

    const svg = fs.readFileSync(svgPath, 'utf-8');
    const pathMatch = svg.match(/\bd="([^"]+)"/);
    if (!pathMatch) { missing.push(`${circuitRef} -> ${layoutId}.svg (no d= path found in file)`); continue; }

    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch?.[1] ?? '0 0 500 500';

    result[circuitRef] = { path: pathMatch[1], viewBox };
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'track-paths.json'),
    JSON.stringify(result, null, 2) + '\n',
    'utf-8'
  );

  console.log(`Generated track-paths.json: ${Object.keys(result).length} circuits with a track path.`);
  if (missing.length) {
    console.log(`No track path available for ${missing.length} circuit(s) (same as before this migration — these already returned null from the old GitHub fetch too):`);
    for (const m of missing) console.log(`  - ${m}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
