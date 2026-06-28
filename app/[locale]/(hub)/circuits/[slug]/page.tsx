import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { fetchTrackPathData } from '@/lib/trackSvg';
import CircuitDetailExperience from '@/components/circuits/kinetic/CircuitDetailExperience';
import type { DriverSelectorRow } from '@/lib/types';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const parts = t.split(':');
  if (parts.length !== 2) return Infinity;
  const ms = parseInt(parts[0], 10) * 60000 + parseFloat(parts[1]) * 1000;
  return isNaN(ms) ? Infinity : ms;
}

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('circuits').select('circuit_ref');
  const slugs = (data ?? []).map((c) => c.circuit_ref as string).filter(Boolean);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('circuits')
    .select('name, location, country')
    .eq('circuit_ref', slug)
    .single();
  if (!data) return { title: 'Circuit — PaddockIntel' };
  const name = data.name as string;
  const location = data.location as string;
  const country = data.country as string;
  return {
    title: `${name} — PaddockIntel`,
    description: `Full race history, lap records, and statistics for ${name} in ${location}, ${country}.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CircuitDetailPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const t = await getTranslations('circuitDetail');
  const supabase = createClient();

  // Batch 1 — circuit by slug
  const { data: circuitRaw } = await supabase
    .from('circuits')
    .select('id, name, location, country, lat, lng, circuit_ref')
    .eq('circuit_ref', slug)
    .single();

  if (!circuitRaw) notFound();

  const circuit = {
    id: circuitRaw.id as number,
    name: circuitRaw.name as string,
    location: circuitRaw.location as string,
    country: circuitRaw.country as string,
    lat: circuitRaw.lat as number,
    lng: circuitRaw.lng as number,
    circuit_ref: circuitRaw.circuit_ref as string,
  };

  // Batch 2 — all races at this circuit + track SVG (parallel)
  const [{ data: racesRaw }, trackPathData] = await Promise.all([
    supabase
      .from('races')
      .select('id, year, round, name, date')
      .eq('circuit_id', circuit.id)
      .order('year', { ascending: true }),
    fetchTrackPathData(circuit.circuit_ref),
  ]);

  const races = racesRaw ?? [];
  const raceIds = races.map((r) => r.id as number);
  const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));

  const years = races.map((r) => r.year as number);
  const firstYear = years.length ? Math.min(...years) : null;
  const totalRaces = races.length;

  // 2026 race for section 05
  const race2026 = races.find((r) => (r.year as number) === 2026);
  let nextRace: { name: string; round: number; date: string; daysAway: number } | null = null;
  if (race2026?.date) {
    const today = new Date();
    const raceDate = new Date(race2026.date as string);
    const daysAway = Math.round((raceDate.getTime() - today.getTime()) / 86400000);
    nextRace = {
      name: race2026.name as string,
      round: race2026.round as number,
      date: race2026.date as string,
      daysAway,
    };
  }

  // No-races early return
  if (!raceIds.length) {
    return (
      <main className="flex flex-col">
        <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
          <Link href="/circuits" className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150">
            {t('breadcrumb.circuits')}
          </Link>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">{circuit.name}</span>
        </div>
        <div className="px-6 pt-8 pb-7">
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">{t('hero.label')}</p>
          <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">{circuit.name}</h1>
          <p className="text-[14px] text-text-2 mb-1">{circuit.location} · {circuit.country}</p>
          <p className="font-mono text-[12px] text-text-3">{formatCoord(circuit.lat, circuit.lng)}</p>
        </div>
        <div className="px-6 py-12 border-t border-border">
          <p className="font-mono text-[13px] text-text-3">{t('noData')}</p>
        </div>
      </main>
    );
  }

  // Batch 3 — race winners + all fastest laps + rank-1 lap record + winner laps (parallel)
  const [winnersRaw, fastLapsRaw, rankLapRes, winnerLapsRes] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, driver_id, constructor_id')
      .in('race_id', raceIds)
      .eq('position', 1),
    supabase
      .from('results')
      .select('race_id, driver_id, fastest_lap_time')
      .in('race_id', raceIds)
      .not('fastest_lap_time', 'is', null)
      .neq('fastest_lap_time', '\\N')
      .gt('fastest_lap_time', ''),
    // Official fastest lap (rank=1) ordered by time ASC — gives all-time record holder
    supabase
      .from('results')
      .select('fastest_lap_time, driver_id, race_id')
      .in('race_id', raceIds)
      .eq('rank', 1)
      .not('fastest_lap_time', 'is', null)
      .neq('fastest_lap_time', '\\N')
      .gt('fastest_lap_time', '')
      .order('fastest_lap_time', { ascending: true })
      .limit(1),
    // Winner laps — used to compute the most-common race distance
    supabase
      .from('results')
      .select('laps')
      .in('race_id', raceIds)
      .eq('position', 1)
      .not('laps', 'is', null)
      .gt('laps', 0),
  ]);

  const winners = winnersRaw.data ?? [];
  const fastLaps = fastLapsRaw.data ?? [];

  // Best (fastest) lap per race_id
  const bestLapByRace = new Map<number, { driverId: number; time: string; ms: number }>();
  for (const fl of fastLaps) {
    const raceId = fl.race_id as number;
    const ms = parseTime(fl.fastest_lap_time as string);
    if (!isFinite(ms)) continue;
    const cur = bestLapByRace.get(raceId);
    if (!cur || ms < cur.ms) {
      bestLapByRace.set(raceId, {
        driverId: fl.driver_id as number,
        time: fl.fastest_lap_time as string,
        ms,
      });
    }
  }

  // Collect all driver + constructor IDs (include rank-1 lap holder)
  const winnerDriverIds = winners.map((w) => w.driver_id as number);
  const winnerConstructorIds = winners.map((w) => w.constructor_id as number);
  const lapDriverIds = [...bestLapByRace.values()].map((v) => v.driverId);
  const rankLapRow = (rankLapRes.data ?? [])[0] as
    | { fastest_lap_time: string; driver_id: number; race_id: number }
    | undefined;
  const rankLapDriverId = rankLapRow?.driver_id ?? null;

  const allDriverIds = [
    ...new Set([
      ...winnerDriverIds,
      ...lapDriverIds,
      ...(rankLapDriverId ? [rankLapDriverId] : []),
    ]),
  ];
  const allConstructorIds = [...new Set(winnerConstructorIds)];

  // Batch 4 — driver + constructor names (parallel)
  const [driversRaw, constructorsRaw] = await Promise.all([
    allDriverIds.length
      ? supabase.from('drivers').select('id, forename, surname').in('id', allDriverIds)
      : Promise.resolve({ data: [] as Array<{ id: unknown; forename: unknown; surname: unknown }> }),
    allConstructorIds.length
      ? supabase.from('constructors').select('id, name').in('id', allConstructorIds)
      : Promise.resolve({ data: [] as Array<{ id: unknown; name: unknown }> }),
  ]);

  const driverMap = new Map(
    (driversRaw.data ?? []).map((d) => [
      d.id as number,
      { forename: d.forename as string, surname: d.surname as string },
    ])
  );
  const constructorMap = new Map(
    (constructorsRaw.data ?? []).map((c) => [c.id as number, c.name as string])
  );

  // ─── Assemble: rank-1 lap record for meta strip ──────────────────────────
  const rankLapRecord: { time: string; forename: string; surname: string; year: number } | null =
    (() => {
      if (!rankLapRow) return null;
      const d = driverMap.get(rankLapRow.driver_id);
      const year = raceYearMap.get(rankLapRow.race_id);
      if (!d || !year) return null;
      return { time: rankLapRow.fastest_lap_time, forename: d.forename, surname: d.surname, year };
    })();

  // ─── Assemble: standard laps (mode of position-1 laps) ──────────────────
  const lapsFreq = new Map<number, number>();
  for (const r of winnerLapsRes.data ?? []) {
    const l = r.laps as number;
    if (l > 0) lapsFreq.set(l, (lapsFreq.get(l) ?? 0) + 1);
  }
  const standardLaps: number | null =
    lapsFreq.size > 0 ? [...lapsFreq.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

  // ─── Assemble: winners table (most recent first) ─────────────────────────

  const winnerRows = winners
    .flatMap((w) => {
      const year = raceYearMap.get(w.race_id as number);
      const driver = driverMap.get(w.driver_id as number);
      const constructor = constructorMap.get(w.constructor_id as number);
      if (!year || !driver || !constructor) return [];
      const bestLap = bestLapByRace.get(w.race_id as number);
      return [{ year, forename: driver.forename, surname: driver.surname, constructor, fastestLap: bestLap?.time ?? null }];
    })
    .sort((a, b) => b.year - a.year);

  // ─── Assemble: decade dominance ─────────────────────────────────────────

  const decadeRaceCount = new Map<number, number>();
  for (const year of years) {
    const d = Math.floor(year / 10) * 10;
    decadeRaceCount.set(d, (decadeRaceCount.get(d) ?? 0) + 1);
  }
  const decadeConWins = new Map<number, Map<string, number>>();
  for (const w of winners) {
    const year = raceYearMap.get(w.race_id as number);
    const con = constructorMap.get(w.constructor_id as number);
    if (!year || !con) continue;
    const d = Math.floor(year / 10) * 10;
    if (!decadeConWins.has(d)) decadeConWins.set(d, new Map());
    const m = decadeConWins.get(d)!;
    m.set(con, (m.get(con) ?? 0) + 1);
  }
  const decadeDominance = [...decadeRaceCount.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, total]) => {
      const byDecade = decadeConWins.get(decade);
      if (!byDecade?.size) return { decade, topConstructor: null, wins: 0, total };
      const [topConstructor, wins] = [...byDecade.entries()].sort((a, b) => b[1] - a[1])[0];
      return { decade, topConstructor, wins, total };
    });

  // ─── Assemble: lap record evolution (chronological) ──────────────────────

  const lapEntries = [...bestLapByRace.entries()]
    .flatMap(([raceId, lap]) => {
      const year = raceYearMap.get(raceId);
      const driver = driverMap.get(lap.driverId);
      if (!year || !driver) return [];
      return [{ year, forename: driver.forename, surname: driver.surname, time: lap.time, ms: lap.ms }];
    })
    .sort((a, b) => a.year - b.year);

  const allTimeRecord = lapEntries.reduce<(typeof lapEntries)[0] | null>(
    (best, r) => (!best || r.ms < best.ms ? r : best),
    null
  );

  // ─── Assemble: constructor wins breakdown ────────────────────────────────

  const conWinsMap = new Map<string, number>();
  for (const w of winners) {
    const con = constructorMap.get(w.constructor_id as number);
    if (!con) continue;
    conWinsMap.set(con, (conWinsMap.get(con) ?? 0) + 1);
  }
  const constructorWins = [...conWinsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([constructor, wins]) => ({ constructor, wins }));
  const maxConWins = constructorWins[0]?.wins ?? 1;

  // ─── Driver list for Track Dominance ─────────────────────────────────────

  const [statsRes, driversRes] = await Promise.all([
    supabase.from('driver_stats').select('driver_id, wins, nationality').order('wins', { ascending: false }),
    supabase.from('drivers').select('id, driver_ref, forename, surname'),
  ]);
  const driverIdMap = new Map((driversRes.data ?? []).map((d) => [d.id as number, d]));
  const drivers: DriverSelectorRow[] = (statsRes.data ?? []).flatMap((s) => {
    const d = driverIdMap.get(s.driver_id as number);
    if (!d) return [];
    return [{ driver_id: s.driver_id as number, driver_ref: d.driver_ref as string, forename: d.forename as string, surname: d.surname as string, nationality: s.nationality as string, wins: s.wins as number }];
  });

  // ─── Batch 5: Race 2026 result + qualifying poles (parallel) ─────────────────

  const [race2026Res, qualiPolesRes] = await Promise.all([
    race2026
      ? supabase
          .from('results')
          .select('position, driver_id, constructor_id, points')
          .eq('race_id', race2026.id as number)
          .not('position', 'is', null)
          .lte('position', 10)
          .order('position', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ position: unknown; driver_id: unknown; constructor_id: unknown; points: unknown }> }),
    raceIds.length > 0
      ? supabase
          .from('qualifying')
          .select('driver_id, constructor_id, q1, q2, q3, race_id')
          .eq('position', 1)
          .in('race_id', raceIds)
      : Promise.resolve({ data: [] as Array<{ driver_id: unknown; constructor_id: unknown; q1: unknown; q2: unknown; q3: unknown; race_id: unknown }> }),
  ]);

  // Extend constructorMap with any constructor IDs not already resolved
  const newConstructorIds = [
    ...new Set([
      ...(race2026Res.data ?? []).map((r) => r.constructor_id as number),
      ...(qualiPolesRes.data ?? []).map((q) => q.constructor_id as number),
    ].filter((id): id is number => id != null && !constructorMap.has(id))),
  ];
  if (newConstructorIds.length > 0) {
    const { data: newCons } = await supabase
      .from('constructors').select('id, name').in('id', newConstructorIds);
    for (const c of newCons ?? []) constructorMap.set(c.id as number, c.name as string);
  }

  // ─── Assemble: race 2026 top-10 result ───────────────────────────────────────

  type Race2026Row = { position: number; forename: string; surname: string; constructor: string; points: number };
  const race2026Result: Race2026Row[] = (race2026Res.data ?? []).flatMap((r) => {
    const d = driverIdMap.get(r.driver_id as number);
    const con = constructorMap.get(r.constructor_id as number);
    if (!d || !con) return [];
    return [{ position: r.position as number, forename: d.forename as string, surname: d.surname as string, constructor: con, points: r.points as number }];
  });

  // ─── Assemble: qualifying pole records ───────────────────────────────────────

  type PoleRow = { time: string; ms: number; forename: string; surname: string; constructor: string; year: number };

  const qualiPoles: PoleRow[] = (qualiPolesRes.data ?? []).flatMap((q) => {
    const raw = [q.q3, q.q2, q.q1].find((t) => t && typeof t === 'string' && (t as string).includes(':'));
    if (!raw || typeof raw !== 'string') return [];
    const ms = parseTime(raw);
    if (!isFinite(ms)) return [];
    const d = driverIdMap.get(q.driver_id as number);
    const con = constructorMap.get(q.constructor_id as number);
    const year = raceYearMap.get(q.race_id as number);
    if (!d || !con || !year) return [];
    return [{ time: raw, ms, forename: d.forename as string, surname: d.surname as string, constructor: con, year }];
  });

  const allTimePole: PoleRow | null = qualiPoles.reduce<PoleRow | null>(
    (best, p) => (!best || p.ms < best.ms ? p : best), null
  );
  const recentPoles: PoleRow[] = [...qualiPoles].sort((a, b) => b.year - a.year).slice(0, 5);

  // ─── Batch 6: Intel data (parallel) ──────────────────────────────────────────

  const [allResultsRaw, statusRaw, pitStopsRaw, winnerDobRaw] = await Promise.all([
    raceIds.length > 0
      ? supabase
          .from('results')
          .select('race_id, driver_id, constructor_id, grid, position, status_id')
          .in('race_id', raceIds)
          .limit(3000)
      : Promise.resolve({ data: [] as Array<{ race_id: unknown; driver_id: unknown; constructor_id: unknown; grid: unknown; position: unknown; status_id: unknown }> }),
    supabase.from('status').select('id, status'),
    raceIds.length > 0
      ? supabase
          .from('pit_stops')
          .select('race_id, driver_id, stop, milliseconds')
          .in('race_id', raceIds)
          .limit(5000)
      : Promise.resolve({ data: [] as Array<{ race_id: unknown; driver_id: unknown; stop: unknown; milliseconds: unknown }> }),
    winnerDriverIds.length > 0
      ? supabase
          .from('drivers')
          .select('id, dob, nationality')
          .in('id', [...new Set(winnerDriverIds)])
      : Promise.resolve({ data: [] as Array<{ id: unknown; dob: unknown; nationality: unknown }> }),
  ]);

  // ─── Compute: intel metrics ───────────────────────────────────────────────────

  type AllResultRow = { race_id: number; driver_id: number; constructor_id: number; grid: number | null; position: number | null; status_id: number };
  const allResults = (allResultsRaw.data ?? []) as AllResultRow[];

  const statusTable = new Map<number, string>(
    (statusRaw.data ?? []).map((s) => [s.id as number, s.status as string])
  );

  const winnerDobMap = new Map<number, { dob: string | null; nationality: string | null }>(
    (winnerDobRaw.data ?? []).map((d) => [
      d.id as number,
      { dob: d.dob as string | null, nationality: d.nationality as string | null },
    ])
  );

  // 1 · DNF rate + causes
  const totalEntries = allResults.length;
  const dnfResults = allResults.filter((r) => r.position === null);
  const dnfTotal = dnfResults.length;
  const dnfRate = totalEntries > 0 ? dnfTotal / totalEntries : 0;
  const statusCount = new Map<string, number>();
  for (const r of dnfResults) {
    const st = statusTable.get(r.status_id) ?? 'Unknown';
    if (st === 'Finished' || /^\+\d/.test(st)) continue;
    statusCount.set(st, (statusCount.get(st) ?? 0) + 1);
  }
  const dnfCauses = [...statusCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([cause, count]) => ({ cause, count }));

  // 3 · Pole → Win conversion
  const poleDriverByRaceId = new Map<number, number>(
    (qualiPolesRes.data ?? []).map((q) => [q.race_id as number, q.driver_id as number])
  );
  const winnerByRaceId = new Map<number, number>(
    winners.map((w) => [w.race_id as number, w.driver_id as number])
  );
  let poleWins = 0;
  let poleTotal = 0;
  for (const [raceId, poleDriverId] of poleDriverByRaceId) {
    poleTotal++;
    if (winnerByRaceId.get(raceId) === poleDriverId) poleWins++;
  }

  // 4 · Avg grid delta (positions gained start→finish)
  let gridDeltaSum = 0, gridDeltaCount = 0;
  for (const r of allResults) {
    if (r.grid && r.position && r.grid > 0 && r.position > 0) {
      gridDeltaSum += r.grid - r.position;
      gridDeltaCount++;
    }
  }
  const avgGridDelta = gridDeltaCount > 0 ? gridDeltaSum / gridDeltaCount : null;

  // 5 · Win streaks
  type StreakResult = { name: string; count: number; startYear: number; endYear: number };
  function computeStreaks(seq: Array<{ name: string; year: number }>): StreakResult[] {
    const runs: StreakResult[] = [];
    let i = 0;
    while (i < seq.length) {
      let j = i;
      while (j < seq.length && seq[j].name === seq[i].name) j++;
      runs.push({ name: seq[i].name, count: j - i, startYear: seq[i].year, endYear: seq[j - 1].year });
      i = j;
    }
    return runs.sort((a, b) => b.count - a.count).slice(0, 3);
  }
  const sortedWinsByYear = [...winnerRows].sort((a, b) => a.year - b.year);
  const topDriverStreaks = computeStreaks(sortedWinsByYear.map((w) => ({ name: `${w.forename[0]}. ${w.surname}`, year: w.year })));
  const topConStreaks = computeStreaks(sortedWinsByYear.map((w) => ({ name: w.constructor, year: w.year })));

  // 6 · Youngest / oldest winner
  type AgeWin = { forename: string; surname: string; year: number; ageYears: number };
  const raceIdDateMap = new Map<number, string>(
    races.flatMap((r) => r.date ? [[r.id as number, r.date as string]] : [])
  );
  const ageWinners: AgeWin[] = winners.flatMap((w) => {
    const driverId = w.driver_id as number;
    const raceId = w.race_id as number;
    const year = raceYearMap.get(raceId);
    const raceDate = raceIdDateMap.get(raceId);
    const dobInfo = winnerDobMap.get(driverId);
    const driver = driverMap.get(driverId);
    if (!year || !raceDate || !dobInfo?.dob || !driver) return [];
    const ageDays = (new Date(raceDate).getTime() - new Date(dobInfo.dob).getTime()) / 86400000;
    if (ageDays <= 0) return [];
    return [{ forename: driver.forename, surname: driver.surname, year, ageYears: ageDays / 365.25 }];
  });
  const youngestWinner = ageWinners.reduce<AgeWin | null>((b, a) => !b || a.ageYears < b.ageYears ? a : b, null);
  const oldestWinner = ageWinners.reduce<AgeWin | null>((b, a) => !b || a.ageYears > b.ageYears ? a : b, null);

  // 7 · Pit strategy (avg stop + by decade)
  type PitRow = { race_id: number; driver_id: number; stop: number; milliseconds: number | null };
  const validPits = ((pitStopsRaw.data ?? []) as PitRow[]).filter((p) => {
    const ms = p.milliseconds;
    return ms !== null && ms > 1500 && ms < 120000;
  });
  const overallAvgPitSec = validPits.length > 0
    ? validPits.reduce((sum, p) => sum + (p.milliseconds as number), 0) / validPits.length / 1000
    : null;
  const pitDecadeAccum = new Map<number, { sum: number; count: number }>();
  for (const p of validPits) {
    const year = raceYearMap.get(p.race_id);
    if (!year) continue;
    const decade = Math.floor(year / 10) * 10;
    const cur = pitDecadeAccum.get(decade) ?? { sum: 0, count: 0 };
    cur.sum += p.milliseconds as number;
    cur.count++;
    pitDecadeAccum.set(decade, cur);
  }
  const pitByDecade = [...pitDecadeAccum.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, { sum, count }]) => ({ decade, avgSec: sum / count / 1000 }));

  // 8 · Wins by driver nationality
  const natWinsMap = new Map<string, number>();
  for (const w of winners) {
    const nat = winnerDobMap.get(w.driver_id as number)?.nationality;
    if (!nat) continue;
    natWinsMap.set(nat, (natWinsMap.get(nat) ?? 0) + 1);
  }
  const natWins = [...natWinsMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([nationality, wins]) => ({ nationality, wins }));

  // 9 · Fastest avg pit by constructor (via driver→constructor from allResults)
  const drRaceConMap = new Map<string, number>();
  for (const r of allResults) {
    if (r.constructor_id) drRaceConMap.set(`${r.race_id}_${r.driver_id}`, r.constructor_id);
  }
  const raceConPitMins = new Map<string, number>();
  for (const p of validPits) {
    const conId = drRaceConMap.get(`${p.race_id}_${p.driver_id}`);
    if (conId === undefined) continue;
    const key = `${p.race_id}_${conId}`;
    const cur = raceConPitMins.get(key) ?? Infinity;
    if ((p.milliseconds as number) < cur) raceConPitMins.set(key, p.milliseconds as number);
  }
  const conBestPitAccum = new Map<number, { sum: number; count: number }>();
  for (const [key, minMs] of raceConPitMins) {
    const conId = parseInt(key.split('_')[1], 10);
    const cur = conBestPitAccum.get(conId) ?? { sum: 0, count: 0 };
    cur.sum += minMs;
    cur.count++;
    conBestPitAccum.set(conId, cur);
  }
  const fastestPitByConstructor = [...conBestPitAccum.entries()]
    .map(([conId, { sum, count }]) => ({
      constructor: constructorMap.get(conId) ?? null,
      avgBestSec: sum / count / 1000,
      raceCount: count,
    }))
    .filter((c): c is { constructor: string; avgBestSec: number; raceCount: number } => c.constructor !== null)
    .sort((a, b) => a.avgBestSec - b.avgBestSec)
    .slice(0, 5);

  // 12 · Most podiums without a win
  const podiumCounts = new Map<number, number>();
  for (const r of allResults) {
    if (r.position === 2 || r.position === 3) {
      podiumCounts.set(r.driver_id, (podiumCounts.get(r.driver_id) ?? 0) + 1);
    }
  }
  const winDriverSet = new Set(winners.map((w) => w.driver_id as number));
  const podNoWin = [...podiumCounts.entries()]
    .filter(([driverId]) => !winDriverSet.has(driverId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .flatMap(([driverId, podiums]) => {
      const d = driverIdMap.get(driverId);
      if (!d) return [];
      return [{ forename: d.forename as string, surname: d.surname as string, podiums }];
    });

  const intelData = {
    dnfRate, dnfTotal, totalEntries, dnfCauses,
    poleWins, poleTotal,
    topDriverStreaks, topConStreaks,
    youngestWinner, oldestWinner,
    avgGridDelta,
    overallAvgPitSec, pitByDecade,
    natWins,
    fastestPitByConstructor,
    podNoWin,
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <CircuitDetailExperience
      circuit={circuit}
      drivers={drivers}
      firstYear={firstYear}
      totalRaces={totalRaces}
      standardLaps={standardLaps}
      rankLapRecord={rankLapRecord}
      trackPathData={trackPathData}
      winnerRows={winnerRows}
      decadeDominance={decadeDominance}
      lapEntries={lapEntries}
      allTimeRecord={allTimeRecord}
      constructorWins={constructorWins}
      maxConWins={maxConWins}
      nextRace={nextRace}
      race2026Result={race2026Result}
      allTimePole={allTimePole}
      recentPoles={recentPoles}
      intelData={intelData}
    />
  );
}


