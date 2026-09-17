import { createClient } from '@/lib/supabase/server';
import { getArticleIdsForTagSlug, getArticleTagSlugs, type TagRef } from '@/lib/blog/tags';
import { entityCountsInWindow, topEntity, type EntityCount } from '@/lib/entityMentions';
import { getTranslations } from 'next-intl/server';

const FEATURED_TAG = 'featured';
export const DATA_DESK_TAG = 'data-desk';

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  tags: TagRef[];
  published_at: string | null;
  stats: unknown;
  cover_image_url: string | null;
};

const ARTICLE_SELECT = 'id, slug, title, meta_description, published_at, stats, cover_image_url';

async function attachTags(rows: Omit<ArticleRow, 'tags'>[]): Promise<ArticleRow[]> {
  if (!rows.length) return [];
  const supabase = createClient();
  const [tTags, slugsByArticle] = await Promise.all([
    getTranslations('articleTags'),
    getArticleTagSlugs(supabase, rows.map((r) => r.id)),
  ]);
  return rows.map((r) => ({
    ...r,
    tags: (slugsByArticle.get(r.id) ?? []).map((slug) => ({ slug, label: tTags(slug) })),
  }));
}

export async function getFeaturedAndRecent(locale: string) {
  const supabase = createClient();

  const featuredIds = await getArticleIdsForTagSlug(supabase, FEATURED_TAG);
  const { data: featuredRows } = featuredIds.length
    ? await supabase
        .from('articles')
        .select(ARTICLE_SELECT)
        .eq('locale', locale)
        .eq('status', 'published')
        .in('id', featuredIds)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(1)
    : { data: [] };

  let featured = (featuredRows?.[0] as Omit<ArticleRow, 'tags'> | undefined) ?? null;

  const { data: latestRows } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(7);
  const latest = (latestRows as Omit<ArticleRow, 'tags'>[] | null) ?? [];

  // No editorial pick for this locale yet (e.g. a translation hasn't landed)
  // — fall back to the most recent article so the page never ships without
  // a lead story.
  if (!featured) featured = latest[0] ?? null;

  const recentRaw = latest.filter((a) => a.slug !== featured?.slug).slice(0, 6);

  const [[featuredTagged], recent] = await Promise.all([
    attachTags(featured ? [featured] : []),
    attachTags(recentRaw),
  ]);

  return { featured: featuredTagged ?? null, recent };
}

export async function getDataDeskArticles(locale: string) {
  const supabase = createClient();
  const ids = await getArticleIdsForTagSlug(supabase, DATA_DESK_TAG);
  if (!ids.length) return [];

  const { data } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .in('id', ids)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(3);
  return attachTags((data as Omit<ArticleRow, 'tags'>[] | null) ?? []);
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

export type RaceHighlightMover = {
  driver_id: number;
  forename: string;
  surname: string;
  constructor_ref: string;
  grid: number;
  finish: number;
  delta: number;
};

export type RaceHighlights = {
  raceName: string;
  gainers: RaceHighlightMover[];
  fallers: RaceHighlightMover[];
  maxAbsDelta: number;
  fastestLap: { forename: string; surname: string; time: string } | null;
  fastestPit: { forename: string; surname: string; constructor_name: string; duration: string } | null;
  retirements: Array<{ forename: string; surname: string; constructor_name: string; constructor_ref: string; lap: number; status: string }>;
};

const EMPTY_RACE_HIGHLIGHTS: RaceHighlights = {
  raceName: '',
  gainers: [],
  fallers: [],
  maxAbsDelta: 0,
  fastestLap: null,
  fastestPit: null,
  retirements: [],
};

// Race-day grid->finish movement — a different story than getMovers() above,
// which tracks *championship* position across races (deltas of ±1-3 in a
// normal weekend). This is the single-race drama: a driver can gain or lose
// dozens of places in one race (grid 0 is a pit-lane start, excluded — it
// isn't a real grid position to diff against).
//
// Also carries fastest lap / fastest pit stop / retirements for the same
// race — same "last race that happened" scope as the movers above, so it's
// one query batch instead of a separate lookup per stat.
export async function getRaceHighlights(limit = 3): Promise<RaceHighlights> {
  const supabase = createClient();

  const { data: raceIdRows } = await supabase
    .from('driver_standings')
    .select('race_id')
    .order('race_id', { ascending: false })
    .limit(1);
  const currentRaceId = raceIdRows?.[0]?.race_id as number | undefined;
  if (!currentRaceId) return EMPTY_RACE_HIGHLIGHTS;

  const [raceRes, resultsRes, pitRes, statusRes] = await Promise.all([
    supabase.from('races').select('name').eq('id', currentRaceId).single(),
    supabase
      .from('results')
      .select('driver_id, constructor_id, grid, position, laps, rank, fastest_lap_time, status_id')
      .eq('race_id', currentRaceId),
    supabase
      .from('pit_stops')
      .select('driver_id, duration, milliseconds')
      .eq('race_id', currentRaceId)
      .not('milliseconds', 'is', null)
      .gt('milliseconds', 0)
      .order('milliseconds', { ascending: true })
      .limit(1),
    supabase.from('status').select('id, status'),
  ]);

  const allResults = (resultsRes.data ?? []) as Array<{
    driver_id: number;
    constructor_id: number;
    grid: number | null;
    position: number | null;
    laps: number | null;
    rank: number | null;
    fastest_lap_time: string | null;
    status_id: number;
  }>;
  if (allResults.length === 0) return EMPTY_RACE_HIGHLIGHTS;

  const statusMap = new Map((statusRes.data ?? []).map((s) => [s.id as number, s.status as string]));

  const driverIds = [...new Set(allResults.map((r) => r.driver_id))];
  const constructorIds = [...new Set(allResults.map((r) => r.constructor_id))];
  const [driversRes, constructorsRes] = await Promise.all([
    supabase.from('drivers').select('id, forename, surname').in('id', driverIds),
    supabase.from('constructors').select('id, constructor_ref, name').in('id', constructorIds),
  ]);
  const driverMap = new Map((driversRes.data ?? []).map((d) => [d.id as number, d]));
  const constructorMap = new Map(
    (constructorsRes.data ?? []).map((c) => [c.id as number, { ref: c.constructor_ref as string, name: c.name as string }])
  );

  const moverRows = allResults.filter((r) => r.grid !== null && r.grid > 0 && r.position !== null);
  const movers: RaceHighlightMover[] = moverRows.flatMap((r) => {
    const d = driverMap.get(r.driver_id);
    if (!d) return [];
    return [{
      driver_id: r.driver_id,
      forename: d.forename as string,
      surname: d.surname as string,
      constructor_ref: constructorMap.get(r.constructor_id)?.ref ?? '',
      grid: r.grid as number,
      finish: r.position as number,
      delta: (r.grid as number) - (r.position as number),
    }];
  });

  const gainers = movers.filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, limit);
  const fallers = movers.filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, limit);
  const maxAbsDelta = Math.max(1, ...movers.map((m) => Math.abs(m.delta)));

  const flRow = allResults.find(
    (r) => r.rank === 1 && r.fastest_lap_time && r.fastest_lap_time !== '\\N' && r.fastest_lap_time.trim() !== ''
  );
  const flDriver = flRow ? driverMap.get(flRow.driver_id) : undefined;
  const fastestLap =
    flRow && flDriver
      ? { forename: flDriver.forename as string, surname: flDriver.surname as string, time: flRow.fastest_lap_time as string }
      : null;

  const pitRow = (pitRes.data ?? [])[0] as { driver_id: number; duration: string } | undefined;
  const pitDriver = pitRow ? driverMap.get(pitRow.driver_id) : undefined;
  const pitResultRow = pitRow ? allResults.find((r) => r.driver_id === pitRow.driver_id) : undefined;
  const fastestPit =
    pitRow && pitDriver
      ? {
          forename: pitDriver.forename as string,
          surname: pitDriver.surname as string,
          constructor_name: pitResultRow ? (constructorMap.get(pitResultRow.constructor_id)?.name ?? '') : '',
          duration: pitRow.duration,
        }
      : null;

  // position_text is NOT 'R' for a retirement in this dataset -- a driver
  // who retires after covering enough distance still gets classified with a
  // numeric position (confirmed against the Spanish GP: Sainz/Pérez/Stroll/
  // Hamilton all show numeric position_text with status 'Retired'). The
  // real signal is status: anything but "Finished" or "+N Lap(s)" (lapped,
  // still classified as finishing) is a genuine retirement -- matches
  // DATA-EXPERT.md's warning that status_id, not position_text, is what
  // actually distinguishes a DNF here.
  const LAPPED_STATUS_RE = /^\+\d+ Laps?$/;
  const retirements = allResults
    .filter((r) => {
      const statusText = statusMap.get(r.status_id) ?? '';
      return statusText !== 'Finished' && !LAPPED_STATUS_RE.test(statusText);
    })
    .flatMap((r) => {
      const d = driverMap.get(r.driver_id);
      if (!d) return [];
      return [{
        forename: d.forename as string,
        surname: d.surname as string,
        constructor_name: constructorMap.get(r.constructor_id)?.name ?? '',
        constructor_ref: constructorMap.get(r.constructor_id)?.ref ?? '',
        lap: r.laps ?? 0,
        status: statusMap.get(r.status_id) ?? 'Retired',
      }];
    });

  return {
    raceName: (raceRes.data?.name as string) ?? '',
    gainers,
    fallers,
    maxAbsDelta,
    fastestLap,
    fastestPit,
    retirements,
  };
}

// "Attention This Week" — third piece of the magazine-home redesign
// discussion (AI Weekly's own "Attention This Week" module). Originally
// shipped as a plain "Most Covered" snapshot with no week-over-week delta,
// because digest_items only had 42 rows total with real gaps (months with
// zero items) — a delta then would've been computed from samples of 1-2
// stories, misleading per docs/advisors/DATA-EXPERT.md. The dataset has
// since grown (81 rows, ~36/week) enough to support real riser/faller
// deltas, gated the same cautious way: MIN_SAMPLE requires BOTH weeks to
// clear the bar before a % change is shown at all, so a 0→1 or 1→3 swing
// still can't produce a headline number.
const MIN_SAMPLE = 2;
const MIN_THEME_SAMPLE = 3;

export type AttentionChange = { entity: string; count: number; prevCount: number; pctChange: number };
export type AttentionTheme = { slug: string; label: string; count: number; total: number };
export type AttentionThisWeek = {
  mostCovered: EntityCount | null;
  fastestRiser: AttentionChange | null;
  biggestFall: AttentionChange | null;
  dominantTheme: AttentionTheme | null;
};

export async function getAttentionThisWeek(locale: string): Promise<AttentionThisWeek> {
  const empty: AttentionThisWeek = { mostCovered: null, fastestRiser: null, biggestFall: null, dominantTheme: null };
  const supabase = createClient();
  const { data: issues } = await supabase.from('digest_issues').select('id').eq('series', 'newsletter');
  const issueIds = (issues ?? []).map((i) => i.id as string);
  if (!issueIds.length) return empty;

  const { data } = await supabase
    .from('digest_items')
    .select('entity_tags, published_at, internal_link_slug')
    .in('issue_id', issueIds);
  const items = (data ?? []) as {
    entity_tags: string[];
    published_at: string;
    internal_link_slug: string | null;
  }[];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const thisWeek = entityCountsInWindow(items, now - 7 * day, now);
  const lastWeek = entityCountsInWindow(items, now - 14 * day, now - 7 * day);

  const topThisWeek = topEntity(thisWeek);
  const mostCovered = topThisWeek && topThisWeek.count >= MIN_SAMPLE ? topThisWeek : null;

  const changes: AttentionChange[] = [];
  for (const entity of new Set([...thisWeek.keys(), ...lastWeek.keys()])) {
    const count = thisWeek.get(entity) ?? 0;
    const prevCount = lastWeek.get(entity) ?? 0;
    if (Math.min(count, prevCount) < MIN_SAMPLE) continue;
    changes.push({ entity, count, prevCount, pctChange: Math.round(((count - prevCount) / prevCount) * 100) });
  }
  const fastestRiser =
    changes.filter((c) => c.pctChange > 0).sort((a, b) => b.pctChange - a.pctChange)[0] ?? null;
  const biggestFall =
    changes.filter((c) => c.pctChange < 0).sort((a, b) => a.pctChange - b.pctChange)[0] ?? null;

  // Dominant theme: digest_items don't carry a topic/category of their own,
  // but many link to a full article via internal_link_slug, and articles
  // do carry canonical topic tags (economics, regulations, driver-finance,
  // ...). Reusing that as a proxy — count how many of this week's items
  // link to an article under each topic. A digest item without a link, or
  // whose linked article has no topic tag, just doesn't count toward any
  // theme (no invented fallback).
  const thisWeekItems = items.filter((i) => new Date(i.published_at).getTime() >= now - 7 * day);
  const thisWeekTotal = thisWeekItems.length;
  const linkedSlugs = [...new Set(thisWeekItems.map((i) => i.internal_link_slug).filter((s): s is string => !!s))];

  let dominantTheme: AttentionTheme | null = null;
  if (linkedSlugs.length) {
    const { data: articleRows } = await supabase.from('articles').select('id, slug').in('slug', linkedSlugs);
    const articleIdBySlug = new Map((articleRows ?? []).map((a) => [a.slug as string, a.id as string]));

    const { data: tagRows } = await supabase
      .from('article_tags')
      .select('article_id, tags(slug, category)')
      .in('article_id', [...articleIdBySlug.values()]);
    const topicSlugByArticleId = new Map<string, string>();
    for (const row of (tagRows ?? []) as unknown as { article_id: string; tags: { slug: string; category: string } | null }[]) {
      if (row.tags?.category === 'topic' && !topicSlugByArticleId.has(row.article_id)) {
        topicSlugByArticleId.set(row.article_id, row.tags.slug);
      }
    }

    const topicCounts = new Map<string, number>();
    for (const item of thisWeekItems) {
      const articleId = item.internal_link_slug ? articleIdBySlug.get(item.internal_link_slug) : undefined;
      const topicSlug = articleId ? topicSlugByArticleId.get(articleId) : undefined;
      if (topicSlug) topicCounts.set(topicSlug, (topicCounts.get(topicSlug) ?? 0) + 1);
    }

    const topTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topTopic && topTopic[1] >= MIN_THEME_SAMPLE) {
      const tTags = await getTranslations({ locale, namespace: 'articleTags' });
      dominantTheme = { slug: topTopic[0], label: tTags(topTopic[0]), count: topTopic[1], total: thisWeekTotal };
    }
  }

  return { mostCovered, fastestRiser, biggestFall, dominantTheme };
}

// "Learning" teaser — fourth piece of the magazine-home redesign discussion
// (AI Weekly's "Learning AI" module). Real content already exists
// (glossary_terms, 69 published EN rows across eli5/technical depth layers,
// see app/[locale]/(blog)/glossary/) — this just surfaces the 5 most
// recently published terms, no new data model. A term can have both an
// eli5 and a technical row for the same slug; dedupe by slug (prefer eli5,
// same rule the glossary index/detail pages already use) before taking the
// 5 most recent, not after — otherwise a term with two depths could crowd
// out a distinct term from the teaser.
export type LearningTerm = { slug: string; term: string; short_definition: string };

export async function getLearningTerms(locale: string, limit = 5): Promise<LearningTerm[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('glossary_terms')
    .select('slug, term, short_definition, depth, published_at')
    .eq('locale', locale)
    .eq('status', 'published')
    .in('depth', ['eli5', 'technical'])
    .order('published_at', { ascending: false, nullsFirst: false });

  const rows = (data ?? []) as Array<{
    slug: string;
    term: string;
    short_definition: string;
    depth: 'eli5' | 'technical' | 'fia';
    published_at: string | null;
  }>;

  const bySlug = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing || row.depth === 'eli5') bySlug.set(row.slug, row);
  }

  return Array.from(bySlug.values())
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, limit)
    .map((r) => ({ slug: r.slug, term: r.term, short_definition: r.short_definition }));
}

// "Track by team" tag cloud — fifth piece of the magazine-home redesign
// discussion (AI Weekly's "Track by company" list). Real counts from the
// tags/article_tags system (paso 2), not invented — teams with zero tagged
// articles just don't appear (today: Mercedes-AMG F1 81, Aston Martin 51,
// Red Bull Racing 47, Ferrari 39, McLaren 21, Cadillac F1 Team 21,
// Williams 3 — real spread, no sample-size concern like Attention This
// Week had, since these are plain counts, not week-over-week deltas).
export type TeamTagCount = { slug: string; name: string; count: number };

export async function getTeamTags(): Promise<TeamTagCount[]> {
  const supabase = createClient();
  const { data: teamTags } = await supabase.from('tags').select('id, slug, name').eq('category', 'team');
  const rows = teamTags ?? [];
  if (!rows.length) return [];

  const tagIds = rows.map((r) => r.id as string);
  const { data: links } = await supabase.from('article_tags').select('tag_id').in('tag_id', tagIds);

  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    const id = link.tag_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return rows
    .map((r) => ({ slug: r.slug as string, name: r.name as string, count: counts.get(r.id as string) ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export type SessionKey = 'fp1' | 'fp2' | 'fp3' | 'sprint' | 'qualifying' | 'race';
export type RaceSession = { key: SessionKey; date: string; time: string };

export type CircuitOfTheDay = {
  circuit_ref: string;
  name: string;
  location: string;
  country: string;
  race_name: string;
  race_date: string;
  race_time: string | null;
  days_until: number;
  sessions: RaceSession[];
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
    .select(
      'id, round, name, date, time, circuit_id, fp1_date, fp1_time, fp2_date, fp2_time, fp3_date, fp3_time, quali_date, quali_time, sprint_date, sprint_time'
    )
    .gt('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single();
  if (!nextRace) return null;

  const daysUntil = Math.ceil(
    (new Date(nextRace.date as string).getTime() - new Date(today).getTime()) / 86_400_000
  );

  const sessions: RaceSession[] = (
    [
      { key: 'fp1', date: nextRace.fp1_date as string | null, time: nextRace.fp1_time as string | null },
      { key: 'fp2', date: nextRace.fp2_date as string | null, time: nextRace.fp2_time as string | null },
      { key: 'fp3', date: nextRace.fp3_date as string | null, time: nextRace.fp3_time as string | null },
      { key: 'sprint', date: nextRace.sprint_date as string | null, time: nextRace.sprint_time as string | null },
      { key: 'qualifying', date: nextRace.quali_date as string | null, time: nextRace.quali_time as string | null },
      { key: 'race', date: nextRace.date as string | null, time: nextRace.time as string | null },
    ] as { key: SessionKey; date: string | null; time: string | null }[]
  )
    .filter((s): s is { key: SessionKey; date: string; time: string } => !!s.date && !!s.time)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

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
      race_time: nextRace.time as string | null,
      days_until: daysUntil,
      sessions,
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
    race_time: nextRace.time as string | null,
    days_until: daysUntil,
    sessions,
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
