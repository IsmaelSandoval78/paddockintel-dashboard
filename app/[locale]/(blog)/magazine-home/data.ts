import { createClient } from '@/lib/supabase/server';

const FEATURED_TAG = 'featured';
export const DATA_DESK_TAG = 'data-desk';

type ArticleRow = {
  slug: string;
  title: string;
  meta_description: string | null;
  tags: string[] | null;
  published_at: string | null;
  stats: unknown;
};

const ARTICLE_SELECT = 'slug, title, meta_description, tags, published_at, stats';

export async function getFeaturedAndRecent(locale: string) {
  const supabase = createClient();

  const { data: featuredRows } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .contains('tags', [FEATURED_TAG])
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1);

  let featured = (featuredRows?.[0] as ArticleRow | undefined) ?? null;

  const { data: latestRows } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(4);
  const latest = (latestRows as ArticleRow[] | null) ?? [];

  // No editorial pick for this locale yet (e.g. a translation hasn't landed)
  // — fall back to the most recent article so the page never ships without
  // a lead story.
  if (!featured) featured = latest[0] ?? null;

  const recent = latest.filter((a) => a.slug !== featured?.slug).slice(0, 3);

  return { featured, recent };
}

export async function getDataDeskArticles(locale: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .contains('tags', [DATA_DESK_TAG])
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(3);
  return (data as ArticleRow[] | null) ?? [];
}

export type Top5Driver = {
  driver_id: number;
  forename: string;
  surname: string;
  position: number;
  points: number;
  wins: number;
  constructor_name: string;
  constructor_ref: string;
};

export type Top5Constructor = {
  constructor_id: number;
  name: string;
  constructor_ref: string;
  position: number;
  points: number;
  wins: number;
};

export async function getStandings(): Promise<{ drivers: Top5Driver[]; constructors: Top5Constructor[] }> {
  const supabase = createClient();

  // Same gotcha as the Hub home: join on driver_standings' own max race_id,
  // not `races` by date — a race can exist before its results are imported.
  const { data: latestRow } = await supabase
    .from('driver_standings')
    .select('race_id')
    .order('race_id', { ascending: false })
    .limit(1)
    .single();
  const latestRaceId = (latestRow?.race_id as number | undefined) ?? null;
  if (latestRaceId === null) return { drivers: [], constructors: [] };

  const [driverStandRes, constructorStandRes, resultsRes] = await Promise.all([
    supabase
      .from('driver_standings')
      .select('driver_id, position, points, wins')
      .eq('race_id', latestRaceId)
      .order('position', { ascending: true })
      .limit(5),
    supabase
      .from('constructor_standings')
      .select('constructor_id, position, points, wins')
      .eq('race_id', latestRaceId)
      .order('position', { ascending: true })
      .limit(5),
    supabase
      .from('results')
      .select('driver_id, constructor_id')
      .eq('race_id', latestRaceId),
  ]);

  const driverConstructorMap = new Map(
    (resultsRes.data ?? []).map((r) => [r.driver_id as number, r.constructor_id as number])
  );

  const driverIds = (driverStandRes.data ?? []).map((s) => s.driver_id as number);
  const constructorIds = [
    ...new Set([
      ...(constructorStandRes.data ?? []).map((s) => s.constructor_id as number),
      ...[...driverConstructorMap.values()],
    ]),
  ];

  const [driversRes, constructorsRes] = await Promise.all([
    driverIds.length
      ? supabase.from('drivers').select('id, forename, surname').in('id', driverIds)
      : Promise.resolve({ data: [] as Array<{ id: number; forename: string; surname: string }> }),
    constructorIds.length
      ? supabase.from('constructors').select('id, name, constructor_ref').in('id', constructorIds)
      : Promise.resolve({ data: [] as Array<{ id: number; name: string; constructor_ref: string }> }),
  ]);

  const driverMap = new Map((driversRes.data ?? []).map((d) => [d.id as number, d]));
  const constructorMap = new Map((constructorsRes.data ?? []).map((c) => [c.id as number, c]));

  const drivers: Top5Driver[] = (driverStandRes.data ?? []).flatMap((s) => {
    const d = driverMap.get(s.driver_id as number);
    if (!d) return [];
    const cid = driverConstructorMap.get(s.driver_id as number);
    const c = cid !== undefined ? constructorMap.get(cid) : undefined;
    return [{
      driver_id: s.driver_id as number,
      forename: d.forename as string,
      surname: d.surname as string,
      position: s.position as number,
      points: s.points as number,
      wins: s.wins as number,
      constructor_name: (c?.name as string) ?? '',
      constructor_ref: (c?.constructor_ref as string) ?? '',
    }];
  });

  const constructors: Top5Constructor[] = (constructorStandRes.data ?? []).flatMap((s) => {
    const c = constructorMap.get(s.constructor_id as number);
    if (!c) return [];
    return [{
      constructor_id: s.constructor_id as number,
      name: c.name as string,
      constructor_ref: c.constructor_ref as string,
      position: s.position as number,
      points: s.points as number,
      wins: s.wins as number,
    }];
  });

  return { drivers, constructors };
}

export type Mover = {
  id: number;
  name: string;
  constructor_ref: string;
  position: number;
  prevPosition: number;
  positionDelta: number;
};

export type MoversResult = {
  raceName: string;
  driverRiser: Mover | null;
  driverFaller: Mover | null;
  constructorRiser: Mover | null;
  constructorFaller: Mover | null;
};

const EMPTY_MOVERS: MoversResult = {
  raceName: '',
  driverRiser: null,
  driverFaller: null,
  constructorRiser: null,
  constructorFaller: null,
};

function biggestDelta<T extends { positionDelta: number }>(rows: T[], direction: 'up' | 'down'): T | null {
  const sorted = [...rows].sort((a, b) =>
    direction === 'up' ? b.positionDelta - a.positionDelta : a.positionDelta - b.positionDelta
  );
  const top = sorted[0];
  if (!top) return null;
  if (direction === 'up' && top.positionDelta <= 0) return null;
  if (direction === 'down' && top.positionDelta >= 0) return null;
  return top;
}

// Movers = who gained/lost the most standings positions in the most recently
// scored race, compared to the race immediately before it. Not a media-
// attention signal like AI Weekly's index (we don't track that) — this is
// real points-table movement, derived the same way getStandings() finds
// "latest": off driver_standings' own race_id ordering, not races.date.
export async function getMovers(): Promise<MoversResult> {
  const supabase = createClient();

  const { data: raceIdRows } = await supabase
    .from('driver_standings')
    .select('race_id')
    .order('race_id', { ascending: false })
    .limit(50);
  const distinctRaceIds = [...new Set((raceIdRows ?? []).map((r) => r.race_id as number))];
  const [currentRaceId, previousRaceId] = distinctRaceIds;
  if (!currentRaceId || !previousRaceId) return EMPTY_MOVERS;

  const [raceRes, curDriverRes, prevDriverRes, curConstructorRes, prevConstructorRes, resultsRes] =
    await Promise.all([
      supabase.from('races').select('name').eq('id', currentRaceId).single(),
      supabase.from('driver_standings').select('driver_id, position').eq('race_id', currentRaceId),
      supabase.from('driver_standings').select('driver_id, position').eq('race_id', previousRaceId),
      supabase.from('constructor_standings').select('constructor_id, position').eq('race_id', currentRaceId),
      supabase.from('constructor_standings').select('constructor_id, position').eq('race_id', previousRaceId),
      supabase.from('results').select('driver_id, constructor_id').eq('race_id', currentRaceId),
    ]);

  const prevDriverPos = new Map((prevDriverRes.data ?? []).map((s) => [s.driver_id as number, s.position as number]));
  const driverDeltas = (curDriverRes.data ?? []).flatMap((s) => {
    const prevPosition = prevDriverPos.get(s.driver_id as number);
    if (prevPosition === undefined) return [];
    return [{
      id: s.driver_id as number,
      position: s.position as number,
      prevPosition,
      positionDelta: prevPosition - (s.position as number),
    }];
  });

  const prevConstructorPos = new Map(
    (prevConstructorRes.data ?? []).map((s) => [s.constructor_id as number, s.position as number])
  );
  const constructorDeltas = (curConstructorRes.data ?? []).flatMap((s) => {
    const prevPosition = prevConstructorPos.get(s.constructor_id as number);
    if (prevPosition === undefined) return [];
    return [{
      id: s.constructor_id as number,
      position: s.position as number,
      prevPosition,
      positionDelta: prevPosition - (s.position as number),
    }];
  });

  const driverRiserRaw = biggestDelta(driverDeltas, 'up');
  const driverFallerRaw = biggestDelta(driverDeltas, 'down');
  const constructorRiserRaw = biggestDelta(constructorDeltas, 'up');
  const constructorFallerRaw = biggestDelta(constructorDeltas, 'down');

  const driverIds = [driverRiserRaw?.id, driverFallerRaw?.id].filter((v): v is number => v !== undefined);
  const driverConstructorMap = new Map(
    (resultsRes.data ?? []).map((r) => [r.driver_id as number, r.constructor_id as number])
  );
  const constructorIds = [
    ...new Set([
      constructorRiserRaw?.id,
      constructorFallerRaw?.id,
      ...driverIds.map((id) => driverConstructorMap.get(id)),
    ].filter((v): v is number => v !== undefined)),
  ];

  const [driversRes, constructorsRes] = await Promise.all([
    driverIds.length
      ? supabase.from('drivers').select('id, forename, surname').in('id', driverIds)
      : Promise.resolve({ data: [] as Array<{ id: number; forename: string; surname: string }> }),
    constructorIds.length
      ? supabase.from('constructors').select('id, name, constructor_ref').in('id', constructorIds)
      : Promise.resolve({ data: [] as Array<{ id: number; name: string; constructor_ref: string }> }),
  ]);

  const driverNameMap = new Map((driversRes.data ?? []).map((d) => [d.id as number, `${d.forename} ${d.surname}`]));
  const constructorMap = new Map((constructorsRes.data ?? []).map((c) => [c.id as number, c]));

  const toDriverMover = (raw: typeof driverRiserRaw): Mover | null => {
    if (!raw) return null;
    const name = driverNameMap.get(raw.id);
    const cid = driverConstructorMap.get(raw.id);
    const constructor = cid !== undefined ? constructorMap.get(cid) : undefined;
    if (!name) return null;
    return { ...raw, name, constructor_ref: constructor?.constructor_ref ?? '' };
  };

  const toConstructorMover = (raw: typeof constructorRiserRaw): Mover | null => {
    if (!raw) return null;
    const constructor = constructorMap.get(raw.id);
    if (!constructor) return null;
    return { ...raw, name: constructor.name as string, constructor_ref: constructor.constructor_ref as string };
  };

  return {
    raceName: (raceRes.data?.name as string) ?? '',
    driverRiser: toDriverMover(driverRiserRaw),
    driverFaller: toDriverMover(driverFallerRaw),
    constructorRiser: toConstructorMover(constructorRiserRaw),
    constructorFaller: toConstructorMover(constructorFallerRaw),
  };
}

export type CircuitOfTheDay = {
  circuit_ref: string;
  name: string;
  location: string;
  country: string;
  race_name: string;
  race_date: string;
  round: number;
  first_year: number | null;
  total_races: number;
  laps: number | null;
  avg_winner_grid: number | null;
  champions: Array<{ year: number; forename: string; surname: string }>;
  fastest_lap: { forename: string; surname: string; time: string; year: number } | null;
  fastest_pit: { constructor: string; duration: string; year: number } | null;
  top_constructor: { name: string; wins: number } | null;
  top_win_driver: { forename: string; surname: string; wins: number } | null;
};

export async function getCircuitOfTheDay(): Promise<CircuitOfTheDay | null> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: nextRace } = await supabase
    .from('races')
    .select('id, round, name, date, circuit_id')
    .gt('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single();
  if (!nextRace) return null;

  const circuitId = nextRace.circuit_id as number;
  const [circuitRes, racesAtCircuitRes] = await Promise.all([
    supabase.from('circuits').select('name, location, country, circuit_ref').eq('id', circuitId).single(),
    supabase.from('races').select('id, year').eq('circuit_id', circuitId),
  ]);
  if (!circuitRes.data) return null;

  const races = racesAtCircuitRes.data ?? [];
  const raceIds = races.map((r) => r.id as number);
  const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));
  const years = races.map((r) => r.year as number);

  if (!raceIds.length) {
    return {
      circuit_ref: circuitRes.data.circuit_ref as string,
      name: circuitRes.data.name as string,
      location: circuitRes.data.location as string,
      country: circuitRes.data.country as string,
      race_name: nextRace.name as string,
      race_date: nextRace.date as string,
      round: nextRace.round as number,
      first_year: null,
      total_races: 0,
      laps: null,
      avg_winner_grid: null,
      champions: [],
      fastest_lap: null,
      fastest_pit: null,
      top_constructor: null,
      top_win_driver: null,
    };
  }

  const [allWinnersRes, fastLapRes, pitRes] = await Promise.all([
    supabase.from('results').select('race_id, driver_id, constructor_id, grid, laps').in('race_id', raceIds).eq('position', 1),
    supabase
      .from('results')
      .select('race_id, driver_id, fastest_lap_time')
      .in('race_id', raceIds)
      .not('fastest_lap_time', 'is', null)
      .neq('fastest_lap_time', '\\N')
      .gt('fastest_lap_time', '')
      .order('fastest_lap_time', { ascending: true })
      .limit(1),
    supabase
      .from('pit_stops')
      .select('race_id, driver_id, duration, milliseconds')
      .in('race_id', raceIds)
      .gt('milliseconds', 0)
      .order('milliseconds', { ascending: true })
      .limit(1),
  ]);

  const allWinners = allWinnersRes.data ?? [];
  const fastLapRow = fastLapRes.data?.[0];
  const pitStop = pitRes.data?.[0];

  const sortedWinners = [...allWinners].sort((a, b) => (b.race_id as number) - (a.race_id as number));
  const last5 = sortedWinners.slice(0, 5);

  const conWins = new Map<number, number>();
  for (const w of allWinners) conWins.set(w.constructor_id as number, (conWins.get(w.constructor_id as number) ?? 0) + 1);
  const topConEntry = [...conWins.entries()].sort((a, b) => b[1] - a[1])[0];

  const drvWins = new Map<number, number>();
  for (const w of allWinners) drvWins.set(w.driver_id as number, (drvWins.get(w.driver_id as number) ?? 0) + 1);
  const topWinEntry = [...drvWins.entries()].sort((a, b) => b[1] - a[1])[0];

  const lapsFreq = new Map<number, number>();
  for (const w of allWinners) {
    const l = w.laps as number;
    if (l > 0) lapsFreq.set(l, (lapsFreq.get(l) ?? 0) + 1);
  }
  const standardLaps = lapsFreq.size > 0 ? [...lapsFreq.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

  const validGrids = allWinners.map((w) => w.grid as number).filter((g) => g > 0);
  const avgWinnerGrid = validGrids.length
    ? Math.round((validGrids.reduce((a, b) => a + b, 0) / validGrids.length) * 10) / 10
    : null;

  const fastLapDriverId = fastLapRow ? (fastLapRow.driver_id as number) : null;
  const pitConstructorId = pitStop
    ? ((await supabase.from('results').select('constructor_id').eq('race_id', pitStop.race_id).eq('driver_id', pitStop.driver_id).limit(1)).data?.[0]?.constructor_id as number | undefined)
    : undefined;

  const allDriverIds = [
    ...new Set([
      ...last5.map((w) => w.driver_id as number),
      ...(topWinEntry ? [topWinEntry[0]] : []),
      ...(fastLapDriverId ? [fastLapDriverId] : []),
    ]),
  ];
  const constructorIds = [
    ...new Set([...(topConEntry ? [topConEntry[0]] : []), ...(pitConstructorId ? [pitConstructorId] : [])]),
  ];

  const [driversRes, constructorsRes] = await Promise.all([
    allDriverIds.length
      ? supabase.from('drivers').select('id, forename, surname').in('id', allDriverIds)
      : Promise.resolve({ data: [] as Array<{ id: number; forename: string; surname: string }> }),
    constructorIds.length
      ? supabase.from('constructors').select('id, name').in('id', constructorIds)
      : Promise.resolve({ data: [] as Array<{ id: number; name: string }> }),
  ]);

  const driverMap = new Map((driversRes.data ?? []).map((d) => [d.id as number, d]));
  const constructorNameMap = new Map((constructorsRes.data ?? []).map((c) => [c.id as number, c.name as string]));

  const champions = last5.flatMap((c) => {
    const d = driverMap.get(c.driver_id as number);
    const year = raceYearMap.get(c.race_id as number);
    if (!d || !year) return [];
    return [{ year, forename: d.forename as string, surname: d.surname as string }];
  });

  const fastestLap = fastLapRow && fastLapDriverId && driverMap.has(fastLapDriverId)
    ? {
        forename: driverMap.get(fastLapDriverId)!.forename as string,
        surname: driverMap.get(fastLapDriverId)!.surname as string,
        time: fastLapRow.fastest_lap_time as string,
        year: raceYearMap.get(fastLapRow.race_id as number) ?? 0,
      }
    : null;

  const fastestPit = pitStop && pitConstructorId && constructorNameMap.has(pitConstructorId)
    ? {
        constructor: constructorNameMap.get(pitConstructorId)!,
        duration: pitStop.duration as string,
        year: raceYearMap.get(pitStop.race_id as number) ?? 0,
      }
    : null;

  const topConstructor = topConEntry && constructorNameMap.has(topConEntry[0])
    ? { name: constructorNameMap.get(topConEntry[0])!, wins: topConEntry[1] }
    : null;

  const topWinDriver = topWinEntry && driverMap.has(topWinEntry[0])
    ? {
        forename: driverMap.get(topWinEntry[0])!.forename as string,
        surname: driverMap.get(topWinEntry[0])!.surname as string,
        wins: topWinEntry[1],
      }
    : null;

  return {
    circuit_ref: circuitRes.data.circuit_ref as string,
    name: circuitRes.data.name as string,
    location: circuitRes.data.location as string,
    country: circuitRes.data.country as string,
    race_name: nextRace.name as string,
    race_date: nextRace.date as string,
    round: nextRace.round as number,
    first_year: years.length ? Math.min(...years) : null,
    total_races: races.length,
    laps: standardLaps,
    avg_winner_grid: avgWinnerGrid,
    champions,
    fastest_lap: fastestLap,
    fastest_pit: fastestPit,
    top_constructor: topConstructor,
    top_win_driver: topWinDriver,
  };
}
