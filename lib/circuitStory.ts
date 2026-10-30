// Circuit page, "the story of a track" (docs/DECISION-2026-10-11-home-dusk.md, circuit section):
// everything the page shows, read from Supabase. Each chapter is null or empty when its data is
// missing, and the page hides it -- never a placeholder or an older value.
import { createClient } from '@/lib/supabase/server';
import { editorialToday } from '@/lib/dates';


export type Edition = {
  raceId: number;
  year: number;
  round: number;
  name: string;
  layout: string | null;
  winner: { surname: string; ref: string; teamRef: string; teamName: string; grid: number };
  pole: { surname: string; ref: string } | null;
  fastestLap: { surname: string; time: string } | null;
  starters: number;
  retirements: number;
  podium: Array<{ position: number; surname: string; teamRef: string }>;
};

export type Era = {
  layout: string | null;
  from: number;
  to: number;
  editions: Edition[];
  poleWins: number;
  retirementPct: number | null;
  topWinners: { surnames: string[]; wins: number } | null;
};

type LapRecord = { time: string; surname: string; year: number };

export type CircuitStory = {
  circuit: { id: number; ref: string; name: string; location: string; country: string; lat: number | null; lng: number | null; alt: number | null };
  editions: Edition[];
  eras: Era[];
  // The circuit's race on the calendar that hasn't been run yet, if any.
  upcoming: { raceId: number; year: number; round: number; name: string; date: string; seasonRounds: number; isNext: boolean; daysUntil: number } | null;
  // Highest circuit on the latest calendar, with the runner-up for scale.
  altitude: { metres: number; highestOnCalendar: { year: number; next: { name: string; location: string; metres: number } | null } | null } | null;
  poleWins: number;
  topDrivers: Array<{ surname: string; teamRef: string; wins: number; years: number[] }>;
  topTeams: Array<{ name: string; ref: string; wins: number }>;
  // Records on the current layout only (laps on other layouts aren't comparable).
  records: { raceLap: LapRecord | null; pole: LapRecord | null; fastestQuali: (LapRecord & { pole: string | null }) | null } | null;
};

function lapMs(t: string | null | undefined): number {
  if (!t || !t.includes(':')) return Infinity;
  const [m, s] = t.split(':');
  const ms = parseInt(m, 10) * 60000 + parseFloat(s) * 1000;
  return Number.isFinite(ms) ? ms : Infinity;
}

const NON_STARTS = new Set(['F', 'W', 'E']);

// PostgREST returns at most 1,000 rows per request; long-running circuits have more results than that.
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

export async function getCircuitStory(slug: string): Promise<CircuitStory | null> {
  const supabase = createClient();
  const today = editorialToday();

  const { data: c } = await supabase
    .from('circuits')
    .select('id, circuit_ref, name, location, country, lat, lng, alt')
    .eq('circuit_ref', slug)
    .single();
  if (!c) return null;
  const circuit = {
    id: c.id as number,
    ref: c.circuit_ref as string,
    name: c.name as string,
    location: c.location as string,
    country: c.country as string,
    lat: (c.lat as number | null) ?? null,
    lng: (c.lng as number | null) ?? null,
    alt: (c.alt as number | null) ?? null,
  };

  const { data: raceRows } = await supabase
    .from('races')
    .select('id, year, round, name, date, circuit_layout')
    .eq('circuit_id', circuit.id)
    .order('year', { ascending: true });
  const races = raceRows ?? [];
  const raceIds = races.map((r) => r.id as number);

  type ResultRow = {
    race_id: number;
    driver_id: number;
    constructor_id: number;
    grid: number | null;
    position: number | null;
    position_text: string | null;
    pole: boolean | null;
    rank: number | null;
    fastest_lap_time: string | null;
  };
  const results = raceIds.length
    ? await allRows<ResultRow>((from, to) =>
        supabase
          .from('results')
          .select('race_id, driver_id, constructor_id, grid, position, position_text, pole, rank, fastest_lap_time')
          .in('race_id', raceIds)
          .order('id', { ascending: true })
          .range(from, to),
      )
    : [];

  const driverIds = [...new Set(results.filter((r) => (r.position ?? 99) <= 3 || r.pole || r.rank === 1).map((r) => r.driver_id))];
  const constructorIds = [...new Set(results.filter((r) => (r.position ?? 99) <= 3).map((r) => r.constructor_id))];
  const [driversRes, constructorsRes] = await Promise.all([
    driverIds.length ? supabase.from('drivers').select('id, surname, driver_ref').in('id', driverIds) : Promise.resolve({ data: [] }),
    constructorIds.length ? supabase.from('constructors').select('id, constructor_ref, name').in('id', constructorIds) : Promise.resolve({ data: [] }),
  ]);
  const driverById = new Map((driversRes.data ?? []).map((d) => [d.id as number, { surname: d.surname as string, ref: d.driver_ref as string }]));
  const teamById = new Map((constructorsRes.data ?? []).map((t) => [t.id as number, { ref: t.constructor_ref as string, name: t.name as string }]));

  const byRace = new Map<number, ResultRow[]>();
  for (const r of results) {
    if (!byRace.has(r.race_id)) byRace.set(r.race_id, []);
    byRace.get(r.race_id)!.push(r);
  }

  const editions: Edition[] = races.flatMap((race) => {
    const rows = byRace.get(race.id as number) ?? [];
    const w = rows.find((r) => r.position === 1);
    const wd = w ? driverById.get(w.driver_id) : undefined;
    const wt = w ? teamById.get(w.constructor_id) : undefined;
    if (!w || !wd || !wt) return [];
    const pole = rows.find((r) => r.pole);
    const fl = rows.find((r) => r.rank === 1 && r.fastest_lap_time);
    const starts = rows.filter((r) => !NON_STARTS.has(r.position_text ?? ''));
    return [
      {
        raceId: race.id as number,
        year: race.year as number,
        round: race.round as number,
        name: race.name as string,
        layout: (race.circuit_layout as string | null) ?? null,
        winner: { surname: wd.surname, ref: wd.ref, teamRef: wt.ref, teamName: wt.name, grid: w.grid ?? 0 },
        pole: pole && driverById.get(pole.driver_id) ? driverById.get(pole.driver_id)! : null,
        fastestLap: fl ? { surname: driverById.get(fl.driver_id)?.surname ?? '', time: fl.fastest_lap_time! } : null,
        starters: starts.length,
        retirements: starts.filter((r) => r.position_text === 'R').length,
        podium: rows
          .filter((r) => r.position !== null && r.position <= 3)
          .sort((a, b) => a.position! - b.position!)
          .map((r) => ({ position: r.position!, surname: driverById.get(r.driver_id)?.surname ?? '', teamRef: teamById.get(r.constructor_id)?.ref ?? '' })),
      },
    ];
  });

  const wonFromPole = (e: Edition) => e.pole !== null && e.pole.ref === e.winner.ref;
  const topOf = (list: Edition[]) => {
    const tally = new Map<string, number>();
    for (const e of list) tally.set(e.winner.surname, (tally.get(e.winner.surname) ?? 0) + 1);
    const best = Math.max(0, ...tally.values());
    return best > 0 ? { wins: best, surnames: [...tally.entries()].filter(([, n]) => n === best).map(([s]) => s) } : null;
  };

  // Eras: consecutive editions on the same layout.
  const eras: Era[] = [];
  for (const e of editions) {
    const last = eras[eras.length - 1];
    if (last && last.layout === e.layout) last.editions.push(e);
    else eras.push({ layout: e.layout, from: e.year, to: e.year, editions: [e], poleWins: 0, retirementPct: null, topWinners: null });
  }
  for (const era of eras) {
    era.from = era.editions[0].year;
    era.to = era.editions[era.editions.length - 1].year;
    era.poleWins = era.editions.filter(wonFromPole).length;
    const starters = era.editions.reduce((s, e) => s + e.starters, 0);
    era.retirementPct = starters > 0 ? Math.round((100 * era.editions.reduce((s, e) => s + e.retirements, 0)) / starters) : null;
    era.topWinners = topOf(era.editions);
  }

  const driverTally = new Map<string, { surname: string; teamRef: string; wins: number; years: number[] }>();
  const teamTally = new Map<string, { name: string; ref: string; wins: number }>();
  for (const e of editions) {
    const d = driverTally.get(e.winner.ref) ?? { surname: e.winner.surname, teamRef: e.winner.teamRef, wins: 0, years: [] };
    driverTally.set(e.winner.ref, { ...d, teamRef: e.winner.teamRef, wins: d.wins + 1, years: [...d.years, e.year] });
    const t = teamTally.get(e.winner.teamRef) ?? { name: e.winner.teamName, ref: e.winner.teamRef, wins: 0 };
    teamTally.set(e.winner.teamRef, { ...t, wins: t.wins + 1 });
  }
  const topDrivers = [...driverTally.values()].sort((a, b) => b.wins - a.wins || a.years[0] - b.years[0]).slice(0, 5);
  const topTeams = [...teamTally.values()].sort((a, b) => b.wins - a.wins).slice(0, 5);

  // The race on the calendar here that hasn't been run, and whether it's the next one anywhere.
  const pending = races.find((r) => (r.date as string) >= today && !editions.some((e) => e.raceId === (r.id as number)));
  let upcoming: CircuitStory['upcoming'] = null;
  if (pending) {
    const [{ data: nextAny }, { count: seasonRounds }] = await Promise.all([
      supabase.from('races').select('id').gte('date', today).order('date', { ascending: true }).limit(1).single(),
      supabase.from('races').select('*', { count: 'exact', head: true }).eq('year', pending.year as number),
    ]);
    upcoming = {
      raceId: pending.id as number,
      year: pending.year as number,
      round: pending.round as number,
      name: pending.name as string,
      date: pending.date as string,
      seasonRounds: seasonRounds ?? 0,
      isNext: (nextAny?.id as number | undefined) === (pending.id as number),
      daysUntil: Math.round((Date.parse(pending.date as string) - Date.parse(today)) / 86_400_000),
    };
  }

  // Altitude, and whether this is the highest circuit on the latest calendar.
  let altitude: CircuitStory['altitude'] = null;
  if (circuit.alt !== null) {
    const { data: latestRace } = await supabase.from('races').select('year').order('year', { ascending: false }).limit(1).single();
    const latestYear = latestRace?.year as number | undefined;
    let highestOnCalendar: NonNullable<CircuitStory['altitude']>['highestOnCalendar'] = null;
    if (latestYear && races.some((r) => (r.year as number) === latestYear)) {
      const { data: calendar } = await supabase.from('races').select('circuit_id').eq('year', latestYear);
      const ids = [...new Set((calendar ?? []).map((r) => r.circuit_id as number))];
      const { data: alts } = await supabase.from('circuits').select('id, name, location, alt').in('id', ids).not('alt', 'is', null).order('alt', { ascending: false }).limit(2);
      if (alts?.[0] && (alts[0].id as number) === circuit.id) {
        const next = alts[1];
        highestOnCalendar = {
          year: latestYear,
          next: next ? { name: next.name as string, location: next.location as string, metres: next.alt as number } : null,
        };
      }
    }
    altitude = { metres: circuit.alt, highestOnCalendar };
  }

  // Records on the current layout: the race lap record (rank 1), the pole record (the official pole
  // sitter's qualifying lap) and the fastest qualifying lap if it isn't the pole record. Our
  // qualifying table starts in 1994 and has gaps; a missing lap is left out, never filled.
  const currentLayout = (races[races.length - 1]?.circuit_layout as string | null | undefined) ?? null;
  let records: CircuitStory['records'] = null;
  if (currentLayout) {
    const onLayout = editions.filter((e) => e.layout === currentLayout);
    const yearOf = new Map(onLayout.map((e) => [e.raceId, e.year]));
    const layoutRaceIds = onLayout.map((e) => e.raceId);
    let raceLap: LapRecord | null = null;
    for (const e of onLayout) {
      if (e.fastestLap && (!raceLap || lapMs(e.fastestLap.time) < lapMs(raceLap.time))) raceLap = { time: e.fastestLap.time, surname: e.fastestLap.surname, year: e.year };
    }
    let pole: LapRecord | null = null;
    let fastestQuali: (LapRecord & { pole: string | null }) | null = null;
    if (layoutRaceIds.length) {
      type QRow = { race_id: number; driver_id: number; position: number | null; q1: string | null; q2: string | null; q3: string | null };
      const quali = await allRows<QRow>((from, to) =>
        supabase.from('qualifying').select('race_id, driver_id, position, q1, q2, q3').in('race_id', layoutRaceIds).order('id', { ascending: true }).range(from, to),
      );
      const qDriverIds = [...new Set(quali.filter((q) => q.position === 1).map((q) => q.driver_id))].filter((id) => !driverById.has(id));
      if (qDriverIds.length) {
        const { data: extra } = await supabase.from('drivers').select('id, surname, driver_ref').in('id', qDriverIds);
        for (const d of extra ?? []) driverById.set(d.id as number, { surname: d.surname as string, ref: d.driver_ref as string });
      }
      const best = (q: QRow) => [q.q3, q.q2, q.q1].filter((t): t is string => !!t && t.includes(':')).sort((a, b) => lapMs(a) - lapMs(b))[0] ?? null;
      const poleDriver = new Map(layoutRaceIds.flatMap((id) => (byRace.get(id) ?? []).filter((r) => r.pole).map((r) => [id, r.driver_id] as const)));
      for (const q of quali) {
        const time = best(q);
        const year = yearOf.get(q.race_id);
        const surname = driverById.get(q.driver_id)?.surname;
        if (!time || !year || !surname) continue;
        if (poleDriver.get(q.race_id) === q.driver_id && (!pole || lapMs(time) < lapMs(pole.time))) pole = { time, surname, year };
        if (q.position === 1 && (!fastestQuali || lapMs(time) < lapMs(fastestQuali.time))) {
          const poleId = poleDriver.get(q.race_id);
          fastestQuali = { time, surname, year, pole: poleId !== undefined ? (driverById.get(poleId)?.surname ?? null) : null };
        }
      }
      if (fastestQuali && pole && lapMs(fastestQuali.time) >= lapMs(pole.time)) fastestQuali = null;
    }
    records = raceLap || pole ? { raceLap, pole, fastestQuali } : null;
  }

  return {
    circuit,
    editions,
    eras,
    upcoming,
    altitude,
    poleWins: editions.filter(wonFromPole).length,
    topDrivers,
    topTeams,
    records,
  };
}
