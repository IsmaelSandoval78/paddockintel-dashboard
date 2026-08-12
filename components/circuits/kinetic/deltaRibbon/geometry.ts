// Pure geometry helpers for the Delta Ribbon (no React/GSAP) — Phase 1, historical-only.
// See CONCEPT-V2.md §3 for the visual spec this implements (states 1/3/4 of 5).

export interface Point {
  x: number;
  y: number;
}

export interface RibbonFrame {
  lap: number;
  path_percent: number;
  delta_seconds: number;
  leader_driver_id: number;
}

export interface DensifiedSample {
  percent: number;
  deltaSeconds: number;
  leaderId: number;
}

export interface LeaderRun<T> {
  startIdx: number;
  endIdx: number; // inclusive
  key: T;
}

const DEFAULT_WIDTH_CAP_SECONDS = 8;

/**
 * Batched path_percent (0-100) -> SVG (x,y) lookup. Measures an offscreen, unstyled clone
 * of the track path — the visible path has GSAP DrawSVG's vector-effect:non-scaling-stroke,
 * which breaks getTotalLength() when CSS-scaled (same workaround as CircuitHero.tsx). All
 * percents are resolved against one clone in one pass, not one clone per lookup.
 */
export function getPointsAtPercents(pathD: string, percents: number[]): Point[] {
  if (typeof document === 'undefined' || percents.length === 0) return [];
  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  svgEl.appendChild(pathEl);
  document.body.appendChild(svgEl);
  const totalLen = pathEl.getTotalLength();
  const points = totalLen > 0
    ? percents.map((p) => {
        const wrapped = ((p % 100) + 100) % 100;
        const pt = pathEl.getPointAtLength((wrapped / 100) * totalLen);
        return { x: pt.x, y: pt.y };
      })
    : percents.map(() => ({ x: 0, y: 0 }));
  document.body.removeChild(svgEl);
  return points;
}

/** Ribbon half-width scale: sqrt-compressed so small deltas still show visible variation
 * instead of being crushed by rare long-gap outliers. `capSeconds` should be derived from the
 * real race's own delta range (see `widthCapForRace`) — a fixed cap tuned for one race/lap's
 * typical gaps can pin an entire different lap at max width with zero visible variation. */
export function widthForDelta(absDeltaSeconds: number, vw: number, capSeconds = DEFAULT_WIDTH_CAP_SECONDS): number {
  const min = vw * 0.016;
  const max = vw * 0.07;
  const t = Math.min(Math.sqrt(Math.abs(absDeltaSeconds) / capSeconds), 1);
  return min + (max - min) * t;
}

/** Cap for widthForDelta, derived from this race's own frames so the scale reflects gaps that
 * actually occur in the data instead of an assumption tuned against a different race. Floored
 * at DEFAULT_WIDTH_CAP_SECONDS so a race with only small deltas doesn't over-amplify noise. */
export function widthCapForRace(frames: RibbonFrame[]): number {
  if (frames.length === 0) return DEFAULT_WIDTH_CAP_SECONDS;
  const maxAbsDelta = Math.max(...frames.map((f) => Math.abs(f.delta_seconds)));
  return Math.max(DEFAULT_WIDTH_CAP_SECONDS, maxAbsDelta);
}

/**
 * Gap-fills and densifies a race's last recorded lap into a smooth, full 0-100% loop.
 * Frames are sparse and corner-anchored (not fixed-distance), and rarely cover the full
 * loop on their own — the gap between the lap's last and first anchor (wrapping 100->0) is
 * linearly interpolated for delta_seconds, holding leader_driver_id from the nearer real
 * anchor rather than inventing a leader-change frame that never happened.
 */
export function densifyLastLap(frames: RibbonFrame[], stepPercent = 0.5): DensifiedSample[] {
  if (frames.length === 0) return [];
  const maxLap = Math.max(...frames.map((f) => f.lap));
  const lapFrames = frames
    .filter((f) => f.lap === maxLap)
    .sort((a, b) => a.path_percent - b.path_percent);
  if (lapFrames.length === 0) return [];

  const first = lapFrames[0];
  const last = lapFrames[lapFrames.length - 1];
  // Virtual anchors before 0% and after 100% so every real pct in [0,100) has a bracket,
  // including the wrap seam — never treated as a real event, just an interpolation boundary.
  const anchors = [
    { ...last, path_percent: last.path_percent - 100 },
    ...lapFrames,
    { ...first, path_percent: first.path_percent + 100 },
  ];

  const samples: DensifiedSample[] = [];
  for (let pct = 0; pct < 100; pct += stepPercent) {
    let i = 0;
    while (i < anchors.length - 2 && anchors[i + 1].path_percent <= pct) i++;
    const a = anchors[i];
    const b = anchors[i + 1];
    const span = b.path_percent - a.path_percent;
    const frac = span > 0 ? (pct - a.path_percent) / span : 0;
    samples.push({
      percent: pct,
      deltaSeconds: a.delta_seconds + frac * (b.delta_seconds - a.delta_seconds),
      leaderId: frac < 0.5 ? a.leader_driver_id : b.leader_driver_id,
    });
  }
  return samples;
}

/**
 * Per-point left/right boundary offsets, forming a variable-width band along the track path.
 * Tangent is the forward difference to the next point (points are already a dense, ~evenly
 * spaced ring), rotated 90deg for the normal — no separate offset lookup needed.
 */
export function buildRibbonPolygon(points: Point[], widths: number[]): { left: Point[]; right: Point[] } {
  const n = points.length;
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < n; i++) {
    const cur = points[i];
    const next = points[(i + 1) % n];
    const dx = next.x - cur.x;
    const dy = next.y - cur.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const halfW = widths[i] / 2;
    left.push({ x: cur.x + nx * halfW, y: cur.y + ny * halfW });
    right.push({ x: cur.x - nx * halfW, y: cur.y - ny * halfW });
  }
  return { left, right };
}

/** Splits an ordered sequence into contiguous same-key runs (leader id, or a braid sentinel). */
export function segmentByKey<T>(keys: T[]): LeaderRun<T>[] {
  const runs: LeaderRun<T>[] = [];
  if (keys.length === 0) return runs;
  let start = 0;
  for (let i = 1; i <= keys.length; i++) {
    if (i === keys.length || keys[i] !== keys[start]) {
      runs.push({ startIdx: start, endIdx: i - 1, key: keys[start] });
      start = i;
    }
  }
  return runs;
}

/** Builds a filled SVG path `d` for one leader-run: left boundary forward, right boundary reversed. */
export function runPathD(left: Point[], right: Point[], startIdx: number, endIdx: number): string {
  const leftSeg = left.slice(startIdx, endIdx + 1);
  const rightSeg = right.slice(startIdx, endIdx + 1).reverse();
  const all = [...leftSeg, ...rightSeg];
  if (all.length === 0) return '';
  return `M ${all.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')} Z`;
}
