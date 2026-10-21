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

const SPECS: Record<string, (supabase: Supabase) => Promise<Computed>> = {
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
