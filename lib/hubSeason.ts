// Hub home, "the season so far" (docs/DECISION-2026-10-11-home-dusk.md, Hub section): everything the
// page shows, read from Supabase. Each chapter is null when its data is missing, and the page hides
// it -- never a placeholder or an older value.
import { createClient } from '@/lib/supabase/server';
import { editorialToday } from '@/lib/dates';
import { getLatestStandingsRaceId } from '@/lib/latestRace';
import { GP_POINTS, SPRINT_WIN_POINTS, clinchPoints } from '@/lib/titleStakes';
import { poleToWinAt } from '@/app/[locale]/(blog)/magazine-home/dusk-data';

type Client = ReturnType<typeof createClient>;

export type SeasonDriver = { id: number; code: string; surname: string; ref: string; teamRef: string };

export type SeasonRound = {
  round: number;
  raceId: number;
  name: string;
  date: string;
  location: string;
  sprint: boolean;
  // Only for rounds with standings.
  winner: { code: string; surname: string; teamRef: string; grid: number } | null;
  poleCode: string | null;
  leaderCode: string | null;
};

export type HubSeason = {
  year: number;
  lastRound: number;
  totalRounds: number;
  racesLeft: number;
  pointsLeft: number;
  rounds: SeasonRound[];
  // Cumulative points after each round 1..lastRound, top five of the current standings.
  series: Array<{ code: string; surname: string; points: number[] }>;
  standings: Array<SeasonDriver & { position: number; points: number; wins: number }>;
  constructors: Array<{ ref: string; name: string; position: number; points: number }>;
  leader: SeasonDriver & { points: number; wins: number; leadSince: number; roundsLed: number };
  rival: (SeasonDriver & { points: number; wins: number; roundsLed: number }) | null;
  // Title state for the headline: decided, can be decided at the next race (fewest points the
  // leader needs), or open.
  title: { state: 'decided' } | { state: 'clinchable'; points: number } | { state: 'open' };
  facts: {
    winners: number;
    topTeam: { ref: string; name: string; wins: number } | null;
    poleWins: number;
    deepest: { round: number; location: string; surname: string; grid: number } | null;
  };
  lastRace: {
    raceId: number;
    round: number;
    name: string;
    date: string;
    location: string;
    circuitRef: string;
    rows: Array<{
      code: string;
      surname: string;
      teamRef: string;
      grid: number;
      positionOrder: number;
      positionText: string;
      classified: boolean;
      time: string | null;
      fastestLap: string | null;
      rank: number | null;
    }>;
    report: { slug: string; title: string } | null;
  } | null;
  nextRace: {
    round: number;
    name: string;
    date: string;
    location: string;
    circuitRef: string;
    circuitName: string;
    sprint: boolean;
    editions: number;
    sinceYear: number | null;
    topWinners: Array<{ surnames: string[]; wins: number }>;
    recentWinners: Array<{ year: number; surname: string; grid: number }>;
  } | null;
  // Points scored over the last five rounds (or since round 1), most first.
  form: Array<{ code: string; surname: string; teamRef: string; points: number; results: string[] }>;
  formFrom: number;
  archive: { seasons: number; firstYear: number; races: number; results: number; drivers: number; constructors: number; circuits: number } | null;
};

const FORM_ROUNDS = 5;

export async function getHubSeason(locale: string): Promise<HubSeason | null> {
  const supabase = createClient();
  const today = editorialToday();
  const latestId = await getLatestStandingsRaceId(supabase);
  if (latestId === null) return null;

  const { data: latest } = await supabase.from('races').select('year').eq('id', latestId).single();
  if (!latest) return null;
  const year = latest.year as number;

  const { data: raceRows } = await supabase
    .from('races')
    .select('id, round, name, date, circuit_id, sprint_date')
    .eq('year', year)
    .order('round', { ascending: true });
  const races = raceRows ?? [];
  const lastRace = races.find((r) => (r.id as number) === latestId);
  if (!lastRace) return null;
  const lastRound = lastRace.round as number;
  const done = races.filter((r) => (r.round as number) <= lastRound);
  const doneIds = done.map((r) => r.id as number);
  const after = races.filter((r) => (r.round as number) > lastRound);
  const next = after[0] ?? null;

  const [circuitsRes, standingsRes, keyResultsRes, lastResultsRes, consRes, consStandRes, reportRes, archive] = await Promise.all([
    supabase.from('circuits').select('id, circuit_ref, name, location').in('id', [...new Set(races.map((r) => r.circuit_id as number))]),
    supabase.from('driver_standings').select('race_id, driver_id, points, position, wins').in('race_id', doneIds),
    supabase.from('results').select('race_id, driver_id, constructor_id, grid, position, pole').in('race_id', doneIds).or('position.eq.1,pole.eq.true'),
    supabase
      .from('results')
      .select('driver_id, constructor_id, grid, position_order, position_text, position, time, fastest_lap_time, rank')
      .eq('race_id', latestId)
      .order('position_order', { ascending: true }),
    supabase.from('constructors').select('id, constructor_ref, name'),
    supabase.from('constructor_standings').select('constructor_id, points, position').eq('race_id', latestId).order('position', { ascending: true }),
    supabase
      .from('articles')
      .select('slug, title')
      .eq('race_id', latestId)
      .eq('locale', locale)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(1),
    archiveCounts(supabase, today),
  ]);

  const circuitById = new Map((circuitsRes.data ?? []).map((c) => [c.id as number, c]));
  const constructorById = new Map((consRes.data ?? []).map((c) => [c.id as number, { ref: c.constructor_ref as string, name: c.name as string }]));
  const roundById = new Map(done.map((r) => [r.id as number, r.round as number]));

  // Each driver's team: their constructor in the latest race, else in any key result of the season.
  const teamByDriver = new Map<number, string>();
  for (const r of keyResultsRes.data ?? []) teamByDriver.set(r.driver_id as number, constructorById.get(r.constructor_id as number)?.ref ?? '');
  for (const r of lastResultsRes.data ?? []) teamByDriver.set(r.driver_id as number, constructorById.get(r.constructor_id as number)?.ref ?? '');

  const standingRows = standingsRes.data ?? [];
  const driverIds = [...new Set([...standingRows.map((s) => s.driver_id as number), ...(lastResultsRes.data ?? []).map((r) => r.driver_id as number)])];
  const { data: driverRows } = driverIds.length
    ? await supabase.from('drivers').select('id, code, surname, driver_ref').in('id', driverIds)
    : { data: [] };
  const driverById = new Map<number, SeasonDriver>(
    (driverRows ?? []).map((d) => [
      d.id as number,
      {
        id: d.id as number,
        code: (d.code as string | null) ?? (d.surname as string),
        surname: d.surname as string,
        ref: d.driver_ref as string,
        teamRef: teamByDriver.get(d.id as number) ?? '',
      },
    ]),
  );

  // points[driver][round]
  const pointsAt = new Map<number, Map<number, number>>();
  const leaderAt = new Map<number, number>();
  for (const s of standingRows) {
    const round = roundById.get(s.race_id as number);
    if (round === undefined) continue;
    const id = s.driver_id as number;
    if (!pointsAt.has(id)) pointsAt.set(id, new Map());
    pointsAt.get(id)!.set(round, Number(s.points));
    if ((s.position as number) === 1) leaderAt.set(round, id);
  }

  const standings = standingRows
    .filter((s) => (s.race_id as number) === latestId)
    .sort((a, b) => (a.position as number) - (b.position as number))
    .flatMap((s) => {
      const d = driverById.get(s.driver_id as number);
      return d ? [{ ...d, position: s.position as number, points: Number(s.points), wins: s.wins as number }] : [];
    });
  if (!standings.length) return null;

  const pointsLeft = after.reduce((sum, r) => sum + GP_POINTS[0] + (r.sprint_date ? SPRINT_WIN_POINTS : 0), 0);
  const roundsLedBy = (id: number) => [...leaderAt.values()].filter((l) => l === id).length;
  const [first, second] = standings;
  let leadSince = lastRound;
  while (leadSince > 1 && leaderAt.get(leadSince - 1) === first.id) leadSince--;

  // Decided when no rival can reach the leader's points; clinchable when the standings are from
  // the round before the next race, that race has no sprint, and some result is enough.
  let title: HubSeason['title'] = { state: 'open' };
  if (standings.slice(1).every((s) => s.points + pointsLeft < first.points)) title = { state: 'decided' };
  else if (next && !next.sprint_date && (next.round as number) === lastRound + 1) {
    const after2 = after.slice(1);
    const pointsAfterNext = after2.reduce((sum, r) => sum + GP_POINTS[0] + (r.sprint_date ? SPRINT_WIN_POINTS : 0), 0);
    const need = clinchPoints(
      standings.map((s) => ({ driverId: s.id, surname: s.surname, points: s.points, wins: s.wins })),
      pointsAfterNext,
      after2.length,
    );
    if (need !== null) title = { state: 'clinchable', points: need };
  }

  const winnerByRace = new Map<number, { driverId: number; teamRef: string; grid: number }>();
  const poleByRace = new Map<number, number>();
  for (const r of keyResultsRes.data ?? []) {
    if ((r.position as number | null) === 1)
      winnerByRace.set(r.race_id as number, {
        driverId: r.driver_id as number,
        teamRef: constructorById.get(r.constructor_id as number)?.ref ?? '',
        grid: r.grid as number,
      });
    if (r.pole) poleByRace.set(r.race_id as number, r.driver_id as number);
  }

  const rounds: SeasonRound[] = races.map((r) => {
    const id = r.id as number;
    const round = r.round as number;
    const w = winnerByRace.get(id);
    const wd = w ? driverById.get(w.driverId) : undefined;
    const pole = poleByRace.get(id);
    const lead = leaderAt.get(round);
    return {
      round,
      raceId: id,
      name: r.name as string,
      date: r.date as string,
      location: (circuitById.get(r.circuit_id as number)?.location as string | undefined) ?? '',
      sprint: !!r.sprint_date,
      winner: w && wd ? { code: wd.code, surname: wd.surname, teamRef: w.teamRef, grid: w.grid } : null,
      poleCode: pole !== undefined ? (driverById.get(pole)?.code ?? null) : null,
      leaderCode: lead !== undefined ? (driverById.get(lead)?.code ?? null) : null,
    };
  });

  const played = rounds.filter((r) => r.round <= lastRound && r.winner);
  const winsByTeam = new Map<string, number>();
  for (const r of played) winsByTeam.set(r.winner!.teamRef, (winsByTeam.get(r.winner!.teamRef) ?? 0) + 1);
  const topTeamEntry = [...winsByTeam.entries()].sort((a, b) => b[1] - a[1])[0];
  const topTeamName = topTeamEntry ? [...constructorById.values()].find((c) => c.ref === topTeamEntry[0])?.name : undefined;
  const deepestRound = [...played].sort((a, b) => b.winner!.grid - a.winner!.grid)[0];

  const series = standings.slice(0, 5).map((s) => {
    let prev = 0;
    const pts = pointsAt.get(s.id);
    return {
      code: s.code,
      surname: s.surname,
      points: Array.from({ length: lastRound }, (_, i) => (prev = pts?.get(i + 1) ?? prev)),
    };
  });

  // Form: points over the last FORM_ROUNDS rounds (since round 1 early in the season).
  const formFrom = Math.max(1, lastRound - FORM_ROUNDS + 1);
  const formIds = done.filter((r) => (r.round as number) >= formFrom).map((r) => r.id as number);
  const { data: formResults } = await supabase
    .from('results')
    .select('race_id, driver_id, position, position_text')
    .in('race_id', formIds)
    .in('driver_id', standings.slice(0, 10).map((s) => s.id));
  const form = standings
    .slice(0, 10)
    .map((s) => {
      const base = formFrom > 1 ? (pointsAt.get(s.id)?.get(formFrom - 1) ?? 0) : 0;
      const results = Array.from({ length: lastRound - formFrom + 1 }, (_, i) => {
        const raceId = done.find((r) => (r.round as number) === formFrom + i)?.id as number | undefined;
        const row = (formResults ?? []).find((x) => x.race_id === raceId && x.driver_id === s.id);
        return row ? ((row.position as number | null) !== null ? String(row.position) : (row.position_text as string)) : '–';
      });
      return { code: s.code, surname: s.surname, teamRef: s.teamRef, points: s.points - base, results };
    })
    .sort((a, b) => b.points - a.points);

  // The last race, every car.
  const lastCircuit = circuitById.get(lastRace.circuit_id as number);
  const lastRows = (lastResultsRes.data ?? []).flatMap((r) => {
    const d = driverById.get(r.driver_id as number);
    if (!d) return [];
    return [
      {
        code: d.code,
        surname: d.surname,
        teamRef: constructorById.get(r.constructor_id as number)?.ref ?? '',
        grid: r.grid as number,
        positionOrder: r.position_order as number,
        positionText: r.position_text as string,
        classified: (r.position as number | null) !== null,
        time: (r.time as string | null) ?? null,
        fastestLap: (r.fastest_lap_time as string | null) ?? null,
        rank: (r.rank as number | null) ?? null,
      },
    ];
  });
  const report = (reportRes.data ?? [])[0];

  // The next Grand Prix and its circuit's history.
  let nextRace: HubSeason['nextRace'] = null;
  if (next) {
    const circuit = circuitById.get(next.circuit_id as number);
    const { data: past } = await supabase
      .from('races')
      .select('id, year')
      .eq('circuit_id', next.circuit_id as number)
      .lt('year', year)
      .order('year', { ascending: true });
    const history = await poleToWinAt(supabase, past ?? []);
    const winsBy = new Map<number, { surname: string; wins: number }>();
    for (const h of history?.history ?? []) {
      const w = winsBy.get(h.winnerId) ?? { surname: h.winner, wins: 0 };
      winsBy.set(h.winnerId, { ...w, wins: w.wins + 1 });
    }
    const tally = Math.max(0, ...[...winsBy.values()].map((w) => w.wins));
    nextRace = circuit
      ? {
          round: next.round as number,
          name: next.name as string,
          date: next.date as string,
          location: circuit.location as string,
          circuitRef: circuit.circuit_ref as string,
          circuitName: circuit.name as string,
          sprint: !!next.sprint_date,
          editions: history?.races ?? 0,
          sinceYear: history?.sinceYear ?? null,
          topWinners: tally > 0 ? [{ wins: tally, surnames: [...winsBy.values()].filter((w) => w.wins === tally).map((w) => w.surname) }] : [],
          recentWinners: [...(history?.history ?? [])].reverse().slice(0, 5).map((h) => ({ year: h.year, surname: h.winner, grid: h.grid })),
        }
      : null;
  }

  return {
    year,
    lastRound,
    totalRounds: races.length,
    racesLeft: after.length,
    pointsLeft,
    rounds,
    series,
    standings,
    constructors: (consStandRes.data ?? []).flatMap((c) => {
      const con = constructorById.get(c.constructor_id as number);
      return con ? [{ ...con, position: c.position as number, points: Number(c.points) }] : [];
    }),
    leader: { ...first, leadSince, roundsLed: roundsLedBy(first.id) },
    rival: second ? { ...second, roundsLed: roundsLedBy(second.id) } : null,
    title,
    facts: {
      winners: new Set(played.map((r) => r.winner!.code)).size,
      topTeam: topTeamEntry && topTeamName ? { ref: topTeamEntry[0], name: topTeamName, wins: topTeamEntry[1] } : null,
      poleWins: played.filter((r) => r.poleCode && r.poleCode === r.winner!.code).length,
      deepest:
        deepestRound && deepestRound.winner!.grid > 3
          ? { round: deepestRound.round, location: deepestRound.location, surname: deepestRound.winner!.surname, grid: deepestRound.winner!.grid }
          : null,
    },
    lastRace: lastRows.length
      ? {
          raceId: latestId,
          round: lastRound,
          name: lastRace.name as string,
          date: lastRace.date as string,
          location: (lastCircuit?.location as string | undefined) ?? '',
          circuitRef: (lastCircuit?.circuit_ref as string | undefined) ?? '',
          rows: lastRows,
          report: report ? { slug: report.slug as string, title: report.title as string } : null,
        }
      : null,
    nextRace,
    form,
    formFrom,
    archive,
  };
}

// The database in numbers, for the "explore" chapter. Count-only queries (no rows, no row cap).
async function archiveCounts(supabase: Client, today: string): Promise<HubSeason['archive']> {
  const head = { count: 'exact' as const, head: true };
  const [seasons, races, results, drivers, constructors, circuits, firstRace] = await Promise.all([
    supabase.from('seasons').select('*', head),
    supabase.from('races').select('*', head).lte('date', today),
    supabase.from('results').select('*', head),
    supabase.from('drivers').select('*', head),
    supabase.from('constructors').select('*', head),
    supabase.from('circuits').select('*', head),
    supabase.from('races').select('year').order('year', { ascending: true }).limit(1).single(),
  ]);
  const firstYear = firstRace.data?.year as number | undefined;
  if (!firstYear || !seasons.count || !races.count || !results.count || !drivers.count || !constructors.count || !circuits.count) return null;
  return {
    seasons: seasons.count,
    firstYear,
    races: races.count,
    results: results.count,
    drivers: drivers.count,
    constructors: constructors.count,
    circuits: circuits.count,
  };
}
