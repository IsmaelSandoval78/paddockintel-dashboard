import * as THREE from 'three'
import session from '../../data/session.json'

/**
 * Everything the qualifying template shows comes from data/session.json.
 * This module reads it once and derives the handful of helpers the scene
 * needs (colours for any driver code, time <-> lap-fraction lookups).
 * Nothing here knows which circuit or which drivers it is looking at.
 */
export { session }

/** Brand palette, with safe fallbacks if a key is missing from the file. */
export const COLORS = {
  cream: '#F3ECDD',
  blue: '#2B4AA0',
  red: '#E23A3A',
  navy: '#16244F',
  yellow: '#F5C518',
  ...(session.colors ?? {}),
}

/**
 * Track look: ribbon colour and the kerb stripe pattern. Comes from
 * session.theme; `?track=` and `?kerbs=` in the address override it so
 * options can be compared without touching the file.
 */
const TRACK_PRESETS = { azul: COLORS.blue, gris: '#5b5e66', negro: '#1d1f24' }
const KERB_PRESETS = {
  clasico: [COLORS.red, '#ffffff'],
  brasil: ['#009C3B', '#FFDF00'],
  brasil3: ['#009C3B', '#FFDF00', '#002776'],
}
const pick = (value, presets) => (value && (presets[value] ?? (/^#?[0-9a-f]{6}$/i.test(value) ? `#${value.replace('#', '')}` : null))) || null
const params = new URLSearchParams(location.search)
const kerbParam = params.get('kerbs')
export const THEME = {
  track: pick(params.get('track'), TRACK_PRESETS) ?? session.theme?.track ?? COLORS.blue,
  kerbs: (kerbParam && KERB_PRESETS[kerbParam]) ?? session.theme?.kerbs ?? KERB_PRESETS.clasico,
}

/** One place to ask "what colour is this driver?", whatever list they came from. */
const knownColors = {}
for (const [code, d] of Object.entries(session.drivers ?? {})) knownColors[code] = d.color
for (const g of session.grid ?? []) knownColors[g.code] ??= g.color
for (const d of session.top3 ?? []) knownColors[d.code] ??= d.color

export function colorOf(code) {
  return knownColors[code] ?? COLORS.navy
}

/** Final classification position, used to order the knockout columns. */
export function positionOf(code) {
  const d = session.drivers?.[code]
  if (d?.pos) return d.pos
  const g = (session.grid ?? []).find((x) => x.code === code)
  if (g) return g.pos
  return 99
}

export const TOP3 = session.top3
export const SECTOR_LINES = session.sector_lines
/** Samples per lap in the `t` / `speed` arrays (401 -> 400 steps). */
const STEPS = TOP3[0].t.length - 1

/**
 * Two cars of the same team share a colour. The second one is shown a
 * shade darker so the three trails stay tellable apart.
 */
const navy = new THREE.Color(COLORS.navy)
const used = []
for (const d of TOP3) {
  const base = new THREE.Color(d.color)
  const clash = used.some(
    (c) => Math.abs(c.r - base.r) + Math.abs(c.g - base.g) + Math.abs(c.b - base.b) < 0.08
  )
  d.display = clash ? '#' + base.clone().lerp(navy, 0.45).getHexString() : d.color
  used.push(base)
}

/** Lap fraction (0-1) a driver had reached `time` seconds into the lap. */
export function fractionAt(driver, time) {
  const t = driver.t
  if (time <= 0) return 0
  if (time >= t[STEPS]) return 1
  let lo = 0
  let hi = STEPS
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (t[mid] <= time) lo = mid
    else hi = mid
  }
  const f = (time - t[lo]) / (t[hi] - t[lo] || 1)
  return (lo + f) / STEPS
}

/** Elapsed lap time of a driver at lap fraction f (exact at sector lines). */
export function timeAt(driver, f) {
  const x = Math.min(Math.max(f, 0), 1) * STEPS
  const i = Math.min(Math.floor(x), STEPS - 1)
  return driver.t[i] + (driver.t[i + 1] - driver.t[i]) * (x - i)
}

/** Speed (km/h) of a driver at lap fraction f. */
export function speedAt(driver, f) {
  const s = driver.speed
  const x = Math.min(Math.max(f, 0), 1) * STEPS
  const i = Math.min(Math.floor(x), STEPS - 1)
  return s[i] + (s[i + 1] - s[i]) * (x - i)
}

/** The longest of the three laps, i.e. how long the comparison runs. */
export const LAP_MAX = Math.max(...TOP3.map((d) => d.t[STEPS]))

/** Which sector (1-3) lap fraction f is in. */
export function sectorOf(f) {
  return f < SECTOR_LINES[0] ? 1 : f < SECTOR_LINES[1] ? 2 : 3
}

/** "1:16.514" / "34.218" style clock. */
export function formatClock(seconds) {
  const s = Math.max(seconds, 0)
  const m = Math.floor(s / 60)
  const rest = (s - m * 60).toFixed(3).padStart(6, '0')
  return m > 0 ? `${m}:${rest}` : rest
}

/** Rough lap length in metres, integrated from the pole lap's speed trace. */
export const LAP_METRES = (() => {
  const d = TOP3[0]
  let m = 0
  for (let i = 0; i < STEPS; i++) {
    const v = (d.speed[i] + d.speed[i + 1]) / 2 / 3.6
    m += v * (d.t[i + 1] - d.t[i])
  }
  return m
})()
