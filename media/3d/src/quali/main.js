import '../style.css'
import './quali.css'
import { createScene } from '../scene.js'
import { createPost, GLOW_LAYER } from '../post.js'
import { session, TOP3, COLORS, colorOf } from './data.js'
import { createCircuit, trackPoint } from './track.js'
import { Trail } from './trails.js'
import { createKnockout } from './knockout.js'
import { createGrid } from './grid.js'
import { S, PLAN, createStory, updateCamera, lapFractions, currentClock } from './story.js'
import { createUI } from './ui.js'

/**
 * Qualifying template. Loaded by src/main.js when the address has
 * ?session=q. Every name, time, colour, the track shape and the chapter
 * texts come from data/session.json.
 */
history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

const params = new URLSearchParams(location.search)
const VERTICAL = params.get('vertical') === '1'
const AUTOPLAY = params.get('autoplay') === '1'
const CLEAN = params.get('clean') === '1'
document.body.classList.add('quali')
if (VERTICAL) document.body.classList.add('vertical')
if (CLEAN) document.body.classList.add('clean')
document.title = `PaddockIntel 3D — ${session.event} · Qualifying`

const canvas = document.getElementById('webgl')
const frame = document.getElementById('frame')
const { renderer, scene, camera } = createScene(canvas)

// --- the world -----------------------------------------------------------------
const sectorColors = [1, 2, 3].map((n) => {
  const best = (session.sector_best ?? []).find((s) => s.sector === n)
  return best ? colorOf(best.code) : COLORS.blue
})
const circuit = createCircuit({ sectorColors })
scene.add(circuit.group)

// Three lanes: P1 inside left, P2 in the middle, P3 on the right.
const LANES = [-0.55, 0, 0.55]
const trails = TOP3.map((d, i) => new Trail({ color: d.display, lane: LANES[i] ?? 0 }))
for (const trail of trails) {
  scene.add(trail.points, trail.headPoint)
  trail.headPoint.layers.enable(GLOW_LAYER)
}
circuit.glowMesh.layers.enable(GLOW_LAYER)

const knockout = createKnockout()
scene.add(knockout.group)

const grid = createGrid()
scene.add(grid.group)

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

const tallFrame = VERTICAL || frame.clientWidth / frame.clientHeight < 1.1
if (tallFrame) document.body.classList.add('tall')
const ui = createUI(document.getElementById('overlay'), { tallFrame })

createStory({
  autoplay: AUTOPLAY,
  knockout,
  grid,
  onChapter: (index) => {
    document.body.dataset.chapter = String(index + 1)
    document.body.dataset.kind = PLAN[index].kind
    ui.show(index)
  },
})
ui.show(0)
document.body.dataset.kind = PLAN[0].kind

if (import.meta.env.DEV) {
  window.__pi = { scene, camera, renderer, S, PLAN, circuit, trails, knockout, grid, trackPoint, session }
}

// --- every frame -------------------------------------------------------------------
const POLE_COLOR = TOP3[0].display
const fractions = [0, 0, 0]
const _p = trackPoint(0)
let last = performance.now()

renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  const projScale =
    renderer.domElement.height /
    (2 * Math.tan((camera.fov * Math.PI) / 360) * renderer.getPixelRatio())

  // Ribbon: pole colour washes round behind the pole lap; paler while the
  // sector pieces float above it, so they read as lifted off.
  circuit.paint({
    tintColor: POLE_COLOR,
    tintTo: S.poleTo,
    tintAmount: 0.55 * S.poleGlow,
    fade: 0.45 * S.split,
  })
  circuit.setGlow(POLE_COLOR, S.poleTo, S.poleGlow)
  circuit.setSplit(S.split)
  circuit.setSectorMarks(S.marks)

  // Cars: the pole lap on its own first, then the three laps together.
  lapFractions(fractions)
  trails.forEach((trail, i) => {
    const solo = i === 0 ? S.poleTrail : 0
    const laps = S.lapsShow * (i === 2 ? S.p3 : 1)
    const opacity = Math.max(solo, laps)
    trail.setOpacity(opacity)
    if (opacity <= 0.002) return
    trail.setT(solo > laps ? S.poleTo : fractions[i])
    trail.projScale = projScale
  })

  knockout.update(S.knockShow, S.knock)
  const settled = grid.update(S.gridShow, S.gridBuild)

  updateCamera(camera, dt)
  camera.updateMatrixWorld()

  // HTML that follows the scene.
  const w = frame.clientWidth
  const h = frame.clientHeight
  const kind = PLAN[S.chapter].kind
  ui.setTravel(S.u - S.chapter)
  ui.setGap(kind === 'three_laps' || kind === 'margin' ? S.lapsShow : 0, currentClock(), fractions)
  trails.forEach((trail, i) => {
    // Tags only once the camera has arrived on a chapter that is about laps.
    const lapsChapter = kind === 'three_laps' || kind === 'margin' ? 1 : 0
    const showLabel = lapsChapter * S.lapsShow * (i === 2 ? S.p3 : 1)
    ui.place(ui.carLabels[i], trail.head, camera, showLabel, w, h)
  })
  circuit.sectorPieces.forEach((piece, i) => {
    const label = ui.sectorLabels[i]
    if (!label) return
    trackPoint(piece.mid, 0, piece.mesh.position.y + 1.4, _p)
    ui.place(label, _p, camera, Math.max(0, S.split * 1.6 - 0.6), w, h)
  })
  grid.slots.forEach((slot, i) => {
    const label = ui.gridLabels[i]
    if (label) ui.place(label, slot.labelAnchor, camera, settled[i], w, h)
  })

  // Safe zone: whatever passes behind the chapter text washes back to paper.
  const zone = ui.safeZone()
  const riso = post.riso.uniforms
  if (zone) {
    const pad = 22
    riso.uSafe.value.set(
      (zone.left - pad) / w,
      1 - (zone.bottom + pad) / h,
      (zone.right + pad) / w,
      1 - (zone.top - pad) / h
    )
    riso.uSafeFeather.value.set(70 / w, 70 / h)
  }
  riso.uSafeAmount.value = zone ? 0.94 * zone.alpha : 0

  post.render(now / 1000, 0)
})
