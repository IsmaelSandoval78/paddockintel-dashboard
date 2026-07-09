import { createClient } from '@/lib/supabase/server';

// ─── Record categories (v1 — drivers only, driver_stats/driver_win_streaks) ──

export const RECORD_SLUGS = [
  'most-wins',
  'most-poles',
  'most-podiums',
  'most-fastest-laps',
  'most-championships',
  'most-points',
  'longest-win-streak',
] as const;

export type RecordSlug = (typeof RECORD_SLUGS)[number];

export function isRecordSlug(slug: string): slug is RecordSlug {
  return (RECORD_SLUGS as readonly string[]).includes(slug);
}

// driver_stats column each stat-based category ranks by
const STAT_COLUMN: Record<Exclude<RecordSlug, 'longest-win-streak'>, string> = {
  'most-wins': 'wins',
  'most-poles': 'poles',
  'most-podiums': 'podiums',
  'most-fastest-laps': 'fastest_laps',
  'most-championships': 'championships',
  'most-points': 'total_points',
};

export interface RecordEntry {
  rank: number;
  driver_id: number;
  driver_ref: string | null;
  name: string;
  code: string | null;
  nationality: string | null;
  value: number;
  // stat categories: career span "1950–1958" · streak: end year "2023"
  era: string | null;
}

export async function fetchDriverRefs(
  driverIds: number[]
): Promise<Map<number, { driver_ref: string; code: string | null; nationality: string | null }>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('drivers')
    .select('id, driver_ref, code, nationality')
    .in('id', driverIds);
  return new Map(
    (data ?? []).map((d) => [
      d.id as number,
      {
        driver_ref: d.driver_ref as string,
        code: (d.code as string | null) === '\\N' ? null : ((d.code as string | null) ?? null),
        nationality: (d.nationality as string | null) ?? null,
      },
    ])
  );
}

async function fetchStatRecord(slug: Exclude<RecordSlug, 'longest-win-streak'>, limit: number): Promise<RecordEntry[]> {
  const supabase = createClient();
  const col = STAT_COLUMN[slug];
  let query = supabase
    .from('driver_stats')
    .select(`driver_id, name, code, nationality, first_year, last_year, ${col}`)
    .order(col, { ascending: false })
    .order('driver_id', { ascending: true })
    .limit(limit);
  if (slug === 'most-championships') query = query.gt('championships', 0);
  const { data } = await query;

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const refs = await fetchDriverRefs(rows.map((r) => r.driver_id as number));

  return rows.map((r, i) => {
    const first = r.first_year as number | null;
    const last = r.last_year as number | null;
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: refs.get(r.driver_id as number)?.driver_ref ?? null,
      name: r.name as string,
      code: (r.code as string | null) === '\\N' ? null : ((r.code as string | null) ?? null),
      nationality: (r.nationality as string | null) ?? null,
      value: Number(r[col]),
      era: first && last ? `${first}–${last}` : null,
    };
  });
}

async function fetchStreakRecord(limit: number): Promise<RecordEntry[]> {
  const supabase = createClient();
  // View has no code/nationality — join drivers by driver_id (see RECORDS-HUB-SPEC.md)
  const { data } = await supabase
    .from('driver_win_streaks')
    .select('driver_id, forename, surname, streak_len, end_year')
    .order('streak_len', { ascending: false })
    .order('end_year', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const refs = await fetchDriverRefs([...new Set(rows.map((r) => r.driver_id as number))]);

  return rows.map((r, i) => {
    const extra = refs.get(r.driver_id as number);
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: extra?.driver_ref ?? null,
      name: `${r.forename as string} ${r.surname as string}`,
      code: extra?.code ?? null,
      nationality: extra?.nationality ?? null,
      value: r.streak_len as number,
      era: r.end_year != null ? String(r.end_year) : null,
    };
  });
}

export async function fetchRecord(slug: RecordSlug, limit = 10): Promise<RecordEntry[]> {
  return slug === 'longest-win-streak' ? fetchStreakRecord(limit) : fetchStatRecord(slug, limit);
}

export async function fetchAllRecords(limit = 3): Promise<Record<RecordSlug, RecordEntry[]>> {
  const results = await Promise.all(RECORD_SLUGS.map((slug) => fetchRecord(slug, limit)));
  return Object.fromEntries(RECORD_SLUGS.map((slug, i) => [slug, results[i]])) as Record<
    RecordSlug,
    RecordEntry[]
  >;
}

// Locale-aware value formatting — points carry decimals (e.g. 4405.5), rest are integers
export function formatRecordValue(slug: RecordSlug, value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: slug === 'most-points' ? 1 : 0,
  }).format(value);
}

// ─── Record categories (v2 — constructors, constructor_stats/constructor_win_streaks) ──

export const CONSTRUCTOR_RECORD_SLUGS = [
  'constructors-most-wins',
  'constructors-most-poles',
  'constructors-most-podiums',
  'constructors-most-fastest-laps',
  'constructors-most-championships',
  'constructors-most-points',
  'constructors-longest-win-streak',
] as const;

export type ConstructorRecordSlug = (typeof CONSTRUCTOR_RECORD_SLUGS)[number];

export function isConstructorRecordSlug(slug: string): slug is ConstructorRecordSlug {
  return (CONSTRUCTOR_RECORD_SLUGS as readonly string[]).includes(slug);
}

// constructor_stats column each stat-based category ranks by — note pole_positions,
// not poles (different name than driver_stats, see RECORDS-HUB-SPEC-V2.md)
const CONSTRUCTOR_STAT_COLUMN: Record<
  Exclude<ConstructorRecordSlug, 'constructors-longest-win-streak'>,
  string
> = {
  'constructors-most-wins': 'wins',
  'constructors-most-poles': 'pole_positions',
  'constructors-most-podiums': 'podiums',
  'constructors-most-fastest-laps': 'fastest_laps',
  'constructors-most-championships': 'championships',
  'constructors-most-points': 'total_points',
};

export interface ConstructorRecordEntry {
  rank: number;
  constructor_id: number;
  constructor_ref: string | null;
  name: string;
  nationality: string | null;
  value: number;
  // stat categories: career span "1950–1958" · streak: end year "2023"
  era: string | null;
}

async function fetchConstructorRefs(constructorIds: number[]): Promise<Map<number, string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('constructors')
    .select('id, constructor_ref')
    .in('id', constructorIds);
  return new Map((data ?? []).map((c) => [c.id as number, c.constructor_ref as string]));
}

async function fetchConstructorStatRecord(
  slug: Exclude<ConstructorRecordSlug, 'constructors-longest-win-streak'>,
  limit: number
): Promise<ConstructorRecordEntry[]> {
  const supabase = createClient();
  const col = CONSTRUCTOR_STAT_COLUMN[slug];
  let query = supabase
    .from('constructor_stats')
    .select(`constructor_id, name, nationality, first_year, last_year, ${col}`)
    .order(col, { ascending: false })
    .order('constructor_id', { ascending: true })
    .limit(limit);
  if (slug === 'constructors-most-championships') query = query.gt('championships', 0);
  const { data } = await query;

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const refs = await fetchConstructorRefs(rows.map((r) => r.constructor_id as number));

  return rows.map((r, i) => {
    const first = r.first_year as number | null;
    const last = r.last_year as number | null;
    return {
      rank: i + 1,
      constructor_id: r.constructor_id as number,
      constructor_ref: refs.get(r.constructor_id as number) ?? null,
      name: r.name as string,
      nationality: (r.nationality as string | null) ?? null,
      value: Number(r[col]),
      era: first && last ? `${first}–${last}` : null,
    };
  });
}

async function fetchConstructorStreakRecord(limit: number): Promise<ConstructorRecordEntry[]> {
  const supabase = createClient();
  // View already carries name + constructor_ref — no extra join needed
  // (unlike driver_win_streaks), see RECORDS-HUB-SPEC-V2.md.
  const { data } = await supabase
    .from('constructor_win_streaks')
    .select('constructor_id, name, constructor_ref, streak_len, end_year')
    .order('streak_len', { ascending: false })
    .order('end_year', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  return rows.map((r, i) => ({
    rank: i + 1,
    constructor_id: r.constructor_id as number,
    constructor_ref: (r.constructor_ref as string | null) ?? null,
    name: r.name as string,
    nationality: null,
    value: r.streak_len as number,
    era: r.end_year != null ? String(r.end_year) : null,
  }));
}

export async function fetchConstructorRecord(
  slug: ConstructorRecordSlug,
  limit = 10
): Promise<ConstructorRecordEntry[]> {
  return slug === 'constructors-longest-win-streak'
    ? fetchConstructorStreakRecord(limit)
    : fetchConstructorStatRecord(slug, limit);
}

export async function fetchAllConstructorRecords(
  limit = 3
): Promise<Record<ConstructorRecordSlug, ConstructorRecordEntry[]>> {
  const results = await Promise.all(
    CONSTRUCTOR_RECORD_SLUGS.map((slug) => fetchConstructorRecord(slug, limit))
  );
  return Object.fromEntries(
    CONSTRUCTOR_RECORD_SLUGS.map((slug, i) => [slug, results[i]])
  ) as Record<ConstructorRecordSlug, ConstructorRecordEntry[]>;
}

export function formatConstructorRecordValue(
  slug: ConstructorRecordSlug,
  value: number,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: slug === 'constructors-most-points' ? 1 : 0,
  }).format(value);
}

// ─── Record categories (v2 — special, race_winner_ages/driver_circuit_wins) ──

export const SPECIAL_RECORD_SLUGS = ['youngest-oldest-winner', 'most-wins-single-circuit'] as const;

export type SpecialRecordSlug = (typeof SPECIAL_RECORD_SLUGS)[number];

export function isSpecialRecordSlug(slug: string): slug is SpecialRecordSlug {
  return (SPECIAL_RECORD_SLUGS as readonly string[]).includes(slug);
}

export interface AgeRecordEntry {
  rank: number;
  driver_id: number;
  driver_ref: string | null;
  name: string;
  code: string | null;
  nationality: string | null;
  ageDays: number;
  // race name · year — the context here is the specific race, not a career span
  era: string;
}

async function fetchAgeRecord(
  view: 'youngest_race_winners' | 'oldest_race_winners',
  ascending: boolean,
  limit: number
): Promise<AgeRecordEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from(view)
    .select('driver_id, race_name, year, age_days')
    .order('age_days', { ascending })
    .limit(limit);

  const rows = data ?? [];
  const refs = await fetchDriverRefs(rows.map((r) => r.driver_id as number));

  return rows.map((r, i) => {
    const ref = refs.get(r.driver_id as number);
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: ref?.driver_ref ?? null,
      name: '', // filled by caller — driver name isn't on these views, see fetchYoungestOldestWinners
      code: ref?.code ?? null,
      nationality: ref?.nationality ?? null,
      ageDays: r.age_days as number,
      era: `${r.race_name as string} · ${r.year as number}`,
    };
  });
}

export async function fetchYoungestOldestWinners(
  limit = 10
): Promise<{ youngest: AgeRecordEntry[]; oldest: AgeRecordEntry[] }> {
  const [youngestRaw, oldestRaw] = await Promise.all([
    fetchAgeRecord('youngest_race_winners', true, limit),
    fetchAgeRecord('oldest_race_winners', false, limit),
  ]);

  const supabase = createClient();
  const ids = [...new Set([...youngestRaw, ...oldestRaw].map((r) => r.driver_id))];
  const { data: driverRows } = await supabase
    .from('drivers')
    .select('id, forename, surname')
    .in('id', ids);
  const names = new Map(
    (driverRows ?? []).map((d) => [d.id as number, `${d.forename as string} ${d.surname as string}`])
  );

  const withNames = (rows: AgeRecordEntry[]) =>
    rows.map((r) => ({ ...r, name: names.get(r.driver_id) ?? '' }));

  return { youngest: withNames(youngestRaw), oldest: withNames(oldestRaw) };
}

// age_days is a Postgres date-diff interval — convert to years for display,
// e.g. 8085 → "22.1" — never render it as a raw day count or a date
export function formatAgeYears(ageDays: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ageDays / 365.25);
}

export interface CircuitWinRecordEntry {
  rank: number;
  driver_id: number;
  driver_ref: string | null;
  circuit_id: number;
  name: string;
  code: string | null;
  nationality: string | null;
  value: number;
  // circuit name, e.g. "Silverstone Circuit" — the context here is the track, not a year
  era: string;
}

export async function fetchCircuitWinRecord(limit = 10): Promise<CircuitWinRecordEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('driver_circuit_wins')
    .select('driver_id, circuit_id, wins')
    .order('wins', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const driverIds = [...new Set(rows.map((r) => r.driver_id as number))];
  const circuitIds = [...new Set(rows.map((r) => r.circuit_id as number))];

  const [refs, circuitRows] = await Promise.all([
    fetchDriverRefs(driverIds),
    supabase.from('circuits').select('id, name').in('id', circuitIds),
  ]);
  const circuitNames = new Map(
    (circuitRows.data ?? []).map((c) => [c.id as number, c.name as string])
  );
  // Driver names aren't on driver_circuit_wins — batch-fetch alongside refs
  const { data: driverRows } = await supabase
    .from('drivers')
    .select('id, forename, surname')
    .in('id', driverIds);
  const names = new Map(
    (driverRows ?? []).map((d) => [d.id as number, `${d.forename as string} ${d.surname as string}`])
  );

  return rows.map((r, i) => {
    const driverId = r.driver_id as number;
    const ref = refs.get(driverId);
    return {
      rank: i + 1,
      driver_id: driverId,
      driver_ref: ref?.driver_ref ?? null,
      circuit_id: r.circuit_id as number,
      name: names.get(driverId) ?? '',
      code: ref?.code ?? null,
      nationality: ref?.nationality ?? null,
      value: r.wins as number,
      era: circuitNames.get(r.circuit_id as number) ?? '',
    };
  });
}

// ─── Record categories (v3 — closest championships, season_title_fights) ──

export interface SeasonTitleFight {
  year: number;
  championId: number;
  championRef: string | null;
  championName: string;
  runnerUpId: number;
  runnerUpRef: string | null;
  runnerUpName: string;
  championPoints: number;
  runnerUpPoints: number;
  gap: number;
}

async function fetchDriverNames(driverIds: number[]): Promise<Map<number, string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('drivers')
    .select('id, forename, surname')
    .in('id', driverIds);
  return new Map(
    (data ?? []).map((d) => [d.id as number, `${d.forename as string} ${d.surname as string}`])
  );
}

function mapTitleFightRow(
  row: { year: number; champion_id: number; runner_up_id: number; champion_points: number; runner_up_points: number; gap: number },
  names: Map<number, string>,
  refs: Map<number, { driver_ref: string; code: string | null; nationality: string | null }>
): SeasonTitleFight {
  return {
    year: row.year,
    championId: row.champion_id,
    championRef: refs.get(row.champion_id)?.driver_ref ?? null,
    championName: names.get(row.champion_id) ?? '',
    runnerUpId: row.runner_up_id,
    runnerUpRef: refs.get(row.runner_up_id)?.driver_ref ?? null,
    runnerUpName: names.get(row.runner_up_id) ?? '',
    championPoints: row.champion_points,
    runnerUpPoints: row.runner_up_points,
    gap: row.gap,
  };
}

export async function fetchClosestChampionships(limit = 10): Promise<SeasonTitleFight[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('season_title_fights')
    .select('year, champion_id, runner_up_id, champion_points, runner_up_points, gap')
    .order('gap', { ascending: true })
    .limit(limit);

  const rows = data ?? [];
  const ids = [...new Set(rows.flatMap((r) => [r.champion_id as number, r.runner_up_id as number]))];
  const [refs, names] = await Promise.all([fetchDriverRefs(ids), fetchDriverNames(ids)]);

  return rows.map((r) =>
    mapTitleFightRow(
      {
        year: r.year as number,
        champion_id: r.champion_id as number,
        runner_up_id: r.runner_up_id as number,
        champion_points: r.champion_points as number,
        runner_up_points: r.runner_up_points as number,
        gap: r.gap as number,
      },
      names,
      refs
    )
  );
}

export async function fetchSeasonTitleFight(year: number): Promise<SeasonTitleFight | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('season_title_fights')
    .select('year, champion_id, runner_up_id, champion_points, runner_up_points, gap')
    .eq('year', year)
    .maybeSingle();
  if (!data) return null;

  const ids = [data.champion_id as number, data.runner_up_id as number];
  const [refs, names] = await Promise.all([fetchDriverRefs(ids), fetchDriverNames(ids)]);

  return mapTitleFightRow(
    {
      year: data.year as number,
      champion_id: data.champion_id as number,
      runner_up_id: data.runner_up_id as number,
      champion_points: data.champion_points as number,
      runner_up_points: data.runner_up_points as number,
      gap: data.gap as number,
    },
    names,
    refs
  );
}

export async function fetchTitleFightYears(): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase.from('season_title_fights').select('year');
  return (data ?? []).map((r) => r.year as number);
}

export interface SeasonBattleRound {
  round: number;
  raceName: string;
  championPoints: number;
  runnerUpPoints: number;
  gap: number;
}

// driver_standings coverage varies by era (1991-2002 top 6 only, 2010+ top 10) —
// rows simply won't exist for a driver outside the points that round. Missing
// rows are treated as 0, the real historical points tally, not "corrected".
export async function fetchSeasonBattle(
  year: number,
  championId: number,
  runnerUpId: number
): Promise<SeasonBattleRound[]> {
  const supabase = createClient();
  const { data: races } = await supabase
    .from('races')
    .select('id, round, name')
    .eq('year', year)
    .order('round', { ascending: true });
  const seasonRaces = races ?? [];
  const raceIds = seasonRaces.map((r) => r.id as number);

  const { data: standings } = await supabase
    .from('driver_standings')
    .select('race_id, driver_id, points')
    .in('race_id', raceIds)
    .in('driver_id', [championId, runnerUpId]);

  const byRace = new Map<number, { champion: number; runnerUp: number }>();
  for (const s of standings ?? []) {
    const raceId = s.race_id as number;
    const entry = byRace.get(raceId) ?? { champion: 0, runnerUp: 0 };
    if (s.driver_id === championId) entry.champion = s.points as number;
    if (s.driver_id === runnerUpId) entry.runnerUp = s.points as number;
    byRace.set(raceId, entry);
  }

  return seasonRaces.map((r) => {
    const entry = byRace.get(r.id as number) ?? { champion: 0, runnerUp: 0 };
    return {
      round: r.round as number,
      raceName: r.name as string,
      championPoints: entry.champion,
      runnerUpPoints: entry.runnerUp,
      gap: entry.champion - entry.runnerUp,
    };
  });
}

// signDisplay adds the "+"/"-" the index rows and hero number need — a bare
// gap of 0.5 reads as an unsigned quantity otherwise
export function formatGap(gap: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(gap);
}
