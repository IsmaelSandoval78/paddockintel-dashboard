import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fetchTrackPathData } from '@/lib/trackSvg';
import { Link } from '@/lib/i18n/navigation';
import EpicenterMap, { type EpicenterEvent } from '@/components/circuits/EpicenterMap';

// PostgREST silently caps any single request at 1,000 rows regardless of .limit() — races is
// past that (~1,200 rows). Same pagination pattern as app/[locale]/(hub)/drivers/page.tsx.
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

interface FeaturedCircuit {
  circuitId: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
  firstYear: number | null;
  totalRaces: number;
  fastestLap: { time: string; forename: string; surname: string; year: number } | null;
  topWinDriver: { forename: string; surname: string; wins: number } | null;
  trackPath: { path: string; viewBox: string } | null;
  event: EpicenterEvent | null;
}

interface CalendarRow {
  round: number;
  circuitId: number;
  circuitRef: string;
  name: string;
  totalRaces: number;
}

async function getFeaturedCircuit(): Promise<FeaturedCircuit | null> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Same selection rule as the magazine's CircuitOfTheDay (app/[locale]/(blog)/magazine-home/data.ts):
  // the circuit hosting the next race on the calendar. Kept in sync deliberately, not reused
  // directly — that function returns Blog-shaped data, this returns Hub-shaped data.
  const { data: nextRace } = await supabase
    .from('races')
    .select('circuit_id')
    .gt('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single();
  if (!nextRace) return null;

  const circuitId = nextRace.circuit_id as number;
  const { data: circuit } = await supabase
    .from('circuits')
    .select('id, name, location, country, circuit_ref')
    .eq('id', circuitId)
    .single();
  if (!circuit) return null;

  const circuitRef = circuit.circuit_ref as string;

  const [racesRes, cornersRes, trackPath] = await Promise.all([
    supabase.from('races').select('id, year').eq('circuit_id', circuitId),
    supabase
      .from('circuit_corners')
      .select('corner_number, name, path_percent')
      .eq('circuit_ref', circuitRef)
      .not('path_percent', 'is', null)
      .order('corner_number', { ascending: true })
      .limit(1),
    fetchTrackPathData(circuitRef),
  ]);

  const races = racesRes.data ?? [];
  const raceIds = races.map((r) => r.id as number);
  const years = races.map((r) => r.year as number);
  const firstYear = years.length ? Math.min(...years) : null;
  const totalRaces = races.length;

  let fastestLap: FeaturedCircuit['fastestLap'] = null;
  let topWinDriver: FeaturedCircuit['topWinDriver'] = null;

  if (raceIds.length) {
    const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));
    const [fastLapRes, winnersRes] = await Promise.all([
      supabase
        .from('results')
        .select('race_id, driver_id, fastest_lap_time')
        .in('race_id', raceIds)
        .not('fastest_lap_time', 'is', null)
        .neq('fastest_lap_time', '\\N')
        .gt('fastest_lap_time', '')
        .order('fastest_lap_time', { ascending: true })
        .limit(1),
      supabase.from('results').select('race_id, driver_id').in('race_id', raceIds).eq('position', 1),
    ]);

    const winners = winnersRes.data ?? [];
    const winCounts = new Map<number, number>();
    for (const w of winners) winCounts.set(w.driver_id as number, (winCounts.get(w.driver_id as number) ?? 0) + 1);
    const topEntry = [...winCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const fastLapRow = fastLapRes.data?.[0];
    const driverIds = [
      ...new Set([...(topEntry ? [topEntry[0]] : []), ...(fastLapRow ? [fastLapRow.driver_id as number] : [])]),
    ];
    const { data: drivers } = driverIds.length
      ? await supabase.from('drivers').select('id, forename, surname').in('id', driverIds)
      : { data: [] as { id: number; forename: string; surname: string }[] };
    const driverMap = new Map((drivers ?? []).map((d) => [d.id as number, d]));

    if (fastLapRow) {
      const d = driverMap.get(fastLapRow.driver_id as number);
      const year = raceYearMap.get(fastLapRow.race_id as number);
      if (d && year) {
        fastestLap = { time: fastLapRow.fastest_lap_time as string, forename: d.forename as string, surname: d.surname as string, year };
      }
    }
    if (topEntry) {
      const d = driverMap.get(topEntry[0]);
      if (d) topWinDriver = { forename: d.forename as string, surname: d.surname as string, wins: topEntry[1] };
    }
  }

  const cornerRow = cornersRes.data?.[0];

  return {
    circuitId,
    circuitRef,
    name: circuit.name as string,
    location: circuit.location as string,
    country: circuit.country as string,
    firstYear,
    totalRaces,
    fastestLap,
    topWinDriver,
    trackPath,
    event: cornerRow
      ? { cornerNumber: cornerRow.corner_number as number, cornerName: cornerRow.name as string | null, pathPercent: cornerRow.path_percent as number }
      : null,
  };
}

// Returns every 2026-calendar circuit (including the featured one — the page filters that
// row out when rendering the list, but callers that need the full active-circuit set, like
// getHistoricalCircuits' exclusion list, need it present here).
async function getCalendarList(): Promise<CalendarRow[]> {
  const supabase = createClient();

  const [racesRes, allRaces] = await Promise.all([
    supabase
      .from('races')
      .select('round, circuit_id, circuits(circuit_ref, name)')
      .eq('year', 2026)
      .order('round', { ascending: true }),
    // Total-races-ever per circuit — paginated, races is past the 1,000-row PostgREST cap.
    fetchAllRows<{ circuit_id: number }>((from, to) =>
      supabase.from('races').select('circuit_id').range(from, to)
    ),
  ]);

  const totalRacesByCircuit = new Map<number, number>();
  for (const r of allRaces) {
    const cid = r.circuit_id;
    totalRacesByCircuit.set(cid, (totalRacesByCircuit.get(cid) ?? 0) + 1);
  }

  return (racesRes.data ?? []).flatMap((r) => {
    const circuitId = r.circuit_id as number;
    const circuitJoin = r.circuits as unknown as { circuit_ref: string; name: string } | null;
    if (!circuitJoin) return [];
    return [{
      round: r.round as number,
      circuitId,
      circuitRef: circuitJoin.circuit_ref,
      name: circuitJoin.name,
      totalRaces: totalRacesByCircuit.get(circuitId) ?? 0,
    }];
  });
}

interface HistoricalCircuit {
  circuitRef: string;
  name: string;
  country: string;
}

// Every circuit NOT on the 2026 calendar — a plain text list, no map/track/stats. Exists so
// retired circuits stay reachable from the index (SEO-EXPERT.md: no orphaned pages, 3-click
// reachability from the homepage) without building interactive map/filter/search back in.
async function getHistoricalCircuits(activeCircuitIds: Set<number>): Promise<HistoricalCircuit[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('circuits')
    .select('id, circuit_ref, name, country')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  return (data ?? [])
    .filter((c) => !activeCircuitIds.has(c.id as number))
    .map((c) => ({ circuitRef: c.circuit_ref as string, name: c.name as string, country: c.country as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function CircuitsPage() {
  const t = await getTranslations('circuits');
  const featured = await getFeaturedCircuit();
  const calendar = await getCalendarList();
  const list = calendar.filter((row) => row.circuitId !== featured?.circuitId);
  const historical = await getHistoricalCircuits(new Set(calendar.map((row) => row.circuitId)));

  return (
    <main className="flex flex-col">
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0 bg-surface-raised">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">02 ·</span>
        <h1
          className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {t('title')}
        </h1>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: list.length + (featured ? 1 : 0) + historical.length })}
        </span>
      </div>

      {featured && (
        <section className="border-b border-border px-6 py-10 flex flex-col items-center gap-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2">
            {t('featured.kicker')}
          </p>

          <EpicenterMap name={featured.name} trackPathData={featured.trackPath} event={featured.event} />

          <div className="text-center">
            <h2
              className="uppercase leading-none tracking-[-0.02em] text-text-1"
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
            >
              {featured.name}
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 mt-2">
              {featured.location} · {featured.country}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 w-full max-w-md pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex flex-col items-center text-center">
              <p
                className="tabular-nums leading-none text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
              >
                {featured.firstYear ?? '—'}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
                {t('featured.since')} · {featured.totalRaces} {t('list.races')}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p
                className="tabular-nums leading-none"
                style={{ fontFamily: 'var(--pi-mono)', fontSize: 'clamp(1.1rem, 2.6vw, 1.4rem)', color: 'var(--terracotta)' }}
              >
                {featured.fastestLap?.time ?? '—'}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
                {featured.fastestLap
                  ? `${t('panel.fastestLap')} · ${featured.fastestLap.forename[0]}. ${featured.fastestLap.surname} · ${featured.fastestLap.year}`
                  : t('panel.fastestLap')}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p
                className="tabular-nums leading-none text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
              >
                {featured.topWinDriver?.wins ?? '—'}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
                {featured.topWinDriver
                  ? `${t('panel.mostWins')} · ${featured.topWinDriver.forename[0]}. ${featured.topWinDriver.surname}`
                  : t('panel.mostWins')}
              </p>
            </div>
          </div>

          <Link
            href={`/circuits/${featured.circuitRef}`}
            data-cursor
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-terracotta transition-colors duration-150"
          >
            {t('panel.viewFull')}
          </Link>
        </section>
      )}

      <section>
        <div className="px-6 py-3 border-b border-border">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2">
            {t('list.title')}
          </h2>
        </div>
        <div>
          {list.map((row) => (
            <Link
              key={row.circuitRef}
              href={`/circuits/${row.circuitRef}`}
              data-cursor
              className="flex items-center gap-4 px-6 py-3 border-b border-border-subtle hover:bg-surface-raised transition-colors duration-100"
            >
              <span className="font-mono text-[11px] text-text-3 tabular-nums w-8 shrink-0">
                {String(row.round).padStart(2, '0')}
              </span>
              <span className="text-[14px] text-text-1 flex-1 min-w-0 truncate">{row.name}</span>
              <span className="font-mono text-[11px] text-text-2 tabular-nums shrink-0">
                {row.totalRaces} {t('list.races')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {historical.length > 0 && (
        <section>
          <div className="px-6 py-3 border-b border-border">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2">
              {t('legend.historical')} · {historical.length}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {historical.map((c) => (
              <Link
                key={c.circuitRef}
                href={`/circuits/${c.circuitRef}`}
                data-cursor
                className="flex items-baseline gap-2 px-6 py-2.5 border-b border-r border-border-subtle hover:bg-surface-raised transition-colors duration-100 min-w-0"
              >
                <span className="text-[13px] text-text-1 truncate">{c.name}</span>
                <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] shrink-0 ml-auto">
                  {c.country}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
