import { createClient } from '@/lib/supabase/server';
import { getLatestStandingsRaceId } from './data';

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

  const circuitRaces = racesAtCircuitRes.data ?? [];
  let poleToWin: LatestRace['poleToWin'] = null;
  if (circuitRaces.length) {
    const { data: winners } = await supabase
      .from('results')
      .select('race_id, grid, driver_id')
      .in('race_id', circuitRaces.map((r) => r.id as number))
      .eq('position', 1);
    const winnerRows = winners ?? [];
    if (winnerRows.length) {
      const yearById = new Map(circuitRaces.map((r) => [r.id as number, r.year as number]));
      const winnerIds = [...new Set(winnerRows.map((w) => w.driver_id as number))];
      const { data: winnerDrivers } = await supabase.from('drivers').select('id, surname').in('id', winnerIds);
      const surnameById = new Map((winnerDrivers ?? []).map((d) => [d.id as number, d.surname as string]));
      const history = winnerRows
        .flatMap((w) => {
          const year = yearById.get(w.race_id as number);
          return year ? [{ year, winner: surnameById.get(w.driver_id as number) ?? '', grid: w.grid as number }] : [];
        })
        .sort((a, b) => a.year - b.year);
      poleToWin = {
        poleWins: history.filter((h) => h.grid === 1).length,
        races: history.length,
        sinceYear: history[0]?.year ?? (race.year as number),
        history,
      };
    }
  }

  const driverIds = (raceResultsRes.data ?? []).map((r) => r.driver_id as number);
  const { data: drivers } = driverIds.length
    ? await supabase.from('drivers').select('code, surname').in('id', driverIds)
    : { data: [] as Array<{ code: string | null; surname: string }> };
  const surnameByCode: Record<string, string> = {};
  for (const d of drivers ?? []) {
    if (d.code) surnameByCode[d.code as string] = d.surname as string;
  }

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
