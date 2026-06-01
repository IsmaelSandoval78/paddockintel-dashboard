import { createClient } from '@/lib/supabase/server';
import type { Circuit } from '@/lib/types';
import CircuitsClient from '@/components/circuits/CircuitsClient';

async function getAllCircuits(): Promise<Circuit[]> {
  const supabase = createClient();

  const [circuitsRes, races2026Res] = await Promise.all([
    supabase
      .from('circuits')
      .select('id, circuit_ref, name, location, country, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null),
    supabase
      .from('races')
      .select('circuit_id')
      .eq('year', 2026),
  ]);

  if (circuitsRes.error) {
    console.error('circuits fetch error:', circuitsRes.error.message);
    return [];
  }

  const ids2026 = new Set(
    (races2026Res.data ?? []).map((r) => (r as { circuit_id: number }).circuit_id)
  );

  return (circuitsRes.data ?? []).map((c) => ({
    id: c.id as number,
    circuit_ref: c.circuit_ref as string,
    name: c.name as string,
    location: c.location as string,
    country: c.country as string,
    lat: c.lat as number,
    lng: c.lng as number,
    is_2026: ids2026.has(c.id as number),
  }));
}

export default async function CircuitsPage() {
  const circuits = await getAllCircuits();
  return <CircuitsClient circuits={circuits} totalCount={circuits.length} />;
}
