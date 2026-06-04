import { createClient } from '@/lib/supabase/server';
import type { Circuit } from '@/lib/types';
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

export default async function CircuitsPage() {
  const circuits = await getAllCircuits();
  return <CircuitsClient circuits={circuits} totalCount={circuits.length} />;
}
