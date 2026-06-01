import { createClient } from '@/lib/supabase/server';
import type { DriverSeasonRow, DriverAllTimeRow } from '@/lib/types';
import DriversClient from '@/components/drivers/DriversClient';

async function getDriversData(): Promise<{
  season2026: DriverSeasonRow[];
  allTime: DriverAllTimeRow[];
  totalCount: number;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: latest 2026 race + all-time stats + drivers table (ref + names)
  const [latestRaceRes, driverStatsRes, driversRes] = await Promise.all([
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('driver_stats')
      .select('driver_id, nationality, first_year, last_year, wins, races')
      .order('wins', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, driver_ref, forename, surname'),
  ]);

  const driverMap = new Map(
    (driversRes.data ?? []).map((d) => [
      d.id as number,
      {
        driver_ref: d.driver_ref as string,
        forename: d.forename as string,
        surname: d.surname as string,
      },
    ])
  );

  const allTime: DriverAllTimeRow[] = (driverStatsRes.data ?? []).flatMap((s) => {
    const d = driverMap.get(s.driver_id as number);
    if (!d) return [];
    return [
      {
        driver_id: s.driver_id as number,
        driver_ref: d.driver_ref,
        forename: d.forename,
        surname: d.surname,
        nationality: s.nationality as string,
        first_year: s.first_year as number,
        last_year: s.last_year as number,
        wins: s.wins as number,
        races: s.races as number,
      },
    ];
  });

  if (!latestRaceRes.data) {
    return { season2026: [], allTime, totalCount: allTime.length };
  }
  const latestRaceId = latestRaceRes.data.id as number;

  // Batch 2: standings at latest race + all 2026 race IDs
  const [standingsRes, races2026Res] = await Promise.all([
    supabase
      .from('driver_standings')
      .select('driver_id, points, position, wins')
      .eq('race_id', latestRaceId)
      .order('position', { ascending: true })
      .limit(20),
    supabase.from('races').select('id').eq('year', 2026),
  ]);

  const standingDriverIds = (standingsRes.data ?? []).map((s) => s.driver_id as number);
  const race2026Ids = (races2026Res.data ?? []).map((r) => r.id as number);

  if (!standingDriverIds.length) {
    return { season2026: [], allTime, totalCount: allTime.length };
  }

  // Batch 3: driver detail + 2026 results (podiums/races) + constructor at latest race
  const [driversDetailRes, resultsRes, latestResultsRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, forename, surname, driver_ref, code, nationality')
      .in('id', standingDriverIds),
    supabase
      .from('results')
      .select('driver_id, position')
      .in('driver_id', standingDriverIds)
      .in('race_id', race2026Ids)
      .not('position', 'is', null),
    supabase
      .from('results')
      .select('driver_id, constructor_id')
      .eq('race_id', latestRaceId)
      .in('driver_id', standingDriverIds),
  ]);

  const constructorIds = [
    ...new Set(
      (latestResultsRes.data ?? []).map((r) => r.constructor_id as number)
    ),
  ];

  // Batch 4: constructor names
  const { data: constructorsData } = constructorIds.length
    ? await supabase
        .from('constructors')
        .select('id, name, constructor_ref')
        .in('id', constructorIds)
    : { data: [] as { id: unknown; name: unknown; constructor_ref: unknown }[] };

  const constructorMap = new Map(
    (constructorsData ?? []).map((c) => [c.id as number, c])
  );
  const driverConstructorMap = new Map(
    (latestResultsRes.data ?? []).map((r) => [
      r.driver_id as number,
      r.constructor_id as number,
    ])
  );

  const podiumMap = new Map<number, number>();
  const racesMap = new Map<number, number>();
  for (const r of resultsRes.data ?? []) {
    const did = r.driver_id as number;
    racesMap.set(did, (racesMap.get(did) ?? 0) + 1);
    if (Number(r.position) <= 3) {
      podiumMap.set(did, (podiumMap.get(did) ?? 0) + 1);
    }
  }

  const driverDetailMap = new Map(
    (driversDetailRes.data ?? []).map((d) => [d.id as number, d])
  );

  const season2026: DriverSeasonRow[] = (standingsRes.data ?? []).flatMap((s) => {
    const d = driverDetailMap.get(s.driver_id as number);
    if (!d) return [];
    const did = s.driver_id as number;
    const constructorId = driverConstructorMap.get(did);
    const constructor = constructorId ? constructorMap.get(constructorId) : null;
    return [
      {
        driver_id: did,
        driver_ref: d.driver_ref as string,
        forename: d.forename as string,
        surname: d.surname as string,
        code: (d.code as string | null) ?? null,
        nationality: d.nationality as string,
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
        podiums: podiumMap.get(did) ?? 0,
        races: racesMap.get(did) ?? 0,
        constructor_id: constructorId ?? 0,
        constructor_name: constructor ? (constructor.name as string) : '—',
        constructor_ref: constructor ? (constructor.constructor_ref as string) : '',
      },
    ];
  });

  return { season2026, allTime, totalCount: allTime.length };
}

export default async function DriversPage() {
  const { season2026, allTime, totalCount } = await getDriversData();
  return (
    <DriversClient
      season2026={season2026}
      allTime={allTime}
      totalCount={totalCount}
    />
  );
}
