import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchTrackPathData } from '@/lib/trackSvg';
import type { CircuitInfo } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const circuitId = parseInt(id, 10);
  if (isNaN(circuitId)) return NextResponse.json(null, { status: 400 });

  const supabase = createClient();

  // Batch 1: circuit details + all races at this circuit
  const [circuitRes, racesRes] = await Promise.all([
    supabase
      .from('circuits')
      .select('name, location, country, lat, lng, circuit_ref')
      .eq('id', circuitId)
      .single(),
    supabase
      .from('races')
      .select('id, year')
      .eq('circuit_id', circuitId),
  ]);

  if (circuitRes.error || !circuitRes.data) {
    return NextResponse.json(null, { status: 404 });
  }

  const circuit = circuitRes.data;
  const races = racesRes.data ?? [];
  const raceIds = races.map((r) => r.id as number);
  const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));

  const years = races.map((r) => r.year as number);
  const firstYear = years.length ? Math.min(...years) : null;
  const totalRaces = races.length;

  if (!raceIds.length) {
    return NextResponse.json<CircuitInfo>({
      name: circuit.name as string,
      location: circuit.location as string,
      country: circuit.country as string,
      lat: circuit.lat as number,
      lng: circuit.lng as number,
      circuit_ref: circuit.circuit_ref as string,
      first_year: firstYear,
      total_races: totalRaces,
      laps: null,
      champions: [],
      fastest_pit: null,
      fastest_lap: null,
      top_constructor: null,
      top_win_driver: null,
      top_pole_driver: null,
      avg_winner_grid: null,
      track_path: null,
      corners: [],
    });
  }

  // Batch 2: all winners + fastest lap + fastest pit + pole positions + track SVG + corners
  const [allWinnersRes, fastLapRes, pitRes, poleRes, trackPath, cornersRes] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, driver_id, constructor_id, grid, laps')
      .in('race_id', raceIds)
      .eq('position', 1),
    supabase
      .from('results')
      .select('race_id, driver_id, fastest_lap_time')
      .in('race_id', raceIds)
      .not('fastest_lap_time', 'is', null)
      .neq('fastest_lap_time', '\\N')
      .gt('fastest_lap_time', '')
      .order('fastest_lap_time', { ascending: true })
      .limit(1),
    supabase
      .from('pit_stops')
      .select('race_id, driver_id, duration, milliseconds')
      .in('race_id', raceIds)
      .gt('milliseconds', 0)
      .order('milliseconds', { ascending: true })
      .limit(1),
    supabase
      .from('qualifying')
      .select('race_id, driver_id')
      .in('race_id', raceIds)
      .eq('position', 1),
    fetchTrackPathData(circuit.circuit_ref as string),
    supabase
      .from('circuit_corners')
      .select('corner_number, name, type, sector, is_drs_zone, description, path_percent')
      .eq('circuit_ref', circuit.circuit_ref as string)
      .order('corner_number', { ascending: true }),
  ]);

  const allWinners = allWinnersRes.data ?? [];
  const fastLapRow = fastLapRes.data?.[0];
  const pitStop = pitRes.data?.[0];
  const poles = poleRes.data ?? [];

  // Last 5 champions (sorted by race_id desc)
  const sortedWinners = [...allWinners].sort(
    (a, b) => (b.race_id as number) - (a.race_id as number)
  );
  const last5 = sortedWinners.slice(0, 5);

  // Top constructor by wins
  const conWins = new Map<number, number>();
  for (const w of allWinners) {
    const cid = w.constructor_id as number;
    conWins.set(cid, (conWins.get(cid) ?? 0) + 1);
  }
  const topConEntry = [...conWins.entries()].sort((a, b) => b[1] - a[1])[0];
  const topConstructorId = topConEntry?.[0] ?? null;
  const topConstructorWins = topConEntry?.[1] ?? 0;

  // Top win driver
  const drvWins = new Map<number, number>();
  for (const w of allWinners) {
    const did = w.driver_id as number;
    drvWins.set(did, (drvWins.get(did) ?? 0) + 1);
  }
  const topWinEntry = [...drvWins.entries()].sort((a, b) => b[1] - a[1])[0];
  const topWinDriverId = topWinEntry?.[0] ?? null;
  const topWinCount = topWinEntry?.[1] ?? 0;

  // Standard laps (mode of winner laps)
  const lapsFreq = new Map<number, number>();
  for (const w of allWinners) {
    const l = w.laps as number;
    if (l > 0) lapsFreq.set(l, (lapsFreq.get(l) ?? 0) + 1);
  }
  const standardLaps: number | null = lapsFreq.size > 0
    ? [...lapsFreq.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Avg winner grid (grid=0 means no data)
  const validGrids = allWinners
    .map((w) => w.grid as number)
    .filter((g) => g > 0);
  const avgWinnerGrid =
    validGrids.length
      ? Math.round((validGrids.reduce((a, b) => a + b, 0) / validGrids.length) * 10) / 10
      : null;

  // Top pole driver
  const poleCounts = new Map<number, number>();
  for (const p of poles) {
    const did = p.driver_id as number;
    poleCounts.set(did, (poleCounts.get(did) ?? 0) + 1);
  }
  const topPoleEntry = [...poleCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPoleDriverId = topPoleEntry?.[0] ?? null;
  const topPoleCount = topPoleEntry?.[1] ?? 0;

  const fastLapDriverId = fastLapRow ? (fastLapRow.driver_id as number) : null;

  const allDriverIds = [
    ...new Set([
      ...last5.map((w) => w.driver_id as number),
      ...(topWinDriverId ? [topWinDriverId] : []),
      ...(topPoleDriverId ? [topPoleDriverId] : []),
      ...(fastLapDriverId ? [fastLapDriverId] : []),
    ]),
  ];

  // Batch 3: driver names + pit stop constructor_id
  const [driversRes, pitConstructorRes] = await Promise.all([
    allDriverIds.length
      ? supabase
          .from('drivers')
          .select('id, forename, surname')
          .in('id', allDriverIds)
      : Promise.resolve({ data: [] as { id: unknown; forename: unknown; surname: unknown }[], error: null }),
    pitStop
      ? supabase
          .from('results')
          .select('constructor_id')
          .eq('race_id', pitStop.race_id)
          .eq('driver_id', pitStop.driver_id)
          .limit(1)
      : Promise.resolve({ data: [] as { constructor_id: unknown }[], error: null }),
  ]);

  const driverMap = new Map(
    (driversRes.data ?? []).map((d) => [d.id as number, d])
  );

  // Batch 4: constructor names for pit stop + top constructor (one query)
  const pitConstructorId = (pitConstructorRes.data ?? [])[0]?.constructor_id as number | undefined;
  const constructorIds = [
    ...(pitConstructorId ? [pitConstructorId] : []),
    ...(topConstructorId ? [topConstructorId] : []),
  ];

  const constructorNameMap = new Map<number, string>();
  if (constructorIds.length) {
    const { data: conData } = await supabase
      .from('constructors')
      .select('id, name')
      .in('id', constructorIds);
    for (const c of conData ?? []) {
      constructorNameMap.set(c.id as number, c.name as string);
    }
  }

  // Assemble response
  const champions = last5.flatMap((c) => {
    const d = driverMap.get(c.driver_id as number);
    const year = raceYearMap.get(c.race_id as number);
    if (!d || !year) return [];
    return [{ year, forename: d.forename as string, surname: d.surname as string }];
  });

  const fastestLap =
    fastLapRow && fastLapDriverId
      ? (() => {
          const d = driverMap.get(fastLapDriverId);
          const year = raceYearMap.get(fastLapRow.race_id as number);
          if (!d || !year) return null;
          return {
            forename: d.forename as string,
            surname: d.surname as string,
            time: fastLapRow.fastest_lap_time as string,
            year,
          };
        })()
      : null;

  const fastestPit =
    pitStop && pitConstructorId && constructorNameMap.has(pitConstructorId)
      ? {
          constructor: constructorNameMap.get(pitConstructorId)!,
          duration: pitStop.duration as string,
          year: raceYearMap.get(pitStop.race_id as number) ?? 0,
        }
      : null;

  const topConstructor =
    topConstructorId && constructorNameMap.has(topConstructorId)
      ? { name: constructorNameMap.get(topConstructorId)!, wins: topConstructorWins }
      : null;

  const topWinDriver =
    topWinDriverId && driverMap.has(topWinDriverId)
      ? (() => {
          const d = driverMap.get(topWinDriverId)!;
          return {
            forename: d.forename as string,
            surname: d.surname as string,
            wins: topWinCount,
          };
        })()
      : null;

  const topPoleDriver =
    topPoleDriverId && driverMap.has(topPoleDriverId)
      ? (() => {
          const d = driverMap.get(topPoleDriverId)!;
          return {
            forename: d.forename as string,
            surname: d.surname as string,
            poles: topPoleCount,
          };
        })()
      : null;

  const corners = (cornersRes.data ?? []).map((c) => ({
    corner_number: c.corner_number as number,
    name: c.name as string | null,
    type: c.type as string,
    sector: c.sector as number,
    is_drs_zone: c.is_drs_zone as boolean,
    description: c.description as string | null,
    path_percent: c.path_percent as number | null,
  }));

  return NextResponse.json<CircuitInfo>({
    name: circuit.name as string,
    location: circuit.location as string,
    country: circuit.country as string,
    lat: circuit.lat as number,
    lng: circuit.lng as number,
    circuit_ref: circuit.circuit_ref as string,
    first_year: firstYear,
    total_races: totalRaces,
    laps: standardLaps,
    champions,
    fastest_pit: fastestPit,
    fastest_lap: fastestLap,
    top_constructor: topConstructor,
    top_win_driver: topWinDriver,
    top_pole_driver: topPoleDriver,
    avg_winner_grid: avgWinnerGrid,
    track_path: trackPath,
    corners,
  });
}
