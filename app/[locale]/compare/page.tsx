import { createClient } from '@/lib/supabase/server';
import type { DriverSelectorRow, ConstructorSelectorRow } from '@/lib/types';
import CompareClient from '@/components/compare/CompareClient';

async function getSelectorData(): Promise<{
  drivers: DriverSelectorRow[];
  constructors: ConstructorSelectorRow[];
}> {
  const supabase = createClient();

  // Both lists fit within the 1000-row cap: 865 drivers, 214 constructors
  const [driverStatsRes, conStatsRes, driversRes, constructorsRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select('driver_id, wins, nationality')
      .order('wins', { ascending: false }),
    supabase
      .from('constructor_stats')
      .select('constructor_id, wins, nationality')
      .order('wins', { ascending: false }),
    supabase
      .from('drivers')
      .select('id, driver_ref, forename, surname'),
    supabase
      .from('constructors')
      .select('id, constructor_ref, name'),
  ]);

  const driverInfoMap = new Map(
    (driversRes.data ?? []).map((d) => [
      d.id as number,
      { driver_ref: d.driver_ref as string, forename: d.forename as string, surname: d.surname as string },
    ])
  );

  const drivers: DriverSelectorRow[] = (driverStatsRes.data ?? []).flatMap((s) => {
    const d = driverInfoMap.get(s.driver_id as number);
    if (!d) return [];
    return [{
      driver_id: s.driver_id as number,
      driver_ref: d.driver_ref,
      forename: d.forename,
      surname: d.surname,
      nationality: s.nationality as string,
      wins: s.wins as number,
    }];
  });

  const constructorInfoMap = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      { constructor_ref: c.constructor_ref as string, name: c.name as string },
    ])
  );

  const constructors: ConstructorSelectorRow[] = (conStatsRes.data ?? []).flatMap((s) => {
    const c = constructorInfoMap.get(s.constructor_id as number);
    if (!c) return [];
    return [{
      constructor_id: s.constructor_id as number,
      constructor_ref: c.constructor_ref,
      name: c.name,
      nationality: s.nationality as string,
      wins: s.wins as number,
    }];
  });

  return { drivers, constructors };
}

export default async function ComparePage() {
  const { drivers, constructors } = await getSelectorData();
  return <CompareClient drivers={drivers} constructors={constructors} />;
}
