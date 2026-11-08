import { createClient } from '@/lib/supabase/server';
import { getLatestStandingsRaceId } from '@/lib/latestRace';
import { editorialToday } from '@/lib/dates';
import { GP_POINTS, SPRINT_WIN_POINTS, titleStakes, type TitleStakes } from '@/lib/titleStakes';

// The race the home is "about": the one driver_standings was last computed for — same
// rule as getStandings(), so the hero, gauges and standings always describe one race.
export type LatestRace = {
  raceId: number;
  year: number;
  round: number;
  name: string;
  date: string;
  circuitName: string;
  // Grands Prix on this season's calendar (for "Round 17 of 23" and races left).
  seasonRounds: number;
  // Wins from pole at this circuit, counted live from `results` (grid 1 + position 1).
  poleToWin: {
    poleWins: number;
    races: number;
    sinceYear: number;
    history: Array<{ year: number; winner: string; grid: number }>;
  } | null;
  // Abbreviation -> surname for every driver classified in this race, so per-race
  // highlights (keyed by FastF1 abbreviations) resolve to real names from Supabase.
  surnameByCode: Record<string, string>;
};

export async function getLatestRace(): Promise<LatestRace | null> {
  const supabase = createClient();

  const raceId = await getLatestStandingsRaceId(supabase);
  if (raceId === null) return null;

  const { data: race } = await supabase
    .from('races')
    .select('id, year, round, name, date, circuit_id')
    .eq('id', raceId)
    .single();
  if (!race) return null;

  const circuitId = race.circuit_id as number;
  const [circuitRes, racesAtCircuitRes, raceResultsRes, seasonRes] = await Promise.all([
    supabase.from('circuits').select('name').eq('id', circuitId).single(),
    supabase.from('races').select('id, year').eq('circuit_id', circuitId).lte('year', race.year as number),
    supabase.from('results').select('driver_id').eq('race_id', raceId),
    supabase.from('races').select('id', { count: 'exact', head: true }).eq('year', race.year as number),
  ]);

  const [poleToWin, surnameByCode] = await Promise.all([
    poleToWinAt(supabase, racesAtCircuitRes.data ?? []),
    surnamesByCode(supabase, (raceResultsRes.data ?? []).map((r) => r.driver_id as number)),
  ]);

  return {
    raceId,
    year: race.year as number,
    round: race.round as number,
    name: race.name as string,
    date: race.date as string,
    circuitName: (circuitRes.data?.name as string | undefined) ?? '',
    seasonRounds: seasonRes.count ?? (race.round as number),
    poleToWin,
    surnameByCode,
  };
}

type Client = ReturnType<typeof createClient>;
export type PoleToWin = {
  poleWins: number;
  races: number;
  sinceYear: number;
  history: Array<{ year: number; winner: string; winnerId: number; grid: number }>;
};

// Every Grand Prix won at a circuit (grid and winner per year), from `results` (position 1).
export async function poleToWinAt(supabase: Client, circuitRaces: Array<{ id: unknown; year: unknown }>): Promise<PoleToWin | null> {
  if (!circuitRaces.length) return null;
  const { data: winners } = await supabase
    .from('results')
    .select('race_id, grid, driver_id')
    .in('race_id', circuitRaces.map((r) => r.id as number))
    .eq('position', 1);
  if (!winners?.length) return null;
  const yearById = new Map(circuitRaces.map((r) => [r.id as number, r.year as number]));
  const winnerIds = [...new Set(winners.map((w) => w.driver_id as number))];
  const { data: winnerDrivers } = await supabase.from('drivers').select('id, surname').in('id', winnerIds);
  const surnameById = new Map((winnerDrivers ?? []).map((d) => [d.id as number, d.surname as string]));
  const history = winners
    .flatMap((w) => {
      const year = yearById.get(w.race_id as number);
      const winnerId = w.driver_id as number;
      return year ? [{ year, winner: surnameById.get(winnerId) ?? '', winnerId, grid: w.grid as number }] : [];
    })
    .sort((a, b) => a.year - b.year);
  if (!history.length) return null;
  return {
    poleWins: history.filter((h) => h.grid === 1).length,
    races: history.length,
    sinceYear: history[0].year,
    history,
  };
}

// Abbreviation -> surname for the given drivers (per-race highlights are keyed by abbreviation).
async function surnamesByCode(supabase: Client, driverIds: number[]): Promise<Record<string, string>> {
  const { data: drivers } = driverIds.length
    ? await supabase.from('drivers').select('code, surname').in('id', driverIds)
    : { data: [] as Array<{ code: string | null; surname: string }> };
  const out: Record<string, string> = {};
  for (const d of drivers ?? []) {
    if (d.code) out[d.code as string] = d.surname as string;
  }
  return out;
}

// Points after every round of the season so far, for the given drivers (the current top 5).
// Only rounds with standings rows for every one of them are kept, so no line ever dips to zero
// because a round hasn't been imported.
export type TitleTrend = {
  rounds: number[];
  series: Array<{ driverId: number; points: number[] }>;
};

export async function getTitleTrend(year: number, round: number, driverIds: number[]): Promise<TitleTrend | null> {
  if (!driverIds.length) return null;
  const supabase = createClient();
  const { data: races } = await supabase
    .from('races')
    .select('id, round')
    .eq('year', year)
    .lte('round', round)
    .order('round', { ascending: true });
  const raceRows = races ?? [];
  if (raceRows.length < 2) return null;

  const { data: rows } = await supabase
    .from('driver_standings')
    .select('race_id, driver_id, points')
    .in('race_id', raceRows.map((r) => r.id as number))
    .in('driver_id', driverIds);
  const points = new Map((rows ?? []).map((r) => [`${r.race_id}:${r.driver_id}`, Number(r.points)]));

  const kept = raceRows.filter((r) => driverIds.every((d) => points.has(`${r.id}:${d}`)));
  if (kept.length < 2) return null;
  return {
    rounds: kept.map((r) => r.round as number),
    series: driverIds.map((d) => ({ driverId: d, points: kept.map((r) => points.get(`${r.id}:${d}`) as number) })),
  };
}

// Race week: the next Grand Prix is at most six days away (Monday to Saturday before a Sunday
// race). Everything the race-week strip and circuit section show, from Supabase; the pole-lap
// telemetry for the circuit's last edition comes from lib/raceHighlights by that edition's round.
export type RaceWeek = {
  raceId: number;
  year: number;
  round: number;
  name: string;
  date: string;
  // UTC start time as stored in `races.time`, or null when the calendar has none yet.
  time: string | null;
  // First session date of the weekend (FP1, or the race day when the calendar has no sessions).
  weekendStart: string;
  daysUntil: number;
  seasonRounds: number;
  circuit: { ref: string; name: string; location: string; country: string };
  poleToWin: PoleToWin | null;
  // Most wins at this circuit, then the next-best tally (ties share a line).
  topWinners: Array<{ surnames: string[]; wins: number }>;
  lastEdition: { year: number; round: number; surnameByCode: Record<string, string> } | null;
  // Only when the standings are from the round just before this one and the weekend has no sprint.
  stakes: TitleStakes | null;
};

const RACE_WEEK_DAYS = 6;

export async function getRaceWeek(): Promise<RaceWeek | null> {
  const supabase = createClient();
  const today = editorialToday();

  const { data: race } = await supabase
    .from('races')
    .select('id, year, round, name, date, time, circuit_id, fp1_date, sprint_date')
    .gt('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single();
  if (!race) return null;
  const daysUntil = Math.round((Date.parse(race.date as string) - Date.parse(today)) / 86_400_000);
  if (daysUntil > RACE_WEEK_DAYS) return null;

  const year = race.year as number;
  const round = race.round as number;
  const circuitId = race.circuit_id as number;
  const [circuitRes, pastAtCircuitRes, seasonRes, standingsRaceId] = await Promise.all([
    supabase.from('circuits').select('circuit_ref, name, location, country').eq('id', circuitId).single(),
    supabase.from('races').select('id, year, round').eq('circuit_id', circuitId).lt('year', year).order('year', { ascending: true }),
    supabase.from('races').select('id, round, sprint_date').eq('year', year),
    getLatestStandingsRaceId(supabase),
  ]);
  if (!circuitRes.data) return null;

  const past = pastAtCircuitRes.data ?? [];
  const season = seasonRes.data ?? [];
  const poleToWin = await poleToWinAt(supabase, past);

  const winsBy = new Map<number, { surname: string; wins: number }>();
  for (const h of poleToWin?.history ?? []) {
    const w = winsBy.get(h.winnerId) ?? { surname: h.winner, wins: 0 };
    winsBy.set(h.winnerId, { ...w, wins: w.wins + 1 });
  }
  const tallies = [...new Set([...winsBy.values()].map((w) => w.wins))].sort((a, b) => b - a).slice(0, 2);
  const topWinners = tallies.map((wins) => ({
    wins,
    surnames: [...winsBy.values()].filter((w) => w.wins === wins).map((w) => w.surname),
  }));

  // The last edition is the latest past race at this circuit that has a winner in `results`.
  const lastYear = poleToWin?.history[poleToWin.history.length - 1]?.year;
  const last = past.find((r) => (r.year as number) === lastYear);
  let lastEdition: RaceWeek['lastEdition'] = null;
  if (last) {
    const { data: lastResults } = await supabase.from('results').select('driver_id').eq('race_id', last.id as number);
    lastEdition = {
      year: last.year as number,
      round: last.round as number,
      surnameByCode: await surnamesByCode(supabase, (lastResults ?? []).map((r) => r.driver_id as number)),
    };
  }

  let stakes: TitleStakes | null = null;
  const standingsRace = season.find((r) => (r.id as number) === standingsRaceId);
  if (!race.sprint_date && standingsRace && (standingsRace.round as number) === round - 1) {
    const { data: rows } = await supabase
      .from('driver_standings')
      .select('driver_id, points, wins')
      .eq('race_id', standingsRaceId as number);
    const ids = (rows ?? []).map((r) => r.driver_id as number);
    const { data: drivers } = ids.length
      ? await supabase.from('drivers').select('id, surname').in('id', ids)
      : { data: [] as Array<{ id: number; surname: string }> };
    const surnameById = new Map((drivers ?? []).map((d) => [d.id as number, d.surname as string]));
    const after = season.filter((r) => (r.round as number) > round);
    const pointsAfter = after.reduce((sum, r) => sum + GP_POINTS[0] + (r.sprint_date ? SPRINT_WIN_POINTS : 0), 0);
    stakes = titleStakes(
      (rows ?? []).map((r) => ({
        driverId: r.driver_id as number,
        surname: surnameById.get(r.driver_id as number) ?? '',
        points: Number(r.points),
        wins: r.wins as number,
      })),
      pointsAfter,
      after.length,
    );
  }

  return {
    raceId: race.id as number,
    year,
    round,
    name: race.name as string,
    date: race.date as string,
    time: (race.time as string | null) ?? null,
    weekendStart: (race.fp1_date as string | null) ?? (race.date as string),
    daysUntil,
    seasonRounds: season.length,
    circuit: {
      ref: circuitRes.data.circuit_ref as string,
      name: circuitRes.data.name as string,
      location: circuitRes.data.location as string,
      country: circuitRes.data.country as string,
    },
    poleToWin,
    topWinners,
    lastEdition,
    stakes,
  };
}
