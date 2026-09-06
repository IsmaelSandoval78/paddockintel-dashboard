// Pure geometry for the Vintage Editorial "epicenter" circuit illustration —
// fits a track path into a square viewBox centered on its real bounding box, sized to the
// farthest point from that center (not half-width/half-height), so the track sits fully
// inside a circular frame regardless of its own aspect ratio (a tight infield vs. an oval).
// Client-only (needs a real DOM to measure the path) — same offscreen-SVG technique already
// used by CircuitHero.tsx and deltaRibbon/geometry.ts's getPointsAtPercents.

export interface EpicenterFrame {
  viewBox: string;
  cx: number;
  cy: number;
  radius: number;
}

const FARTHEST_POINT_SAMPLES = 200;

export function computeEpicenterFrame(pathD: string, paddingPct = 0.14): EpicenterFrame | null {
  if (typeof document === 'undefined') return null;

  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  svgEl.appendChild(pathEl);
  document.body.appendChild(svgEl);

  let frame: EpicenterFrame | null = null;
  try {
    const bbox = pathEl.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const totalLen = pathEl.getTotalLength();
    let maxDist = 0;
    if (totalLen > 0) {
      for (let i = 0; i <= FARTHEST_POINT_SAMPLES; i++) {
        const pt = pathEl.getPointAtLength((i / FARTHEST_POINT_SAMPLES) * totalLen);
        const dist = Math.hypot(pt.x - cx, pt.y - cy);
        if (dist > maxDist) maxDist = dist;
      }
    }

    if (maxDist > 0) {
      const radius = maxDist * (1 + paddingPct);
      frame = {
        viewBox: `${cx - radius} ${cy - radius} ${radius * 2} ${radius * 2}`,
        cx,
        cy,
        radius,
      };
    }
  } finally {
    document.body.removeChild(svgEl);
  }

  return frame;
}

// Single point on the path at a given path_percent (0-100), in the path's own coordinate
// space — same convention as circuit_corners.path_percent / delta_ribbon path_percent.
export function pointAtPercent(pathD: string, percent: number): { x: number; y: number } | null {
  if (typeof document === 'undefined') return null;

  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', pathD);
  svgEl.appendChild(pathEl);
  document.body.appendChild(svgEl);

  let point: { x: number; y: number } | null = null;
  try {
    const totalLen = pathEl.getTotalLength();
    if (totalLen > 0) {
      const wrapped = ((percent % 100) + 100) % 100;
      const pt = pathEl.getPointAtLength((wrapped / 100) * totalLen);
      point = { x: pt.x, y: pt.y };
    }
  } finally {
    document.body.removeChild(svgEl);
  }

  return point;
}
