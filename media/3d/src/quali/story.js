import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { session, TOP3, SECTOR_LINES, LAP_MAX, fractionAt, timeAt } from './data.js'
import { trackPoint, EXTENT, LAP_UNITS, SPAN_X, SPAN_Z } from './track.js'

gsap.registerPlugin(ScrollTrigger)

/**
 * What each chapter kind needs from the page: how much scroll it gets
 * (weight), where its text parks in a wide and in a tall frame, and
 * whether the text steps aside while the camera travels away.
 */
export const KINDS = {
  // Opening hook (vertical only): the pole margin, huge, over the pole car.
  hook: { weight: 0.46, place: 'top-center', placeTall: 'top-center', huge: true },
  pole: { weight: 1.2, place: 'mid-left', placeTall: 'top-left' },
  knockout: { weight: 0.92, place: 'mid-left', placeTall: 'top-left' },
  three_laps: { weight: 2.0, place: 'top-left', placeTall: 'top-left', fade: true },
  sectors: { weight: 1.1, place: 'top-left', placeTall: 'top-left' },
  margin: { weight: 1.1, place: 'top-center', placeTall: 'top-center', huge: true, fade: true },
  grid: { weight: 1.3, place: 'top-left', placeTall: 'top-left' },
}
const FALLBACK_KIND = 'pole'

/** Autoplay length in seconds; every chapter gets its share by weight. */
export const AUTOPLAY_SECONDS = 35

const VERTICAL = new URLSearchParams(location.search).get('vertical') === '1'
const gapText = typeof session.gap_p1_p2 === 'number' ? `${session.gap_p1_p2.toFixed(3)}s` : ''

/** The chapters from the file, each with its slot on the scroll timeline. */
export const PLAN = (() => {
  let start = 0
  const chapters = session.chapters.filter((c) => c.kind !== 'hook')
  // Vertical videos open on a 2-second hook before the first chapter. It is
  // not numbered: the counter still runs 01..06 over the file's chapters.
  if (VERTICAL && gapText && TOP3.length > 1) {
    chapters.unshift({ kind: 'hook', title: gapText, text: `${TOP3[0].code} on pole over ${TOP3[1].code}` })
  }
  let number = 0
  return chapters.map((chapter, index) => {
    const kind = KINDS[chapter.kind] ? chapter.kind : FALLBACK_KIND
    const weight = KINDS[kind].weight
    const slot = { index, chapter, kind, start, weight, number: kind === 'hook' ? 0 : ++number, ...KINDS[kind] }
    start += weight
    return slot
  })
})()
export const TOTAL = PLAN.reduce((sum, c) => sum + c.weight, 0)

/** Everything the scroll drives. Read every frame, never set by hand. */
export const S = {
  /** Which camera shot (chapter index, fractional while travelling). */
  u: 0,
  chapter: 0,
  /** Orbit angle for the wide shots. */
  orbit: -0.5,
  /** Pole chapter: how much of the lap the pole driver has painted. */
  poleTo: 0,
  poleGlow: 0,
  poleTrail: 0,
  /** Knockout board visibility and progress (0 -> 2). */
  knockShow: 0,
  knock: 0,
  /** The three fastest laps: visibility and the shared lap clock (s). */
  lapsShow: 0,
  clock: 0,
  /** Margin chapter: its own clock, parked at the sector-2 line. */
  marginMode: 0,
  mclock: 0,
  /** P3's share of visibility (dimmed in the P1 vs P2 shot). */
  p3: 1,
  /** Yellow sector lines on the ribbon. */
  marks: 0,
  /** Sector pieces lifting off the ribbon. */
  split: 0,
  /** Starting grid visibility and build progress. */
  gridShow: 0,
  gridBuild: 0,
}

/** The three cars' lap fractions right now, in TOP3 order. */
export function lapFractions(out = [0, 0, 0]) {
  const clock = S.marginMode > 0.5 ? S.mclock : S.clock
  TOP3.forEach((d, i) => (out[i] = fractionAt(d, clock)))
  return out
}
export function currentClock() {
  return S.marginMode > 0.5 ? S.mclock : S.clock
}

const _f = [0, 0, 0]
/** Lap fraction of whoever is furthest round. */
function leaderT() {
  lapFractions(_f)
  return Math.max(..._f)
}

// --- camera shots -----------------------------------------------------------

function makePose() {
  return {
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    roll: 0,
    fov: 42,
    /** Slide the whole picture by a share of the frame, to clear the text. */
    shiftX: 0,
    shiftY: 0,
  }
}

const REFERENCE_ASPECT = 16 / 9
let aspect = REFERENCE_ASPECT
const tall = () => aspect < 1.1
const units = (worldUnits) => worldUnits / LAP_UNITS

let props = null

const SHOTS = {
  // Low and close behind the pole car as it sets off.
  hook(o) {
    trackPoint(S.poleTo - units(6), -0.9, 2.2, o.pos)
    trackPoint(S.poleTo + units(4), -0.4, 0.9, o.target)
    o.fov = 46
    o.shiftY = -0.1
  },
  // Wide establishing orbit.
  pole(o) {
    const a = S.orbit + (tall() ? Math.PI / 2 : 0)
    const r = EXTENT * 1.7
    o.pos.set(Math.sin(a) * r, EXTENT * 1.2, Math.cos(a) * r)
    o.target.set(0, 11, 0)
    o.fov = 42
    o.shiftX = tall() ? 0 : 0.13
    o.shiftY = tall() ? -0.08 : 0
  },
  // Face-on to the knockout board floating over the circuit.
  knockout(o) {
    const board = props.knockout
    const c = board.center
    const fov = 40
    let dist = board.height / (0.8 * 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))
    if (tall()) {
      // Phone frame: fill the width, so the tags are as big as they can be.
      // (framing() later widens the lens and backs off; undo that here.)
      const { fovMul, distMul } = framing(aspect)
      const halfW = Math.tan(THREE.MathUtils.degToRad((fov * fovMul) / 2)) * aspect
      dist = board.width / (0.86 * 2 * halfW * distMul)
    }
    o.target.copy(c)
    o.pos.set(c.x, c.y + dist * 0.2, c.z + dist)
    o.fov = fov
    o.shiftX = tall() ? 0 : 0.16
    o.shiftY = tall() ? -0.16 : 0
  },
  // Low tracking shot running just ahead of the leader, looking back.
  three_laps(o) {
    const t = leaderT()
    // Low enough that the horizon (and the far side of the circuit) stays
    // below the chapter text.
    trackPoint(t + units(10), -7, 2.8, o.pos)
    trackPoint(t - units(2), 0, 1.1, o.target)
    o.fov = 44
    o.shiftY = -0.12
  },
  // High three-quarter view of the whole lap.
  sectors(o) {
    // Look across the circuit's short side, so its long side runs along
    // the long side of the frame (across in 16:9, up and down in 9:16).
    const deep = SPAN_Z > SPAN_X
    const fromSide = tall() ? !deep : deep
    if (fromSide) o.pos.set(EXTENT * 1.0, EXTENT * 2.3, 0)
    else o.pos.set(0, EXTENT * 2.3, EXTENT * 1.0)
    o.target.set(0, 9, 0)
    o.fov = 40
    o.shiftX = tall() ? 0 : 0.17
    o.shiftY = -0.08
  },
  // Chase cam just behind P1 and P2 at the sector-2 line.
  margin(o) {
    lapFractions(_f)
    const t = (_f[0] + _f[1]) / 2
    trackPoint(t - units(9), -0.25, 3.4, o.pos)
    trackPoint(t + units(2.5), 0, 2.7, o.target)
    o.fov = 50
  },
  // Straight down onto the grid, travel direction pointing right (or up
  // in a tall frame), pole at the front.
  grid(o) {
    const g = props.grid
    const up = tall()
      ? g.forward.clone()
      : new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), g.forward).normalize()
    const fov = 38
    const across = tall() ? g.span * 1.5 : g.span * 2.3
    const h = across / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (tall() ? 1 : aspect))
    o.target.copy(g.center)
    o.pos.copy(g.center).addScaledVector(up, -h * 0.12)
    o.pos.y += h
    o.up.copy(up)
    o.fov = fov
    o.shiftX = tall() ? 0 : 0.08
    o.shiftY = -0.1
  },
}

function shotFor(index, o) {
  o.up.set(0, 1, 0)
  o.roll = 0
  o.shiftX = 0
  o.shiftY = 0
  SHOTS[PLAN[index].kind](o)
}

/**
 * Narrow frames (9:16) would crop the action out of every shot, so widen
 * the lens a little and back the camera off to cover the same width.
 */
function framing(a) {
  const ratio = Math.min(REFERENCE_ASPECT / a, 2.0)
  if (ratio <= 1.001) return { fovMul: 1, distMul: 1 }
  const fovMul = Math.min(Math.sqrt(ratio), 1.42)
  return { fovMul, distMul: ratio / fovMul }
}

const poseA = makePose()
const poseB = makePose()
const pose = makePose()
const smooth = { pos: new THREE.Vector3(), target: new THREE.Vector3(), up: new THREE.Vector3(), fov: 42, primed: false }
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _camUp = new THREE.Vector3()

export function updateCamera(camera, dt) {
  aspect = camera.aspect
  const last = PLAN.length - 1
  const u = THREE.MathUtils.clamp(S.u, 0, last)
  const i = Math.min(Math.floor(u), Math.max(last - 1, 0))
  const f = last === 0 ? 0 : u - i

  shotFor(i, poseA)
  shotFor(Math.min(i + 1, last), poseB)

  pose.pos.lerpVectors(poseA.pos, poseB.pos, f)
  pose.target.lerpVectors(poseA.target, poseB.target, f)
  pose.up.lerpVectors(poseA.up, poseB.up, f).normalize()
  pose.fov = THREE.MathUtils.lerp(poseA.fov, poseB.fov, f)
  pose.shiftX = THREE.MathUtils.lerp(poseA.shiftX, poseB.shiftX, f)
  pose.shiftY = THREE.MathUtils.lerp(poseA.shiftY, poseB.shiftY, f)

  const { fovMul, distMul } = framing(aspect)
  if (distMul !== 1) {
    pose.pos.sub(pose.target).multiplyScalar(distMul).add(pose.target)
    pose.fov *= fovMul
  }

  // Slide camera and target together so the subject moves off the text.
  _fwd.subVectors(pose.target, pose.pos)
  const dist = _fwd.length()
  _fwd.normalize()
  _right.crossVectors(_fwd, pose.up).normalize()
  _camUp.crossVectors(_right, _fwd).normalize()
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(pose.fov / 2))
  const halfW = halfH * aspect
  const dx = -pose.shiftX * 2 * halfW
  const dy = -pose.shiftY * 2 * halfH
  pose.pos.addScaledVector(_right, dx).addScaledVector(_camUp, dy)
  pose.target.addScaledVector(_right, dx).addScaledVector(_camUp, dy)

  if (!smooth.primed) {
    smooth.pos.copy(pose.pos)
    smooth.target.copy(pose.target)
    smooth.up.copy(pose.up)
    smooth.fov = pose.fov
    smooth.primed = true
  }
  const k = 1 - Math.exp(-dt * 9)
  smooth.pos.lerp(pose.pos, k)
  smooth.target.lerp(pose.target, k)
  smooth.up.lerp(pose.up, k).normalize()
  smooth.fov += (pose.fov - smooth.fov) * k

  camera.position.copy(smooth.pos)
  camera.up.copy(smooth.up)
  camera.lookAt(smooth.target)
  if (Math.abs(camera.fov - smooth.fov) > 0.001) {
    camera.fov = smooth.fov
    camera.updateProjectionMatrix()
  }
}

// --- music --------------------------------------------------------------------

/**
 * public/music.mp3 plays with autoplay and fades out over the last seconds.
 * No file, no sound. Browsers only allow sound after a click, so if it is
 * blocked it starts on the first click or key press instead.
 */
const FADE_SECONDS = 3
function playMusic() {
  const audio = new Audio(`${import.meta.env.BASE_URL}music.mp3`)
  audio.volume = 1
  audio.addEventListener('error', () => {}, { once: true })
  const started = performance.now()
  const go = () => {
    const elapsed = (performance.now() - started) / 1000
    if (elapsed >= AUTOPLAY_SECONDS) return
    audio.currentTime = elapsed
    audio.play().then(() => {
      const fadeAt = Math.max(AUTOPLAY_SECONDS - FADE_SECONDS - elapsed, 0)
      gsap.to(audio, { volume: 0, duration: FADE_SECONDS, delay: fadeAt, ease: 'none', onComplete: () => audio.pause() })
    }, () => {
      const retry = () => go()
      window.addEventListener('pointerdown', retry, { once: true })
      window.addEventListener('keydown', retry, { once: true })
    })
  }
  go()
}

// --- the scroll timeline ----------------------------------------------------

/** How long before a chapter starts its pieces begin to come in. */
const LEAD = 0.35

/**
 * Lays every chapter out on one scrubbed timeline. Each chapter owns
 * [start, start + weight]: the camera holds on its shot, then travels to
 * the next one over the last ~40% of a unit.
 */
export function createStory({ onChapter, autoplay = false, knockout, grid }) {
  props = { knockout, grid }
  document.getElementById('scroll-track').style.height = `${Math.round(TOTAL * 112)}vh`

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
        const time = self.progress * TOTAL + 0.001
        let index = 0
        for (const c of PLAN) if (c.start <= time) index = c.index
        if (index !== S.chapter) {
          S.chapter = index
          onChapter(index)
        }
      },
    },
  })

  const P1 = TOP3[0]
  const atLine2 = timeAt(P1, SECTOR_LINES[1])

  for (const c of PLAN) {
    const s = c.start
    const w = c.weight
    const first = c.index === 0
    const last = c.index === PLAN.length - 1
    /** Bring values in during the camera move into this chapter. */
    const enter = (values, duration = 0.3, lead = LEAD) => {
      if (first) Object.assign(S, values)
      else timeline.to(S, { ...values, duration }, s - lead)
    }
    /** Clear them out as the camera leaves. */
    const exit = (values, duration = 0.25) => {
      if (!last) timeline.to(S, { ...values, duration }, s + w - 0.32)
    }

    if (!last) {
      // The hook holds its close-up for its whole slot, then flies out.
      if (c.kind === 'hook') timeline.to(S, { u: c.index + 1, duration: 0.35, ease: 'power2.inOut' }, s + w - 0.04)
      else timeline.to(S, { u: c.index + 1, duration: 0.42, ease: 'power2.inOut' }, s + w - 0.4)
    }

    switch (c.kind) {
      case 'hook':
        enter({ poleGlow: 1, poleTrail: 1, poleTo: 0 })
        timeline.to(S, { poleTo: 0.035, duration: w, ease: 'power1.in' }, s)
        break

      case 'pole':
        enter({ poleGlow: 1, poleTrail: 1, poleTo: 0.06 })
        timeline.to(S, { orbit: S.orbit + 0.95, duration: w + 0.4 }, s)
        timeline.to(S, { poleTo: 1, duration: w - 0.35, ease: 'power1.inOut' }, s)
        exit({ poleGlow: 0, poleTrail: 0 })
        break

      case 'knockout':
        enter({ knockShow: 1 })
        // Short slot (~4 s in autoplay): Q1 -> Q2 starts while the camera
        // is still arriving, Q2 -> Q3 is done before it leaves.
        timeline.to(S, { knock: 1, duration: 0.28, ease: 'power1.inOut' }, s - 0.04)
        timeline.to(S, { knock: 2, duration: 0.28, ease: 'power1.inOut' }, s + 0.26)
        exit({ knockShow: 0 })
        break

      case 'three_laps':
        enter({ lapsShow: 1, marks: 1, marginMode: 0, p3: 1 })
        timeline.set(S, { clock: 0 }, Math.max(s - LEAD, 0))
        timeline.to(S, { clock: LAP_MAX, duration: w - 0.45 }, s + 0.02)
        exit({ lapsShow: 0, marks: 0 })
        break

      case 'sectors':
        enter({ split: 1 }, 0.45, 0.1)
        exit({ split: 0 })
        break

      case 'margin':
        timeline.set(S, { marginMode: 1, mclock: atLine2 - 1.1 }, Math.max(s - LEAD - 0.01, 0))
        enter({ lapsShow: 1, marks: 1, p3: 0.18 })
        // Fast at first, then crawling across the line: nearly a freeze-frame.
        timeline.to(S, { mclock: atLine2 + 0.012, duration: 0.8, ease: 'power3.out' }, s - 0.3)
        exit({ lapsShow: 0, marks: 0 })
        break

      case 'grid':
        enter({ gridShow: 1 })
        timeline.to(S, { gridBuild: 1, duration: Math.min(0.6, w - 0.3) }, s + 0.02)
        exit({ gridShow: 0 })
        break
    }
  }
  // Pin the timeline's length to the total, so scroll progress maps 1:1.
  timeline.set({}, {}, TOTAL)

  if (autoplay) {
    setTimeout(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      lenis.scrollTo(max, { duration: AUTOPLAY_SECONDS, easing: (x) => x, lock: true })
      // Wall-clock start, so a screen recorder can cut the video to it.
      window.__autoplayStart = Date.now() / 1000
      playMusic()
    }, 1200)
  }

  return { lenis, timeline }
}
