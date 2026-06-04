export const revalidate = 3600;

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import NextRaceCard from '@/components/home/NextRaceCard';
import Top10Drivers from '@/components/home/Top10Drivers';
import ConstructorOfTheDay from '@/components/home/ConstructorOfTheDay';
import Top5Constructors from '@/components/home/Top5Constructors';
import CompareScorecardsSection from '@/components/home/CompareScorecardsSection';
import type {
  HomeNextRace,
  HomeDriverRow,
  HomeConstructorOfDay,
  HomeConstructorRow,
  DriverSelectorRow,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

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
  constructorOfDay: HomeConstructorOfDay | null;
  top5Constructors: HomeConstructorRow[];
  allDrivers: DriverSelectorRow[];
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: race data + constructors + driver selector list (all parallel)
  const [latestRaceRes, nextRaceRes, constructorsRes, constructorStatsRes, driverStatsRes, driversListRes] = await Promise.all([
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('races')
      .select('id, round, name, date, circuit_id')
      .gt('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('constructors')
      .select('id, name, constructor_ref, nationality'),
    supabase
      .from('constructor_stats')
      .select('constructor_id, first_year, last_year, wins, races'),
    supabase
      .from('driver_stats')
      .select('driver_id, wins, nationality')
      .order('wins', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, driver_ref, forename, surname'),
  ]);

  const latestRaceId = (latestRaceRes.data?.id ?? null) as number | null;
  const nextRaceRaw = nextRaceRes.data;

  // Batch 2: circuit for next race + standings + all past races at next circuit
  const [circuitRes, driverStandRes, constStandRes, pastCircuitRacesRes] = await Promise.all([
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
    latestRaceId !== null
      ? supabase
          .from('constructor_standings')
          .select('constructor_id, position, points, wins')
          .eq('race_id', latestRaceId)
          .order('position', { ascending: true })
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
  ]);

  const driverIds = (driverStandRes.data ?? []).map((s) => s.driver_id as number);
  const constStandData = (constStandRes.data ?? []) as Array<{
    constructor_id: number;
    position: number;
    points: number;
    wins: number;
  }>;

  const pastCircuitRaces = (pastCircuitRacesRes.data ?? []) as Array<{ id: number; year: number }>;
  const pastCircuitRaceIds = pastCircuitRaces.map((r) => r.id);
  const lastPastRace = pastCircuitRaces[0] ?? null;

  // Batch 3: driver details + standings results + last winner + rank-1 lap + winner laps (parallel)
  const [driversRes, resultsRes, lastWinnerResultRes, rankLapHomeRes, winnerLapsHomeRes] = await Promise.all([
    driverIds.length
      ? supabase
          .from('drivers')
          .select('id, forename, surname, code')
          .in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length && latestRaceId !== null
      ? supabase
          .from('results')
          .select('driver_id, constructor_id')
          .eq('race_id', latestRaceId)
          .in('driver_id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    lastPastRace
      ? supabase
          .from('results')
          .select('driver_id, constructor_id')
          .eq('race_id', lastPastRace.id)
          .eq('position', 1)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Official fastest lap (rank=1), best time across all past races at this circuit
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
      : Promise.resolve({ data: [] as Array<{ fastest_lap_time: string; driver_id: number; race_id: number }>, error: null }),
    // Winner laps — to compute most-common race distance (mode)
    pastCircuitRaceIds.length > 0
      ? supabase
          .from('results')
          .select('laps')
          .in('race_id', pastCircuitRaceIds)
          .eq('position', 1)
          .not('laps', 'is', null)
          .gt('laps', 0)
      : Promise.resolve({ data: [] as Array<{ laps: number }>, error: null }),
  ]);

  // Batch 4: driver names for last winner + rank-1 lap holder (one query)
  const lastWinnerResult = lastWinnerResultRes.data as {
    driver_id: number;
    constructor_id: number;
  } | null;

  const rankLapHomeRow = ((rankLapHomeRes.data ?? []) as Array<{
    fastest_lap_time: string;
    driver_id: number;
    race_id: number;
  }>)[0] ?? null;

  const driverIdsToFetch = new Set<number>();
  if (lastWinnerResult) driverIdsToFetch.add(lastWinnerResult.driver_id);
  if (rankLapHomeRow) driverIdsToFetch.add(rankLapHomeRow.driver_id);

  const homeDriverNameMap = new Map<number, { forename: string; surname: string }>();
  if (driverIdsToFetch.size > 0) {
    const { data: homeDrivers } = await supabase
      .from('drivers')
      .select('id, forename, surname')
      .in('id', [...driverIdsToFetch]);
    for (const d of homeDrivers ?? []) {
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

  // Standard laps — mode of winner laps at this circuit
  const lapsFreqHome = new Map<number, number>();
  for (const r of (winnerLapsHomeRes.data ?? []) as Array<{ laps: number }>) {
    if (r.laps > 0) lapsFreqHome.set(r.laps, (lapsFreqHome.get(r.laps) ?? 0) + 1);
  }
  const homeStandardLaps: number | null =
    lapsFreqHome.size > 0 ? [...lapsFreqHome.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

  // Rank-1 lap record for this circuit
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

  // ── Build lookup maps ──────────────────────────────────────────

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

  const statsMap = new Map(
    (constructorStatsRes.data ?? []).map((s) => [
      s.constructor_id as number,
      {
        first_year: s.first_year as number,
        last_year: s.last_year as number,
        wins: s.wins as number,
        races: s.races as number,
      },
    ])
  );

  const driverMap = new Map(
    (driversRes.data ?? []).map((d) => [
      d.id as number,
      {
        forename: d.forename as string,
        surname: d.surname as string,
        code: (d.code as string | null) ?? null,
      },
    ])
  );

  // driver_id → constructor_id from results at latest race
  const resultConstructorMap = new Map(
    (resultsRes.data ?? []).map((r) => [r.driver_id as number, r.constructor_id as number])
  );

  // ── Assemble top 10 drivers ────────────────────────────────────
  const topDrivers: HomeDriverRow[] = (driverStandRes.data ?? []).flatMap((s) => {
    const d = driverMap.get(s.driver_id as number);
    if (!d) return [];
    const cid = resultConstructorMap.get(s.driver_id as number);
    const c = cid !== undefined ? constructorMap.get(cid) : undefined;
    return [
      {
        driver_id: s.driver_id as number,
        position: s.position as number,
        forename: d.forename,
        surname: d.surname,
        code: d.code,
        points: s.points as number,
        wins: s.wins as number,
        constructor_ref: c?.constructor_ref ?? '',
        constructor_name: c?.name ?? '',
      },
    ];
  });

  // ── Assemble top 5 constructors ────────────────────────────────
  const top5Constructors: HomeConstructorRow[] = constStandData.slice(0, 5).flatMap((s) => {
    const c = constructorMap.get(s.constructor_id);
    if (!c) return [];
    return [
      {
        constructor_id: s.constructor_id,
        constructor_ref: c.constructor_ref,
        name: c.name,
        position: s.position,
        points: s.points,
        wins: s.wins,
      },
    ];
  });

  // ── Constructor of the Day (seeded by date, 2026-active only) ──
  const active2026Ids = new Set(constStandData.map((s) => s.constructor_id));
  const activeSorted: HomeConstructorOfDay[] = Array.from(active2026Ids)
    .flatMap((id) => {
      const c = constructorMap.get(id);
      const s = statsMap.get(id);
      if (!c || !s) return [];
      return [
        {
          constructor_id: id,
          constructor_ref: c.constructor_ref,
          name: c.name,
          nationality: c.nationality,
          races: s.races,
          wins: s.wins,
          first_year: s.first_year,
          last_year: s.last_year,
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // deterministic ordering

  const seed = new Date().toDateString();
  const constructorOfDay = activeSorted.length > 0
    ? activeSorted[hashCode(seed) % activeSorted.length]
    : null;

  // ── Next race ──────────────────────────────────────────────────
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
      circuit_length_km: null,
      circuit_laps: homeStandardLaps,
      circuit_lap_record: homeCircuitLapRecord,
    };
  }

  // ── Assemble driver selector list ─────────────────────────────
  const driversNameMap = new Map(
    (driversListRes.data ?? []).map((d) => [
      d.id as number,
      { driver_ref: d.driver_ref as string, forename: d.forename as string, surname: d.surname as string },
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

  return { nextRace, topDrivers, constructorOfDay, top5Constructors, allDrivers };
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function HomePage() {
  const [{ nextRace, topDrivers, constructorOfDay, top5Constructors, allDrivers }, t] = await Promise.all([
    getHomeData(),
    getTranslations('hub.home'),
  ]);

  return (
    <main className="bg-bg min-h-[calc(100vh-3rem)]">

      {/* ── Page header strip ──────────────────────────────── */}
      <div className="h-8 px-4 md:px-6 border-b border-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          [ HUB ] · VOL.01 · RD.09 · 2026
        </span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] hidden sm:block">
          ⬤ LIVE
        </span>
      </div>

      {/* ── 3-column grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_320px] gap-4 md:gap-6 p-4 md:p-6">

        {/* Left — Next Race Card */}
        <div>
          <NextRaceCard race={nextRace} />
        </div>

        {/* Center — Top 10 Drivers */}
        <div>
          {/* Section header ASCII */}
          <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-3">
            01 · {t('top10').toUpperCase()}
          </p>
          <Top10Drivers drivers={topDrivers} />
        </div>

        {/* Right — Constructor of the Day + Top 5 Constructors */}
        <div className="flex flex-col gap-4">
          <ConstructorOfTheDay constructor={constructorOfDay} />
          <Top5Constructors constructors={top5Constructors} />
        </div>

      </div>

      {/* ── 03 · Compare Scorecards ────────────────────────── */}
      <div className="border-t border-border mt-2 pt-6">
        <CompareScorecardsSection allDrivers={allDrivers} />
      </div>

      {/* ── Footer ASCII ───────────────────────────────────── */}
      <div className="px-4 md:px-6 pb-6 pt-2">
        <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] text-center">
          © PADDOCKINTEL · MMXXVI · ⬤ LIVE
        </p>
      </div>

    </main>
  );
}
