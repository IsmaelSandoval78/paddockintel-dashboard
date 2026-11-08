import * as THREE from 'three'
import { sweepProfile } from '../sweep.js'
import { session, COLORS, SECTOR_LINES, THEME } from './data.js'

/**
 * The circuit, built from session.track (normalised [x, y, elevation]
 * points, index i = lap fraction i/400, lap starting on the timing line).
 * The ribbon floats 9 units up and elevation is exaggerated so it reads.
 * Every circuit is drawn with the same lap length (Mexico's in the race
 * template, ~286 units) so the camera shots fit any track: session.track is
 * normalised to the circuit's width, which would make a tall circuit like
 * Interlagos twice as big as a wide one.
 */
const REF_LAP = 286
export const BASE_Y = 9
const ELEV_AMP = 14
/** Most the exaggerated hills may rise above the lowest point, world units. */
const MAX_RELIEF = 5
export const HALF_WIDTH = 1.0

const raw = session.track
// The last sample repeats the first one (closed lap); drop it.
const loop =
  Math.hypot(raw[0][0] - raw.at(-1)[0], raw[0][1] - raw.at(-1)[1]) < 0.02
    ? raw.slice(0, -1)
    : raw.slice()

let polyLength = 0
for (let i = 0; i < loop.length; i++) {
  const a = loop[i]
  const b = loop[(i + 1) % loop.length]
  polyLength += Math.hypot(b[0] - a[0], b[1] - a[1])
}
export const SCALE = REF_LAP / polyLength
// Flat circuits (Mexico) get the full exaggeration; hilly ones (Interlagos)
// are capped so the ribbon reads as rolling, not a rollercoaster.
const zs = loop.map((p) => p[2] ?? 0)
const relief = Math.max(...zs) - Math.min(...zs)
const ELEV = Math.min(SCALE * ELEV_AMP, relief > 0 ? MAX_RELIEF / relief : Infinity)

const xs = loop.map((p) => p[0])
const ys = loop.map((p) => p[1])
const CENTER_X = (Math.min(...xs) + Math.max(...xs)) / 2
const CENTER_Z = (Math.min(...ys) + Math.max(...ys)) / 2

/** Footprint along x and z, world units. */
export const SPAN_X = (Math.max(...xs) - Math.min(...xs)) * SCALE
export const SPAN_Z = (Math.max(...ys) - Math.min(...ys)) * SCALE

/** Half-diagonal of the circuit's footprint, used to frame the wide shots. */
export const EXTENT =
  (Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * SCALE) / 2

export const curve = new THREE.CatmullRomCurve3(
  loop.map(
    ([x, z, elev]) =>
      new THREE.Vector3(
        (x - CENTER_X) * SCALE,
        BASE_Y + ((elev ?? 0) - Math.min(...zs)) * ELEV,
        (z - CENTER_Z) * SCALE
      )
  ),
  true,
  'centripetal',
  0.5
)
curve.arcLengthDivisions = 4000

/** Circuit length in world units. */
export const LAP_UNITS = curve.getLength()

const _p = new THREE.Vector3()
const _tan = new THREE.Vector3()
const _side = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

/** A point on the circuit: t along the lap (wraps), metres right, metres up. */
export function trackPoint(t, lateral = 0, height = 0, target = new THREE.Vector3()) {
  const u = ((t % 1) + 1) % 1
  curve.getPointAt(u, _p)
  curve.getTangentAt(u, _tan).normalize()
  _side.crossVectors(_tan, UP).normalize()
  return target.copy(_p).addScaledVector(_side, lateral).addScaledVector(UP, height)
}

/** The forward direction of the circuit at t. */
export function trackTangent(t, target = new THREE.Vector3()) {
  const u = ((t % 1) + 1) % 1
  return curve.getTangentAt(u, target).normalize()
}

// Lookup table for the trails, which redraw a few hundred points a frame.
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

/** A stretch [a, b] of the lap, re-parameterised 0-1, for sweeping a piece. */
function subCurve(a, b) {
  return {
    getPointAt: (u, target = new THREE.Vector3()) => trackPoint(a + (b - a) * u, 0, 0, target),
    getTangentAt: (u, target = new THREE.Vector3()) => trackTangent(a + (b - a) * u, target),
  }
}

const THICK = 0.16
const SEGMENTS = 1400

/** A flat bar lying across the ribbon at lap fraction t. */
function crossBar(t, color, depth, opacity = 1) {
  const geometry = new THREE.PlaneGeometry(HALF_WIDTH * 2 + 0.56, depth)
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      transparent: opacity < 1,
      opacity,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  )
  trackPoint(t, 0, 0.035, mesh.position)
  const tan = trackTangent(t)
  mesh.rotation.y = Math.atan2(tan.x, tan.z)
  return mesh
}

/**
 * Glowing strip along the centre of the ribbon. Shows the stretch of lap
 * [from, to]; drawn into the glow buffer too, so it blooms.
 */
function createGlowStrip() {
  const geometry = sweepProfile(
    curve,
    [
      [-0.32, 0.02],
      [0.32, 0.02],
      [0.32, 0.05],
      [-0.32, 0.05],
    ],
    SEGMENTS,
    { uvRepeat: 1 }
  )
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#ffffff') },
      uTo: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying float vT;
      void main() {
        vT = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTo;
      uniform float uOpacity;
      varying float vT;
      void main() {
        if (vT > uTo) discard;
        // Brightest right behind the moving head, settling down behind it.
        float head = smoothstep(uTo - 0.06, uTo, vT);
        vec3 color = uColor * (1.3 + 1.6 * head);
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 3
  return { mesh, material }
}

/**
 * Ribbon + kerbs + start line + sector lines + corner ticks, plus the two
 * qualifying-specific pieces: the glowing pole strip and the three sector
 * pieces that lift off the ribbon.
 */
export function createCircuit({ sectorColors }) {
  const group = new THREE.Group()
  group.name = 'circuit'

  // --- racing surface: per-vertex colour, so it can be repainted -----------
  const ribbonGeometry = sweepProfile(
    curve,
    [
      [-HALF_WIDTH, -THICK],
      [HALF_WIDTH, -THICK],
      [HALF_WIDTH, 0],
      [-HALF_WIDTH, 0],
    ],
    SEGMENTS,
    { uvRepeat: 1 }
  )
  const vertexCount = ribbonGeometry.attributes.position.count
  ribbonGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3)
  )
  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    vertexColors: true,
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
  group.add(ribbon)

  const BASE = new THREE.Color(THEME.track)
  const PAPER = new THREE.Color(COLORS.cream)
  const _c = new THREE.Color()
  const _tint = new THREE.Color()
  let paintKey = ''

  /**
   * Repaints the ribbon. `tintColor` covers the lap up to `tintTo` by
   * `tintAmount`; `fade` washes the whole ribbon towards paper (used while
   * the sector pieces float above it).
   */
  function paint({ tintColor = null, tintTo = 0, tintAmount = 0, fade = 0 }) {
    const key = `${tintColor}|${tintTo.toFixed(3)}|${tintAmount.toFixed(3)}|${fade.toFixed(3)}`
    if (key === paintKey) return
    paintKey = key
    if (tintColor) _tint.set(tintColor)
    const uv = ribbonGeometry.attributes.uv.array
    const col = ribbonGeometry.attributes.color.array
    for (let v = 0; v < vertexCount; v++) {
      const t = uv[v * 2]
      _c.copy(BASE)
      if (tintColor && tintAmount > 0 && t <= tintTo) _c.lerp(_tint, tintAmount)
      if (fade > 0) _c.lerp(PAPER, fade)
      col[v * 3] = _c.r
      col[v * 3 + 1] = _c.g
      col[v * 3 + 2] = _c.b
    }
    ribbonGeometry.attributes.color.needsUpdate = true
  }
  paint({})

  // --- kerbs: stripes cycle through the theme's colours ---------------------
  const kerbColors = THEME.kerbs.map((c) => new THREE.Color(c))
  const kerbMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
  for (const dir of [-1, 1]) {
    const a = dir * HALF_WIDTH
    const b = dir * (HALF_WIDTH + 0.28)
    const kerb = new THREE.Mesh(
      sweepProfile(
        curve,
        [
          [Math.min(a, b), -THICK],
          [Math.max(a, b), -THICK],
          [Math.max(a, b), 0.03],
          [Math.min(a, b), 0.03],
        ],
        SEGMENTS,
        { colorFn: (i) => kerbColors[((i / 5) | 0) % kerbColors.length] }
      ),
      kerbMaterial
    )
    kerb.castShadow = true
    group.add(kerb)
  }

  // --- start / finish line (lap fraction 0 is the timing line) -------------
  group.add(crossBar(0, '#faf6ec', 0.9))

  // --- sector lines: yellow bars, faded in when the story needs them -------
  const sectorBars = SECTOR_LINES.map((t) => crossBar(t, COLORS.yellow, 0.7, 0.999))
  for (const bar of sectorBars) group.add(bar)

  // --- corner ticks -----------------------------------------------------------
  const corners = session.corners ?? []
  if (corners.length) {
    const ticks = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.1, 0.04, 0.9),
      new THREE.MeshStandardMaterial({
        color: COLORS.navy,
        roughness: 0.7,
        transparent: true,
        opacity: 0.35,
      }),
      corners.length
    )
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    const p = new THREE.Vector3()
    corners.forEach(([, t], i) => {
      trackPoint(t, HALF_WIDTH + 0.75, 0, p)
      const tan = trackTangent(t)
      q.setFromEuler(new THREE.Euler(0, Math.atan2(tan.x, tan.z), 0))
      ticks.setMatrixAt(i, m.compose(p, q, s))
    })
    ticks.instanceMatrix.needsUpdate = true
    group.add(ticks)
  }

  // --- pole glow strip --------------------------------------------------------
  const glow = createGlowStrip()
  group.add(glow.mesh)

  // --- the three sector pieces -----------------------------------------------
  const bounds = [0, SECTOR_LINES[0], SECTOR_LINES[1], 1]
  const GAP = 0.0035
  const sectorPieces = [0, 1, 2].map((i) => {
    const a = bounds[i] + GAP
    const b = bounds[i + 1] - GAP
    const segments = Math.max(40, Math.round(SEGMENTS * (b - a)))
    const geometry = sweepProfile(
      subCurve(a, b),
      [
        [-HALF_WIDTH * 1.08, -0.3],
        [HALF_WIDTH * 1.08, -0.3],
        [HALF_WIDTH * 1.08, 0.04],
        [-HALF_WIDTH * 1.08, 0.04],
      ],
      segments,
      { closed: false }
    )
    const color = new THREE.Color(sectorColors[i])
    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      roughness: 0.38,
      clearcoat: 0.7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      // Seen from high up for the whole-lap view: keep the colours pure.
      fog: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.visible = false
    group.add(mesh)
    return { mesh, material, mid: (a + b) / 2 }
  })

  /** 0 = sector pieces flush and hidden, 1 = lifted clear of the ribbon. */
  function setSplit(amount) {
    sectorPieces.forEach((piece, i) => {
      piece.mesh.visible = amount > 0.002
      piece.material.opacity = Math.min(amount * 1.6, 1)
      // A small stagger so they peel off one after the other.
      const lift = THREE.MathUtils.clamp(amount * 1.3 - i * 0.15, 0, 1)
      piece.mesh.position.y = 0.2 + 3.2 * (lift * lift * (3 - 2 * lift))
    })
  }

  function setSectorMarks(amount) {
    for (const bar of sectorBars) {
      bar.visible = amount > 0.002
      bar.material.opacity = amount
    }
  }

  function setGlow(color, to, opacity) {
    glow.material.uniforms.uColor.value.set(color)
    glow.material.uniforms.uTo.value = to
    glow.material.uniforms.uOpacity.value = opacity
    glow.mesh.visible = opacity > 0.002 && to > 0.001
  }

  setSplit(0)
  setSectorMarks(0)
  setGlow('#ffffff', 0, 0)

  return {
    group,
    ribbonMaterial,
    glowMesh: glow.mesh,
    sectorPieces,
    paint,
    setSplit,
    setSectorMarks,
    setGlow,
  }
}
