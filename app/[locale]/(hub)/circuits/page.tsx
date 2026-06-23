import { createClient } from '@/lib/supabase/server';
import type { Circuit, CalendarStop } from '@/lib/types';
import CircuitsClient from '@/components/circuits/CircuitsClient';

async function getAllCircuits(): Promise<Circuit[]> {
  const supabase = createClient();

  const [circuitsRes, racesActiveRes] = await Promise.all([
    supabase
      .from('circuits')
      .select('id, circuit_ref, name, location, country, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null),
    supabase
      .from('races')
      .select('circuit_id')
      .gte('year', 2020),
  ]);

  if (circuitsRes.error) {
    console.error('circuits fetch error:', circuitsRes.error.message);
    return [];
  }

  const idsActive = new Set(
    (racesActiveRes.data ?? []).map((r) => (r as { circuit_id: number }).circuit_id)
  );

  return (circuitsRes.data ?? []).map((c) => ({
    id: c.id as number,
    circuit_ref: c.circuit_ref as string,
    name: c.name as string,
    location: c.location as string,
    country: c.country as string,
    lat: c.lat as number,
    lng: c.lng as number,
    is_active: idsActive.has(c.id as number),
  }));
}

async function getCalendar2026(circuits: Circuit[]): Promise<CalendarStop[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('races')
    .select('round, circuit_id, name')
    .eq('year', 2026)
    .order('round', { ascending: true });

  const circuitMap = new Map(circuits.map((c) => [c.id, c]));

  return (data ?? []).flatMap((r) => {
    const circuit = circuitMap.get(r.circuit_id as number);
    if (!circuit) return [];
    return [{
      round: r.round as number,
      circuitId: circuit.id,
      lat: circuit.lat,
      lng: circuit.lng,
      name: r.name as string,
    }];
  });
}

export default async function CircuitsPage() {
  const circuits = await getAllCircuits();
  const calendar2026 = await getCalendar2026(circuits);
  return (
    <CircuitsClient
      circuits={circuits}
      totalCount={circuits.length}
      calendar2026={calendar2026}
    />
  );
}
