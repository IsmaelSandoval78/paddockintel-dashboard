import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import race from '../data/race.json'
import { trackPoint } from './track.js'
import {
  fieldAt,
  raceTimeAt,
  trackStatusAt,
  timeAtProgress,
  telemetryAt,
  TOTAL_LAPS,
} from './field.js'

gsap.registerPlugin(ScrollTrigger)

export const CHAPTERS = race.chapters

/** Everything the scroll drives. Read every frame, never set by hand. */
export const S = {
  /** 0-6, which camera shot we are on (fractional = mid-transition). */
  u: 0,
  /** The leader's position around the lap. Grows past 1 as laps go by. */
  lapT: 0.42,
  /** Race lap. Starts mid-race so the hook opens on a moving field. */
  raceLap: 30,
  /** Orbit angles for the opening and closing wide shots. */
  orbitA: -0.5,
  orbitB: -0.8,
  /** 0-1 global trail brightness. */
  trailOpacity: 1,
  /** 0-1 red-flag tint. */
  red: 0,
  /** 0-1 reveal of the lap-chart lines. */
  chart: 0,
  /** 0-1 how many of the five start lights are lit, then 0 again. */
  lights: 0,
  /** 0-1 confetti. */
  confetti: 0,
  /** 0-1 the circuit name painted on the infield (chapter 2 only). */
  circuitName: 0,
  /** Index of the chapter currently on screen. */
  chapter: 0,
}

/** The whole field at the current race lap, refreshed once per frame. */
export const field = {}
/** Track status at the current race lap (see trackStatusAt). */
export const raceState = { status: 1 }
let fieldLap = NaN

/** Call once per frame before reading `field` or `driverT`. */
export function updateField() {
  if (S.raceLap === fieldLap) return
  fieldLap = S.raceLap
  const time = raceTimeAt(S.raceLap)
  fieldAt(time, field)
  raceState.status = trackStatusAt(time)
}

/**
 * Lap fraction of one driver: the leader sits at S.lapT, chosen by the
 * story, and everyone else is placed behind by their real gap on track.
 */
export function driverT(code) {
  updateField()
  return S.lapT + field[code].behind
}

/**
 * Telemetry of one driver for what is on screen. The story moves the car
 * round the lap freely, so the readout follows the car's position on the
 * ribbon: it shows the real speed the driver had at that exact spot on the
 * current lap (the final lap once the race is over). A parked car (grid)
 * or a neutralised race (safety car, VSC, red flag) shows the real moment.
 */
const telemetry = {}
export function telemetryOnScreen(code) {
  updateField()
  const car = field[code]
  let time = raceTimeAt(S.raceLap)
  const green = raceState.status === 1 || raceState.status === 2
  if (green && car.pace > 0.25) {
    const t = driverT(code)
    const f = t - Math.floor(t)
    let lap = Math.round(car.progress - f) + f
    if (lap > TOTAL_LAPS) lap -= 1
    time = timeAtProgress(code, lap)
  }
  return telemetryAt(code, time, telemetry)
}

// --- camera shots -----------------------------------------------------------

function makePose() {
  return { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0, fov: 42 }
}

const SHOTS = [
  // 1 — P21 → P2. The hook: glued to Verstappen mid-race, trail alive. Offset
  // to the side so the ribbon runs up the right edge, clear of the title.
  (o) => {
    const t = driverT('VER')
    trackPoint(t - 0.05, -7, 5.5, o.pos)
    trackPoint(t + 0.012, 1.5, 1.4, o.target)
    o.roll = 0
    o.fov = 50
  },
  // 2 — THE RAIN RACE. Wide establishing shot, slow orbit, field racing.
  (o) => {
    const a = S.orbitA + orbitOffset()
    o.pos.set(Math.sin(a) * 76, 50, Math.cos(a) * 76)
    o.target.set(0, 10, 0)
    o.roll = 0
    o.fov = 42
  },
  // 3 — LIGHTS OUT. Crane down over the grid, looking along the straight.
  (o) => {
    trackPoint(0.997, -11, 6.5, o.pos)
    trackPoint(1.045, -1, 2.6, o.target)
    o.roll = 0
    o.fov = 46
  },
  // 4 — LAP 20. Low tracking shot running ahead of the papaya trail and
  // looking back, so Norris is nearest and the others chase.
  (o) => {
    const t = driverT('NOR')
    trackPoint(t + 0.024, -5.5, 3.2, o.pos)
    trackPoint(t - 0.005, 0, 1, o.target)
    o.roll = 0
    o.fov = 42
  },
  // 5 — THE CLIMB. Top-down over the lap chart, close enough to fill the frame.
  (o) => {
    o.pos.set(-8, 148, 30)
    o.target.set(-8, 14, -14)
    o.roll = 0
    o.fov = 40
  },
  // 6 — 14.602s. Chase cam behind the winner on the run to the flag.
  (o) => {
    const t = driverT('NOR')
    // Nearly level, so the road fills the lower half and the sky above it
    // stays clear for the big number.
    trackPoint(t - 0.03, -0.3, 3.4, o.pos)
    trackPoint(t + 0.008, 0, 2.7, o.target)
    o.roll = 0
    o.fov = 50
  },
  // 7 — NORRIS WINS. Back out wide, slow orbit.
  (o) => {
    const a = S.orbitB + orbitOffset()
    o.pos.set(Math.sin(a) * 78, 46, Math.cos(a) * 78)
    o.target.set(0, 10, 0)
    o.roll = 0
    o.fov = 42
  },
]

/** Shots are composed for 16:9. */
const REFERENCE_ASPECT = 16 / 9
/** Current frame aspect, refreshed each time the camera is updated. */
let currentAspect = REFERENCE_ASPECT

/**
 * In a tall frame the wide shots look at the circuit down its long axis, so
 * its 100-unit length runs into depth instead of straight off both edges.
 */
function orbitOffset() {
  return currentAspect < 1.1 ? Math.PI / 2 : 0
}

/**
 * Narrower frames (the 9:16 recording layout) would crop the action out of
 * every shot, so widen the lens a little and back the camera off to cover
 * the same horizontal field.
 */
function framing(aspect) {
  const ratio = Math.min(REFERENCE_ASPECT / aspect, 2.0)
  if (ratio <= 1.001) return { fovMul: 1, distMul: 1 }
  const fovMul = Math.min(Math.sqrt(ratio), 1.42)
  return { fovMul, distMul: ratio / fovMul }
}

const poseA = makePose()
const poseB = makePose()
const pose = makePose()
const smoothPos = new THREE.Vector3()
const smoothTarget = new THREE.Vector3()
let smoothRoll = 0
let smoothFov = 42
let primed = false

/** Evaluates the blended shot and writes it onto the camera. */
export function updateCamera(camera, dt) {
  currentAspect = camera.aspect
  const u = THREE.MathUtils.clamp(S.u, 0, SHOTS.length - 1)
  const i = Math.min(Math.floor(u), SHOTS.length - 2)
  const f = u - i

  SHOTS[i](poseA)
  SHOTS[i + 1](poseB)

  pose.pos.lerpVectors(poseA.pos, poseB.pos, f)
  pose.target.lerpVectors(poseA.target, poseB.target, f)
  pose.roll = THREE.MathUtils.lerp(poseA.roll, poseB.roll, f)
  pose.fov = THREE.MathUtils.lerp(poseA.fov, poseB.fov, f)

  const { fovMul, distMul } = framing(camera.aspect)
  if (distMul !== 1) {
    pose.pos.sub(pose.target).multiplyScalar(distMul).add(pose.target)
    pose.fov *= fovMul
  }

  if (!primed) {
    smoothPos.copy(pose.pos)
    smoothTarget.copy(pose.target)
    smoothRoll = pose.roll
    smoothFov = pose.fov
    primed = true
  }

  // A little critical damping on top of the scrub makes it feel like a drone
  // rather than a value being dragged.
  const k = 1 - Math.exp(-dt * 9)
  smoothPos.lerp(pose.pos, k)
  smoothTarget.lerp(pose.target, k)
  smoothRoll += (pose.roll - smoothRoll) * k
  smoothFov += (pose.fov - smoothFov) * k

  camera.position.copy(smoothPos)
  camera.up.set(0, 1, 0)
  camera.lookAt(smoothTarget)
  camera.rotateZ(smoothRoll)
  if (Math.abs(camera.fov - smoothFov) > 0.001) {
    camera.fov = smoothFov
    camera.updateProjectionMatrix()
  }
}

// --- the scroll timeline ----------------------------------------------------

/**
 * Wires Lenis + ScrollTrigger and lays out the seven chapters on one
 * scrubbed timeline.
 * @param {(index: number) => void} onChapter
 */
export function createStory({ onChapter, autoplay = false }) {
  const lenis = new Lenis({ autoRaf: false, duration: 1.0 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7,
      onUpdate: (self) => {
        const index = Math.min(6, Math.floor(self.progress * 7 + 0.001))
        if (index !== S.chapter) {
          S.chapter = index
          onChapter(index)
        }
        // The last ~second of scroll is the subscribe end card.
        document.body.classList.toggle('outro', self.progress > 0.972)
      },
    },
  })

  // Each chapter owns one unit of timeline time: chapter k spans [k, k+1].
  // The camera holds for the first ~60% then travels to the next shot.
  for (let k = 0; k < 6; k++) {
    timeline.to(S, { u: k + 1, duration: 0.42, ease: 'power2.inOut' }, k + 0.6)
  }

  // Chapter 1 — the hook: Verstappen's trail keeps moving under the title.
  timeline.to(S, { lapT: 1.2, duration: 1.0, ease: 'none' }, 0)

  // Chapter 2 — wide shot, the field still racing in the rain. On the travel
  // out, everything is pulled back to the grid for the lights: the infield
  // name clears, the field parks, the leader sits on the start line.
  timeline.to(S, { orbitA: 0.45, duration: 2 }, 1)
  timeline.to(S, { lapT: 1.7, duration: 0.8, ease: 'power1.out' }, 1.05)
  timeline.to(S, { circuitName: 1, duration: 0.25, ease: 'power2.out' }, 1.02)
  timeline.to(S, { circuitName: 0, duration: 0.3, ease: 'power2.in' }, 1.75)
  timeline.to(S, { raceLap: 0, duration: 0.45, ease: 'power2.inOut' }, 1.75)
  timeline.to(S, { lapT: 2.055, duration: 0.5, ease: 'power1.inOut' }, 1.78)

  // Chapter 3 — the five lights go on, then out, then the lap-1 reshuffle.
  // The running order only settles once they have actually raced to turn 1.
  // All five stay lit for a decent stretch of scroll, so nobody races past
  // the moment they go out.
  timeline.to(S, { lights: 1, duration: 0.24 }, 2.02)
  timeline.to(S, { lights: 0, duration: 0.04 }, 2.5)
  timeline.to(S, { lapT: 2.4, duration: 1.0, ease: 'power2.in' }, 2.52)
  timeline.to(S, { raceLap: 1, duration: 0.7, ease: 'power1.inOut' }, 2.56)

  // Chapter 4 — the laps fly by during the camera move, so the running order
  // already reads "lap 20, Norris leading" when the title lands.
  timeline.to(S, { raceLap: 20, duration: 0.5, ease: 'power1.inOut' }, 2.7)
  timeline.to(S, { lapT: 3.12, duration: 1.3, ease: 'power1.inOut' }, 2.9)

  // Chapter 5 — top-down, the real position lines rise off the ground.
  timeline.to(S, { raceLap: 55, duration: 0.45, ease: 'power1.inOut' }, 3.7)
  timeline.to(S, { trailOpacity: 0.3, duration: 0.4 }, 3.9)
  timeline.to(S, { chart: 1, duration: 0.7, ease: 'power2.out' }, 4.05)
  timeline.to(S, { chart: 0, duration: 0.35 }, 4.95)
  timeline.to(S, { trailOpacity: 1, duration: 0.35 }, 4.9)

  // Chapter 6 — to the flag, Verstappen 14.602s behind.
  timeline.to(S, { raceLap: 71, duration: 0.6, ease: 'power1.inOut' }, 4.7)
  timeline.to(S, { lapT: 4.02, duration: 1.4, ease: 'power1.inOut' }, 4.95)

  // Chapter 7 — slow down, pull out, confetti.
  timeline.to(S, { lapT: 4.26, duration: 1.3, ease: 'power2.out' }, 6.0)
  timeline.to(S, { orbitB: 0.35, duration: 1.5 }, 5.8)
  timeline.to(S, { confetti: 1, duration: 0.5 }, 6.15)

  if (autoplay) {
    const run = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      lenis.scrollTo(max, { duration: 40, easing: (x) => x, lock: true })
    }
    setTimeout(run, 400)
  }

  return { lenis, timeline }
}
