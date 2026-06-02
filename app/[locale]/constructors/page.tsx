import { createClient } from '@/lib/supabase/server';
import type { ConstructorSeasonRow, ConstructorAllTimeRow } from '@/lib/types';
import ConstructorsClient from '@/components/constructors/ConstructorsClient';

async function getConstructorsData(): Promise<{
  season2026: ConstructorSeasonRow[];
  allTime: ConstructorAllTimeRow[];
  totalCount: number;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: latest 2026 race + constructors (ref/name/nat) + constructor_stats (all-time)
  const [latestRaceRes, constructorsRes, statsRes] = await Promise.all([
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('constructors')
      .select('id, name, constructor_ref, nationality'),
    supabase
      .from('constructor_stats')
      .select('constructor_id, nationality, first_year, last_year, wins, races')
      .order('wins', { ascending: false }),
  ]);

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
