import { createClient } from '@/lib/supabase/server';
import { getLatestStandingsRaceId } from '@/lib/latestRace';
import NavbarShell from './NavbarShell';

async function getCurrentRound(): Promise<{ round: number; year: number } | null> {
  try {
    const supabase = createClient();
    const raceId = await getLatestStandingsRaceId(supabase);
    if (raceId === null) return null;
    const { data: race } = await supabase
      .from('races')
      .select('round, year')
      .eq('id', raceId)
      .single();
    return race ? { round: race.round as number, year: race.year as number } : null;
  } catch {
    return null;
  }
}

// Server half of the navbar: only the current round (cacheable, no request data). The rest,
// including which chrome to show and the signed-in state, is NavbarShell (client).
export default async function Navbar() {
  const current = await getCurrentRound();
  return <NavbarShell current={current} />;
}
