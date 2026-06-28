export const revalidate = 3600;

import { createClient } from '@/lib/supabase/server';
import { fetchTrackPathData } from '@/lib/trackSvg';
import HomeExperience from '@/components/home/kinetic/HomeExperience';
import type {
  HomeNextRace,
  HomeDriverRow,
  HomeLastRaceData,
  HomeStreaksData,
  DriverSelectorRow,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const race = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((race.getTime() - now.getTime()) / 86400000));
}

// ─── Data fetching ────────────────────────────────────────────────

async function getHomeData(): Promise<{
  nextRace: HomeNextRace | null;
  topDrivers: HomeDriverRow[];
  lastRaceData: HomeLastRaceData | null;
  allDrivers: DriverSelectorRow[];
  currentRound: number | null;
  currentYear: number | null;
  streaksData: HomeStreaksData | null;
  formGuideData: import('@/lib/types').HomeFormGuideData;
  seasonShapeData: import('@/lib/types').HomeSeasonShapeData;
  championshipGapData: import('@/lib/types').HomeChampionshipGapData;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // ── Batch 1 ─────────────────────────────────────────────────────
  // NOTE: driver_standings max race_id — not races by date — because
  // a race can exist in `races` before its results are imported.
  const [latestStandingsRaceRes, nextRaceRes, constructorsRes, driverStatsRes, driversListRes, races2026CompletedRes] =
    await Promise.all([
      supabase
        .from('driver_standings')
        .select('race_id')
        .order('race_id', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('races')
        .select('id, round, name, date, circuit_id')
        .gt('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single(),
      supabase.from('constructors').select('id, name, constructor_ref, nationality'),
      supabase
        .from('driver_stats')
        .select('driver_id, wins, nationality, podiums, races')
        .order('wins', { ascending: false }),
      supabase.from('drivers').select('id, driver_ref, forename, surname'),
      supabase
        .from('races')
        .select('id, round')
        .eq('year', 2026)
        .lte('date', today)
        .order('round', { ascending: true }),
    ]);

  const latestRaceId = (latestStandingsRaceRes.data?.race_id ?? null) as number | null;
  const nextRaceRaw = nextRaceRes.data;
  const races2026Completed = (races2026CompletedRes.data ?? []) as Array<{ id: number; round: number }>;
  const races2026Ids = races2026Completed.map((r) => r.id);
  const totalRounds2026 = races2026Ids.length;

  // ── Latest race info (lightweight single-row lookup) ─────────────
  let latestRaceRound: number | null = null;
  let latestRaceYear: number | null = null;
  let latestRaceName: string | null = null;
  let latestRaceDate: string | null = null;
  let latestCircuitId: number | null = null;

  if (latestRaceId !== null) {
    const { data: raceInfo } = await supabase
      .from('races')
      .select('round, year, name, date, circuit_id')
      .eq('id', latestRaceId)
      .single();
    latestRaceRound  = (raceInfo?.round      ?? null) as number | null;
    latestRaceYear   = (raceInfo?.year       ?? null) as number | null;
    latestRaceName   = (raceInfo?.name       ?? null) as string | null;
    latestRaceDate   = (raceInfo?.date       ?? null) as string | null;
    latestCircuitId  = (raceInfo?.circuit_id ?? null) as number | null;
  }

  // ── Batch 2 ─────────────────────────────────────────────────────
  const [
    circuitRes,
    driverStandRes,
    pastCircuitRacesRes,
    lastRaceCircuitRes,
    lastRaceResultsRes,
    lastRacePitRes,
    statusRes,
    winners2026Res,
    allTimeDriverRes,
    allTimeConstructorRes,
    nextRaceQualiRes,
    poles2026Res,
    podiums2026Res,
    fastestLaps2026Res,
    constructorStandRes,
    leaderPerRound2026Res,
  ] = await Promise.all([
    nextRaceRaw
      ? supabase
          .from('circuits')
          .select('name, location, country, circuit_ref')
          .eq('id', nextRaceRaw.circuit_id as number)
          .single()
      : Promise.resolve({ data: null, error: null }),
    latestRaceId !== null
      ? supabase
          .from('driver_standings')
          .select('driver_id, position, points, wins')
          .eq('race_id', latestRaceId)
          .order('position', { ascending: true })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    nextRaceRaw
      ? supabase
          .from('races')
          .select('id, year')
          .eq('circuit_id', nextRaceRaw.circuit_id as number)
          .lte('date', today)
          .order('date', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as Array<{ id: number; year: number }>, error: null }),
    latestCircuitId !== null
      ? supabase
          .from('circuits')
          .select('name, circuit_ref')
          .eq('id', latestCircuitId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    latestRaceId !== null
      ? supabase
          .from('results')
          .select(
            'position, position_text, position_order, driver_id, constructor_id, laps, time, fastest_lap_time, rank, status_id'
          )
          .eq('race_id', latestRaceId)
          .order('position_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    latestRaceId !== null
      ? supabase
          .from('pit_stops')
          .select('driver_id, duration, milliseconds')
          .eq('race_id', latestRaceId)
          .not('milliseconds', 'is', null)
          .gt('milliseconds', 0)
          .order('milliseconds', { ascending: true })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('status').select('id, status'),
    races2026Ids.length > 0
      ? supabase
          .from('results')
          .select('driver_id, constructor_id, race_id')
          .eq('position', 1)
          .in('race_id', races2026Ids)
      : Promise.resolve({ data: [] as Array<{ driver_id: number; constructor_id: number; race_id: number }>, error: null }),
    supabase
      .from('driver_win_streaks')
      .select('driver_id, forename, surname, streak_len, end_year')
      .order('streak_len', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('constructor_win_streaks')
      .select('constructor_id, name, constructor_ref, streak_len, end_year')
      .order('streak_len', { ascending: false })
      .limit(1)
      .maybeSingle(),
    nextRaceRaw
      ? supabase
          .from('qualifying')
          .select('position, driver_id, constructor_id, q1, q2, q3')
          .eq('race_id', nextRaceRaw.id as number)
          .not('position', 'is', null)
          .order('position', { ascending: true })
          .limit(10)
      : Promise.resolve({
          data: [] as Array<{
            position: number;
            driver_id: number;
            constructor_id: number;
            q1: string | null;
            q2: string | null;
            q3: string | null;
          }>,
          error: null,
        }),
    races2026Ids.length > 0
      ? supabase
          .from('qualifying')
          .select('driver_id, race_id')
          .in('race_id', races2026Ids)
          .eq('position', 1)
      : Promise.resolve({ data: [] as Array<{ driver_id: number; race_id: number }>, error: null }),
    races2026Ids.length > 0
      ? supabase
          .from('results')
          .select('driver_id, constructor_id, race_id')
          .in('race_id', races2026Ids)
          .lte('position', 3)
          .not('position', 'is', null)
      : Promise.resolve({ data: [] as Array<{ driver_id: number; constructor_id: number; race_id: number }>, error: null }),
    races2026Ids.length > 0
      ? supabase
          .from('results')
          .select('driver_id, constructor_id, race_id')
          .in('race_id', races2026Ids)
          .eq('rank', 1)
      : Promise.resolve({ data: [] as Array<{ driver_id: number; constructor_id: number; race_id: number }>, error: null }),
    latestRaceId !== null
      ? supabase
          .from('constructor_standings')
          .select('constructor_id, points, position')
          .eq('race_id', latestRaceId)
          .order('position', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] as Array<{ constructor_id: number; points: number; position: number }>, error: null }),
    races2026Ids.length > 0
      ? supabase
          .from('driver_standings')
          .select('race_id, driver_id, points')
          .in('race_id', races2026Ids)
          .eq('position', 1)
      : Promise.resolve({ data: [] as Array<{ race_id: number; driver_id: number; points: number }>, error: null }),
  ]);

  // ── Build base lookup maps ───────────────────────────────────────
  const constructorMap = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      { name: c.name as string, constructor_ref: c.constructor_ref as string },
    ])
  );

  type LastRaceResult = {
    position: number | null;
    position_text: string;
    position_order: number;
    driver_id: number;
    constructor_id: number;
    laps: number;
    time: string | null;
    fastest_lap_time: string | null;
    rank: number | null;
    status_id: number;
  };
  const lastRaceResults = (lastRaceResultsRes.data ?? []) as LastRaceResult[];

  const resultConstructorMap = new Map(
    lastRaceResults.map((r) => [r.driver_id, r.constructor_id])
  );
  const statusMap = new Map(
    (statusRes.data ?? []).map((s) => [s.id as number, s.status as string])
  );

  type QualiRow = { position: number; driver_id: number; constructor_id: number; q1: string | null; q2: string | null; q3: string | null };
  const qualifyingRows = (nextRaceQualiRes.data ?? []) as QualiRow[];

  const driverIds = (driverStandRes.data ?? []).map((s) => s.driver_id as number);
  const lastRaceDriverIds = [...new Set(lastRaceResults.map((r) => r.driver_id))];
  const qualiDriverIds = qualifyingRows.map((q) => q.driver_id);
  const podium2026DriverIds = (podiums2026Res.data ?? []).map((r) => r.driver_id as number);
  const fl2026DriverIds = (fastestLaps2026Res.data ?? []).map((r) => r.driver_id as number);
  const allNeededDriverIds = [...new Set([...driverIds, ...lastRaceDriverIds, ...qualiDriverIds, ...podium2026DriverIds, ...fl2026DriverIds])];

  const pastCircuitRaces = (pastCircuitRacesRes.data ?? []) as Array<{ id: number; year: number }>;
  const pastCircuitRaceIds = pastCircuitRaces.map((r) => r.id);
  const lastPastRace = pastCircuitRaces[0] ?? null;

  // ── Batch 3: drivers + historical circuit stats + SVG fetches ────
  const nextCircuitRef = (circuitRes.data?.circuit_ref as string | undefined) ?? null;
  const lastCircuitRef = (lastRaceCircuitRes.data?.circuit_ref as string | undefined) ?? null;

  const [
    driversRes,
    lastWinnerResultRes,
    rankLapHomeRes,
    winnerLapsHomeRes,
    nextCircuitSvg,
    lastCircuitSvg,
  ] = await Promise.all([
    allNeededDriverIds.length
      ? supabase.from('drivers').select('id, forename, surname, code, number').in('id', allNeededDriverIds)
      : Promise.resolve({ data: [], error: null }),
    lastPastRace
      ? supabase
          .from('results')
          .select('driver_id, constructor_id')
          .eq('race_id', lastPastRace.id)
          .eq('position', 1)
          .single()
      : Promise.resolve({ data: null, error: null }),
    pastCircuitRaceIds.length > 0
      ? supabase
          .from('results')
          .select('fastest_lap_time, driver_id, race_id')
          .in('race_id', pastCircuitRaceIds)
          .eq('rank', 1)
          .not('fastest_lap_time', 'is', null)
          .neq('fastest_lap_time', '\\N')
          .gt('fastest_lap_time', '')
          .order('fastest_lap_time', { ascending: true })
          .limit(1)
      : Promise.resolve({
          data: [] as Array<{ fastest_lap_time: string; driver_id: number; race_id: number }>,
          error: null,
        }),
    pastCircuitRaceIds.length > 0
      ? supabase
          .from('results')
          .select('laps')
          .in('race_id', pastCircuitRaceIds)
          .eq('position', 1)
          .not('laps', 'is', null)
          .gt('laps', 0)
      : Promise.resolve({ data: [] as Array<{ laps: number }>, error: null }),
    nextCircuitRef ? fetchTrackPathData(nextCircuitRef) : Promise.resolve(null),
    lastCircuitRef ? fetchTrackPathData(lastCircuitRef) : Promise.resolve(null),
  ]);

  // ── Batch 4: historical circuit driver name lookups ──────────────
  const lastWinnerResult = lastWinnerResultRes.data as {
    driver_id: number;
    constructor_id: number;
  } | null;
  const rankLapHomeRow = (
    (rankLapHomeRes.data ?? []) as Array<{
      fastest_lap_time: string;
      driver_id: number;
      race_id: number;
    }>
  )[0] ?? null;

  // Seed homeDriverNameMap from already-fetched drivers
  const homeDriverNameMap = new Map<number, { forename: string; surname: string }>();
  for (const d of driversRes.data ?? []) {
    homeDriverNameMap.set(d.id as number, {
      forename: d.forename as string,
      surname: d.surname as string,
    });
  }

  // Extra lookup for historical circuit winners + qualifying drivers not in current grid
  const extraIds = new Set<number>();
  if (lastWinnerResult && !homeDriverNameMap.has(lastWinnerResult.driver_id))
    extraIds.add(lastWinnerResult.driver_id);
  if (rankLapHomeRow && !homeDriverNameMap.has(rankLapHomeRow.driver_id))
    extraIds.add(rankLapHomeRow.driver_id);
  for (const q of qualifyingRows) {
    if (!homeDriverNameMap.has(q.driver_id)) extraIds.add(q.driver_id);
  }

  if (extraIds.size > 0) {
    const { data: extraDrivers } = await supabase
      .from('drivers')
      .select('id, forename, surname')
      .in('id', [...extraIds]);
    for (const d of extraDrivers ?? []) {
      homeDriverNameMap.set(d.id as number, {
        forename: d.forename as string,
        surname: d.surname as string,
      });
    }
  }

  const winnerForename = lastWinnerResult
    ? (homeDriverNameMap.get(lastWinnerResult.driver_id)?.forename ?? null)
    : null;
  const winnerSurname = lastWinnerResult
    ? (homeDriverNameMap.get(lastWinnerResult.driver_id)?.surname ?? null)
    : null;

  // Standard laps — mode of winner laps at next circuit
  const lapsFreqHome = new Map<number, number>();
  for (const r of (winnerLapsHomeRes.data ?? []) as Array<{ laps: number }>) {
    if (r.laps > 0) lapsFreqHome.set(r.laps, (lapsFreqHome.get(r.laps) ?? 0) + 1);
  }
  const homeStandardLaps: number | null =
    lapsFreqHome.size > 0
      ? [...lapsFreqHome.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Rank-1 lap record for next circuit
  const rankLapHomeDriver = rankLapHomeRow
    ? (homeDriverNameMap.get(rankLapHomeRow.driver_id) ?? null)
    : null;
  const pastCircuitRacesById = new Map(pastCircuitRaces.map((r) => [r.id, r.year]));
  const rankLapHomeYear = rankLapHomeRow
    ? (pastCircuitRacesById.get(rankLapHomeRow.race_id) ?? null)
    : null;
  const homeCircuitLapRecord: HomeNextRace['circuit_lap_record'] =
    rankLapHomeRow && rankLapHomeDriver && rankLapHomeYear
      ? {
          time: rankLapHomeRow.fastest_lap_time,
          forename: rankLapHomeDriver.forename,
          surname: rankLapHomeDriver.surname,
          year: rankLapHomeYear,
        }
      : null;

  // ── Assemble top 10 drivers ──────────────────────────────────────
  const driverMap = new Map(
    (driversRes.data ?? []).map((d) => [
      d.id as number,
      {
        forename: d.forename as string,
        surname:  d.surname as string,
        code:     (d.code   as string | null) ?? null,
        number:   (d.number as number | null) ?? null,
      },
    ])
  );

  const driverRefMap = new Map(
    (driversListRes.data ?? []).map((d) => [d.id as number, d.driver_ref as string])
  );

  const driverCareerMap = new Map(
    (driverStatsRes.data ?? []).map((s) => [
      s.driver_id as number,
      {
        podiums: (s.podiums as number) ?? 0,
        wins: s.wins as number,
        races: s.races as number,
        nationality: (s.nationality as string | null) ?? '',
      },
    ])
  );

  const poles2026Map = new Map<number, number>();
  for (const q of (poles2026Res.data ?? []) as Array<{ driver_id: number }>) {
    poles2026Map.set(q.driver_id, (poles2026Map.get(q.driver_id) ?? 0) + 1);
  }

  const topDrivers: HomeDriverRow[] = (driverStandRes.data ?? []).flatMap((s) => {
    const d = driverMap.get(s.driver_id as number);
    if (!d) return [];
    const cid = resultConstructorMap.get(s.driver_id as number);
    const c = cid !== undefined ? constructorMap.get(cid) : undefined;
    const career = driverCareerMap.get(s.driver_id as number);
    return [
      {
        driver_id: s.driver_id as number,
        driver_ref: driverRefMap.get(s.driver_id as number) ?? '',
        position: s.position as number,
        forename: d.forename,
        surname:  d.surname,
        code:     d.code,
        number:   d.number,
        points:   s.points as number,
        wins: s.wins as number,
        constructor_ref: c?.constructor_ref ?? '',
        constructor_name: c?.name ?? '',
        podiums: career?.podiums ?? 0,
        win_rate: career && career.races > 0 ? career.wins / career.races : 0,
        nationality: career?.nationality ?? '',
        poles_2026: poles2026Map.get(s.driver_id as number) ?? 0,
      },
    ];
  });

  // ── Assemble next race ───────────────────────────────────────────
  const lastWinnerConstructorId = lastWinnerResult?.constructor_id ?? null;
  const lastWinner: HomeNextRace['last_winner'] =
    lastPastRace && lastWinnerResult && winnerForename && winnerSurname
      ? {
          year: lastPastRace.year,
          forename: winnerForename,
          surname: winnerSurname,
          constructor: constructorMap.get(lastWinnerConstructorId!)?.name ?? '—',
        }
      : null;

  // ── Assemble qualifying grid ─────────────────────────────────────
  const qualifyingGrid: HomeNextRace['qualifying_grid'] =
    qualifyingRows.length > 0
      ? qualifyingRows.map((q) => {
          const d = homeDriverNameMap.get(q.driver_id);
          const c = constructorMap.get(q.constructor_id);
          const rawTime = q.q3 || q.q2 || q.q1 || null;
          const qTime =
            rawTime && rawTime !== '\\N' && rawTime.trim() !== '' ? rawTime : null;
          return {
            position: q.position,
            forename: d?.forename ?? '?',
            surname: d?.surname ?? '?',
            constructor_ref: c?.constructor_ref ?? '',
            constructor_name: c?.name ?? '?',
            q_time: qTime,
          };
        })
      : null;

  let nextRace: HomeNextRace | null = null;
  if (nextRaceRaw && circuitRes.data) {
    nextRace = {
      round: nextRaceRaw.round as number,
      name: nextRaceRaw.name as string,
      date: nextRaceRaw.date as string,
      circuit_name: circuitRes.data.name as string,
      location: circuitRes.data.location as string,
      country: circuitRes.data.country as string,
      circuit_ref: circuitRes.data.circuit_ref as string,
      days_remaining: daysUntil(nextRaceRaw.date as string),
      last_winner: lastWinner,
      circuit_laps: homeStandardLaps,
      circuit_lap_record: homeCircuitLapRecord,
      circuit_svg: nextCircuitSvg,
      qualifying_grid: qualifyingGrid,
    };
  }

  // ── Assemble last race data ──────────────────────────────────────
  let lastRaceData: HomeLastRaceData | null = null;
  if (latestRaceId !== null && latestRaceName && latestRaceDate && lastRaceCircuitRes.data) {
    const circuitName = lastRaceCircuitRes.data.name as string;
    const circuitRef = lastRaceCircuitRes.data.circuit_ref as string;

    const podium = lastRaceResults
      .filter((r) => r.position !== null && (r.position as number) <= 3)
      .slice(0, 3)
      .map((r) => ({
        position: r.position as number,
        forename: driverMap.get(r.driver_id)?.forename ?? '?',
        surname: driverMap.get(r.driver_id)?.surname ?? '?',
        constructor_name: constructorMap.get(r.constructor_id)?.name ?? '?',
        constructor_ref: constructorMap.get(r.constructor_id)?.constructor_ref ?? '',
        time: r.time ?? null,
      }));

    const fastestLapResult = lastRaceResults.find((r) => r.rank === 1);
    const fastestLap = fastestLapResult
      ? {
          forename: driverMap.get(fastestLapResult.driver_id)?.forename ?? '?',
          surname: driverMap.get(fastestLapResult.driver_id)?.surname ?? '?',
          time: fastestLapResult.fastest_lap_time ?? '—',
        }
      : null;

    const fastestPitRow = (lastRacePitRes.data ?? [])[0] ?? null;
    const fastestPit = fastestPitRow
      ? {
          forename: driverMap.get(fastestPitRow.driver_id as number)?.forename ?? '?',
          surname: driverMap.get(fastestPitRow.driver_id as number)?.surname ?? '?',
          constructor_name:
            constructorMap.get(
              resultConstructorMap.get(fastestPitRow.driver_id as number) ?? -1
            )?.name ?? '?',
          duration: fastestPitRow.duration as string,
        }
      : null;

    const retirements = lastRaceResults
      .filter((r) => r.position_text === 'R')
      .map((r) => ({
        forename: driverMap.get(r.driver_id)?.forename ?? '?',
        surname: driverMap.get(r.driver_id)?.surname ?? '?',
        constructor_name: constructorMap.get(r.constructor_id)?.name ?? '?',
        lap: r.laps ?? 0,
        status: statusMap.get(r.status_id) ?? 'Retired',
      }));

    lastRaceData = {
      race_id: latestRaceId,
      round: latestRaceRound ?? 0,
      year: latestRaceYear ?? 0,
      name: latestRaceName,
      date: latestRaceDate,
      circuit_name: circuitName,
      circuit_ref: circuitRef,
      circuit_svg: lastCircuitSvg,
      podium,
      fastest_lap: fastestLap,
      fastest_pit: fastestPit,
      retirements,
    };
  }

  // ── Assemble driver selector list ────────────────────────────────
  const driversNameMap = new Map(
    (driversListRes.data ?? []).map((d) => [
      d.id as number,
      {
        driver_ref: d.driver_ref as string,
        forename: d.forename as string,
        surname: d.surname as string,
      },
    ])
  );

  const allDrivers: DriverSelectorRow[] = (driverStatsRes.data ?? []).flatMap((s) => {
    const d = driversNameMap.get(s.driver_id as number);
    if (!d) return [];
    return [
      {
        driver_id: s.driver_id as number,
        driver_ref: d.driver_ref,
        forename: d.forename,
        surname: d.surname,
        nationality: s.nationality as string,
        wins: s.wins as number,
      },
    ];
  });

  // ── Assemble streaks ─────────────────────────────────────────────
  type Winner2026 = { driver_id: number; constructor_id: number; race_id: number };
  const raceRoundMap2026 = new Map(races2026Completed.map((r) => [r.id, r.round]));
  const winners2026Sorted = ((winners2026Res.data ?? []) as Winner2026[])
    .slice()
    .sort((a, b) => (raceRoundMap2026.get(a.race_id) ?? 0) - (raceRoundMap2026.get(b.race_id) ?? 0));
  const winners2026Rev = [...winners2026Sorted].reverse();

  let activeDriverStreak = 0;
  const lastDriverWinnerId = winners2026Rev[0]?.driver_id ?? null;
  if (lastDriverWinnerId !== null) {
    for (const w of winners2026Rev) {
      if (w.driver_id === lastDriverWinnerId) activeDriverStreak++;
      else break;
    }
  }

  let activeConstructorStreak = 0;
  const lastConstrWinnerId = winners2026Rev[0]?.constructor_id ?? null;
  if (lastConstrWinnerId !== null) {
    for (const w of winners2026Rev) {
      if (w.constructor_id === lastConstrWinnerId) activeConstructorStreak++;
      else break;
    }
  }

  const streaksData: HomeStreaksData | null =
    winners2026Sorted.length > 0
      ? {
          totalRounds2026,
          driverActive: lastDriverWinnerId !== null
            ? {
                driver_id: lastDriverWinnerId,
                forename:
                  driverMap.get(lastDriverWinnerId)?.forename ??
                  homeDriverNameMap.get(lastDriverWinnerId)?.forename ?? '?',
                surname:
                  driverMap.get(lastDriverWinnerId)?.surname ??
                  homeDriverNameMap.get(lastDriverWinnerId)?.surname ?? '?',
                constructor_ref:
                  constructorMap.get(winners2026Rev[0].constructor_id)?.constructor_ref ?? '',
                streak: activeDriverStreak,
              }
            : null,
          constructorActive: lastConstrWinnerId !== null
            ? {
                constructor_id: lastConstrWinnerId,
                name: constructorMap.get(lastConstrWinnerId)?.name ?? '?',
                constructor_ref: constructorMap.get(lastConstrWinnerId)?.constructor_ref ?? '',
                streak: activeConstructorStreak,
              }
            : null,
          driverAllTime: allTimeDriverRes.data
            ? {
                forename: allTimeDriverRes.data.forename as string,
                surname:  allTimeDriverRes.data.surname as string,
                streak:   allTimeDriverRes.data.streak_len as number,
                year:     allTimeDriverRes.data.end_year as number,
              }
            : null,
          constructorAllTime: allTimeConstructorRes.data
            ? {
                name:   allTimeConstructorRes.data.name as string,
                streak: allTimeConstructorRes.data.streak_len as number,
                year:   allTimeConstructorRes.data.end_year as number,
              }
            : null,
        }
      : null;

  // ── Assemble form guide (podium streak + fastest lap streak) ────
  type Podium2026Row = { driver_id: number; constructor_id: number; race_id: number };
  const podiums2026 = (podiums2026Res.data ?? []) as Podium2026Row[];
  const fl2026 = (fastestLaps2026Res.data ?? []) as Podium2026Row[];

  function computeActiveStreak(
    rows: Podium2026Row[],
    roundMap: Map<number, number>,
    racesDesc: Array<{ id: number; round: number }>
  ): { driver_id: number; constructor_id: number; streak: number } | null {
    if (racesDesc.length === 0 || rows.length === 0) return null;
    const byRound = new Map<number, { driver_id: number; constructor_id: number }[]>();
    for (const r of rows) {
      const rnd = roundMap.get(r.race_id) ?? 0;
      if (!byRound.has(rnd)) byRound.set(rnd, []);
      byRound.get(rnd)!.push({ driver_id: r.driver_id, constructor_id: r.constructor_id });
    }
    // Find the driver with the longest current streak counting back from last race
    const allDriverIds = [...new Set(rows.map((r) => r.driver_id))];
    let best: { driver_id: number; constructor_id: number; streak: number } | null = null;
    for (const did of allDriverIds) {
      let streak = 0;
      for (const race of racesDesc) {
        const inRace = byRound.get(race.round)?.some((r) => r.driver_id === did);
        if (inRace) streak++;
        else break;
      }
      if (streak > 0 && (!best || streak > best.streak)) {
        const lastCid = [...rows].reverse().find((r) => r.driver_id === did)?.constructor_id ?? 0;
        best = { driver_id: did, constructor_id: lastCid, streak };
      }
    }
    return best;
  }

  const races2026Desc = [...races2026Completed].sort((a, b) => b.round - a.round);
  const podiumStreakRaw = computeActiveStreak(podiums2026, raceRoundMap2026, races2026Desc);
  const flStreakRaw = computeActiveStreak(fl2026, raceRoundMap2026, races2026Desc);

  const formGuideData: import('@/lib/types').HomeFormGuideData = {
    podiumStreak: podiumStreakRaw
      ? {
          driver_id: podiumStreakRaw.driver_id,
          forename: homeDriverNameMap.get(podiumStreakRaw.driver_id)?.forename ?? '?',
          surname: homeDriverNameMap.get(podiumStreakRaw.driver_id)?.surname ?? '?',
          constructor_ref: constructorMap.get(podiumStreakRaw.constructor_id)?.constructor_ref ?? '',
          streak: podiumStreakRaw.streak,
        }
      : null,
    fastestLapStreak: flStreakRaw
      ? {
          driver_id: flStreakRaw.driver_id,
          forename: homeDriverNameMap.get(flStreakRaw.driver_id)?.forename ?? '?',
          surname: homeDriverNameMap.get(flStreakRaw.driver_id)?.surname ?? '?',
          constructor_ref: constructorMap.get(flStreakRaw.constructor_id)?.constructor_ref ?? '',
          streak: flStreakRaw.streak,
        }
      : null,
  };

  // ── Assemble season shape ────────────────────────────────────────
  const uniqueWinners = new Set(winners2026Sorted.map((w) => w.driver_id)).size;

  type Pole2026Row = { driver_id: number; race_id: number };
  const poles2026WithRace = (poles2026Res.data ?? []) as Pole2026Row[];
  const polesMap2026 = new Map(poles2026WithRace.map((p) => [p.race_id, p.driver_id]));
  const winners2026Map = new Map(winners2026Sorted.map((w) => [w.race_id, w.driver_id]));
  let poleWins = 0;
  for (const [raceId, poleDid] of polesMap2026) {
    if (winners2026Map.get(raceId) === poleDid) poleWins++;
  }
  const poleToWinPct = polesMap2026.size > 0 ? Math.round((poleWins / polesMap2026.size) * 100) : 0;

  type LeaderRow = { race_id: number; driver_id: number; points: number };
  const leaderPerRound2026 = (leaderPerRound2026Res.data ?? []) as LeaderRow[];
  const leaderPerRoundSorted = leaderPerRound2026
    .map((l) => ({ ...l, round: raceRoundMap2026.get(l.race_id) ?? 0 }))
    .sort((a, b) => a.round - b.round);
  const currentLeaderId = topDrivers[0]?.driver_id ?? null;
  let roundsLedByLeader = 0;
  if (currentLeaderId !== null) {
    for (const l of [...leaderPerRoundSorted].reverse()) {
      if (l.driver_id === currentLeaderId) roundsLedByLeader++;
      else break;
    }
  }
  const leaderSurname = topDrivers[0]?.surname ?? '';

  const seasonShapeData: import('@/lib/types').HomeSeasonShapeData = {
    totalRaces: totalRounds2026,
    uniqueWinners,
    poleToWinPct,
    roundsLedByLeader,
    leaderSurname,
  };

  // ── Assemble championship gap ────────────────────────────────────
  const p1Driver = topDrivers[0] ?? null;
  const p2Driver = topDrivers[1] ?? null;

  type ConstrStandRow = { constructor_id: number; points: number; position: number };
  const constrStands = (constructorStandRes.data ?? []) as ConstrStandRow[];
  const p1Constr = constrStands.find((c) => c.position === 1) ?? null;
  const p2Constr = constrStands.find((c) => c.position === 2) ?? null;

  const championshipGapData: import('@/lib/types').HomeChampionshipGapData = {
    driver:
      p1Driver && p2Driver
        ? {
            p1: { surname: p1Driver.surname, constructor_ref: p1Driver.constructor_ref, points: p1Driver.points },
            p2: { surname: p2Driver.surname, constructor_ref: p2Driver.constructor_ref, points: p2Driver.points },
            gap: p1Driver.points - p2Driver.points,
          }
        : null,
    constructor:
      p1Constr && p2Constr
        ? {
            p1: {
              name: constructorMap.get(p1Constr.constructor_id)?.name ?? '?',
              constructor_ref: constructorMap.get(p1Constr.constructor_id)?.constructor_ref ?? '',
              points: p1Constr.points,
            },
            p2: {
              name: constructorMap.get(p2Constr.constructor_id)?.name ?? '?',
              constructor_ref: constructorMap.get(p2Constr.constructor_id)?.constructor_ref ?? '',
              points: p2Constr.points,
            },
            gap: p1Constr.points - p2Constr.points,
          }
        : null,
  };

  return {
    nextRace,
    topDrivers,
    lastRaceData,
    allDrivers,
    currentRound: latestRaceRound,
    currentYear: latestRaceYear,
    streaksData,
    formGuideData,
    seasonShapeData,
    championshipGapData,
  };
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function HomePage() {
  const {
    nextRace, topDrivers, lastRaceData, currentRound, currentYear,
    streaksData, formGuideData, seasonShapeData, championshipGapData,
  } = await getHomeData();

  return (
    <HomeExperience
      nextRace={nextRace}
      lastRace={lastRaceData}
      topDrivers={topDrivers}
      streaksData={streaksData}
      formGuideData={formGuideData}
      seasonShapeData={seasonShapeData}
      championshipGapData={championshipGapData}
      round={currentRound ?? 0}
      year={currentYear ?? 2026}
    />
  );
}
