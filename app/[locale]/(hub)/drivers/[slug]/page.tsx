import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { type CircuitRecord } from '@/components/drivers/CircuitRecordSection';
import DriverDetailExperience from '@/components/drivers/kinetic/DriverDetailExperience';

type PageParams = Promise<{ locale: string; slug: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanLapTime(t: string | null | undefined): string | null {
  if (!t || t === '\\N' || t.trim() === '') return null;
  return t;
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('drivers').select('driver_ref');
  const slugs = (data ?? []).map((d) => d.driver_ref as string).filter(Boolean);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('drivers')
    .select('forename, surname, nationality')
    .eq('driver_ref', slug)
    .single();
  if (!data) return { title: 'Driver — PaddockIntel' };
  const name = `${data.forename as string} ${data.surname as string}`;
  return {
    title: `${name} — PaddockIntel`,
    description: `Career statistics, season records, and win history for ${name} (${data.nationality as string}).`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DriverDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const t = await getTranslations('driverDetail');
  const supabase = createClient();

  // Batch 1 — driver by slug
  const { data: driverRaw } = await supabase
    .from('drivers')
    .select('id, driver_ref, forename, surname, code, number, nationality, dob')
    .eq('driver_ref', slug)
    .single();

  if (!driverRaw) notFound();

  const driver = {
    id: driverRaw.id as number,
    driver_ref: driverRaw.driver_ref as string,
    forename: driverRaw.forename as string,
    surname: driverRaw.surname as string,
    code: (driverRaw.code as string | null) ?? null,
    number: (driverRaw.number as number | null) ?? null,
    nationality: driverRaw.nationality as string,
    dob: (driverRaw.dob as string | null) ?? null,
  };

  // Batch 2 — career stats + all results + all qualifying (parallel)
  const [statsRes, resultsRes, qualiRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select(
        'races, wins, podiums, poles, fastest_laps, dnfs, first_year, last_year'
      )
      .eq('driver_id', driver.id)
      .single(),
    supabase
      .from('results')
      .select('race_id, constructor_id, position, points, fastest_lap_time, rank, status_id')
      .eq('driver_id', driver.id)
      .limit(500),
    supabase
      .from('qualifying')
      .select('race_id, position')
      .eq('driver_id', driver.id),
  ]);

  const stats = statsRes.data;
  const allResults = resultsRes.data ?? [];
  const allQuali = qualiRes.data ?? [];

  // Collect race IDs from both results and qualifying
  const resultRaceIds = allResults.map((r) => r.race_id as number);
  const qualiRaceIds = allQuali.map((q) => q.race_id as number);
  const allRaceIds = [...new Set([...resultRaceIds, ...qualiRaceIds])];

  // Early return if no data
  if (!allRaceIds.length || !stats) {
    return (
      <main className="flex flex-col">
        <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
          <Link
            href="/drivers"
            className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
          >
            {t('breadcrumb.drivers')}
          </Link>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">{driver.surname}</span>
        </div>
        <div className="px-6 pt-8 pb-7">
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
            {t('hero.label')}
          </p>
          <h1
            className="uppercase text-text-1 leading-none tracking-[-0.03em] mb-2 text-[clamp(2.5rem,8vw,5rem)]"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {driver.surname}
          </h1>
          <p className="text-[14px] text-text-2">{driver.forename} · {driver.nationality}</p>
        </div>
        <div className="px-6 py-12 border-t border-border">
          <p className="font-mono text-[13px] text-text-3">{t('noData')}</p>
        </div>
      </main>
    );
  }

  // Batch 3 — race metadata (circuit_id included for §06 circuit record)
  const { data: racesRaw } = await supabase
    .from('races')
    .select('id, year, round, name, circuit_id')
    .in('id', allRaceIds)
    .order('year', { ascending: true })
    .order('round', { ascending: true });

  // Build race → circuit map for §06
  const raceCircuitMap = new Map(
    (racesRaw ?? [])
      .filter((r) => r.circuit_id != null)
      .map((r) => [r.id as number, r.circuit_id as number])
  );
  const uniqueCircuitIds = [...new Set(raceCircuitMap.values())];

  const races = racesRaw ?? [];
  const raceById = new Map(
    races.map((r) => [
      r.id as number,
      { year: r.year as number, round: r.round as number, name: r.name as string },
    ])
  );

  // Find last raced round per year (from results only)
  const lastRacePerYear = new Map<number, number>(); // year → race_id
  for (const r of allResults) {
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const cur = lastRacePerYear.get(race.year);
    if (cur === undefined) {
      lastRacePerYear.set(race.year, raceId);
    } else {
      const curRace = raceById.get(cur);
      if (curRace && race.round > curRace.round) {
        lastRacePerYear.set(race.year, raceId);
      }
    }
  }

  const lastRaceIds = [...lastRacePerYear.values()];
  const uniqueConstructorIds = [
    ...new Set(allResults.map((r) => r.constructor_id as number)),
  ];

  // Batch 4 — standings + constructors + circuits (§06) + status table (§06)
  const [standingsRes, constructorsRes, circuitsRes, finishedStatusRes] = await Promise.all([
    lastRaceIds.length
      ? supabase
          .from('driver_standings')
          .select('race_id, position, points, wins')
          .eq('driver_id', driver.id)
          .in('race_id', lastRaceIds)
      : Promise.resolve({
          data: [] as {
            race_id: unknown;
            position: unknown;
            points: unknown;
            wins: unknown;
          }[],
          error: null,
        }),
    uniqueConstructorIds.length
      ? supabase
          .from('constructors')
          .select('id, name, constructor_ref')
          .in('id', uniqueConstructorIds)
      : Promise.resolve({
          data: [] as { id: unknown; name: unknown; constructor_ref: unknown }[],
          error: null,
        }),
    uniqueCircuitIds.length
      ? supabase
          .from('circuits')
          .select('id, name, location, country')
          .in('id', uniqueCircuitIds)
          .limit(500)
      : Promise.resolve({
          data: [] as { id: unknown; name: unknown; location: unknown; country: unknown }[],
          error: null,
        }),
    supabase.from('status').select('id').eq('status', 'Finished').limit(1),
  ]);

  const standingsByRaceId = new Map(
    (standingsRes.data ?? []).map((s) => [
      s.race_id as number,
      {
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
      },
    ])
  );

  const constructorById = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      { name: c.name as string, ref: c.constructor_ref as string },
    ])
  );

  // ─── Assemble: §06 circuit records ────────────────────────────────────────

  const finishedStatusId =
    ((finishedStatusRes.data ?? []) as Array<{ id: number }>)[0]?.id ?? 1;

  const circuitInfoMap = new Map(
    ((circuitsRes.data ?? []) as Array<{
      id: number;
      name: string;
      location: string;
      country: string;
    }>).map((c) => [c.id, c])
  );

  // Aggregate per-circuit from results
  const circuitStatsMap = new Map<
    number,
    { starts: number; wins: number; podiums: number; best: number | null; dnfs: number; fl: number }
  >();

  for (const r of allResults) {
    const circuitId = raceCircuitMap.get(r.race_id as number);
    if (!circuitId) continue;
    const pos      = r.position !== null ? Number(r.position) : null;
    const statusId = r.status_id as number | null;
    const cur = circuitStatsMap.get(circuitId) ?? { starts: 0, wins: 0, podiums: 0, best: null, dnfs: 0, fl: 0 };
    cur.starts += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    if (cur.best === null || (pos !== null && pos < cur.best)) cur.best = pos;
    if (pos === null && statusId !== null && statusId !== finishedStatusId) cur.dnfs += 1;
    if (Number(r.rank) === 1) cur.fl += 1;
    circuitStatsMap.set(circuitId, cur);
  }

  // Aggregate poles from qualifying
  const circuitPolesMap = new Map<number, number>();
  for (const q of allQuali) {
    if (Number(q.position) !== 1) continue;
    const circuitId = raceCircuitMap.get(q.race_id as number);
    if (!circuitId) continue;
    circuitPolesMap.set(circuitId, (circuitPolesMap.get(circuitId) ?? 0) + 1);
  }

  const circuitRecords: CircuitRecord[] = [];
  for (const [circuitId, s] of circuitStatsMap.entries()) {
    const info = circuitInfoMap.get(circuitId);
    if (!info) continue;
    const poles   = circuitPolesMap.get(circuitId) ?? 0;
    const winPct  = s.starts > 0 ? Math.round((s.wins / s.starts) * 1000) / 10 : 0;
    circuitRecords.push({
      circuit_id:   circuitId,
      circuit_name: info.name,
      location:     info.location,
      country:      info.country,
      starts:       s.starts,
      wins:         s.wins,
      podiums:      s.podiums,
      best_result:  s.best,
      dnfs:         s.dnfs,
      fastest_laps: s.fl,
      poles,
      win_pct:      winPct,
    });
  }

  // ─── Assemble: championships ─────────────────────────────────────────────

  const championshipYears: number[] = [];
  for (const [year, raceId] of lastRacePerYear.entries()) {
    const standing = standingsByRaceId.get(raceId);
    if (standing?.position === 1) championshipYears.push(year);
  }
  championshipYears.sort((a, b) => a - b);

  // ─── Assemble: season-by-season rows ─────────────────────────────────────

  type SeasonRow = {
    year: number;
    constructorName: string;
    constructorRef: string;
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    races: number;
  };

  const seasonMap = new Map<
    number,
    { races: number; wins: number; podiums: number; lastConstructorId: number | null }
  >();

  for (const r of allResults) {
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const year = race.year;
    const pos = r.position !== null ? Number(r.position) : null;
    const isLastRace = lastRacePerYear.get(year) === raceId;

    const cur = seasonMap.get(year) ?? {
      races: 0,
      wins: 0,
      podiums: 0,
      lastConstructorId: null,
    };
    cur.races += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    if (isLastRace) cur.lastConstructorId = r.constructor_id as number;
    seasonMap.set(year, cur);
  }

  const seasonRows: SeasonRow[] = [...seasonMap.entries()]
    .map(([year, s]) => {
      const lastRaceId = lastRacePerYear.get(year);
      const standing = lastRaceId ? standingsByRaceId.get(lastRaceId) : undefined;
      const con = s.lastConstructorId
        ? constructorById.get(s.lastConstructorId)
        : null;
      return {
        year,
        constructorName: con?.name ?? '—',
        constructorRef: con?.ref ?? '',
        position: standing?.position ?? null,
        points: standing?.points ?? 0,
        wins: s.wins,
        podiums: s.podiums,
        races: s.races,
      };
    })
    .sort((a, b) => b.year - a.year);

  // ─── Assemble: win history ────────────────────────────────────────────────

  type WinRow = {
    year: number;
    raceName: string;
    constructorName: string;
    constructorRef: string;
    fastestLap: string | null;
  };

  const winRows: WinRow[] = allResults
    .flatMap((r) => {
      if (Number(r.position) !== 1) return [];
      const raceId = r.race_id as number;
      const race = raceById.get(raceId);
      if (!race) return [];
      const con = constructorById.get(r.constructor_id as number);
      return [
        {
          year: race.year,
          raceName: race.name,
          constructorName: con?.name ?? '—',
          constructorRef: con?.ref ?? '',
          fastestLap: cleanLapTime(r.fastest_lap_time as string | null),
        },
      ];
    })
    .sort((a, b) => b.year - a.year || a.raceName.localeCompare(b.raceName));

  // ─── Assemble: qualifying record ─────────────────────────────────────────

  type PoleRow = { year: number; raceName: string };

  let qualiSum = 0;
  let qualiCount = 0;
  let frontRowCount = 0;
  const poleRows: PoleRow[] = [];

  for (const q of allQuali) {
    const pos = q.position !== null ? Number(q.position) : null;
    if (pos === null || isNaN(pos)) continue;
    qualiSum += pos;
    qualiCount += 1;
    if (pos <= 2) frontRowCount += 1;
    if (pos === 1) {
      const race = raceById.get(q.race_id as number);
      if (race) poleRows.push({ year: race.year, raceName: race.name });
    }
  }

  poleRows.sort((a, b) => b.year - a.year);
  const avgQuali =
    qualiCount > 0 ? Math.round((qualiSum / qualiCount) * 10) / 10 : null;

  // ─── Assemble: constructors section ──────────────────────────────────────

  type ConstructorRow = {
    constructorId: number;
    name: string;
    ref: string;
    firstYear: number;
    lastYear: number;
    races: number;
    wins: number;
    podiums: number;
  };

  const conStatsMap = new Map<
    number,
    { races: number; wins: number; podiums: number; years: Set<number> }
  >();

  for (const r of allResults) {
    const conId = r.constructor_id as number;
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const pos = r.position !== null ? Number(r.position) : null;
    const cur = conStatsMap.get(conId) ?? {
      races: 0,
      wins: 0,
      podiums: 0,
      years: new Set<number>(),
    };
    cur.races += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    cur.years.add(race.year);
    conStatsMap.set(conId, cur);
  }

  const constructorRows: ConstructorRow[] = [...conStatsMap.entries()]
    .flatMap(([conId, s]) => {
      const con = constructorById.get(conId);
      if (!con) return [];
      const years = [...s.years].sort((a, b) => a - b);
      return [
        {
          constructorId: conId,
          name: con.name,
          ref: con.ref,
          firstYear: years[0],
          lastYear: years[years.length - 1],
          races: s.races,
          wins: s.wins,
          podiums: s.podiums,
        },
      ];
    })
    .sort((a, b) => b.races - a.races);

  const maxConRaces = constructorRows[0]?.races ?? 1;

  // ─── Win % ────────────────────────────────────────────────────────────────

  const winPct =
    stats.races > 0
      ? ((stats.wins as number / stats.races as number) * 100).toFixed(1)
      : '0.0';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DriverDetailExperience
      driver={{
        forename:    driver.forename,
        surname:     driver.surname,
        code:        driver.code,
        number:      driver.number,
        nationality: driver.nationality,
        dob:         driver.dob,
        driver_ref:  driver.driver_ref,
      }}
      stats={{
        races:       stats.races        as number,
        wins:        stats.wins         as number,
        podiums:     stats.podiums      as number,
        poles:       stats.poles        as number,
        fastestLaps: stats.fastest_laps as number,
        dnfs:        stats.dnfs         as number,
        firstYear:   stats.first_year   as number,
        lastYear:    stats.last_year    as number,
      }}
      winPct={winPct}
      avgQuali={avgQuali}
      frontRowCount={frontRowCount}
      championshipYears={championshipYears}
      seasonRows={seasonRows}
      winRows={winRows}
      poleRows={poleRows}
      constructorRows={constructorRows}
      maxConRaces={maxConRaces}
      circuitRecords={circuitRecords}
    />
  );
}
