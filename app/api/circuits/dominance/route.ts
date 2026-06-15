import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refA = searchParams.get('a');
  const refB = searchParams.get('b');

  if (!refA || !refB) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const supabase = createClient();

  // Resolve driver_ref → id (parallel)
  const [{ data: dA }, { data: dB }] = await Promise.all([
    supabase.from('drivers').select('id').eq('driver_ref', refA).single(),
    supabase.from('drivers').select('id').eq('driver_ref', refB).single(),
  ]);

  if (!dA || !dB) {
    return NextResponse.json({ error: 'driver not found' }, { status: 404 });
  }

  const idA = dA.id as number;
  const idB = dB.id as number;

  // Fetch all classified results for both drivers (parallel)
  const [{ data: resA }, { data: resB }] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, position')
      .eq('driver_id', idA)
      .not('position', 'is', null),
    supabase
      .from('results')
      .select('race_id, position')
      .eq('driver_id', idB)
      .not('position', 'is', null),
  ]);

  const mapA = new Map<number, number>(
    (resA ?? []).map((r) => [r.race_id as number, r.position as number])
  );
  const mapB = new Map<number, number>(
    (resB ?? []).map((r) => [r.race_id as number, r.position as number])
  );

  // Races where both classified
  const sharedIds = [...mapA.keys()].filter((id) => mapB.has(id));
  if (sharedIds.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Get circuit_id for each shared race
  const { data: racesData } = await supabase
    .from('races')
    .select('id, circuit_id')
    .in('id', sharedIds);

  // Aggregate H2H per circuit
  const circuitStats = new Map<number, { winsA: number; winsB: number; total: number }>();

  for (const race of racesData ?? []) {
    const raceId = race.id as number;
    const circuitId = race.circuit_id as number;
    const posA = mapA.get(raceId)!;
    const posB = mapB.get(raceId)!;

    const s = circuitStats.get(circuitId) ?? { winsA: 0, winsB: 0, total: 0 };
    s.total++;
    if (posA < posB) s.winsA++;
    else if (posB < posA) s.winsB++;
    circuitStats.set(circuitId, s);
  }

  const results = [...circuitStats.entries()].map(([circuit_id, s]) => ({
    circuit_id,
    wins_a: s.winsA,
    wins_b: s.winsB,
    total: s.total,
  }));

  return NextResponse.json({ results });
}
