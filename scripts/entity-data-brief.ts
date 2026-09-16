// Pulls the standard "who is this driver in numbers" stat set for a Feed item's `stats`
// column — career totals from driver_stats (pre-aggregated, per CLAUDE.md's query-pattern
// rule) plus the current-season standing as of the last *completed* race, never the last
// scheduled one (see project_vol10_first_drama_batch memory: round 22 is Abu Dhabi in
// December, months away — using it silently returns empty standings).
//
// Usage: npx ts-node --project scripts/tsconfig.json scripts/entity-data-brief.ts <driver_code>
// Example: npx ts-node --project scripts/tsconfig.json scripts/entity-data-brief.ts HAD
//
// Prints a JSON array of {value, label, label_es, unit, unit_es} ready to paste into a
// digest item's `stats` field. Values are never hand-typed into the digest JSON directly —
// this script is the one place that does the query, so the position_text "W" = Withdrawn
// (not Win) trap and similar parsing bugs only need to be handled correctly once.

import * as fs from 'fs';
import * as path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

import { createClient } from '../lib/supabase/server';

async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: entity-data-brief.ts <driver_code>  (e.g. HAD, LAW, PIA)');
    process.exit(1);
  }

  const supabase = createClient();

  const { data: driver } = await supabase
    .from('drivers')
    .select('id, code, forename, surname')
    .eq('code', code.toUpperCase())
    .single();

  if (!driver) {
    console.error(`No driver found with code ${code}`);
    process.exit(1);
  }

  const { data: career } = await supabase
    .from('driver_stats')
    .select('*')
    .eq('driver_id', driver.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const { data: races } = await supabase
    .from('races')
    .select('id, round, date')
    .eq('year', 2026)
    .lte('date', today)
    .order('round', { ascending: false })
    .limit(1);

  const lastRace = races?.[0];
  let seasonPoints: number | null = null;
  let seasonPosition: number | null = null;
  let seasonWins: number | null = null;

  if (lastRace) {
    const { data: standing } = await supabase
      .from('driver_standings')
      .select('points, position, wins')
      .eq('race_id', lastRace.id)
      .eq('driver_id', driver.id)
      .single();
    if (standing) {
      seasonPoints = standing.points as number;
      seasonPosition = standing.position as number;
      seasonWins = standing.wins as number;
    }
  }

  const stats = [
    { value: String(career?.races ?? '—'), label: 'CAREER STARTS', label_es: 'CARRERAS EN F1', unit: null, unit_es: null },
    { value: String(career?.wins ?? '—'), label: 'CAREER WINS', label_es: 'VICTORIAS DE CARRERA', unit: null, unit_es: null },
    { value: String(career?.podiums ?? '—'), label: 'CAREER PODIUMS', label_es: 'PODIOS DE CARRERA', unit: null, unit_es: null },
    ...(career?.championships > 0
      ? [{ value: String(career.championships), label: 'CAREER CHAMPIONSHIPS', label_es: 'CAMPEONATOS DE CARRERA', unit: null, unit_es: null }]
      : []),
    ...(seasonPoints !== null
      ? [{
          value: String(seasonPoints),
          label: `2026 POINTS — P${seasonPosition}`,
          label_es: `PUNTOS 2026 — P${seasonPosition}`,
          unit: lastRace ? `through round ${lastRace.round}` : null,
          unit_es: lastRace ? `hasta la fecha ${lastRace.round}` : null,
        }]
      : []),
    ...(seasonWins !== null && seasonWins > 0
      ? [{ value: String(seasonWins), label: '2026 WINS', label_es: 'VICTORIAS 2026', unit: null, unit_es: null }]
      : []),
  ];

  console.log(`${driver.forename} ${driver.surname} (${driver.code})`);
  console.log(JSON.stringify(stats, null, 2));
}

main();
