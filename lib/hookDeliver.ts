import { createClient } from '@/lib/supabase/server';

// Feed Hook & Deliver v0. The headline stays the drama hook. This module turns a
// small authored spec into 1–3 facts from Supabase. A callout that cannot be
// resolved is omitted — never filled with a placeholder. Contract: docs/HOOK-DELIVER-FEED-V0.md.

const REF = /^[a-z0-9_-]{1,80}$/;
const MAX_CALLOUTS = 3;
const LABEL_MAX = 80;

export type HubKind = 'driver' | 'constructor' | 'circuit';

export type CareerMetric = 'wins' | 'podiums' | 'points' | 'races' | 'championships';

export type HookDeliverCalloutSpec =
  | {
      kind: 'h2h_season';
      driver_a: string;
      driver_b: string;
      year: number;
      label?: string;
      label_es?: string;
      label_pt?: string;
    }
  | {
      kind: 'wins_at_circuit';
      driver_ref: string;
      circuit_ref: string;
      label?: string;
      label_es?: string;
      label_pt?: string;
    }
  | {
      kind: 'constructor_career';
      constructor_ref: string;
      metric: CareerMetric;
      label?: string;
      label_es?: string;
      label_pt?: string;
    }
  | {
      kind: 'constructor_season_points';
      constructor_ref: string;
      year: number;
      label?: string;
      label_es?: string;
      label_pt?: string;
    };

export type HookDeliverSpec = {
  hub: { kind: HubKind; ref: string };
  callouts: HookDeliverCalloutSpec[];
};

export type FeaturedStat = {
  value: string;
  label: string;
  label_es?: string | null;
  unit?: string | null;
  unit_es?: string | null;
};

export type ResolvedCallout = {
  value: string;
  label: string;
};

export type ResolvedHookDeliver = {
  callouts: ResolvedCallout[];
  hub: { href: string; name: string };
};

export type HookDeliverFallbacks = {
  h2h: (year: number) => string;
  winsAtCircuit: string;
  constructorSeasonPoints: string;
  constructorCareer: (metric: CareerMetric) => string;
};

type Db = ReturnType<typeof createClient>;

const HUB_PREFIX: Record<HubKind, string> = {
  driver: '/drivers',
  constructor: '/constructors',
  circuit: '/circuits',
};

const CAREER_COLUMN: Record<CareerMetric, 'wins' | 'podiums' | 'total_points' | 'races' | 'championships'> = {
  wins: 'wins',
  podiums: 'podiums',
  points: 'total_points',
  races: 'races',
  championships: 'championships',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function refOf(value: unknown): string | null {
  return typeof value === 'string' && REF.test(value) ? value : null;
}

function yearOf(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1950 || value > 2100) return null;
  return value;
}

function labelOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > LABEL_MAX) return undefined;
  return trimmed;
}

function authoredLabel(
  spec: { label?: string; label_es?: string; label_pt?: string },
  locale: string,
): string | undefined {
  if (locale === 'es') return spec.label_es ?? spec.label;
  if (locale === 'pt') return spec.label_pt ?? spec.label;
  return spec.label;
}

function withLabels(raw: Record<string, unknown>): { label?: string; label_es?: string; label_pt?: string } {
  return {
    label: labelOf(raw.label),
    label_es: labelOf(raw.label_es),
    label_pt: labelOf(raw.label_pt),
  };
}

function parseCallout(raw: unknown): HookDeliverCalloutSpec | null {
  if (!isRecord(raw) || typeof raw.kind !== 'string') return null;
  const labels = withLabels(raw);

  if (raw.kind === 'h2h_season') {
    const driverA = refOf(raw.driver_a);
    const driverB = refOf(raw.driver_b);
    const year = yearOf(raw.year);
    if (!driverA || !driverB || driverA === driverB || year === null) return null;
    return { kind: 'h2h_season', driver_a: driverA, driver_b: driverB, year, ...labels };
  }

  if (raw.kind === 'wins_at_circuit') {
    const driverRef = refOf(raw.driver_ref);
    const circuitRef = refOf(raw.circuit_ref);
    if (!driverRef || !circuitRef) return null;
    return { kind: 'wins_at_circuit', driver_ref: driverRef, circuit_ref: circuitRef, ...labels };
  }

  if (raw.kind === 'constructor_career') {
    const constructorRef = refOf(raw.constructor_ref);
    const metric = raw.metric;
    if (!constructorRef || !isCareerMetric(metric)) return null;
    return { kind: 'constructor_career', constructor_ref: constructorRef, metric, ...labels };
  }

  if (raw.kind === 'constructor_season_points') {
    const constructorRef = refOf(raw.constructor_ref);
    const year = yearOf(raw.year);
    if (!constructorRef || year === null) return null;
    return { kind: 'constructor_season_points', constructor_ref: constructorRef, year, ...labels };
  }

  return null;
}

function isCareerMetric(value: unknown): value is CareerMetric {
  return value === 'wins' || value === 'podiums' || value === 'points' || value === 'races' || value === 'championships';
}

function isHubKind(value: unknown): value is HubKind {
  return value === 'driver' || value === 'constructor' || value === 'circuit';
}

/** Accepts the `hook_deliver` object. Returns null when the hub or every callout is unusable. */
export function parseHookDeliver(raw: unknown): HookDeliverSpec | null {
  if (!isRecord(raw) || !isRecord(raw.hub)) return null;
  const kind = raw.hub.kind;
  const ref = refOf(raw.hub.ref);
  if (!isHubKind(kind) || !ref) return null;
  if (!Array.isArray(raw.callouts)) return null;

  const callouts: HookDeliverCalloutSpec[] = [];
  for (const entry of raw.callouts) {
    if (callouts.length >= MAX_CALLOUTS) break;
    const parsed = parseCallout(entry);
    if (parsed) callouts.push(parsed);
  }
  if (callouts.length === 0) return null;
  return { hub: { kind, ref }, callouts };
}

/**
 * `stats` stays a Stat[] for items authored before this pilot.
 * An object `{ featured, hook_deliver }` is also accepted so a later item can
 * nest the spec without a second column. The column wins when both are set.
 */
export function readHookDeliver(stats: unknown, column: unknown): HookDeliverSpec | null {
  const fromColumn = parseHookDeliver(column);
  if (fromColumn) return fromColumn;
  if (isRecord(stats)) return parseHookDeliver(stats.hook_deliver);
  return null;
}

function isFeaturedStat(value: unknown): value is FeaturedStat {
  if (!isRecord(value)) return false;
  return typeof value.value === 'string' && typeof value.label === 'string';
}

export function readFeaturedStats(stats: unknown): FeaturedStat[] {
  const list = Array.isArray(stats) ? stats : isRecord(stats) && Array.isArray(stats.featured) ? stats.featured : [];
  return list.filter(isFeaturedStat);
}

export function hookDeliverSpecForItem(item: {
  entity_tags: string[] | null;
  stats: unknown;
  hook_deliver: unknown;
}): HookDeliverSpec | null {
  if (!item.entity_tags || item.entity_tags.length === 0) return null;
  return readHookDeliver(item.stats, item.hook_deliver);
}

function formatStatNumber(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function finishPosition(value: unknown): number | null | 'skip' {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric)) return 'skip';
  return numeric;
}

async function resolveH2H(
  supabase: Db,
  spec: Extract<HookDeliverCalloutSpec, { kind: 'h2h_season' }>,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedCallout | null> {
  const { data: driverRows, error: driverError } = await supabase
    .from('drivers')
    .select('id, driver_ref')
    .in('driver_ref', [spec.driver_a, spec.driver_b]);
  if (driverError || !driverRows) return null;

  const drivers = driverRows as { id: number; driver_ref: string }[];
  const idA = drivers.find((row) => row.driver_ref === spec.driver_a)?.id;
  const idB = drivers.find((row) => row.driver_ref === spec.driver_b)?.id;
  if (!idA || !idB) return null;

  const { data: raceRows, error: raceError } = await supabase.from('races').select('id').eq('year', spec.year);
  if (raceError || !raceRows || raceRows.length === 0) return null;
  const raceIds = (raceRows as { id: number }[]).map((row) => row.id);

  const { data: resultRows, error: resultError } = await supabase
    .from('results')
    .select('race_id, driver_id, position')
    .in('driver_id', [idA, idB])
    .in('race_id', raceIds);
  if (resultError || !resultRows) return null;

  // Same rule as app/api/compare/h2h: both classified → lower position finishes
  // ahead; one classified and one null (DNF) → the classified driver finishes
  // ahead; both null → the shared race counts, neither does. A non-numeric
  // position is skipped rather than treated as a result.
  const slots = new Map<number, { a?: number | null; b?: number | null }>();
  for (const row of resultRows as { race_id: number; driver_id: number; position: unknown }[]) {
    const position = finishPosition(row.position);
    if (position === 'skip') continue;
    const slot = slots.get(row.race_id) ?? {};
    if (row.driver_id === idA) slot.a = position;
    else if (row.driver_id === idB) slot.b = position;
    slots.set(row.race_id, slot);
  }

  let shared = 0;
  let aAhead = 0;
  let bAhead = 0;
  for (const slot of slots.values()) {
    if (slot.a === undefined || slot.b === undefined) continue;
    shared += 1;
    if (slot.a !== null && slot.b !== null) {
      if (slot.a < slot.b) aAhead += 1;
      else if (slot.b < slot.a) bAhead += 1;
    } else if (slot.a !== null) {
      aAhead += 1;
    } else if (slot.b !== null) {
      bAhead += 1;
    }
  }
  if (shared === 0) return null;

  return {
    value: `${aAhead}\u2013${bAhead}`,
    label: authoredLabel(spec, locale) ?? fallbacks.h2h(spec.year),
  };
}

async function resolveWinsAtCircuit(
  supabase: Db,
  spec: Extract<HookDeliverCalloutSpec, { kind: 'wins_at_circuit' }>,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedCallout | null> {
  const [{ data: driver, error: driverError }, { data: circuit, error: circuitError }] = await Promise.all([
    supabase.from('drivers').select('id').eq('driver_ref', spec.driver_ref).maybeSingle(),
    supabase.from('circuits').select('id').eq('circuit_ref', spec.circuit_ref).maybeSingle(),
  ]);
  if (driverError || circuitError || !driver || !circuit) return null;

  const driverId = (driver as { id: number }).id;
  const circuitId = (circuit as { id: number }).id;
  const { data: winRow, error } = await supabase
    .from('driver_circuit_wins')
    .select('wins')
    .eq('driver_id', driverId)
    .eq('circuit_id', circuitId)
    .maybeSingle();
  if (error) return null;

  // The view only emits rows for position = 1. A known driver and circuit with
  // no row is zero wins, which is a resolved fact. An unknown ref is omitted above.
  const wins = winRow ? Number((winRow as { wins: unknown }).wins) : 0;
  const value = formatStatNumber(wins);
  if (value === null) return null;

  return {
    value,
    label: authoredLabel(spec, locale) ?? fallbacks.winsAtCircuit,
  };
}

async function resolveConstructorCareer(
  supabase: Db,
  spec: Extract<HookDeliverCalloutSpec, { kind: 'constructor_career' }>,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedCallout | null> {
  const { data: constructor, error: constructorError } = await supabase
    .from('constructors')
    .select('id')
    .eq('constructor_ref', spec.constructor_ref)
    .maybeSingle();
  if (constructorError || !constructor) return null;

  const column = CAREER_COLUMN[spec.metric];
  const { data: stats, error } = await supabase
    .from('constructor_stats')
    .select('wins, podiums, total_points, races, championships')
    .eq('constructor_id', (constructor as { id: number }).id)
    .maybeSingle();
  if (error || !stats) return null;

  const value = formatStatNumber(Number((stats as Record<string, unknown>)[column]));
  if (value === null) return null;

  return {
    value,
    label: authoredLabel(spec, locale) ?? fallbacks.constructorCareer(spec.metric),
  };
}

async function resolveConstructorSeasonPoints(
  supabase: Db,
  spec: Extract<HookDeliverCalloutSpec, { kind: 'constructor_season_points' }>,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedCallout | null> {
  const { data: constructor, error: constructorError } = await supabase
    .from('constructors')
    .select('id')
    .eq('constructor_ref', spec.constructor_ref)
    .maybeSingle();
  if (constructorError || !constructor) return null;

  const { data: raceRows, error: raceError } = await supabase
    .from('races')
    .select('id, round')
    .eq('year', spec.year);
  if (raceError || !raceRows || raceRows.length === 0) return null;
  const races = raceRows as { id: number; round: number }[];

  const { data: standingRows, error } = await supabase
    .from('constructor_standings')
    .select('points, race_id')
    .eq('constructor_id', (constructor as { id: number }).id)
    .in('race_id', races.map((race) => race.id));
  if (error || !standingRows || standingRows.length === 0) return null;

  const roundByRace = new Map(races.map((race) => [race.id, race.round]));
  let latest: { round: number; points: number } | null = null;
  for (const row of standingRows as { points: unknown; race_id: number }[]) {
    const round = roundByRace.get(row.race_id);
    const points = Number(row.points);
    if (round === undefined || !Number.isFinite(points)) continue;
    if (!latest || round > latest.round) latest = { round, points };
  }
  if (!latest) return null;
  const value = formatStatNumber(latest.points);
  if (value === null) return null;

  return {
    value,
    label: authoredLabel(spec, locale) ?? fallbacks.constructorSeasonPoints,
  };
}

async function resolveCallout(
  supabase: Db,
  spec: HookDeliverCalloutSpec,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedCallout | null> {
  if (spec.kind === 'h2h_season') return resolveH2H(supabase, spec, locale, fallbacks);
  if (spec.kind === 'wins_at_circuit') return resolveWinsAtCircuit(supabase, spec, locale, fallbacks);
  if (spec.kind === 'constructor_career') return resolveConstructorCareer(supabase, spec, locale, fallbacks);
  return resolveConstructorSeasonPoints(supabase, spec, locale, fallbacks);
}

async function resolveHub(supabase: Db, hub: HookDeliverSpec['hub']): Promise<{ href: string; name: string } | null> {
  const href = `${HUB_PREFIX[hub.kind]}/${hub.ref}`;

  if (hub.kind === 'driver') {
    const { data, error } = await supabase
      .from('drivers')
      .select('forename, surname')
      .eq('driver_ref', hub.ref)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { forename: string; surname: string };
    return { href, name: `${row.forename} ${row.surname}` };
  }

  if (hub.kind === 'constructor') {
    const { data, error } = await supabase
      .from('constructors')
      .select('name')
      .eq('constructor_ref', hub.ref)
      .maybeSingle();
    if (error || !data) return null;
    return { href, name: (data as { name: string }).name };
  }

  const { data, error } = await supabase.from('circuits').select('name').eq('circuit_ref', hub.ref).maybeSingle();
  if (error || !data) return null;
  return { href, name: (data as { name: string }).name };
}

export async function resolveHookDeliver(
  spec: HookDeliverSpec,
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<ResolvedHookDeliver | null> {
  const supabase = createClient();
  const [hub, resolved] = await Promise.all([
    resolveHub(supabase, spec.hub),
    Promise.all(spec.callouts.map((callout) => resolveCallout(supabase, callout, locale, fallbacks))),
  ]);
  if (!hub) return null;

  const callouts = resolved.filter((callout): callout is ResolvedCallout => callout !== null);
  if (callouts.length === 0) return null;

  // Table names stay inside the queries. The card's source line is the
  // locale string feed.hookDeliver.source, not a join of those tables.
  return { callouts, hub };
}

export async function loadHookDeliverMap(
  items: { id: string; entity_tags: string[] | null; stats: unknown; hook_deliver: unknown }[],
  locale: string,
  fallbacks: HookDeliverFallbacks,
): Promise<Map<string, ResolvedHookDeliver>> {
  const resolved = new Map<string, ResolvedHookDeliver>();
  await Promise.all(
    items.map(async (item) => {
      const spec = hookDeliverSpecForItem(item);
      if (!spec) return;
      const block = await resolveHookDeliver(spec, locale, fallbacks);
      if (block) resolved.set(item.id, block);
    }),
  );
  return resolved;
}
