import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CompareH2HData } from '@/lib/types';

// Real on-track head-to-head: every race both drivers started, who finished ahead.
// Rule: both classified → lower position wins; one classified + one DNF → the
// classified driver wins; both DNF → no point. Qualifying compared by position.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ refA: string; refB: string }> }
) {
  const { refA, refB } = await params;
  const supabase = createClient();

  const { data: driverRows } = await supabase
    .from('drivers')
    .select('id, driver_ref')
    .in('driver_ref', [refA, refB]);

  const idA = driverRows?.find((d) => d.driver_ref === refA)?.id as number | undefined;
  const idB = driverRows?.find((d) => d.driver_ref === refB)?.id as number | undefined;
  if (!idA || !idB) return NextResponse.json(null, { status: 404 });

  // One query per driver per table — a combined .in() for two 400-race careers
  // would brush against the PostgREST 1,000-row cap
  const [resARes, resBRes, qualARes, qualBRes] = await Promise.all([
    supabase.from('results').select('race_id, position').eq('driver_id', idA),
    supabase.from('results').select('race_id, position').eq('driver_id', idB),
    supabase.from('qualifying').select('race_id, position').eq('driver_id', idA),
    supabase.from('qualifying').select('race_id, position').eq('driver_id', idB),
  ]);

  type Slot = { a?: number | null; b?: number | null };
  const raceMap = new Map<number, Slot>();
  for (const r of resARes.data ?? []) {
    const rid = r.race_id as number;
    if (!raceMap.has(rid)) raceMap.set(rid, {});
    raceMap.get(rid)!.a = r.position === null ? null : Number(r.position);
  }
  for (const r of resBRes.data ?? []) {
    const rid = r.race_id as number;
    if (!raceMap.has(rid)) raceMap.set(rid, {});
    raceMap.get(rid)!.b = r.position === null ? null : Number(r.position);
  }

  let sharedRaces = 0;
  let aRaceAhead = 0;
  let bRaceAhead = 0;
  const sharedRaceIds: number[] = [];
  for (const [rid, s] of raceMap) {
    if (s.a === undefined || s.b === undefined) continue;
    sharedRaces++;
    sharedRaceIds.push(rid);
    if (s.a !== null && s.b !== null) {
      if (s.a < s.b) aRaceAhead++;
      else if (s.b < s.a) bRaceAhead++;
    } else if (s.a !== null) {
      aRaceAhead++;
    } else if (s.b !== null) {
      bRaceAhead++;
    }
  }

  const qualiMap = new Map<number, Slot>();
  for (const q of qualARes.data ?? []) {
    const rid = q.race_id as number;
    if (!qualiMap.has(rid)) qualiMap.set(rid, {});
    qualiMap.get(rid)!.a = q.position === null ? null : Number(q.position);
  }
  for (const q of qualBRes.data ?? []) {
    const rid = q.race_id as number;
    if (!qualiMap.has(rid)) qualiMap.set(rid, {});
    qualiMap.get(rid)!.b = q.position === null ? null : Number(q.position);
  }

  let qualiSessions = 0;
  let aQualiAhead = 0;
  let bQualiAhead = 0;
  for (const s of qualiMap.values()) {
    if (s.a === undefined || s.b === undefined || s.a === null || s.b === null) continue;
    if (s.a === s.b) continue;
    qualiSessions++;
    if (s.a < s.b) aQualiAhead++;
    else bQualiAhead++;
  }

  // Shared span — chunk the id list to keep each request URL well under limits
  let firstYear: number | null = null;
  let lastYear: number | null = null;
  for (let i = 0; i < sharedRaceIds.length; i += 200) {
    const { data: raceYears } = await supabase
      .from('races')
      .select('year')
      .in('id', sharedRaceIds.slice(i, i + 200));
    for (const r of raceYears ?? []) {
      const y = r.year as number;
      if (firstYear === null || y < firstYear) firstYear = y;
      if (lastYear === null || y > lastYear) lastYear = y;
    }
  }

  return NextResponse.json<CompareH2HData>({
    shared_races: sharedRaces,
    a_race_ahead: aRaceAhead,
    b_race_ahead: bRaceAhead,
    quali_sessions: qualiSessions,
    a_quali_ahead: aQualiAhead,
    b_quali_ahead: bQualiAhead,
    first_shared_year: firstYear,
    last_shared_year: lastYear,
  });
}
