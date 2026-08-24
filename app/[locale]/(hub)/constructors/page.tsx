import { createClient } from '@/lib/supabase/server';
import type { ConstructorSeasonRow, ConstructorAllTimeRow } from '@/lib/types';
import ConstructorsClient from '@/components/constructors/ConstructorsClient';

async function getConstructorsData(): Promise<{
  season2026: ConstructorSeasonRow[];
  allTime: ConstructorAllTimeRow[];
  totalCount: number;
}> {
  const supabase = createClient();

  // Batch 1: latest race WITH results loaded + constructors + constructor_stats + all races
  // (for champ calc). Keyed off constructor_standings, not races.date <= today — a race can
  // be in the past by calendar date before the post-race loader has run for it, same pattern
  // as the Hub's/Drivers' getXData(). Querying by date alone would find that race and then
  // fail to find any standings for it, blanking the whole page (the "0 CONSTRUCTORS" bug).
  const [latestRaceRes, constructorsRes, statsRes, allRacesRes] = await Promise.all([
    supabase
      .from('constructor_standings')
      .select('race_id')
      .order('race_id', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('constructors')
      .select('id, name, constructor_ref, nationality'),
    supabase
      .from('constructor_stats')
      .select('constructor_id, nationality, first_year, last_year, wins, races')
      .order('wins', { ascending: false }),
    // TODO: F1 has ~1200+ races since 1950 — keep limit above that count
    supabase
      .from('races')
      .select('id, year, round')
      .limit(2000),
  ]);

  // Find season finale race IDs (highest round per year)
  const yearMax = new Map<number, { id: number; round: number }>();
  for (const r of allRacesRes.data ?? []) {
    const raceId = r.id as number;
    const year = r.year as number;
    const round = r.round as number;
    const cur = yearMax.get(year);
    if (!cur || round > cur.round) yearMax.set(year, { id: raceId, round });
  }
  const finaleRaceIds = [...yearMax.values()].map((v) => v.id);

  // Batch 1b: P1 constructor standings at season finale races
  const champStandingsRes = finaleRaceIds.length
    ? await supabase
        .from('constructor_standings')
        .select('constructor_id')
        .in('race_id', finaleRaceIds)
        .eq('position', 1)
    : { data: [] as { constructor_id: unknown }[] };

  const champMap = new Map<number, number>();
  for (const r of champStandingsRes.data ?? []) {
    const cid = r.constructor_id as number;
    champMap.set(cid, (champMap.get(cid) ?? 0) + 1);
  }

  const constructorMap = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      {
        name: c.name as string,
        constructor_ref: c.constructor_ref as string,
        nationality: c.nationality as string,
      },
    ])
  );

  const allTime: ConstructorAllTimeRow[] = (statsRes.data ?? []).flatMap((s) => {
    const c = constructorMap.get(s.constructor_id as number);
    if (!c) return [];
    return [
      {
        constructor_id: s.constructor_id as number,
        constructor_ref: c.constructor_ref,
        name: c.name,
        nationality: s.nationality as string,
        first_year: s.first_year as number,
        last_year: s.last_year as number,
        wins: s.wins as number,
        races: s.races as number,
        championships: champMap.get(s.constructor_id as number) ?? 0,
      },
    ];
  });

  if (!latestRaceRes.data) {
    return { season2026: [], allTime, totalCount: allTime.length };
  }
  const latestRaceId = latestRaceRes.data.race_id as number;

  // Batch 2: standings at latest race + all 2026 race IDs
  const [standingsRes, races2026Res] = await Promise.all([
    supabase
      .from('constructor_standings')
      .select('constructor_id, points, position, wins')
      .eq('race_id', latestRaceId)
      .order('position', { ascending: true }),
    supabase.from('races').select('id').eq('year', 2026),
  ]);

  const standingConstructorIds = (standingsRes.data ?? []).map(
    (s) => s.constructor_id as number
  );
  const race2026Ids = (races2026Res.data ?? []).map((r) => r.id as number);

  if (!standingConstructorIds.length) {
    return { season2026: [], allTime, totalCount: allTime.length };
  }

  // Batch 3: 2026 results → podiums + distinct races per constructor
  const { data: resultsData } = await supabase
    .from('results')
    .select('constructor_id, position, race_id')
    .in('constructor_id', standingConstructorIds)
    .in('race_id', race2026Ids)
    .not('position', 'is', null);

  const podiumMap = new Map<number, number>();
  const racesSetMap = new Map<number, Set<number>>();

  for (const r of resultsData ?? []) {
    const cid = r.constructor_id as number;
    const pos = Number(r.position);
    if (!racesSetMap.has(cid)) racesSetMap.set(cid, new Set());
    racesSetMap.get(cid)!.add(r.race_id as number);
    if (pos <= 3) {
      podiumMap.set(cid, (podiumMap.get(cid) ?? 0) + 1);
    }
  }

  const season2026: ConstructorSeasonRow[] = (standingsRes.data ?? []).flatMap((s) => {
    const cid = s.constructor_id as number;
    const c = constructorMap.get(cid);
    if (!c) return [];
    return [
      {
        constructor_id: cid,
        constructor_ref: c.constructor_ref,
        name: c.name,
        nationality: c.nationality,
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
        podiums: podiumMap.get(cid) ?? 0,
        races: racesSetMap.get(cid)?.size ?? 0,
      },
    ];
  });

  return { season2026, allTime, totalCount: allTime.length };
}

export default async function ConstructorsPage() {
  const { season2026, allTime, totalCount } = await getConstructorsData();
  return (
    <ConstructorsClient
      season2026={season2026}
      allTime={allTime}
      totalCount={totalCount}
    />
  );
}
