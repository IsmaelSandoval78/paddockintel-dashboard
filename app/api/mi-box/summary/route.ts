import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export interface MiBoxSummaryDriver {
  ref: string;
  surname: string;
  constructorRef: string;
  points: number | null;
  position: number | null;
}
export interface MiBoxSummaryConstructor {
  ref: string;
  name: string;
  points: number | null;
  position: number | null;
}
export interface MiBoxSummaryResponse {
  drivers: MiBoxSummaryDriver[];
  constructors: MiBoxSummaryConstructor[];
}

// Client-fetched (not a Server Component) on purpose — the Hub home page has
// `revalidate = 3600` (ISR); reading the mi-box cookie server-side there would force it
// into fully dynamic rendering on every request. Matches the existing exception in
// CLAUDE.md Performance Rules ("no client-side fetching unless interactive") — this is the
// same pattern as TrackDominancePanel's /api/circuits/dominance.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const driverRefs = (searchParams.get('drivers') ?? '').split(',').filter(Boolean);
  const constructorRefs = (searchParams.get('constructors') ?? '').split(',').filter(Boolean);

  if (driverRefs.length === 0 && constructorRefs.length === 0) {
    return NextResponse.json({ drivers: [], constructors: [] } satisfies MiBoxSummaryResponse);
  }

  const supabase = createClient();

  const { data: latestStandingsRace } = await supabase
    .from('driver_standings')
    .select('race_id')
    .order('race_id', { ascending: false })
    .limit(1)
    .single();
  const raceId = latestStandingsRace?.race_id as number | undefined;

  const [driversRes, constructorsRes] = await Promise.all([
    driverRefs.length
      ? supabase.from('drivers').select('id, driver_ref, surname').in('driver_ref', driverRefs)
      : Promise.resolve({ data: [] as Array<{ id: number; driver_ref: string; surname: string }> }),
    constructorRefs.length
      ? supabase.from('constructors').select('id, constructor_ref, name').in('constructor_ref', constructorRefs)
      : Promise.resolve({ data: [] as Array<{ id: number; constructor_ref: string; name: string }> }),
  ]);

  const driverIds = (driversRes.data ?? []).map((d) => d.id);
  const constructorIds = (constructorsRes.data ?? []).map((c) => c.id);

  const [driverStandRes, constructorStandRes, driverResultsRes] = raceId
    ? await Promise.all([
        driverIds.length
          ? supabase.from('driver_standings').select('driver_id, points, position').eq('race_id', raceId).in('driver_id', driverIds)
          : Promise.resolve({ data: [] as Array<{ driver_id: number; points: number; position: number }> }),
        constructorIds.length
          ? supabase.from('constructor_standings').select('constructor_id, points, position').eq('race_id', raceId).in('constructor_id', constructorIds)
          : Promise.resolve({ data: [] as Array<{ constructor_id: number; points: number; position: number }> }),
        driverIds.length
          ? supabase.from('results').select('driver_id, constructor_id').eq('race_id', raceId).in('driver_id', driverIds)
          : Promise.resolve({ data: [] as Array<{ driver_id: number; constructor_id: number }> }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const driverStandMap = new Map((driverStandRes.data ?? []).map((s) => [s.driver_id, s]));
  const constructorStandMap = new Map((constructorStandRes.data ?? []).map((s) => [s.constructor_id, s]));
  const driverConstructorMap = new Map((driverResultsRes.data ?? []).map((r) => [r.driver_id, r.constructor_id]));
  const constructorRefById = new Map((constructorsRes.data ?? []).map((c) => [c.id, c.constructor_ref]));

  // Preserve the caller's own follow order (most-recently-followed first), not a ranking.
  const drivers: MiBoxSummaryDriver[] = driverRefs.flatMap((ref) => {
    const d = (driversRes.data ?? []).find((row) => row.driver_ref === ref);
    if (!d) return [];
    const standing = driverStandMap.get(d.id);
    const conId = driverConstructorMap.get(d.id);
    return [{
      ref,
      surname: d.surname,
      constructorRef: (conId !== undefined ? constructorRefById.get(conId) : undefined) ?? '',
      points: standing?.points ?? null,
      position: standing?.position ?? null,
    }];
  });

  const constructors: MiBoxSummaryConstructor[] = constructorRefs.flatMap((ref) => {
    const c = (constructorsRes.data ?? []).find((row) => row.constructor_ref === ref);
    if (!c) return [];
    const standing = constructorStandMap.get(c.id);
    return [{
      ref,
      name: c.name,
      points: standing?.points ?? null,
      position: standing?.position ?? null,
    }];
  });

  return NextResponse.json({ drivers, constructors } satisfies MiBoxSummaryResponse);
}
