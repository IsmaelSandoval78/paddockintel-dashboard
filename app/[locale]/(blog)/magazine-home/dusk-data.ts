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
  // Wins from pole at this circuit, counted live from `results` (grid 1 + position 1).
  poleToWin: { poleWins: number; races: number; sinceYear: number } | null;
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
  const [circuitRes, racesAtCircuitRes, raceResultsRes] = await Promise.all([
    supabase.from('circuits').select('name').eq('id', circuitId).single(),
    supabase.from('races').select('id, year').eq('circuit_id', circuitId).lte('year', race.year as number),
    supabase.from('results').select('driver_id').eq('race_id', raceId),
  ]);

  const circuitRaces = racesAtCircuitRes.data ?? [];
  let poleToWin: LatestRace['poleToWin'] = null;
  if (circuitRaces.length) {
    const { data: winners } = await supabase
      .from('results')
      .select('race_id, grid')
      .in('race_id', circuitRaces.map((r) => r.id as number))
      .eq('position', 1);
    const winnerRows = winners ?? [];
    if (winnerRows.length) {
      const yearById = new Map(circuitRaces.map((r) => [r.id as number, r.year as number]));
      const years = winnerRows.map((w) => yearById.get(w.race_id as number)).filter((y): y is number => !!y);
      poleToWin = {
        poleWins: winnerRows.filter((w) => (w.grid as number) === 1).length,
        races: winnerRows.length,
        sinceYear: Math.min(...years),
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
    poleToWin,
    surnameByCode,
  };
}
