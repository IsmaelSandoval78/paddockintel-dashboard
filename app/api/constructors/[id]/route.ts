import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ConstructorDetail } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const constructorId = parseInt(id, 10);
  if (isNaN(constructorId)) return NextResponse.json(null, { status: 400 });

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Batch 1: constructor info + career stats + latest 2026 race
  const [constructorRes, statsRes, latestRaceRes] = await Promise.all([
    supabase
      .from('constructors')
      .select('id, name, constructor_ref, nationality')
      .eq('id', constructorId)
      .single(),
    supabase
      .from('constructor_stats')
      .select('races, wins, first_year, last_year')
      .eq('constructor_id', constructorId)
      .single(),
    supabase
      .from('races')
      .select('id')
      .eq('year', 2026)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!constructorRes.data || !statsRes.data) {
    return NextResponse.json(null, { status: 404 });
  }

  const constructor = constructorRes.data;
  const stats = statsRes.data;
  const latestRaceId = latestRaceRes.data ? (latestRaceRes.data.id as number) : null;

  // Batch 2: career podiums, fastest laps, 2026 standings, last results
  const [podiumsRes, fastestLapsRes, standings2026Res, lastResultsRes] = await Promise.all([
    supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .eq('constructor_id', constructorId)
      .lte('position', 3)
      .not('position', 'is', null),
    supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .eq('constructor_id', constructorId)
      .not('fastest_lap', 'is', null),
    latestRaceId
      ? supabase
          .from('constructor_standings')
          .select('position, points, wins')
          .eq('constructor_id', constructorId)
          .eq('race_id', latestRaceId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('results')
      .select('race_id, position, points')
      .eq('constructor_id', constructorId)
      .order('race_id', { ascending: false })
      .limit(20),
  ]);

  // Group results by race_id — best position + total points per race (both drivers)
  const raceAgg = new Map<number, { best_position: number | null; points: number }>();
  for (const r of lastResultsRes.data ?? []) {
    const raceId = r.race_id as number;
    const rawPos = r.position;
    const pos =
      rawPos !== null && rawPos !== undefined
        ? (() => { const n = Number(rawPos); return isNaN(n) ? null : n; })()
        : null;
    const pts = Number(r.points ?? 0);

    const existing = raceAgg.get(raceId);
    if (!existing) {
      raceAgg.set(raceId, { best_position: pos, points: pts });
    } else {
      raceAgg.set(raceId, {
        best_position:
          pos !== null && (existing.best_position === null || pos < existing.best_position)
            ? pos
            : existing.best_position,
        points: existing.points + pts,
      });
    }
  }

  // Insertion order is race_id DESC — take first 5 unique races
  const last5RaceIds = [...raceAgg.keys()].slice(0, 5);

  // Batch 3: race names for last 5
  const { data: racesData } = last5RaceIds.length
    ? await supabase
        .from('races')
        .select('id, name, year')
        .in('id', last5RaceIds)
    : { data: [] as { id: unknown; name: unknown; year: unknown }[] };

  const raceMap = new Map(
    (racesData ?? []).map((r) => [
      r.id as number,
      { name: r.name as string, year: r.year as number },
    ])
  );

  const last_5_results = last5RaceIds.map((raceId) => {
    const race = raceMap.get(raceId);
    const agg = raceAgg.get(raceId);
    return {
      race_name: race?.name ?? '—',
      year: race?.year ?? 0,
      best_position: agg?.best_position ?? null,
      points: agg?.points ?? 0,
    };
  });

  const standing2026 = standings2026Res.data;
  const season_2026 = standing2026
    ? {
        position: standing2026.position as number,
        points: standing2026.points as number,
        wins: standing2026.wins as number,
      }
    : null;

  return NextResponse.json<ConstructorDetail>({
    constructor_id: constructorId,
    constructor_ref: constructor.constructor_ref as string,
    name: constructor.name as string,
    nationality: constructor.nationality as string,
    first_year: stats.first_year as number,
    last_year: stats.last_year as number,
    races: stats.races as number,
    wins: stats.wins as number,
    podiums: podiumsRes.count ?? 0,
    fastest_laps: fastestLapsRes.count ?? 0,
    season_2026,
    last_5_results,
  });
}
