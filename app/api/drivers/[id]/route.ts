import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DriverDetail } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const driverId = parseInt(id, 10);
  if (isNaN(driverId)) return NextResponse.json(null, { status: 400 });

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: career stats + driver info + latest 2026 race
  const [statsRes, driverRes, latestRaceRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select(
        'driver_id, code, nationality, dob, races, wins, podiums, poles, fastest_laps, first_year, last_year'
      )
      .eq('driver_id', driverId)
      .single(),
    supabase
      .from('drivers')
      .select('id, forename, surname, driver_ref')
      .eq('id', driverId)
      .single(),
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!statsRes.data || !driverRes.data) {
    return NextResponse.json(null, { status: 404 });
  }

  const stats = statsRes.data;
  const driver = driverRes.data;
  const latestRaceId = latestRaceRes.data ? (latestRaceRes.data.id as number) : null;

  // Batch 2: last 5 results + 2026 standings + full standings history (parallel)
  const [last5Res, standings2026Res, allStandingsRes] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, position, points')
      .eq('driver_id', driverId)
      .order('race_id', { ascending: false })
      .limit(5),
    latestRaceId
      ? supabase
          .from('driver_standings')
          .select('position, points, wins')
          .eq('driver_id', driverId)
          .eq('race_id', latestRaceId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('driver_standings')
      .select('race_id, position, points')
      .eq('driver_id', driverId),
  ]);

  const last5 = last5Res.data ?? [];
  const last5RaceIds = last5.map((r) => r.race_id as number);
  const allStandings = allStandingsRes.data ?? [];
  const standingRaceIds = allStandings.map((s) => s.race_id as number);
  const raceIdsForLookup = [...new Set([...last5RaceIds, ...standingRaceIds])];

  // Batch 3: race names/rounds + constructor at latest race (parallel)
  const [racesRes, latestConstructorRes] = await Promise.all([
    raceIdsForLookup.length
      ? supabase
          .from('races')
          .select('id, name, year, round')
          .in('id', raceIdsForLookup)
      : Promise.resolve({
          data: [] as { id: unknown; name: unknown; year: unknown; round: unknown }[],
          error: null,
        }),
    latestRaceId
      ? supabase
          .from('results')
          .select('constructor_id')
          .eq('driver_id', driverId)
          .eq('race_id', latestRaceId)
          .limit(1)
      : Promise.resolve({
          data: [] as { constructor_id: unknown }[],
          error: null,
        }),
  ]);

  const raceMap = new Map(
    (racesRes.data ?? []).map((r) => [
      r.id as number,
      { name: r.name as string, year: r.year as number, round: r.round as number },
    ])
  );

  // Career arc: points/position at the season-finale race (highest round) per year
  const seasonFinaleByYear = new Map<number, { raceId: number; round: number }>();
  for (const s of allStandings) {
    const race = raceMap.get(s.race_id as number);
    if (!race) continue;
    const cur = seasonFinaleByYear.get(race.year);
    if (!cur || race.round > cur.round) {
      seasonFinaleByYear.set(race.year, { raceId: s.race_id as number, round: race.round });
    }
  }
  const standingByRaceId = new Map(
    allStandings.map((s) => [
      s.race_id as number,
      { position: s.position as number, points: s.points as number },
    ])
  );
  const careerArc = [...seasonFinaleByYear.entries()]
    .map(([year, { raceId }]) => {
      const standing = standingByRaceId.get(raceId);
      return {
        year,
        points: standing?.points ?? 0,
        position: standing?.position ?? null,
      };
    })
    .sort((a, b) => a.year - b.year);

  const constructorId = (latestConstructorRes.data ?? [])[0]
    ?.constructor_id as number | undefined;

  // Batch 4: constructor name (if in 2026)
  let constructorName: string | null = null;
  if (constructorId) {
    const { data: conData } = await supabase
      .from('constructors')
      .select('name')
      .eq('id', constructorId)
      .single();
    constructorName = conData ? (conData.name as string) : null;
  }

  const last5Results = last5.map((r) => {
    const race = raceMap.get(r.race_id as number);
    const rawPos = r.position;
    const pos =
      rawPos !== null && rawPos !== undefined
        ? (() => {
            const n = Number(rawPos);
            return isNaN(n) ? null : n;
          })()
        : null;
    return {
      race_name: race?.name ?? '—',
      year: race?.year ?? 0,
      position: pos,
      points: Number(r.points ?? 0),
    };
  });

  const standing2026 = standings2026Res.data;
  const season_2026 = standing2026
    ? {
        position: standing2026.position as number,
        points: standing2026.points as number,
        wins: standing2026.wins as number,
        constructor_name: constructorName ?? '—',
      }
    : null;

  return NextResponse.json<DriverDetail>({
    driver_id: driverId,
    driver_ref: driver.driver_ref as string,
    forename: driver.forename as string,
    surname: driver.surname as string,
    code: (stats.code as string | null) ?? null,
    nationality: stats.nationality as string,
    dob: (stats.dob as string | null) ?? null,
    first_year: stats.first_year as number,
    last_year: stats.last_year as number,
    races: stats.races as number,
    wins: stats.wins as number,
    podiums: stats.podiums as number,
    poles: stats.poles as number,
    fastest_laps: stats.fastest_laps as number,
    season_2026,
    last_5_results: last5Results,
    career_arc: careerArc,
  });
}
