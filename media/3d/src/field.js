import cars from '../data/cars.json'
import telemetry from '../data/telemetry.json'

/**
 * The real race, from the live-timing recording (see scripts/extract_cars.py).
 * Every car's progress is in laps (12.5 = half-way round lap 13), sampled
 * `cars.hz` times a second from just before the start to after the flag.
 */

const HZ = cars.hz
const LAP_TIMES = cars.leader_lap_times
const ENTRIES = Object.entries(cars.cars)
const SAMPLES = ENTRIES[0][1].progress.length

export const CODES = ENTRIES.map(([code]) => code)
export const CAR_INFO = cars.cars

/**
 * Seconds into the recording at a (fractional) race lap: lap 0 is the start
 * signal, lap N is the moment the leader completed lap N.
 */
export function raceTimeAt(raceLap) {
  const last = LAP_TIMES.length - 1
  const lap = Math.min(Math.max(raceLap, 0), last)
  const i = Math.min(Math.floor(lap), last - 1)
  const f = lap - i
  return LAP_TIMES[i] + (LAP_TIMES[i + 1] - LAP_TIMES[i]) * f
}

/** Laps travelled by one car at a time in seconds. */
export function progressAt(code, time) {
  const p = cars.cars[code].progress
  const x = Math.min(Math.max(time * HZ, 0), SAMPLES - 1)
  const i = Math.min(Math.floor(x), SAMPLES - 2)
  return p[i] + (p[i + 1] - p[i]) * (x - i)
}

/** A typical racing pace, in laps per second (one lap in ~80 s). */
const RACE_PACE = 1 / 80

/** Speed relative to racing pace: 0 parked, ~1 flat out. */
export function paceAt(code, time) {
  return (progressAt(code, time + 1.5) - progressAt(code, time - 1.5)) / 3 / RACE_PACE
}

/** 1 while racing, fading to 0 over a few seconds after a retirement. */
export function presenceAt(code, time) {
  const out = cars.cars[code].retired_at
  if (out == null) return 1
  return Math.min(Math.max(1 - (time - out) / 4, 0), 1)
}

/**
 * Snapshot of the whole field at a time: each car's progress, its distance
 * behind the leader (in laps) and its running position.
 */
export function fieldAt(time, target = {}) {
  let lead = -Infinity
  const running = []
  for (const code of CODES) {
    const p = progressAt(code, time)
    const presence = presenceAt(code, time)
    target[code] = target[code] || {}
    target[code].progress = p
    target[code].presence = presence
    target[code].pace = paceAt(code, time)
    if (presence > 0) {
      running.push(code)
      if (p > lead) lead = p
    }
  }
  running.sort((a, b) => target[b].progress - target[a].progress)
  running.forEach((code, i) => (target[code].rank = i))
  for (const code of CODES) {
    target[code].behind = target[code].progress - lead
    if (target[code].presence <= 0) target[code].rank = -1
  }
  return target
}

/** Track status at a time: 1 green, 2 yellow, 4 SC, 5 red, 6 VSC, 7 VSC ending. */
const STATUS = cars.track_status
export function trackStatusAt(time) {
  let code = 1
  for (const [t, c] of STATUS) {
    if (t > time) break
    code = c
  }
  return code
}

export const TOTAL_LAPS = LAP_TIMES.length - 1

/** Stewards' decisions, in time order (see scripts/extract_cars.py). */
export const STEWARDS = cars.stewards ?? []

/** Drivers with car telemetry (speed, gear, throttle, brake). */
export const TELEMETRY_CODES = Object.keys(telemetry.cars)

/**
 * Speed (km/h), gear, throttle (0-100) and brake (0/1) of one car at a time
 * in seconds, written into `out`.
 */
export function telemetryAt(code, time, out = {}) {
  const c = telemetry.cars[code]
  const n = c.speed.length
  const x = Math.min(Math.max(time * telemetry.hz, 0), n - 1)
  const i = Math.min(Math.floor(x), n - 2)
  const f = x - i
  out.speed = c.speed[i] + (c.speed[i + 1] - c.speed[i]) * f
  out.throttle = c.throttle[i] + (c.throttle[i + 1] - c.throttle[i]) * f
  const near = f < 0.5 ? i : i + 1
  out.gear = c.gear[near]
  out.brake = c.brake[near]
  return out
}

/** The moment (in seconds) one car first reached a progress, in laps. */
export function timeAtProgress(code, target) {
  const p = cars.cars[code].progress
  if (target <= p[0]) return 0
  if (target >= p[SAMPLES - 1]) return (SAMPLES - 1) / HZ
  let lo = 0
  let hi = SAMPLES - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (p[mid] < target) lo = mid
    else hi = mid
  }
  const span = p[hi] - p[lo]
  return (lo + (span > 0 ? (target - p[lo]) / span : 0)) / HZ
}

/** Weather station readings: rows of [t, air, track, humidity, pressure, wind, wind_dir, rain]. */
// A reading of 0° is a sensor dropout, not a cold snap, so it is skipped.
export const WEATHER = (cars.weather?.rows ?? []).filter((r) => r[1] > 0 && r[2] > 0)

/** Weather at a time, eased between the once-a-minute readings. */
export function weatherAt(time, out = {}) {
  if (!WEATHER.length) return null
  let i = 0
  while (i < WEATHER.length - 2 && WEATHER[i + 1][0] <= time) i++
  const a = WEATHER[i]
  const b = WEATHER[Math.min(i + 1, WEATHER.length - 1)]
  const f = b[0] > a[0] ? Math.min(Math.max((time - a[0]) / (b[0] - a[0]), 0), 1) : 0
  const mix = (k) => a[k] + (b[k] - a[k]) * f
  out.air = mix(1)
  out.track = mix(2)
  out.humidity = mix(3)
  out.pressure = mix(4)
  out.wind = mix(5)
  out.windDir = f < 0.5 ? a[6] : b[6]
  out.rain = (f < 0.5 ? a[7] : b[7]) > 0
  return out
}
