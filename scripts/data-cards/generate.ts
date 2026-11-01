// Writes the numbers of every data card from Supabase:
//
//   npx ts-node --project scripts/tsconfig.json scripts/data-cards/generate.ts [slug ...]
//
// Each spec below computes a card's columns, rows and "as of" line from the live tables and merges
// them into content/data-cards/<slug>.json, keeping the text already written there (headline,
// context, method notes, sources...). A new card starts as a file with empty text, which
// lib/dataCards.ts rejects until it is written: no card ships with numbers and nothing around them.
// The script also rewrites content/data-cards/index.ts, the static import list the site reads
// (the Cloudflare Worker has no filesystem at runtime).

import fs from 'fs';
import path from 'path';
import { createClient } from '../../lib/supabase/server';
import { GP_POINTS, SPRINT_WIN_POINTS, titleStakes } from '../../lib/titleStakes';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv();

type Localized = { en: string; es: string; pt: string };
type Column = { key: string; label: Localized; numeric?: boolean; decimals?: number; signed?: boolean; kind?: 'finishOrLower' };
type Row = Record<string, string | number>;
type Venue = { years: string; races: number; strip: Array<{ label: string; sub: string }>; tallies: Array<{ label: string; value: number }> };
type Computed = { asOf: Localized; columns: Column[]; rows: Row[]; highlightRow?: number; venue?: Venue };
type Supabase = ReturnType<typeof createClient>;

const DIR = path.resolve(__dirname, '../../content/data-cards');
const YEAR = 2026;

type SeasonRace = { id: number; round: number; name: string; date: string; sprint_date: string | null };
type Result = { race_id: number; driver_id: number; constructor_id: number; position: number | null; points: number | null };

async function season(supabase: Supabase) {
  const { data: races } = await supabase
    .from('races')
    .select('id, round, name, date, sprint_date')
    .eq('year', YEAR)
    .order('round');
  const all = (races ?? []) as SeasonRace[];
  const { data: results } = await supabase
    .from('results')
    .select('race_id, driver_id, constructor_id, position, points')
    .in('race_id', all.map((r) => r.id));
  const res = (results ?? []) as Result[];
  const done = all.filter((r) => res.some((x) => x.race_id === r.id));
  const last = done[done.length - 1];
  if (!last) throw new Error(`no ${YEAR} results in Supabase`);
  const { data: cons } = await supabase.from('constructors').select('id, constructor_ref, name');
  const consById = new Map((cons ?? []).map((c) => [c.id as number, { ref: c.constructor_ref as string, name: c.name as string }]));
  return { all, done, last, res, consById };
}

function asOfAfter(round: number, raceName: string): Localized {
  return {
    en: `After round ${round}, ${raceName} ${YEAR}`,
    es: `Tras la fecha ${round}, ${raceName} ${YEAR}`,
    pt: `Após a etapa ${round}, ${raceName} ${YEAR}`,
  };
}

// Grand Prix points per race over rounds [from, to], by constructor (sprints excluded).
function pointsPerRace(s: Awaited<ReturnType<typeof season>>, from: number, to: number): Map<number, number> {
  const ids = new Set(s.done.filter((r) => r.round >= from && r.round <= to).map((r) => r.id));
  const totals = new Map<number, number>();
  for (const x of s.res) if (ids.has(x.race_id)) totals.set(x.constructor_id, (totals.get(x.constructor_id) ?? 0) + Number(x.points ?? 0));
  return new Map([...totals].map(([id, pts]) => [id, Math.round((pts / ids.size) * 10) / 10]));
}

const TEAM: Localized = { en: 'Team', es: 'Equipo', pt: 'Equipe' };

// Grand Prix wins at one circuit, every edition, with one team's wins pulled out for the venue
// poster: its winning years (latest five) and the top four teams by wins.
async function circuitWins(supabase: Supabase, circuitRef: string, teamRef: string): Promise<Computed> {
  const { data: circuit } = await supabase.from('circuits').select('id, name').eq('circuit_ref', circuitRef).single();
  if (!circuit) throw new Error(`circuit ${circuitRef} not found`);
  const { data: races } = await supabase.from('races').select('id, year').eq('circuit_id', circuit.id).order('year');
  const ids = (races ?? []).map((r) => r.id as number);
  const { data: wins } = await supabase.from('results').select('race_id, driver_id, constructor_id').in('race_id', ids).eq('position', 1);
  const byRace = new Map((wins ?? []).map((w) => [w.race_id as number, w]));
  const held = (races ?? []).filter((r) => byRace.has(r.id as number));
  const driverIds = [...new Set((wins ?? []).map((w) => w.driver_id as number))];
  const { data: drivers } = await supabase.from('drivers').select('id, surname').in('id', driverIds);
  const { data: cons } = await supabase.from('constructors').select('id, constructor_ref, name');
  const surname = new Map((drivers ?? []).map((d) => [d.id as number, d.surname as string]));
  const team = new Map((cons ?? []).map((c) => [c.id as number, { ref: c.constructor_ref as string, name: c.name as string }]));
  const rows = held.map((r) => {
    const w = byRace.get(r.id as number)!;
    return { year: String(r.year), driver: surname.get(w.driver_id as number) ?? '', team: team.get(w.constructor_id as number)?.name ?? '' };
  });
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.team, (counts.get(r.team) ?? 0) + 1);
  const teamName = [...team.values()].find((t) => t.ref === teamRef)?.name;
  if (!teamName) throw new Error(`team ${teamRef} not found`);
  const caps = (name: string) => name.toUpperCase().replace(/^MC/, 'Mc');
  const tallies = [...counts]
    .sort((a, b) => b[1] - a[1] || (a[0] === teamName ? -1 : b[0] === teamName ? 1 : a[0].localeCompare(b[0])))
    .slice(0, 4)
    .map(([name, value]) => ({ label: caps(name), value }));
  const strip = rows.filter((r) => r.team === teamName).slice(-5).map((r) => ({ label: r.year, sub: r.driver }));
  const first = rows[0]?.year;
  const last = rows[rows.length - 1]?.year;
  return {
    asOf: {
      en: `${circuit.name}, ${first}–${last}: ${rows.length} Grands Prix`,
      es: `${circuit.name}, ${first}–${last}: ${rows.length} Grandes Premios`,
      pt: `${circuit.name}, ${first}–${last}: ${rows.length} Grandes Prêmios`,
    },
    columns: [
      { key: 'year', label: { en: 'Year', es: 'Año', pt: 'Ano' } },
      { key: 'driver', label: { en: 'Winner', es: 'Ganador', pt: 'Vencedor' } },
      { key: 'team', label: TEAM },
    ],
    rows,
    venue: { years: `${first}–${last}`, races: rows.length, strip, tallies },
  };
}

// Supabase returns at most 1,000 rows per request; this pages through a query until it runs out.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

// The most points one driver could score at a race: a Grand Prix win, plus the fastest-lap point
// (2019-2024), plus a sprint win, with the 2014 finale's double points. Valid from 1991, the
// first season in which every result counted.
function maxRacePoints(year: number, round: number, lastRound: number, sprint: boolean): number {
  const win = year >= 2010 ? 25 : 10;
  const double = year === 2014 && round === lastRound ? 2 : 1;
  const fastestLap = year >= 2019 && year <= 2024 ? 1 : 0;
  const sprintWin = sprint ? (year === 2021 ? 3 : SPRINT_WIN_POINTS) : 0;
  return win * double + fastestLap + sprintWin;
}

function ageOn(dob: string, date: string): { years: number; days: number } {
  const birth = new Date(`${dob}T00:00:00Z`);
  const day = new Date(`${date}T00:00:00Z`);
  let years = day.getUTCFullYear() - birth.getUTCFullYear();
  const birthday = (y: number) => Date.UTC(y, birth.getUTCMonth(), birth.getUTCDate());
  if (day.getTime() < birthday(day.getUTCFullYear())) years -= 1;
  const days = Math.round((day.getTime() - birthday(birth.getUTCFullYear() + years)) / 86400000);
  return { years, days };
}

// The youngest drivers to win the world title, by age at the race that decided it: the first race
// after which the champion's lead was larger than the most points anyone could still score. Each
// driver's first title only. Computed for 1991 onwards; every earlier champion is checked to have
// been older, already at the first race of his title season, than the last driver on the card.
// The current season counts only once the leader has clinched. ASSUME_CLINCH_ROUND=<round> renders
// a preview as if the current leader had clinched at that round; its "as of" line says so, and a
// card generated that way is not for publishing.
async function youngestChampions(supabase: Supabase, highlightRef: string, size: number): Promise<Computed> {
  type Race = { id: number; year: number; round: number; name: string; date: string; sprint_date: string | null };
  type Standing = { race_id: number; driver_id: number; points: number; position: number };
  const races = await fetchAll<Race>((from, to) =>
    supabase.from('races').select('id, year, round, name, date, sprint_date').order('year').order('round').range(from, to),
  );
  const standings = await fetchAll<Standing>((from, to) =>
    supabase.from('driver_standings').select('race_id, driver_id, points, position').lte('position', 2).order('id').range(from, to),
  );
  const byRace = new Map<number, Standing[]>();
  for (const s of standings) byRace.set(s.race_id, [...(byRace.get(s.race_id) ?? []), s]);
  const seasons = new Map<number, Race[]>();
  for (const r of races) seasons.set(r.year, [...(seasons.get(r.year) ?? []), r]);

  const assume = process.env.ASSUME_CLINCH_ROUND ? Number(process.env.ASSUME_CLINCH_ROUND) : null;
  const titles: Array<{ driverId: number; year: number; race: Race; preview: boolean }> = [];
  const before1991: Array<{ driverId: number; year: number; first: Race }> = [];
  for (const [year, list] of seasons) {
    const lastRound = list[list.length - 1].round;
    const run = list.filter((r) => byRace.has(r.id));
    if (!run.length) continue;
    const complete = run.length === list.length;
    if (year < 1991) {
      const p1 = byRace.get(run[run.length - 1].id)?.find((s) => s.position === 1);
      if (complete && p1) before1991.push({ driverId: p1.driver_id, year, first: list[0] });
      continue;
    }
    let clinch: { race: Race; driverId: number } | null = null;
    for (const r of run) {
      const top = byRace.get(r.id) ?? [];
      const p1 = top.find((s) => s.position === 1);
      const p2 = top.find((s) => s.position === 2);
      if (!p1 || !p2) continue;
      const left = list.filter((x) => x.round > r.round).reduce((sum, x) => sum + maxRacePoints(year, x.round, lastRound, !!x.sprint_date), 0);
      if (Number(p1.points) - Number(p2.points) > left || (complete && r.round === lastRound)) {
        clinch = { race: r, driverId: p1.driver_id };
        break;
      }
    }
    if (clinch) titles.push({ ...clinch, year, preview: false });
    else if (year === YEAR && assume !== null) {
      const race = list.find((x) => x.round === assume);
      const leader = byRace.get(run[run.length - 1].id)?.find((s) => s.position === 1);
      if (!race || !leader) throw new Error(`cannot preview a clinch at round ${assume}`);
      titles.push({ driverId: leader.driver_id, year, race, preview: true });
    }
  }

  const driverIds = [...new Set([...titles, ...before1991].map((t) => t.driverId))];
  const { data: drivers } = await supabase.from('drivers').select('id, driver_ref, surname, dob').in('id', driverIds);
  const who = new Map((drivers ?? []).map((d) => [d.id as number, { ref: d.driver_ref as string, surname: d.surname as string, dob: d.dob as string }]));
  const first = new Map<number, (typeof titles)[number]>();
  for (const t of titles) if (!first.has(t.driverId)) first.set(t.driverId, t);
  const ranked = [...first.values()]
    .map((t) => ({ ...t, age: ageOn(who.get(t.driverId)!.dob, t.race.date) }))
    .sort((a, b) => a.age.years - b.age.years || a.age.days - b.age.days)
    .slice(0, size);
  const highlight = ranked.find((t) => who.get(t.driverId)?.ref === highlightRef);
  if (!highlight) throw new Error(`${highlightRef} is not among the ${size} youngest champions: has he clinched yet?`);
  const cutoff = ranked[ranked.length - 1].age;
  for (const p of before1991) {
    const a = ageOn(who.get(p.driverId)!.dob, p.first.date);
    if (a.years < cutoff.years || (a.years === cutoff.years && a.days <= cutoff.days))
      throw new Error(`${who.get(p.driverId)?.surname} (${p.year}) may be younger than the card's cut-off; extend the clinch maths before 1991`);
  }

  const { data: wins } = await supabase
    .from('results')
    .select('race_id, driver_id, constructor_id')
    .in('race_id', ranked.map((t) => t.race.id))
    .in('driver_id', ranked.map((t) => t.driverId));
  const { data: cons } = await supabase.from('constructors').select('id, name');
  const teamName = new Map((cons ?? []).map((c) => [c.id as number, c.name as string]));
  // A preview's title race has no result yet, so its team comes from the driver's latest race.
  const { data: latest } = await supabase
    .from('results')
    .select('constructor_id')
    .eq('driver_id', highlight.driverId)
    .order('race_id', { ascending: false })
    .limit(1);
  const teamOf = (t: (typeof ranked)[number]) => {
    const own = (wins ?? []).find((w) => w.race_id === t.race.id && w.driver_id === t.driverId)?.constructor_id;
    const id = own ?? (t.preview ? latest?.[0]?.constructor_id : undefined);
    const name = teamName.get(id as number);
    if (!name) throw new Error(`no team for ${who.get(t.driverId)?.surname} at ${t.race.name} ${t.year}`);
    return name;
  };
  const rows = ranked.map((t) => ({
    driver: who.get(t.driverId)!.surname,
    team: teamOf(t),
    season: String(t.year),
    race: t.race.name.replace(/ Grand Prix$/, ' GP').replace(/^United States /, 'US ').replace(/^Mexico City /, 'Mexico '),
    years: t.age.years,
    days: t.age.days,
  }));
  const r = highlight.race;
  const pv = highlight.preview;
  return {
    asOf: {
      en: `${pv ? 'PREVIEW · Title assumed' : 'Title clinched'} at round ${r.round}, ${r.name} ${r.year} · age on race day`,
      es: `${pv ? 'VISTA PREVIA · Título supuesto' : 'Título'} en la fecha ${r.round}, ${r.name} ${r.year} · edad ese día`,
      pt: `${pv ? 'PRÉVIA · Título suposto' : 'Título'} na etapa ${r.round}, ${r.name} ${r.year} · idade nesse dia`,
    },
    columns: [
      { key: 'driver', label: { en: 'Champion', es: 'Campeón', pt: 'Campeão' } },
      { key: 'team', label: TEAM },
      { key: 'season', label: { en: 'Season', es: 'Temporada', pt: 'Temporada' } },
      { key: 'race', label: { en: 'Title race', es: 'Carrera del título', pt: 'Corrida do título' } },
      { key: 'years', label: { en: 'Years', es: 'Años', pt: 'Anos' }, numeric: true },
      { key: 'days', label: { en: 'Days', es: 'Días', pt: 'Dias' }, numeric: true },
    ],
    rows,
    highlightRow: ranked.indexOf(highlight),
  };
}

const SPECS: Record<string, (supabase: Supabase) => Promise<Computed>> = {
  // Antonelli against the youngest world champions, by age on the day the title was decided.
  'youngest-f1-world-champions-antonelli-vettel-record': (supabase) => youngestChampions(supabase, 'antonelli', 5),

  // Race-week venue poster, United States GP 2026: Red Bull's wins at COTA.
  'red-bull-cota-wins-us-grand-prix': (supabase) => circuitWins(supabase, 'americas', 'red_bull'),

  // Mercedes' 2026 wins and how its points rate changed after its six-race opening run.
  'mercedes-2026-grand-prix-wins-by-team': async (supabase) => {
    const s = await season(supabase);
    const n = s.last.round;
    const early = pointsPerRace(s, 1, 6);
    const late = pointsPerRace(s, 7, n);
    const total = new Map<number, number>();
    for (const x of s.res) total.set(x.constructor_id, (total.get(x.constructor_id) ?? 0) + Number(x.points ?? 0));
    const top = [...total].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
    const rows = top.map((id) => ({
      team: s.consById.get(id)?.name ?? String(id),
      wins: s.res.filter((x) => x.constructor_id === id && x.position === 1).length,
      podiums: s.res.filter((x) => x.constructor_id === id && x.position !== null && x.position <= 3).length,
      early: early.get(id) ?? 0,
      late: late.get(id) ?? 0,
    }));
    rows.sort((a, b) => b.wins - a.wins || b.late - a.late);
    return {
      asOf: asOfAfter(n, s.last.name),
      columns: [
        { key: 'team', label: TEAM },
        { key: 'wins', label: { en: 'GP wins', es: 'Victorias', pt: 'Vitórias' }, numeric: true },
        { key: 'podiums', label: { en: 'Podiums', es: 'Podios', pt: 'Pódios' }, numeric: true },
        { key: 'early', label: { en: 'Pts/race R1-6', es: 'Pts/carrera F1-6', pt: 'Pts/corrida E1-6' }, numeric: true, decimals: 1 },
        { key: 'late', label: { en: `Pts/race R7-${n}`, es: `Pts/carrera F7-${n}`, pt: `Pts/corrida E7-${n}` }, numeric: true, decimals: 1 },
      ],
      rows,
      highlightRow: rows.findIndex((r) => r.team === 'Mercedes'),
    };
  },

  // Red Bull's points rate before and after the Azerbaijan upgrade, against the other top teams.
  'red-bull-points-per-race-after-baku-upgrade-2026': async (supabase) => {
    const s = await season(supabase);
    const n = s.last.round;
    const baku = s.done.find((r) => r.name === 'Azerbaijan Grand Prix');
    if (!baku) throw new Error('Azerbaijan Grand Prix not found in the 2026 results');
    const before = pointsPerRace(s, 1, baku.round - 1);
    const after = pointsPerRace(s, baku.round, n);
    const ids = [...after.keys()].sort((a, b) => (after.get(b) ?? 0) - (after.get(a) ?? 0)).slice(0, 4);
    const rows = ids.map((id) => {
      const b = before.get(id) ?? 0;
      const a = after.get(id) ?? 0;
      return { team: s.consById.get(id)?.name ?? String(id), before: b, after: a, change: Math.round((a - b) * 10) / 10 };
    });
    const r1 = baku.round - 1;
    return {
      asOf: asOfAfter(n, s.last.name),
      columns: [
        { key: 'team', label: TEAM },
        { key: 'before', label: { en: `Pts/race R1-${r1}`, es: `Pts/carrera F1-${r1}`, pt: `Pts/corrida E1-${r1}` }, numeric: true, decimals: 1 },
        { key: 'after', label: { en: `Pts/race R${baku.round}-${n}`, es: `Pts/carrera F${baku.round}-${n}`, pt: `Pts/corrida E${baku.round}-${n}` }, numeric: true, decimals: 1 },
        { key: 'change', label: { en: 'Change', es: 'Cambio', pt: 'Variação' }, numeric: true, decimals: 1, signed: true },
      ],
      rows,
      highlightRow: rows.findIndex((r) => r.team === 'Red Bull'),
    };
  },

  // What the championship leader needs at the next race to clinch, rival by rival (lib/titleStakes).
  'antonelli-title-austin-2026-what-rivals-need': async (supabase) => {
    const s = await season(supabase);
    const next = s.all.find((r) => r.round === s.last.round + 1);
    if (!next) throw new Error('no next race');
    if (next.sprint_date) throw new Error('title stakes are only modelled for a weekend without a sprint');
    const { data: st } = await supabase.from('driver_standings').select('driver_id, points, wins').eq('race_id', s.last.id);
    const ids = (st ?? []).map((r) => r.driver_id as number);
    const { data: drivers } = await supabase.from('drivers').select('id, surname').in('id', ids);
    const surname = new Map((drivers ?? []).map((d) => [d.id as number, d.surname as string]));
    const standings = (st ?? []).map((r) => ({
      driverId: r.driver_id as number,
      surname: surname.get(r.driver_id as number) ?? '',
      points: Number(r.points),
      wins: r.wins as number,
    }));
    const after = s.all.filter((r) => r.round > next.round);
    const pointsAfter = after.reduce((sum, r) => sum + GP_POINTS[0] + (r.sprint_date ? SPRINT_WIN_POINTS : 0), 0);
    const stakes = titleStakes(standings, pointsAfter, after.length);
    if (!stakes) throw new Error('the leader cannot clinch at the next race');
    const pts = new Map(standings.map((d) => [d.surname, d.points]));
    const rows = stakes.rivals.map((r) => ({ driver: r.surname, points: pts.get(r.surname) ?? 0, gap: r.gap, need: r.need, ifWin: r.worstIfWin ?? 0 }));
    return {
      asOf: {
        en: `After round ${s.last.round}, ${s.last.name} ${YEAR} · ${pointsAfter} points left after round ${next.round}`,
        es: `Tras la fecha ${s.last.round}, ${s.last.name} ${YEAR} · quedan ${pointsAfter} puntos tras la fecha ${next.round}`,
        pt: `Após a etapa ${s.last.round}, ${s.last.name} ${YEAR} · restam ${pointsAfter} pontos após a etapa ${next.round}`,
      },
      columns: [
        { key: 'driver', label: { en: 'Rival', es: 'Rival', pt: 'Rival' } },
        { key: 'points', label: { en: 'Points', es: 'Puntos', pt: 'Pontos' }, numeric: true },
        { key: 'gap', label: { en: `Behind ${stakes.leader}`, es: `Detrás de ${stakes.leader}`, pt: `Atrás de ${stakes.leader}` }, numeric: true },
        { key: 'need', label: { en: 'Margin he needs', es: 'Margen que necesita', pt: 'Margem necessária' }, numeric: true, signed: true },
        { key: 'ifWin', label: { en: `If ${stakes.leader} wins`, es: `Si ${stakes.leader} gana`, pt: `Se ${stakes.leader} vencer` }, numeric: true, kind: 'finishOrLower' },
      ],
      rows,
    };
  },
};

function emptyText(): Localized {
  return { en: '', es: '', pt: '' };
}

function writeIndex() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  const names = files.map((f) => `card_${f.replace(/\.json$/, '').replace(/-/g, '_')}`);
  const src = [
    '// Generated by scripts/data-cards/generate.ts: one static import per card file, because the',
    '// Cloudflare Worker that serves the site cannot read content/data-cards/ at runtime.',
    "import type { DataCard } from '@/lib/dataCards';",
    ...files.map((f, i) => `import ${names[i]} from './${f}';`),
    '',
    `export const DATA_CARD_FILES = [${names.join(', ')}] as unknown as DataCard[];`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIR, 'index.ts'), src);
}

async function main() {
  const supabase = createClient();
  const wanted = process.argv.slice(2);
  const slugs = wanted.length ? wanted : Object.keys(SPECS);
  fs.mkdirSync(DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  for (const slug of slugs) {
    const spec = SPECS[slug];
    if (!spec) throw new Error(`no spec for ${slug}`);
    const computed = await spec(supabase);
    const file = path.join(DIR, `${slug}.json`);
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : null;
    const changed =
      !existing ||
      JSON.stringify([existing.columns, existing.rows, existing.venue?.strip, existing.venue?.tallies]) !==
        JSON.stringify([computed.columns, computed.rows, computed.venue?.strip, computed.venue?.tallies]);
    const card = {
      slug,
      publishedAt: existing?.publishedAt ?? today,
      updatedAt: changed ? today : existing.updatedAt,
      asOf: computed.asOf,
      title: existing?.title ?? emptyText(),
      metaDescription: existing?.metaDescription ?? emptyText(),
      headline: existing?.headline ?? emptyText(),
      subtitle: existing?.subtitle ?? emptyText(),
      context: existing?.context ?? emptyText(),
      method: existing?.method ?? { en: [], es: [], pt: [] },
      alt: existing?.alt ?? emptyText(),
      imageSource: existing?.imageSource ?? emptyText(),
      ...(existing?.layout ? { layout: existing.layout } : {}),
      ...(existing?.theme ? { theme: existing.theme } : {}),
      columns: computed.columns,
      rows: computed.rows,
      ...(computed.highlightRow !== undefined && computed.highlightRow >= 0 ? { highlightRow: computed.highlightRow } : {}),
      sources: existing?.sources ?? [],
      ...(existing?.relatedArticle ? { relatedArticle: existing.relatedArticle } : {}),
      ...(existing?.hubLinks ? { hubLinks: existing.hubLinks } : {}),
      ...(existing?.xPostUrl ? { xPostUrl: existing.xPostUrl } : {}),
      ...(computed.venue
        ? {
            venue: {
              place: existing?.venue?.place ?? emptyText(),
              line1: existing?.venue?.line1 ?? emptyText(),
              line2: existing?.venue?.line2 ?? emptyText(),
              footnote: existing?.venue?.footnote ?? emptyText(),
              ...computed.venue,
            },
          }
        : {}),
    };
    fs.writeFileSync(file, `${JSON.stringify(card, null, 2)}\n`);
    console.log(`${changed ? 'updated' : 'unchanged'} ${slug}`);
    console.table(computed.rows);
  }
  writeIndex();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
