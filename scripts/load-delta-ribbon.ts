// One-off ingestion: OpenF1 telemetry -> delta_ribbon_frames / delta_ribbon_events.
//
// Hardcoded to a single race/driver pair by design (CONCEPT-V2.md §3 scope cut for the
// 2026-08-23 launch) — this is not a generic multi-race/multi-driver loader.
//
// path_percent is computed from each driver's OWN lap arc-length (cumulative distance from
// consecutive /location samples, normalized 0-100 per lap), never from OpenF1 (x,y) projected
// onto the external SVG track path — those two coordinate systems have no known common origin/
// scale/rotation, so projecting one onto the other would need a real shape-registration step.
// Arc-length-from-timing sidesteps that entirely and lines up with circuit_corners.path_percent
// (also 0-100, same direction of travel, verified against the seeded Spa corners: corner 1 "La
// Source" sits at 10.00, ascending monotonically through corner 19 at 92.00 — same convention).
//
// Run:  npx ts-node --project scripts/tsconfig.json scripts/load-delta-ribbon.ts [--dry-run]

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');

const SESSION_KEY = 11334; // Belgian GP 2026, Race (confirmed live against OpenF1 /sessions)
const RACE_ID = 1178; // races.id — year=2026 round=10
const TRACK_LENGTH_M = 7004; // Circuit de Spa-Francorchamps, per supabase/seeds/circuit_corners_spa.sql header (Wikipedia-sourced); used only as a sanity bound, not for percent math

const DRIVER_A = { id: 844, number: 16, code: 'LEC' }; // Leclerc — positive delta_seconds = A ahead
const DRIVER_B = { id: 830, number: 3, code: 'VER' }; // Verstappen

const OPENF1_BASE = 'https://api.openf1.org/v1';
const BRAID_WINDOW_M = 400; // per CONCEPT-V2.md §3 example: consecutive swaps within ~400m group into a braid, not separate snaps
const DEFEND_THRESHOLD_S = 1.0; // how close the trailing driver must get, without crossing, to count as a defended attempt

interface Lap {
  lap_number: number;
  date_start: string;
  lap_duration: number | null;
}
interface Location {
  date: string;
  x: number;
  y: number;
}
interface CarDataSample {
  date: string;
  speed: number | null;
  throttle: number | null;
  brake: number | null;
  n_gear: number | null;
  drs: number | null;
}
interface Interval {
  date: string;
  gap_to_leader: number | string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// OpenF1 embeds comparison operators directly in the param name (`date>=`, `date<`) and
// parses the raw query string for that literal operator — URLSearchParams percent-encodes
// the `=`/`<`/`>` to %3D/%3C/%3E, which OpenF1 fails to recognize and 500s on. Build the
// query string by hand so operator keys stay literal; only the value gets percent-encoded.
function buildOpenF1Query(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => (/[<>=]$/.test(k) ? `${k}${encodeURIComponent(String(v))}` : `${k}=${encodeURIComponent(String(v))}`))
    .join('&');
}

async function fetchOpenF1<T>(endpoint: string, params: Record<string, string | number>, retries = 3): Promise<T[]> {
  const url = `${OPENF1_BASE}/${endpoint}?${buildOpenF1Query(params)}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    // 429 needs a real cooldown (OpenF1's free tier caps at 30 req/min) rather than the
    // short 5xx backoff below, or the retry itself trips the limit again.
    if (res.status === 429 && attempt < retries) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (res.status >= 500 && attempt < retries) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    throw new Error(`OpenF1 ${endpoint} failed: ${res.status} ${await res.text()} — url=${url}`);
  }
  throw new Error(`OpenF1 ${endpoint} failed after ${retries} retries`);
}

async function fetchOpenF1Chunked<T>(
  endpoint: string,
  driverNumber: number,
  sessionStart: Date,
  sessionEnd: Date,
  windowMinutes = 5
): Promise<T[]> {
  const out: T[] = [];
  let cursor = new Date(sessionStart);
  while (cursor < sessionEnd) {
    const windowEnd = new Date(Math.min(cursor.getTime() + windowMinutes * 60_000, sessionEnd.getTime()));
    try {
      const rows = await fetchOpenF1<T>(endpoint, {
        session_key: SESSION_KEY,
        driver_number: driverNumber,
        'date>=': cursor.toISOString(),
        'date<': windowEnd.toISOString(),
      });
      out.push(...rows);
    } catch (err) {
      // OpenF1 occasionally 500s on a specific time slice (confirmed independent of this
      // script — same window fails for both drivers). Skip and log rather than abort the
      // whole ingestion; this shows up as a small gap in that stretch of the ribbon.
      console.warn(`  gap: ${endpoint} driver=${driverNumber} ${cursor.toISOString()}–${windowEnd.toISOString()} — ${(err as Error).message.split(' — url=')[0]}`);
    }
    cursor = windowEnd;
    await sleep(2200); // OpenF1 free tier caps at 30 req/min — stay under that, not just "polite"
  }
  return out;
}

// Per-lap arc-length table: cumulative distance (m) at each location sample, from consecutive
// (x,y) deltas. Skips implausible jumps (telemetry glitches/gaps) rather than counting them.
interface ArcPoint {
  t: number; // ms epoch
  cumulativeM: number;
}
function buildArcLengthTable(locations: Location[]): { points: ArcPoint[]; totalM: number } {
  const points: ArcPoint[] = [];
  let cumulative = 0;
  let prev: Location | null = null;
  for (const loc of locations) {
    const t = new Date(loc.date).getTime();
    if (prev) {
      const d = Math.hypot(loc.x - prev.x, loc.y - prev.y);
      if (d < 40) cumulative += d; // ~40m caps a plausible gap between ~3.7Hz samples at race speed
    }
    points.push({ t, cumulativeM: cumulative });
    prev = loc;
  }
  return { points, totalM: cumulative };
}

function percentAtTime(arc: { points: ArcPoint[]; totalM: number }, t: number): number | null {
  if (arc.totalM <= 0 || arc.points.length < 2) return null;
  const { points } = arc;
  if (t <= points[0].t) return (points[0].cumulativeM / arc.totalM) * 100;
  if (t >= points[points.length - 1].t) return (points[points.length - 1].cumulativeM / arc.totalM) * 100;
  // points are chronological — linear scan is fine at this data volume (a few thousand points/lap)
  for (let i = 1; i < points.length; i++) {
    if (points[i].t >= t) {
      const a = points[i - 1];
      const b = points[i];
      const frac = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      const cumulativeM = a.cumulativeM + frac * (b.cumulativeM - a.cumulativeM);
      return (cumulativeM / arc.totalM) * 100;
    }
  }
  return null;
}

function findLapNumber(laps: Lap[], t: number): number | null {
  for (let i = 0; i < laps.length; i++) {
    const start = new Date(laps[i].date_start).getTime();
    const end = laps[i].lap_duration ? start + laps[i].lap_duration! * 1000 : (laps[i + 1] ? new Date(laps[i + 1].date_start).getTime() : start + 3 * 60_000);
    if (t >= start && t < end) return laps[i].lap_number;
  }
  return laps.length ? laps[laps.length - 1].lap_number : null;
}

function nearestSample<T extends { date: string }>(samples: T[], t: number, toleranceMs: number): T | null {
  let best: T | null = null;
  let bestDiff = Infinity;
  for (const s of samples) {
    const diff = Math.abs(new Date(s.date).getTime() - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return bestDiff <= toleranceMs ? best : null;
}

interface Frame {
  path_percent: number;
  lap: number;
  distance_m: number;
  delta_seconds: number;
  leader_driver_id: number;
  speed_a: number | null;
  speed_b: number | null;
  throttle_a: number | null;
  throttle_b: number | null;
  brake_a: number | null;
  brake_b: number | null;
  gear_a: number | null;
  gear_b: number | null;
  drs_a: number | null;
  drs_b: number | null;
  corner_name: string | null;
  t: number; // epoch ms, kept locally for event detection, not written to Supabase
}

interface EventRow {
  path_percent: number;
  lap: number;
  event_type: 'snap' | 'defend' | 'braid_start' | 'braid_end';
  corner_name: string | null;
}

async function main() {
  console.log(`Loading Delta Ribbon: ${DRIVER_A.code} vs ${DRIVER_B.code}, race_id=${RACE_ID}, session_key=${SESSION_KEY}${DRY_RUN ? ' [dry-run]' : ''}`);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [lapsA, lapsB] = await Promise.all([
    fetchOpenF1<Lap>('laps', { session_key: SESSION_KEY, driver_number: DRIVER_A.number }),
    fetchOpenF1<Lap>('laps', { session_key: SESSION_KEY, driver_number: DRIVER_B.number }),
  ]);
  lapsA.sort((a, b) => a.lap_number - b.lap_number);
  lapsB.sort((a, b) => a.lap_number - b.lap_number);
  console.log(`Laps: ${DRIVER_A.code}=${lapsA.length}, ${DRIVER_B.code}=${lapsB.length}`);

  const sessionStart = new Date(Math.min(new Date(lapsA[0].date_start).getTime(), new Date(lapsB[0].date_start).getTime()) - 10_000);
  const lastEnd = (laps: Lap[]) => {
    const last = laps[laps.length - 1];
    return new Date(last.date_start).getTime() + (last.lap_duration ?? 120) * 1000;
  };
  const sessionEnd = new Date(Math.max(lastEnd(lapsA), lastEnd(lapsB)) + 30_000);

  console.log('Fetching location + car_data (chunked, sequential to stay polite to a free API)...');
  const locA = await fetchOpenF1Chunked<Location>('location', DRIVER_A.number, sessionStart, sessionEnd);
  const locB = await fetchOpenF1Chunked<Location>('location', DRIVER_B.number, sessionStart, sessionEnd);
  const carA = await fetchOpenF1Chunked<CarDataSample>('car_data', DRIVER_A.number, sessionStart, sessionEnd);
  const carB = await fetchOpenF1Chunked<CarDataSample>('car_data', DRIVER_B.number, sessionStart, sessionEnd);
  const intA = await fetchOpenF1Chunked<Interval>('intervals', DRIVER_A.number, sessionStart, sessionEnd);
  const intB = await fetchOpenF1Chunked<Interval>('intervals', DRIVER_B.number, sessionStart, sessionEnd);
  console.log(`location: ${locA.length}/${locB.length}, car_data: ${carA.length}/${carB.length}, intervals: ${intA.length}/${intB.length}`);

  locA.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  locB.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  carA.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  carB.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  intA.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Arc-length table per lap, per driver — path_percent comes from here, never from the SVG.
  const arcByLapA = new Map<number, { points: ArcPoint[]; totalM: number }>();
  const arcByLapB = new Map<number, { points: ArcPoint[]; totalM: number }>();
  function buildPerLapArcs(laps: Lap[], locations: Location[], out: Map<number, { points: ArcPoint[]; totalM: number }>) {
    for (let i = 0; i < laps.length; i++) {
      const start = new Date(laps[i].date_start).getTime();
      const end = laps[i].lap_duration ? start + laps[i].lap_duration! * 1000 : (laps[i + 1] ? new Date(laps[i + 1].date_start).getTime() : start + 3 * 60_000);
      const lapLocs = locations.filter((l) => {
        const t = new Date(l.date).getTime();
        return t >= start && t < end;
      });
      if (lapLocs.length > 1) out.set(laps[i].lap_number, buildArcLengthTable(lapLocs));
    }
  }
  buildPerLapArcs(lapsA, locA, arcByLapA);
  buildPerLapArcs(lapsB, locB, arcByLapB);

  const { data: corners } = await supabase
    .from('circuit_corners')
    .select('name, path_percent')
    .eq('circuit_ref', 'spa')
    .not('path_percent', 'is', null)
    .order('path_percent', { ascending: true });
  const cornerList = (corners ?? []) as { name: string | null; path_percent: number }[];
  function nearestCorner(pct: number): string | null {
    let best: string | null = null;
    let bestDiff = Infinity;
    for (const c of cornerList) {
      const diff = Math.abs(c.path_percent - pct);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = c.name;
      }
    }
    return bestDiff <= 3 ? best : null; // only label a frame with a corner if it's genuinely close
  }

  let frames: Frame[] = [];
  const TOLERANCE_MS = 2000;
  for (const sample of intA) {
    const t = new Date(sample.date).getTime();
    const gapA = typeof sample.gap_to_leader === 'number' ? sample.gap_to_leader : null;
    const bSample = nearestSample(intB, t, TOLERANCE_MS);
    const gapB = bSample && typeof bSample.gap_to_leader === 'number' ? bSample.gap_to_leader : null;
    if (gapA === null || gapB === null) continue;

    const delta_seconds = gapB - gapA; // positive = A ahead
    const aheadIsA = delta_seconds >= 0;
    const leadArcs = aheadIsA ? arcByLapA : arcByLapB;
    const leadLaps = aheadIsA ? lapsA : lapsB;

    const lap = findLapNumber(leadLaps, t);
    if (lap === null) continue;
    const arc = leadArcs.get(lap);
    if (!arc) continue;
    const pct = percentAtTime(arc, t);
    if (pct === null) continue;

    const carSampleA = nearestSample(carA, t, TOLERANCE_MS);
    const carSampleB = nearestSample(carB, t, TOLERANCE_MS);
    const distance_m = (lap - 1) * TRACK_LENGTH_M + (pct / 100) * TRACK_LENGTH_M;

    frames.push({
      path_percent: Math.round(pct * 100) / 100,
      lap,
      distance_m: Math.round(distance_m),
      delta_seconds: Math.round(delta_seconds * 1000) / 1000,
      leader_driver_id: aheadIsA ? DRIVER_A.id : DRIVER_B.id,
      speed_a: carSampleA?.speed ?? null,
      speed_b: carSampleB?.speed ?? null,
      throttle_a: carSampleA?.throttle ?? null,
      throttle_b: carSampleB?.throttle ?? null,
      brake_a: carSampleA?.brake ?? null,
      brake_b: carSampleB?.brake ?? null,
      gear_a: carSampleA?.n_gear ?? null,
      gear_b: carSampleB?.n_gear ?? null,
      drs_a: carSampleA?.drs ?? null,
      drs_b: carSampleB?.drs ?? null,
      corner_name: nearestCorner(pct),
      t,
    });
  }
  frames.sort((a, b) => a.t - b.t);

  // Two intervals samples can land close enough in time that arc-length interpolation rounds
  // to the same (lap, path_percent) — most common at very low speed (pit lane, SC). That
  // collides with the DB's unique key, so collapse to the later sample per key before insert.
  const byKey = new Map<string, Frame>();
  for (const f of frames) byKey.set(`${f.lap}|${f.path_percent}`, f);
  const droppedDuplicates = frames.length - byKey.size;
  frames = [...byKey.values()].sort((a, b) => a.t - b.t);

  console.log(`Built ${frames.length} frames${droppedDuplicates ? ` (${droppedDuplicates} duplicate lap+path_percent collapsed)` : ''}`);

  // Event detection: sign changes in leader_driver_id are rebases. Consecutive swaps within
  // BRAID_WINDOW_M group into one braid instead of separate snaps. A local minimum in |delta|
  // that doesn't cross zero, closing within DEFEND_THRESHOLD_S and then reopening, is a 'defend'.
  const events: EventRow[] = [];
  const swapIdx: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].leader_driver_id !== frames[i - 1].leader_driver_id) swapIdx.push(i);
  }
  let i = 0;
  while (i < swapIdx.length) {
    let j = i;
    while (j + 1 < swapIdx.length && frames[swapIdx[j + 1]].distance_m - frames[swapIdx[j]].distance_m <= BRAID_WINDOW_M) j++;
    if (j === i) {
      const f = frames[swapIdx[i]];
      events.push({ path_percent: f.path_percent, lap: f.lap, event_type: 'snap', corner_name: f.corner_name });
    } else {
      const start = frames[swapIdx[i]];
      const end = frames[swapIdx[j]];
      events.push({ path_percent: start.path_percent, lap: start.lap, event_type: 'braid_start', corner_name: start.corner_name });
      events.push({ path_percent: end.path_percent, lap: end.lap, event_type: 'braid_end', corner_name: end.corner_name });
    }
    i = j + 1;
  }
  // Defend: local minima of |delta| that stay on the same side and reopen by DEFEND_THRESHOLD_S.
  for (let k = 1; k < frames.length - 1; k++) {
    const prevAbs = Math.abs(frames[k - 1].delta_seconds);
    const curAbs = Math.abs(frames[k].delta_seconds);
    const nextAbs = Math.abs(frames[k + 1].delta_seconds);
    const sameSideAsNeighbors =
      Math.sign(frames[k].delta_seconds || 1) === Math.sign(frames[k - 1].delta_seconds || 1) &&
      Math.sign(frames[k].delta_seconds || 1) === Math.sign(frames[k + 1].delta_seconds || 1);
    if (sameSideAsNeighbors && curAbs < DEFEND_THRESHOLD_S && curAbs <= prevAbs && curAbs <= nextAbs && nextAbs - curAbs > 0.3) {
      events.push({ path_percent: frames[k].path_percent, lap: frames[k].lap, event_type: 'defend', corner_name: frames[k].corner_name });
    }
  }
  console.log(`Detected ${events.length} events (${events.filter((e) => e.event_type === 'snap').length} snap, ${events.filter((e) => e.event_type.startsWith('braid')).length} braid, ${events.filter((e) => e.event_type === 'defend').length} defend)`);

  if (DRY_RUN) {
    console.log('Dry run — not writing to Supabase.');
    console.log('Sample frame:', frames[Math.floor(frames.length / 2)]);
    if (events.length) console.log('Sample event:', events[0]);
    return;
  }

  await supabase.from('delta_ribbon_frames').delete().eq('race_id', RACE_ID).eq('driver_a_id', DRIVER_A.id).eq('driver_b_id', DRIVER_B.id);
  await supabase.from('delta_ribbon_events').delete().eq('race_id', RACE_ID).eq('driver_a_id', DRIVER_A.id).eq('driver_b_id', DRIVER_B.id);

  const frameRows = frames.map(({ t: _t, ...rest }) => ({
    race_id: RACE_ID,
    driver_a_id: DRIVER_A.id,
    driver_b_id: DRIVER_B.id,
    ...rest,
  }));
  for (let batch = 0; batch < frameRows.length; batch += 500) {
    const chunk = frameRows.slice(batch, batch + 500);
    const { error } = await supabase.from('delta_ribbon_frames').insert(chunk);
    if (error) throw new Error(`Insert frames failed: ${error.message}`);
  }

  if (events.length) {
    const eventRows = events.map((e) => ({ race_id: RACE_ID, driver_a_id: DRIVER_A.id, driver_b_id: DRIVER_B.id, ...e }));
    const { error } = await supabase.from('delta_ribbon_events').insert(eventRows);
    if (error) throw new Error(`Insert events failed: ${error.message}`);
  }

  console.log(`Wrote ${frameRows.length} frames and ${events.length} events.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
