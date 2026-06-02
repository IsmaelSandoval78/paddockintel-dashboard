import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CompareDriverData } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const supabase = createClient();

  // Batch 1 — driver by slug
  const { data: driverRaw } = await supabase
    .from('drivers')
    .select('id, driver_ref, forename, surname, code, nationality')
    .eq('driver_ref', ref)
    .single();

  if (!driverRaw) return NextResponse.json(null, { status: 404 });

  const driverId = driverRaw.id as number;

  // Batch 2 — career stats + all standings + all results + qualifying poles (parallel)
  const [statsRes, standingsRes, resultsRes, polesRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select('races, wins, podiums, poles, fastest_laps, first_year, last_year')
      .eq('driver_id', driverId)
      .single(),
    supabase
      .from('driver_standings')
      .select('race_id, position, points, wins')
      .eq('driver_id', driverId),
    supabase
      .from('results')
      .select('race_id, constructor_id, position')
      .eq('driver_id', driverId),
    supabase
      .from('qualifying')
      .select('race_id')
      .eq('driver_id', driverId)
      .eq('position', 1),
  ]);

  if (!statsRes.data) return NextResponse.json(null, { status: 404 });

  const stats = statsRes.data;
  const allStandings = standingsRes.data ?? [];
  const allResults = resultsRes.data ?? [];

  const standingRaceIds = allStandings.map((s) => s.race_id as number);
  const resultRaceIds = allResults.map((r) => r.race_id as number);
  const allRaceIds = [...new Set([...standingRaceIds, ...resultRaceIds])];
  const constructorIds = [...new Set(allResults.map((r) => r.constructor_id as number))];

  // Batch 3 — race metadata + constructor names (parallel)
  const [racesRes, constructorsRes] = await Promise.all([
    allRaceIds.length
      ? supabase
          .from('races')
          .select('id, year, round')
          .in('id', allRaceIds)
      : Promise.resolve({ data: [] as { id: unknown; year: unknown; round: unknown }[] }),
    constructorIds.length
      ? supabase
          .from('constructors')
          .select('id, name, constructor_ref')
          .in('id', constructorIds)
      : Promise.resolve({ data: [] as { id: unknown; name: unknown; constructor_ref: unknown }[] }),
  ]);

  const raceById = new Map(
    (racesRes.data ?? []).map((r) => [
      r.id as number,
      { year: r.year as number, round: r.round as number },
    ])
  );

  const constructorById = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      { name: c.name as string, ref: c.constructor_ref as string },
    ])
  );

  // Find last race per year from standings (highest round)
  const lastRacePerYear = new Map<number, number>();
  for (const s of allStandings) {
    const raceId = s.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const cur = lastRacePerYear.get(race.year);
    if (cur === undefined) {
      lastRacePerYear.set(race.year, raceId);
    } else {
      const curRace = raceById.get(cur);
      if (curRace && race.round > curRace.round) {
        lastRacePerYear.set(race.year, raceId);
      }
    }
  }

  const standingsByRaceId = new Map(
    allStandings.map((s) => [
      s.race_id as number,
      { position: s.position as number, points: s.points as number },
    ])
  );

  // Championships — years where driver was P1 at their last race of the season
  let championships = 0;
  for (const [, raceId] of lastRacePerYear.entries()) {
    const standing = standingsByRaceId.get(raceId);
    if (standing?.position === 1) championships++;
  }

  // Season breakdown — one entry per year
  type SeasonAcc = {
    wins: number;
    podiums: number;
    races: number;
    lastConstructorId: number | null;
  };
  const seasonAcc = new Map<number, SeasonAcc>();

  for (const r of allResults) {
    const race = raceById.get(r.race_id as number);
    if (!race) continue;
    const pos = r.position !== null && r.position !== undefined
      ? Number(r.position) : null;
    const isLastRace = lastRacePerYear.get(race.year) === (r.race_id as number);
    const acc = seasonAcc.get(race.year) ?? {
      wins: 0, podiums: 0, races: 0, lastConstructorId: null,
    };
    acc.races += 1;
    if (pos === 1) acc.wins += 1;
    if (pos !== null && pos <= 3) acc.podiums += 1;
    if (isLastRace) acc.lastConstructorId = r.constructor_id as number;
    seasonAcc.set(race.year, acc);
  }

  const seasons = [...seasonAcc.entries()]
    .map(([year, acc]) => {
      const lastRaceId = lastRacePerYear.get(year);
      const standing = lastRaceId ? standingsByRaceId.get(lastRaceId) : undefined;
      const con = acc.lastConstructorId ? constructorById.get(acc.lastConstructorId) : null;
      return {
        year,
        constructor_ref: con?.ref ?? '',
        constructor_name: con?.name ?? '—',
        wins: acc.wins,
        podiums: acc.podiums,
        races: acc.races,
        position: standing?.position ?? null,
        points: standing?.points ?? 0,
      };
    })
    .sort((a, b) => b.year - a.year);

  const races = stats.races as number;
  const wins = stats.wins as number;

  return NextResponse.json<CompareDriverData>({
    driver_id: driverId,
    driver_ref: driverRaw.driver_ref as string,
    forename: driverRaw.forename as string,
    surname: driverRaw.surname as string,
    code: (driverRaw.code as string | null) ?? null,
    nationality: driverRaw.nationality as string,
    first_year: stats.first_year as number,
    last_year: stats.last_year as number,
    races,
    wins,
    podiums: stats.podiums as number,
    poles: (polesRes.data ?? []).length,
    fastest_laps: stats.fastest_laps as number,
    championships,
    win_pct: races > 0 ? Math.round((wins / races) * 1000) / 10 : 0,
    seasons,
  });
}
