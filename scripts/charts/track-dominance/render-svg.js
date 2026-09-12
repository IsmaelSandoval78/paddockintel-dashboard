// Track Dominance Map — SVG rendering (reference implementation).
//
// Reads the three JSON files produced by extract-telemetry.py and writes
// two standalone SVG files ready to drop into public/charts/:
//   track-map.svg   — the colored track outline + numbered braking zones
//   gap-chart.svg    — the "Gap Over Distance" companion line chart
//
// Usage (angle/flip found by eye once per circuit — see extract-telemetry.py
// header for why FastF1 doesn't give you this automatically for a debut
// circuit; reuse the same values for every future chart on that circuit):
//   node render-svg.js <codeA> <codeB> <nameA> <nameB> <rotationDeg> [flipX] [flipY]
//   e.g. node render-svg.js ANT LEC Antonelli Leclerc 90 flipX
//
// codeA/codeB MUST be the exact driver codes passed to extract-telemetry.py
// (e.g. "ANT"/"LEC") — dominance-data.json's `winner` field stores those
// codes, not display names. An earlier version of this script guessed the
// code-to-color mapping from "whichever code appears in segment 0", which
// is wrong about half the time (it depends on who won the FIRST minisector,
// not argument order) and silently swapped both drivers' colors and win
// counts. Always pass the real codes explicitly.

const fs = require('fs');
const d = require('./dominance-data.json');
const corners = require('./corners.json');
const dc = require('./delta-curve.json');

const [codeA, codeB, nameA, nameB, angleArg, ...flags] = process.argv.slice(2);
const angleDeg = parseFloat(angleArg || '0');
const flipX = flags.includes('flipX');
const flipY = flags.includes('flipY');

// Team/driver colors — edit per matchup. Keep one from each team's real
// livery color where possible; fall back to the site's terracotta/navy pair.
const COLOR_A = '#00A99D'; // e.g. Mercedes teal
const COLOR_B = '#C1502E'; // site terracotta — safe default for the 2nd driver

const rad = angleDeg * Math.PI / 180;
const cos = Math.cos(rad), sin = Math.sin(rad);

let allX = [], allY = [];
d.segments.forEach(s => { allX.push(...s.x); allY.push(...s.y); });
const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
const cy = (Math.min(...allY) + Math.max(...allY)) / 2;

function transform(x, y) {
  let px = x - cx, py = y - cy;
  if (flipX) px = -px;
  if (flipY) py = -py;
  return [px * cos - py * sin, px * sin + py * cos];
}

const colorFor = (code) => (code === codeA ? COLOR_A : COLOR_B);

const segments = d.segments.map(s => {
  const tx = [], ty = [];
  for (let i = 0; i < s.x.length; i++) {
    const [rx, ry] = transform(s.x[i], s.y[i]);
    tx.push(rx); ty.push(ry);
  }
  return { winner: s.winner, x: tx, y: ty };
});

const cornerPts = corners
  .slice()
  .sort((a, b) => a.dist - b.dist)
  .map((c, i) => { const [rx, ry] = transform(c.x, c.y); return { n: i + 1, x: rx, y: ry }; });

let xs = [], ys = [];
segments.forEach(s => { xs.push(...s.x); ys.push(...s.y); });
const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
const pad = 900;
const vbX = minX - pad, vbY = minY - pad, vbW = (maxX - minX) + pad * 2, vbH = (maxY - minY) + pad * 2;

function pathFor(seg) {
  return 'M ' + seg.x.map((x, i) => `${x.toFixed(1)},${seg.y[i].toFixed(1)}`).join(' L ');
}
// Bicolor "road": thick color stroke + thin white centerline, same path
// twice — never two separate elements, or they drift apart on curves.
const paths = segments.map(seg => {
  const color = colorFor(seg.winner);
  const path = pathFor(seg);
  return `<path d="${path}" stroke="${color}" stroke-width="170" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="${path}" stroke="#FAFAF7" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
}).join('\n    ');

const winsA = segments.filter(s => s.winner === codeA).length;
const winsB = segments.length - winsA;

const first = segments[0];
const sx = first.x[0], sy = first.y[0];
const ai = Math.min(6, first.x.length - 1);
const dx0 = first.x[ai] - sx, dy0 = first.y[ai] - sy;
const l0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);
const ux = dx0 / l0, uy = dy0 / l0, px0 = -uy, py0 = ux;
const gh = 260;
const arrowTip = [sx + ux * 1000, sy + uy * 1000];
const wing1 = [arrowTip[0] - ux * 260 + px0 * 160, arrowTip[1] - uy * 260 + py0 * 160];
const wing2 = [arrowTip[0] - ux * 260 - px0 * 160, arrowTip[1] - uy * 260 - py0 * 160];
const labelPos = [sx + px0 * (gh + 500) - ux * 300, sy + py0 * (gh + 500) - uy * 300];

const cornerMarkers = cornerPts.map(c => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="220" fill="#EDE3D0" stroke="#2B2620" stroke-width="26" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 90).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="240" font-weight="600" fill="#2B2620" text-anchor="middle">${c.n}</text>`).join('');

const trackSvg = `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  ${paths}
  <line x1="${(sx + px0 * gh).toFixed(1)}" y1="${(sy + py0 * gh).toFixed(1)}" x2="${(sx - px0 * gh).toFixed(1)}" y2="${(sy - py0 * gh).toFixed(1)}" stroke="#2B2620" stroke-width="50" stroke-dasharray="70,50" />
  <polygon points="${arrowTip.map(v => v.toFixed(1)).join(',')} ${wing1.map(v => v.toFixed(1)).join(',')} ${wing2.map(v => v.toFixed(1)).join(',')}" fill="#2B2620" />
  <text x="${labelPos[0].toFixed(1)}" y="${labelPos[1].toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="280" fill="#2B2620" text-anchor="middle">START / FINISH</text>
  ${cornerMarkers}
</svg>`;

fs.writeFileSync('track-map.svg', trackSvg);
console.log(`wrote track-map.svg — ${nameA} faster in ${winsA}/${segments.length}, ${nameB} in ${winsB}/${segments.length}`);

// ---- Gap-over-distance chart ----
const grid = dc.grid, delta = dc.delta, n = grid.length;
const W = 1200, H = 260, padL = 60, padR = 20, padT = 20, padB = 40;
const plotW = W - padL - padR, plotH = H - padT - padB;
const maxAbs = Math.max(...delta.map(Math.abs));
const yScale = (plotH / 2) / (maxAbs * 1.15);
const xScale = plotW / (grid[n - 1] - grid[0]);
const midY = padT + plotH / 2;
const X = (dist) => padL + (dist - grid[0]) * xScale;
const Y = (v) => midY - v * yScale;

const runs = [];
let cur = { sign: delta[0] >= 0 ? 1 : -1, pts: [[grid[0], delta[0]]] };
for (let i = 1; i < n; i++) {
  const sign = delta[i] >= 0 ? 1 : -1;
  if (sign !== cur.sign) {
    const t = delta[i - 1] / (delta[i - 1] - delta[i]);
    const crossDist = grid[i - 1] + t * (grid[i] - grid[i - 1]);
    cur.pts.push([crossDist, 0]);
    runs.push(cur);
    cur = { sign, pts: [[crossDist, 0]] };
  }
  cur.pts.push([grid[i], delta[i]]);
}
runs.push(cur);
// fastf1.utils.delta_time(A, B) returns B's elapsed time minus A's at each
// matched point. delta>0 => B took longer to get there => A is AHEAD.
// delta<0 => A took longer => B is AHEAD. Verified against raw per-driver
// elapsed time on a real case before trusting this (see extract-telemetry.py
// header) — an earlier version of this file had this backwards and
// produced a chart (and an already-published article caption) telling the
// opposite story of what the data actually showed. Double-check this sign
// against raw elapsed times for at least one sample point every time this
// script is reused, the way extract-telemetry.py's endpoint check does.
const runColor = { 1: COLOR_A, [-1]: COLOR_B };
const runPaths = runs.map(r => {
  const path = r.pts.map(([dist, v], i) => `${i === 0 ? 'M' : 'L'} ${X(dist).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return `<path d="${path}" stroke="${runColor[r.sign]}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
}).join('\n  ');

const gridLines = [`<line x1="${padL}" y1="${midY.toFixed(1)}" x2="${W - padR}" y2="${midY.toFixed(1)}" stroke="#2B2620" stroke-width="2" />`,
  `<text x="${padL - 10}" y="${(midY + 5).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="18" fill="#6B5F4E" text-anchor="end">0.0s</text>`];
for (let s = 1; s <= Math.ceil(maxAbs); s++) {
  const yUp = Y(s), yDown = Y(-s);
  if (yUp > padT) gridLines.push(`<line x1="${padL}" y1="${yUp.toFixed(1)}" x2="${W - padR}" y2="${yUp.toFixed(1)}" stroke="#C9BC9F" stroke-width="1" stroke-dasharray="4,6" /><text x="${padL - 10}" y="${(yUp + 5).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="16" fill="#A69A82" text-anchor="end">+${s}s</text>`);
  if (yDown < H - padB) gridLines.push(`<line x1="${padL}" y1="${yDown.toFixed(1)}" x2="${W - padR}" y2="${yDown.toFixed(1)}" stroke="#C9BC9F" stroke-width="1" stroke-dasharray="4,6" /><text x="${padL - 10}" y="${(yDown + 5).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="16" fill="#A69A82" text-anchor="end">-${s}s</text>`);
}

const gapSvg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  ${gridLines.join('\n  ')}
  ${runPaths}
  <text x="${padL}" y="${H - 10}" font-family="JetBrains Mono, monospace" font-size="16" fill="#6B5F4E">START/FINISH</text>
  <text x="${W - padR}" y="${H - 10}" font-family="JetBrains Mono, monospace" font-size="16" fill="#6B5F4E" text-anchor="end">FINISH LINE</text>
</svg>`;

fs.writeFileSync('gap-chart.svg', gapSvg);
console.log('wrote gap-chart.svg');
