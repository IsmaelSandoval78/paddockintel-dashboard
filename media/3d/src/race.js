import './style.css'
import { createScene } from './scene.js'
import { createCircuit, trackPoint } from './track.js'
import { createTrails } from './trails.js'
import {
  createStartLights,
  createLapChart,
  createCircuitLabel,
  createConfetti,
  createRedFlag,
} from './props.js'
import { createPost, GLOW_LAYER } from './post.js'
import { createUI, SPEEDO_DRIVER } from './ui.js'
import {
  S,
  field,
  raceState,
  driverT,
  updateField,
  telemetryOnScreen,
  updateCamera,
  createStory,
} from './story.js'

history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

const params = new URLSearchParams(location.search)
const VERTICAL = params.get('vertical') === '1'
const AUTOPLAY = params.get('autoplay') === '1'
// ?clean=1 — recording mode: only the chapter text and a small speedometer.
const CLEAN = params.get('clean') === '1'
if (VERTICAL) document.body.classList.add('vertical')
if (CLEAN) document.body.classList.add('clean')

const canvas = document.getElementById('webgl')
const frame = document.getElementById('frame')

const { renderer, scene, camera, sun, hemi, ground, grid } = createScene(canvas)

const circuit = createCircuit()
scene.add(circuit.group)

const trails = createTrails()
scene.add(trails.group)

const startLights = createStartLights()
scene.add(startLights.group)

const lapChart = createLapChart()
scene.add(lapChart.group)

const circuitLabel = createCircuitLabel()
scene.add(circuitLabel.group)

const confetti = createConfetti()
scene.add(confetti.group)

const redFlag = createRedFlag({
  scene,
  sun,
  hemi,
  ground,
  grid,
  ribbonMaterial: circuit.ribbonMaterial,
})

// The glowing bits are drawn twice: once in the scene, once into the halo
// buffer. Everything else is only ever on layer 0. Every car's head glows;
// the tails stay out of the halo so the bloom stays on the nose.
for (const trail of Object.values(trails.drivers)) {
  trail.headPoint.layers.enable(GLOW_LAYER)
}
startLights.group.traverse((child) => child.layers.enable(GLOW_LAYER))

const post = createPost(renderer, scene, camera)

function layout() {
  const width = frame.clientWidth
  const height = frame.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  post.setSize(width, height)
}
new ResizeObserver(layout).observe(frame)
layout()

const ui = createUI(document.getElementById('overlay'))

createStory({
  autoplay: AUTOPLAY,
  onChapter: (index) => {
    document.body.dataset.chapter = String(index + 1)
    ui.show(index)
  },
})

// ScrollTrigger only fires onUpdate once the user moves, so paint chapter 1.
ui.show(0)

if (import.meta.env.DEV) {
  window.__pi = { scene, camera, renderer, S, circuit, trails, post, lapChart, trackPoint }
}

let last = performance.now()
let yellow = 0

renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now

  // Points are sized in world units, so they need the current projection.
  const projScale =
    renderer.domElement.height /
    (2 * Math.tan((camera.fov * Math.PI) / 360) * renderer.getPixelRatio())

  updateField()
  for (const [code, trail] of Object.entries(trails.drivers)) {
    const car = field[code]
    trail.setOpacity(S.trailOpacity, car.presence)
    if (!trail.points.visible) continue
    trail.steer(car.rank, dt)
    trail.setPace(car.pace, dt)
    trail.setT(driverT(code))
    trail.projScale = projScale
  }

  startLights.update(S.lights)
  circuitLabel.update(S.circuitName)
  lapChart.update(S.chart)
  // Safety car and VSC turn the track yellow. Eased in real time, so a
  // fast scroll past a short VSC is a flicker, not a strobe.
  const yellowTarget = raceState.status === 4 || raceState.status === 6 ? 1 : 0
  yellow += (yellowTarget - yellow) * (1 - Math.exp(-dt * 7))
  redFlag.update(S.red, yellow * (1 - S.red))
  ui.setRace(S.raceLap, raceState.status)
  ui.setSpeedo(telemetryOnScreen(SPEEDO_DRIVER), dt)

  ui.setTravel(S.u - S.chapter)
  updateCamera(camera, dt)
  confetti.update(S.confetti, now / 1000, projScale, camera)

  post.render(now / 1000, S.red)
})
