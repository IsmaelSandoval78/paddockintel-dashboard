import { createClient } from './supabase/server';
import type { DriverRow, ConstructorRow } from './types';

export interface PanelData {
  drivers: DriverRow[];
  constructors: ConstructorRow[];
}

export async function getPanelData(): Promise<PanelData> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Latest completed 2026 race
  const { data: latestRace } = await supabase
    .from('races')
    .select('id')
    .eq('year', 2026)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!latestRace) return { drivers: [], constructors: [] };
  const raceId = latestRace.id as number;

  // Batch 1: standings + all 2026 race IDs (parallel)
  const [driverStanRes, constStanRes, races2026Res] = await Promise.all([
    supabase
      .from('driver_standings')
      .select('driver_id, points, position, wins')
      .eq('race_id', raceId)
      .order('position', { ascending: true })
      .limit(10),
    supabase
      .from('constructor_standings')
      .select('constructor_id, points, position, wins')
      .eq('race_id', raceId)
      .order('position', { ascending: true })
      .limit(5),
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026),
  ]);

  const driverIds = (driverStanRes.data ?? []).map((s) => s.driver_id as number);
  const constIds = (constStanRes.data ?? []).map((s) => s.constructor_id as number);
  const race2026Ids = (races2026Res.data ?? []).map((r) => r.id as number);

  if (!driverIds.length) return { drivers: [], constructors: [] };

  // Batch 2: entity details + 2026 results for podium/race count (parallel)
  const [driversRes, constructorsRes, resultsRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, forename, surname, driver_ref, nationality')
      .in('id', driverIds),
    constIds.length
      ? supabase
          .from('constructors')
          .select('id, name, constructor_ref, nationality')
          .in('id', constIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('results')
      .select('driver_id, position')
      .in('driver_id', driverIds)
      .in('race_id', race2026Ids)
      .not('position', 'is', null),
  ]);

  // Aggregate podiums and race entries per driver
  const podiumMap = new Map<number, number>();
  const racesMap = new Map<number, number>();
  for (const r of resultsRes.data ?? []) {
    const did = r.driver_id as number;
    racesMap.set(did, (racesMap.get(did) ?? 0) + 1);
    if (Number(r.position) <= 3) {
      podiumMap.set(did, (podiumMap.get(did) ?? 0) + 1);
    }
  }

  // Build driver rows
  const driverMap = new Map(
    (driversRes.data ?? []).map((d) => [d.id as number, d])
  );
  const drivers: DriverRow[] = (driverStanRes.data ?? []).flatMap((s) => {
    const d = driverMap.get(s.driver_id as number);
    if (!d) return [];
    const did = s.driver_id as number;
    return [
      {
        driver_id: did,
        forename: d.forename as string,
        surname: d.surname as string,
        driver_ref: d.driver_ref as string,
        nationality: d.nationality as string,
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
        podiums: podiumMap.get(did) ?? 0,
        races: racesMap.get(did) ?? 0,
      },
    ];
  });

  // Build constructor rows
  const constMap = new Map(
    ((constIds.length ? constructorsRes.data : []) ?? []).map((c) => [
      c.id as number,
      c,
    ])
  );
  const constructors: ConstructorRow[] = (constStanRes.data ?? []).flatMap((s) => {
    const c = constMap.get(s.constructor_id as number);
    if (!c) return [];
    return [
      {
        constructor_id: s.constructor_id as number,
        constructor_ref: c.constructor_ref as string,
        name: c.name as string,
        nationality: c.nationality as string,
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
      },
    ];
  });

  return { drivers, constructors };
}
