import * as THREE from 'three'
import race from '../data/race.json'
import { sweepProfile } from './sweep.js'

/** Normalised track data -> world units. 1.0 in x becomes 100 units wide. */
export const SCALE = 100
/** The ribbon floats this high above the ground plane. */
export const BASE_Y = 9
/** Elevation in the data is tiny (0 - 0.0018); lift it so the relief reads. */
const ELEV_AMP = 14
/** Half-width of the racing surface, so the ribbon is ~2 units wide. */
export const HALF_WIDTH = 1.0
/** Where the start/finish line sits, part-way down the main straight. */
export const START_LINE_T = 0.06

const CENTER_X = 0.5
const CENTER_Z = 0.3569

/** Builds the arc-length-parameterised centre line of the circuit. */
function buildCurve() {
  // The last sample repeats the first one; drop it so the loop closes cleanly.
  const raw = race.track.slice(0, -1)
  const points = raw.map(
    ([x, z, elev]) =>
      new THREE.Vector3(
        (x - CENTER_X) * SCALE,
        BASE_Y + elev * SCALE * ELEV_AMP,
        (z - CENTER_Z) * SCALE
      )
  )
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5)
  curve.arcLengthDivisions = 4000
  return curve
}

export const curve = buildCurve()

const _p = new THREE.Vector3()
const _tan = new THREE.Vector3()
const _side = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

/**
 * A point on the circuit.
 * @param {number} t 0-1 along the lap (wraps)
 * @param {number} [lateral] metres right of the centre line
 * @param {number} [height] metres above the surface
 * @param {THREE.Vector3} [target]
 */
export function trackPoint(t, lateral = 0, height = 0, target = new THREE.Vector3()) {
  const u = ((t % 1) + 1) % 1
  curve.getPointAt(u, _p)
  curve.getTangentAt(u, _tan).normalize()
  _side.crossVectors(_tan, UP).normalize()
  return target.copy(_p).addScaledVector(_side, lateral).addScaledVector(UP, height)
}

// Precomputed centre line and sideways vector, for the 22 trails that each
// need a few hundred points every frame. Linear between samples.
const LUT_SIZE = 8192
const lutPos = new Float32Array(LUT_SIZE * 3)
const lutSide = new Float32Array(LUT_SIZE * 2)
for (let i = 0; i < LUT_SIZE; i++) {
  const u = i / LUT_SIZE
  curve.getPointAt(u, _p)
  curve.getTangentAt(u, _tan).normalize()
  _side.crossVectors(_tan, UP).normalize()
  lutPos.set([_p.x, _p.y, _p.z], i * 3)
  lutSide.set([_side.x, _side.z], i * 2)
}

/** Same as trackPoint, from the lookup table. Writes into out[o..o+2]. */
export function trackPointFast(t, lateral, height, out, o) {
  const x = (((t % 1) + 1) % 1) * LUT_SIZE
  const i = Math.floor(x) % LUT_SIZE
  const j = (i + 1) % LUT_SIZE
  const f = x - Math.floor(x)
  const sx = lutSide[i * 2] + (lutSide[j * 2] - lutSide[i * 2]) * f
  const sz = lutSide[i * 2 + 1] + (lutSide[j * 2 + 1] - lutSide[i * 2 + 1]) * f
  out[o] = lutPos[i * 3] + (lutPos[j * 3] - lutPos[i * 3]) * f + sx * lateral
  out[o + 1] = lutPos[i * 3 + 1] + (lutPos[j * 3 + 1] - lutPos[i * 3 + 1]) * f + height
  out[o + 2] = lutPos[i * 3 + 2] + (lutPos[j * 3 + 2] - lutPos[i * 3 + 2]) * f + sz * lateral
}

/** The forward direction of the circuit at t. */
export function trackTangent(t, target = new THREE.Vector3()) {
  const u = ((t % 1) + 1) % 1
  return curve.getTangentAt(u, target).normalize()
}

/** Glossy blue racing surface + red/white kerbs + start line + corner ticks. */
export function createCircuit() {
  const group = new THREE.Group()
  group.name = 'circuit'

  const SEGMENTS = 1400
  const THICK = 0.16

  // --- racing surface -------------------------------------------------------
  const ribbonGeometry = sweepProfile(
    curve,
    [
      [-HALF_WIDTH, -THICK],
      [HALF_WIDTH, -THICK],
      [HALF_WIDTH, 0],
      [-HALF_WIDTH, 0],
    ],
    SEGMENTS,
    { uvRepeat: 120 }
  )

  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(race.colors.VER),
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  })

  const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial)
  ribbon.castShadow = true
  ribbon.receiveShadow = true
  ribbon.name = 'ribbon'
  group.add(ribbon)

  // --- kerbs ----------------------------------------------------------------
  // Green / white / red, in the order of the Mexican flag.
  const kerbColors = [
    new THREE.Color('#006847'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#ce1126'),
  ]
  // One colour change every ~1 unit of track, like real kerb blocks.
  const blockSize = 5
  const kerbColor = (i) => kerbColors[((i / blockSize) | 0) % kerbColors.length]

  const kerbMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0,
    side: THREE.DoubleSide,
  })

  for (const dir of [-1, 1]) {
    const inner = dir * HALF_WIDTH
    const outer = dir * (HALF_WIDTH + 0.28)
    const geometry = sweepProfile(
      curve,
      [
        [Math.min(inner, outer), -THICK],
        [Math.max(inner, outer), -THICK],
        [Math.max(inner, outer), 0.03],
        [Math.min(inner, outer), 0.03],
      ],
      SEGMENTS,
      { colorFn: kerbColor }
    )
    const kerb = new THREE.Mesh(geometry, kerbMaterial)
    kerb.castShadow = true
    group.add(kerb)
  }

  // --- start/finish line ----------------------------------------------------
  const lineGeometry = new THREE.PlaneGeometry(HALF_WIDTH * 2, 0.9)
  lineGeometry.rotateX(-Math.PI / 2)
  const startLine = new THREE.Mesh(
    lineGeometry,
    new THREE.MeshStandardMaterial({ color: '#faf6ec', roughness: 0.6 })
  )
  // The main straight runs from t = 0 to turn 1 at t = 0.28.
  const sfT = START_LINE_T
  trackPoint(sfT, 0, 0.012, startLine.position)
  const tan = trackTangent(sfT)
  startLine.rotation.y = Math.atan2(tan.x, tan.z)
  startLine.name = 'startLine'
  group.add(startLine)

  // --- corner ticks ---------------------------------------------------------
  const tickMaterial = new THREE.MeshStandardMaterial({
    color: race.colors.navy,
    roughness: 0.7,
    transparent: true,
    opacity: 0.35,
  })
  const tickGeometry = new THREE.BoxGeometry(0.1, 0.04, 0.9)
  const ticks = new THREE.InstancedMesh(tickGeometry, tickMaterial, race.corners.length)
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3(1, 1, 1)
  const position = new THREE.Vector3()
  race.corners.forEach(([, t], i) => {
    trackPoint(t, HALF_WIDTH + 0.75, 0, position)
    const tangent = trackTangent(t)
    quaternion.setFromEuler(new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0))
    ticks.setMatrixAt(i, matrix.compose(position, quaternion, scale))
  })
  ticks.instanceMatrix.needsUpdate = true
  group.add(ticks)

  return { group, ribbon, ribbonMaterial, startLine }
}

export { race }
