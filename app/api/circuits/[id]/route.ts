import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
      champions: [],
      fastest_pit: null,
      fastest_lap: null,
    });
  }

  // Batch 2: winners, fastest lap, fastest pit stop (parallel)
  const [champRes, fastLapRes, pitRes] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, driver_id')
      .in('race_id', raceIds)
      .eq('position', 1)
      .order('race_id', { ascending: false })
      .limit(5),
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
  ]);

  const champDriverIds = (champRes.data ?? []).map((c) => c.driver_id as number);
  const fastLapRow = fastLapRes.data?.[0];
  const fastLapDriverId = fastLapRow ? (fastLapRow.driver_id as number) : null;
  const pitStop = pitRes.data?.[0];

  const allDriverIds = [
    ...new Set([
      ...champDriverIds,
      ...(fastLapDriverId ? [fastLapDriverId] : []),
    ]),
  ];

  // Batch 3: driver names + pit stop constructor_id (parallel)
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

  // Batch 4: constructor name for fastest pit stop
  const constructorId = (pitConstructorRes.data ?? [])[0]?.constructor_id as number | undefined;
  let constructorName: string | null = null;
  if (constructorId) {
    const { data: conData } = await supabase
      .from('constructors')
      .select('name')
      .eq('id', constructorId)
      .single();
    constructorName = (conData?.name as string) ?? null;
  }

  // Assemble response
  const champions = (champRes.data ?? []).flatMap((c) => {
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
    pitStop && constructorName
      ? {
          constructor: constructorName,
          duration: pitStop.duration as string,
          year: raceYearMap.get(pitStop.race_id as number) ?? 0,
        }
      : null;

  return NextResponse.json<CircuitInfo>({
    name: circuit.name as string,
    location: circuit.location as string,
    country: circuit.country as string,
    lat: circuit.lat as number,
    lng: circuit.lng as number,
    circuit_ref: circuit.circuit_ref as string,
    first_year: firstYear,
    total_races: totalRaces,
    champions,
    fastest_pit: fastestPit,
    fastest_lap: fastestLap,
  });
}
