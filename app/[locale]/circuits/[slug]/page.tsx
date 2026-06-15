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
    />
  );
}


