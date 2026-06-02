import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CompareConstructorData } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const supabase = createClient();

  // Batch 1 — constructor by slug
  const { data: constructorRaw } = await supabase
    .from('constructors')
    .select('id, constructor_ref, name, nationality')
    .eq('constructor_ref', ref)
    .single();

  if (!constructorRaw) return NextResponse.json(null, { status: 404 });

  const constructorId = constructorRaw.id as number;

  // Batch 2 — career stats + standings (era split) + podium results + fastest_laps count
  const [statsRes, standingsLegacyRes, standingsModernRes, podiumsRes, fastestLapsRes] =
    await Promise.all([
      supabase
        .from('constructor_stats')
        .select('races, wins, first_year, last_year')
        .eq('constructor_id', constructorId)
        .single(),
      supabase
        .from('constructor_standings')
        .select('race_id, position, points, wins')
        .eq('constructor_id', constructorId)
        .lt('race_id', 908),
      supabase
        .from('constructor_standings')
        .select('race_id, position, points, wins')
        .eq('constructor_id', constructorId)
        .gte('race_id', 908),
      supabase
        .from('results')
        .select('race_id, position')
        .eq('constructor_id', constructorId)
        .lte('position', 3)
        .not('position', 'is', null),
      supabase
        .from('results')
        .select('id', { count: 'exact', head: true })
        .eq('constructor_id', constructorId)
        .not('fastest_lap', 'is', null),
    ]);

  if (!statsRes.data) return NextResponse.json(null, { status: 404 });

  const stats = statsRes.data;
  const allStandings = [
    ...(standingsLegacyRes.data ?? []),
    ...(standingsModernRes.data ?? []),
  ];
  const allPodiumResults = podiumsRes.data ?? [];
  const fastestLapsTotal = fastestLapsRes.count ?? 0;

  // Batch 3 — all race metadata via era split (no IN clause to avoid row cap)
  const [racesLegacyRes, racesModernRes] = await Promise.all([
    supabase.from('races').select('id, year, round').lt('id', 908),
    supabase.from('races').select('id, year, round').gte('id', 908),
  ]);

  const raceById = new Map(
    [...(racesLegacyRes.data ?? []), ...(racesModernRes.data ?? [])].map((r) => [
      r.id as number,
      { year: r.year as number, round: r.round as number },
    ])
  );

  // Last race per year from standings
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
      {
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
      },
    ])
  );

  // Championships
  let championships = 0;
  for (const [, raceId] of lastRacePerYear.entries()) {
    const standing = standingsByRaceId.get(raceId);
    if (standing?.position === 1) championships++;
  }

  // Podiums per year from podium results
  const podiumsByYear = new Map<number, number>();
  for (const r of allPodiumResults) {
    const race = raceById.get(r.race_id as number);
    if (!race) continue;
    podiumsByYear.set(race.year, (podiumsByYear.get(race.year) ?? 0) + 1);
  }

  // Races per year from standings (1 row = 1 round)
  const racesByYear = new Map<number, number>();
  for (const s of allStandings) {
    const race = raceById.get(s.race_id as number);
    if (!race) continue;
    racesByYear.set(race.year, (racesByYear.get(race.year) ?? 0) + 1);
  }

  // Season breakdown — one entry per year
  const seasons = [...lastRacePerYear.entries()]
    .map(([year, lastRaceId]) => {
      const standing = standingsByRaceId.get(lastRaceId);
      return {
        year,
        wins: standing?.wins ?? 0,
        podiums: podiumsByYear.get(year) ?? 0,
        races: racesByYear.get(year) ?? 0,
        position: standing?.position ?? null,
        points: standing?.points ?? 0,
      };
    })
    .sort((a, b) => b.year - a.year);

  const totalRaces = stats.races as number;
  const totalWins = stats.wins as number;

  return NextResponse.json<CompareConstructorData>({
    constructor_id: constructorId,
    constructor_ref: constructorRaw.constructor_ref as string,
    name: constructorRaw.name as string,
    nationality: constructorRaw.nationality as string,
    first_year: stats.first_year as number,
    last_year: stats.last_year as number,
    races: totalRaces,
    wins: totalWins,
    podiums: allPodiumResults.length,
    fastest_laps: fastestLapsTotal,
    championships,
    win_pct: totalRaces > 0 ? Math.round((totalWins / totalRaces) * 1000) / 10 : 0,
    seasons,
  });
}
