import { createClient } from '@/lib/supabase/server';
import type {
  DriverSeasonRow,
  DriverAllTimeRow,
  DriversBattleData,
  DriversFormGuide,
  QualiDuelPair,
  ChampionYear,
} from '@/lib/types';
import DriversClient from '@/components/drivers/DriversClient';

const FORM_GUIDE_RACES = 5;
const BATTLE_DRIVERS = 5;

// PostgREST silently caps any single request at 1,000 rows regardless of .limit().
// Use for every query on a table that can grow past that (races ~1,200; drivers and
// driver_stats ~870 and rising). Pass a builder so each page gets a fresh query.
async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data } = await build(from, from + pageSize - 1);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function qualiTimeToMs(t: string | null): number | null {
  if (!t || t === '\\N') return null;
  const m = t.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!m) return null;
  const minutes = m[1] ? parseInt(m[1], 10) : 0;
  return minutes * 60000 + parseInt(m[2], 10) * 1000 + parseInt(m[3].padEnd(3, '0').slice(0, 3), 10);
}

async function getDriversData(): Promise<{
  season2026: DriverSeasonRow[];
  allTime: DriverAllTimeRow[];
  totalCount: number;
  battle: DriversBattleData;
  formGuide: DriversFormGuide;
  qualiDuels: QualiDuelPair[];
  champions: ChampionYear[];
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: latest race WITH results loaded + all-time stats + drivers table + all races
  // (for championship calc). Keyed off driver_standings, not races.date <= today — a race
  // can be in the past by calendar date before the post-race loader has run for it, same
  // pattern as the Hub's getHomeData(). Querying by date alone would find that race and then
  // fail to find any standings for it, blanking the whole page.
  const [latestRaceRes, allStats, allDrivers, allRaces] = await Promise.all([
    supabase
      .from('driver_standings')
      .select('race_id')
      .order('race_id', { ascending: false })
      .limit(1)
      .single(),
    fetchAllRows<{
      driver_id: number; nationality: string; first_year: number;
      last_year: number; wins: number; races: number;
    }>((from, to) =>
      supabase
        .from('driver_stats')
        .select('driver_id, nationality, first_year, last_year, wins, races')
        .order('wins', { ascending: false })
        .order('driver_id', { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{
      id: number; driver_ref: string; forename: string; surname: string; number: number | null;
    }>((from, to) =>
      supabase
        .from('drivers')
        .select('id, driver_ref, forename, surname, number')
        .order('id', { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{ id: number; year: number; round: number }>((from, to) =>
      supabase
        .from('races')
        .select('id, year, round')
        .order('id', { ascending: true })
        .range(from, to)
    ),
  ]);

  // Find season finale race IDs (highest round per year)
  const yearMax = new Map<number, { id: number; round: number }>();
  for (const r of allRaces) {
    const raceId = r.id as number;
    const year = r.year as number;
    const round = r.round as number;
    const cur = yearMax.get(year);
    if (!cur || round > cur.round) yearMax.set(year, { id: raceId, round });
  }
  const finaleRaceIds = [...yearMax.values()].map((v) => v.id);

  // Batch 1b: P1 standings at season finale races
  const champStandingsRes = finaleRaceIds.length
    ? await supabase
        .from('driver_standings')
        .select('driver_id, race_id')
        .in('race_id', finaleRaceIds)
        .eq('position', 1)
    : { data: [] as { driver_id: unknown; race_id: unknown }[] };

  const finaleYearByRaceId = new Map<number, number>();
  for (const [year, v] of yearMax) finaleYearByRaceId.set(v.id, year);

  const champMap = new Map<number, number>();
  const championsByYear: ChampionYear[] = [];
  for (const r of champStandingsRes.data ?? []) {
    const did = r.driver_id as number;
    champMap.set(did, (champMap.get(did) ?? 0) + 1);
    const year = finaleYearByRaceId.get(r.race_id as number);
    if (year !== undefined) {
      championsByYear.push({ year, driver_id: did, forename: '', surname: '' });
    }
  }
  championsByYear.sort((a, b) => a.year - b.year);

  const driverMap = new Map(
    allDrivers.map((d) => [
      d.id as number,
      {
        driver_ref: d.driver_ref as string,
        forename: d.forename as string,
        surname: d.surname as string,
        number: (d.number as number | null) ?? null,
      },
    ])
  );

  const allTime: DriverAllTimeRow[] = allStats.flatMap((s) => {
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
        championships: champMap.get(s.driver_id as number) ?? 0,
        number: d.number,
      },
    ];
  });

  // Champion names resolve from the drivers table map
  for (const c of championsByYear) {
    const d = driverMap.get(c.driver_id);
    if (d) {
      c.forename = d.forename;
      c.surname = d.surname;
    }
  }
  const champions = championsByYear.filter((c) => c.surname !== '');

  const emptyExtras = {
    battle: { rounds: [], series: [] } as DriversBattleData,
    formGuide: {} as DriversFormGuide,
    qualiDuels: [] as QualiDuelPair[],
    champions,
  };

  if (!latestRaceRes.data) {
    return { season2026: [], allTime, totalCount: allTime.length, ...emptyExtras };
  }
  const latestRaceId = latestRaceRes.data.race_id as number;

  // Batch 2: standings at latest race + all 2026 race IDs
  const [standingsRes, races2026Res] = await Promise.all([
    // 2026 grid is 22 cars (11 teams); headroom for mid-season substitutes
    supabase
      .from('driver_standings')
      .select('driver_id, points, position, wins')
      .eq('race_id', latestRaceId)
      .order('position', { ascending: true })
      .limit(30),
    supabase.from('races').select('id, round, name, date').eq('year', 2026).order('round', { ascending: true }),
  ]);

  const standingDriverIds = (standingsRes.data ?? []).map((s) => s.driver_id as number);
  const race2026Ids = (races2026Res.data ?? []).map((r) => r.id as number);
  const completedRaces2026 = (races2026Res.data ?? []).filter((r) => (r.date as string) <= today);
  const lastRaces = completedRaces2026.slice(-FORM_GUIDE_RACES);
  const lastRaceIds = lastRaces.map((r) => r.id as number);
  const top5Ids = standingDriverIds.slice(0, BATTLE_DRIVERS);

  if (!standingDriverIds.length) {
    return { season2026: [], allTime, totalCount: allTime.length, ...emptyExtras };
  }

  // Batch 3: driver detail + 2026 results (podiums/races) + constructor at latest race
  //          + battle standings + form-guide results + qualifying head-to-head
  const [driversDetailRes, resultsRes, latestResultsRes, battleRes, formRes, qualiRes] = await Promise.all([
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
    supabase
      .from('driver_standings')
      .select('driver_id, race_id, points')
      .in('race_id', race2026Ids)
      .in('driver_id', top5Ids),
    lastRaceIds.length
      ? supabase
          .from('results')
          .select('driver_id, race_id, position, position_text')
          .in('race_id', lastRaceIds)
      : Promise.resolve({ data: [] as { driver_id: unknown; race_id: unknown; position: unknown; position_text: unknown }[] }),
    supabase
      .from('qualifying')
      .select('driver_id, race_id, constructor_id, position, q1, q2, q3')
      .in('race_id', race2026Ids),
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

  // ─── Championship battle: cumulative points per completed round, top 5 ───
  const battlePointsByRace = new Map<number, Map<number, number>>();
  for (const r of battleRes.data ?? []) {
    const rid = r.race_id as number;
    if (!battlePointsByRace.has(rid)) battlePointsByRace.set(rid, new Map());
    battlePointsByRace.get(rid)!.set(r.driver_id as number, r.points as number);
  }
  const battleRaces = completedRaces2026.filter((r) => battlePointsByRace.has(r.id as number));
  const seasonRowMap = new Map(season2026.map((s) => [s.driver_id, s]));
  const battle: DriversBattleData = {
    rounds: battleRaces.map((r) => ({
      round: r.round as number,
      race_name: (r.name as string).replace(/ Grand Prix$/, ''),
    })),
    series: top5Ids.flatMap((did) => {
      const row = seasonRowMap.get(did);
      const d = driverDetailMap.get(did);
      if (!row || !d) return [];
      let prev = 0;
      const points = battleRaces.map((r) => {
        const v = battlePointsByRace.get(r.id as number)?.get(did);
        if (v !== undefined) prev = v;
        return prev;
      });
      return [{
        driver_id: did,
        surname: d.surname as string,
        code: (d.code as string | null) ?? null,
        constructor_ref: row.constructor_ref,
        points,
      }];
    }),
  };

  // ─── Form guide: last N completed races per driver ───
  const formByRace = new Map<number, Map<number, { position: number | null; retired: boolean }>>();
  for (const r of formRes.data ?? []) {
    const rid = r.race_id as number;
    const pos = r.position as number | null;
    if (!formByRace.has(rid)) formByRace.set(rid, new Map());
    formByRace.get(rid)!.set(r.driver_id as number, { position: pos, retired: pos === null });
  }
  const formGuide: DriversFormGuide = {};
  for (const did of standingDriverIds) {
    formGuide[did] = lastRaces.map((race) => {
      const cell = formByRace.get(race.id as number)?.get(did);
      return {
        round: race.round as number,
        position: cell?.position ?? null,
        retired: cell?.retired ?? false,
        raced: cell !== undefined,
      };
    });
  }

  // ─── Qualifying head-to-head: teammate duels per constructor ───
  type QRow = {
    driver_id: number; race_id: number; position: number | null;
    q1: string | null; q2: string | null; q3: string | null;
  };
  const qualiByConstructor = new Map<number, QRow[]>();
  for (const r of qualiRes.data ?? []) {
    const cid = r.constructor_id as number;
    if (!qualiByConstructor.has(cid)) qualiByConstructor.set(cid, []);
    qualiByConstructor.get(cid)!.push({
      driver_id: r.driver_id as number,
      race_id: r.race_id as number,
      position: r.position as number | null,
      q1: r.q1 as string | null,
      q2: r.q2 as string | null,
      q3: r.q3 as string | null,
    });
  }
  const constructorInfo = new Map(
    season2026.map((s) => [s.constructor_id, { name: s.constructor_name, ref: s.constructor_ref }])
  );
  const standingPos = (did: number) => seasonRowMap.get(did)?.position ?? 99;
  const qualiDuels: QualiDuelPair[] = [];
  for (const [cid, rows] of qualiByConstructor) {
    const info = constructorInfo.get(cid);
    if (!info) continue;
    const appearances = new Map<number, number>();
    for (const r of rows) appearances.set(r.driver_id, (appearances.get(r.driver_id) ?? 0) + 1);
    const pairIds = [...appearances.entries()]
      .sort((x, y) => y[1] - x[1] || x[0] - y[0])
      .slice(0, 2)
      .map((e) => e[0])
      .sort((x, y) => standingPos(x) - standingPos(y));
    if (pairIds.length < 2) continue;
    const [aId, bId] = pairIds;
    const aInfo = driverDetailMap.get(aId);
    const bInfo = driverDetailMap.get(bId);
    if (!aInfo || !bInfo) continue;

    const byRace = new Map<number, { a?: QRow; b?: QRow }>();
    for (const r of rows) {
      if (r.driver_id !== aId && r.driver_id !== bId) continue;
      if (!byRace.has(r.race_id)) byRace.set(r.race_id, {});
      const slot = byRace.get(r.race_id)!;
      if (r.driver_id === aId) slot.a = r;
      else slot.b = r;
    }
    let aScore = 0;
    let bScore = 0;
    const gaps: number[] = [];
    for (const { a, b } of byRace.values()) {
      if (!a || !b || a.position === null || b.position === null || a.position === b.position) continue;
      if (a.position < b.position) aScore++;
      else bScore++;
      // Gap from the deepest session both drivers set a time in
      for (const key of ['q3', 'q2', 'q1'] as const) {
        const am = qualiTimeToMs(a[key]);
        const bm = qualiTimeToMs(b[key]);
        if (am !== null && bm !== null) {
          gaps.push(bm - am);
          break;
        }
      }
    }
    if (aScore + bScore === 0) continue;
    qualiDuels.push({
      constructor_id: cid,
      constructor_ref: info.ref,
      constructor_name: info.name,
      a: { driver_id: aId, surname: aInfo.surname as string, code: (aInfo.code as string | null) ?? null, score: aScore },
      b: { driver_id: bId, surname: bInfo.surname as string, code: (bInfo.code as string | null) ?? null, score: bScore },
      avg_gap_ms: gaps.length ? gaps.reduce((s, v) => s + v, 0) / gaps.length : null,
      sessions: aScore + bScore,
    });
  }
  qualiDuels.sort(
    (x, y) =>
      Math.min(standingPos(x.a.driver_id), standingPos(x.b.driver_id)) -
      Math.min(standingPos(y.a.driver_id), standingPos(y.b.driver_id))
  );

  // ─── Champions wall: append the 2026 leader as "in progress" ───
  if (season2026.length) {
    const leader = season2026[0];
    champions.push({
      year: 2026,
      driver_id: leader.driver_id,
      forename: leader.forename,
      surname: leader.surname,
      in_progress: true,
    });
  }

  return { season2026, allTime, totalCount: allTime.length, battle, formGuide, qualiDuels, champions };
}

export default async function DriversPage() {
  const { season2026, allTime, totalCount, battle, formGuide, qualiDuels, champions } =
    await getDriversData();
  return (
    <DriversClient
      season2026={season2026}
      allTime={allTime}
      totalCount={totalCount}
      battle={battle}
      formGuide={formGuide}
      qualiDuels={qualiDuels}
      champions={champions}
    />
  );
}
