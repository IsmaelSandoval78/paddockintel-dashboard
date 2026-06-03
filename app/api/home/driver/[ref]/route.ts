import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HomeScorecardData } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const supabase = createClient();

  // Batch 1: driver info by slug
  const { data: driverRaw } = await supabase
    .from('drivers')
    .select('id, number, forename, surname, code, nationality, driver_ref')
    .eq('driver_ref', ref)
    .single();

  if (!driverRaw) return NextResponse.json(null, { status: 404 });

  const driverId = driverRaw.id as number;

  // Batch 2: career stats + DNF count (parallel)
  const [statsRes, dnfRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select('wins, races, podiums, poles, fastest_laps')
      .eq('driver_id', driverId)
      .single(),
    supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', driverId)
      .is('position', null),
  ]);

  if (!statsRes.data) return NextResponse.json(null, { status: 404 });

  const s = statsRes.data;

  return NextResponse.json<HomeScorecardData>({
    driver_id: driverId,
    driver_ref: driverRaw.driver_ref as string,
    forename: driverRaw.forename as string,
    surname: driverRaw.surname as string,
    nationality: driverRaw.nationality as string,
    code: (driverRaw.code as string | null) ?? null,
    number: (driverRaw.number as number | null) ?? null,
    wins: s.wins as number,
    podiums: s.podiums as number,
    poles: s.poles as number,
    fastest_laps: s.fastest_laps as number,
    races: s.races as number,
    dnfs: dnfRes.count ?? 0,
  });
}
