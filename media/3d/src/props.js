import * as THREE from 'three'
import race from '../data/race.json'
import { trackPoint, trackTangent, HALF_WIDTH, START_LINE_T } from './track.js'

/** The gantry straddles the start/finish line, cars wait behind it. */
const LIGHTS_T = START_LINE_T

/** The five red start lights on their gantry over the start straight. */
export function createStartLights() {
  const group = new THREE.Group()
  group.name = 'startLights'

  const anchor = trackPoint(LIGHTS_T, 0, 0)
  const tangent = trackTangent(LIGHTS_T)
  group.position.copy(anchor)
  group.rotation.y = Math.atan2(tangent.x, tangent.z)

  const steel = new THREE.MeshStandardMaterial({ color: '#2a3252', roughness: 0.6 })
  const BAR_WIDTH = HALF_WIDTH * 2 + 2.4
  const BAR_Y = 5.4

  const gantry = new THREE.Mesh(new THREE.BoxGeometry(BAR_WIDTH, 0.3, 0.3), steel)
  gantry.position.y = BAR_Y
  gantry.castShadow = true
  group.add(gantry)

  // Legs down to the edge of the ribbon, so the rig sits on the track.
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, BAR_Y, 0.22), steel)
    leg.position.set((side * BAR_WIDTH) / 2, BAR_Y / 2, 0)
    leg.castShadow = true
    group.add(leg)
  }

  const lamps = []
  const geometry = new THREE.SphereGeometry(0.46, 20, 16)
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: '#3a2024',
      emissive: new THREE.Color(race.colors.red),
      emissiveIntensity: 0,
      roughness: 0.4,
    })
    const lamp = new THREE.Mesh(geometry, material)
    lamp.position.set((i - 2) * 0.95, BAR_Y - 0.62, 0)
    group.add(lamp)
    lamps.push(material)
  }

  /** @param {number} amount 0 = all dark, 1 = all five lit. */
  function update(amount) {
    const visible = amount > 0.001
    group.visible = visible
    if (!visible) return
    for (let i = 0; i < 5; i++) {
      const lit = THREE.MathUtils.clamp(amount * 5 - i, 0, 1)
      lamps[i].emissiveIntensity = lit * 4.5
      lamps[i].color.setHex(lit > 0.5 ? 0x9c1418 : 0x3a2024)
    }
  }

  update(0)
  return { group, update }
}

/**
 * The real classified positions of VER / ANT / HAM, drawn as three tubes
 * floating in the plane above the circuit so they read from the top-down shot.
 */
export function createLapChart() {
  const group = new THREE.Group()
  group.name = 'lapChart'
  group.visible = false
  // Nudged towards the camera in the top-down shot so the chart's own
  // labels clear the chapter title.
  group.position.z = 9

  const LAST_LAP = 71
  const X_SPAN = 58
  // 21 position rows (Verstappen starts P21) instead of Mexico's 6; sized to
  // fill the closer top-down shot — this chapter is the climax of the video.
  const Z_PER_POSITION = 3.0
  const HEIGHT = 24

  const lapToX = (lap) => -X_SPAN + ((lap - 1) / (LAST_LAP - 1)) * X_SPAN * 2
  const positionToZ = (position) => (position - 11) * Z_PER_POSITION

  const lines = []
  for (const code of ['NOR', 'ANT', 'VER']) {
    // Verstappen's line IS the story: thicker and drawn on top of the others.
    const hero = code === 'VER'
    const laps = race.positions_by_lap[code].slice(0, LAST_LAP)
    const points = laps.map(
      (position, i) => new THREE.Vector3(lapToX(i + 1), 0, positionToZ(position))
    )
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.08)
    const geometry = new THREE.TubeGeometry(curve, 420, hero ? 1.5 : 0.8, 8, false)
    // Flat colour, poster-style: these are data, not objects in the world.
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(race.colors[code]),
      transparent: true,
      opacity: hero ? 1 : 0.55,
      fog: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.renderOrder = hero ? 5 : 4
    group.add(mesh)
    lines.push({ mesh, material, total: geometry.index.count })
  }

  // A faint rail for each position row, plus P1 / P3 labels.
  const railMaterial = new THREE.MeshBasicMaterial({
    color: '#b9a781',
    transparent: true,
    opacity: 0.3,
  })
  for (const position of [1, 5, 10, 15, 20]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(X_SPAN * 2, 0.06, 0.12), railMaterial)
    rail.position.set(0, -0.4, positionToZ(position))
    group.add(rail)
  }

  group.add(label('P1', -X_SPAN - 9, positionToZ(1)))
  group.add(label('P21', -X_SPAN - 9, positionToZ(21)))
  group.add(label('LAP 1', lapToX(1) + 4, positionToZ(21) + 7))
  group.add(label('LAP 71', lapToX(LAST_LAP) - 5, positionToZ(21) + 7))
  for (const code of ['VER', 'NOR', 'ANT']) {
    const laps = race.positions_by_lap[code]
    group.add(
      label(code, X_SPAN + 10, positionToZ(laps[LAST_LAP - 1]), race.colors[code])
    )
  }

  /** @param {number} amount 0 = hidden on the ground, 1 = risen and drawn. */
  function update(amount) {
    group.visible = amount > 0.002
    if (!group.visible) return
    const eased = amount * amount * (3 - 2 * amount)
    group.position.y = 9 + HEIGHT * eased
    // Lines draw themselves on, left to right.
    const drawn = THREE.MathUtils.clamp((amount - 0.1) / 0.75, 0, 1)
    for (const line of lines) {
      line.material.opacity = eased
      line.mesh.geometry.setDrawRange(0, Math.floor(line.total * drawn))
    }
    group.traverse((child) => {
      if (child.isSprite) child.material.opacity = Math.max(0, eased * 1.1 - 0.25)
    })
  }

  return { group, update }
}

/** A small flat text sprite drawn from a canvas, for the chart annotations. */
function label(text, x, z, color = '#16244f') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.font = 'bold 64px "JetBrains Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  )
  sprite.scale.set(16, 8, 1)
  sprite.position.set(x, 0.5, z)
  sprite.renderOrder = 6
  return sprite
}

/**
 * The circuit name painted across the infield, in the widest clear patch
 * inside the loop. It is there for the establishing shot and gets out of
 * the way the moment the race starts.
 */
export function createCircuitLabel() {
  // The ribbon floats 9 units up, so the lettering can run right under the
  // track and be read at the scale of the whole circuit.
  const CENTER_X = 6
  const CENTER_Z = -2
  // Small enough that the lettering stays inside the infield, clear of both
  // the ribbon and the chapter titles (it only shows on the wide chapter 2).
  const WIDTH = 68
  const DEPTH = 18
  // Lined up with the main straight rather than the world axes.
  const ANGLE = -0.122

  const [first, second] = race.circuit.split(',')
  const lines = [first.trim().toUpperCase(), (second || '').trim().toUpperCase()]

  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const SKEW = 0.18 // matches the -10deg skew on the chapter titles
  const SAFE_WIDTH = 1900

  /** Largest size at which the line still fits the canvas. */
  function fitSize(text, preferred) {
    ctx.font = `700 ${preferred}px Anton, "Arial Narrow", sans-serif`
    const width = ctx.measureText(text).width
    return width > SAFE_WIDTH ? Math.floor((preferred * SAFE_WIDTH) / width) : preferred
  }

  function line(text, y, preferred, color) {
    ctx.font = `700 ${fitSize(text, preferred)}px Anton, "Arial Narrow", sans-serif`
    ctx.fillStyle = color
    // Skew around this line's own baseline so it stays centred.
    ctx.setTransform(1, 0, SKEW, 1, -SKEW * y, 0)
    ctx.fillText(text, canvas.width / 2, y)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    line(lines[0], 180, 200, race.colors.navy)
    if (lines[1]) line(lines[1], 360, 120, '#b78b00')
  }

  draw()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  // Anton arrives from Google Fonts after the first paint, so draw it again.
  if (document.fonts) {
    document.fonts.ready.then(() => {
      draw()
      texture.needsUpdate = true
    })
  }

  const geometry = new THREE.PlaneGeometry(WIDTH, DEPTH)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(CENTER_X, 0.08, CENTER_Z)
  mesh.rotation.y = ANGLE
  mesh.renderOrder = 2
  mesh.visible = false

  /** @param {number} amount 1 = painted on the infield, 0 = gone. */
  function update(amount) {
    mesh.visible = amount > 0.002
    if (!mesh.visible) return
    material.opacity = amount * 0.8
  }

  return { group: mesh, update }
}

/**
 * Streamer confetti for the final chapter: long paper strips in the brand
 * blue and red that tumble end over end and spin on their long axis as they
 * fall, so they flash between face-on and edge-on like real ticker tape.
 */
export function createConfetti() {
  const COUNT = 280
  const SPREAD = 62
  const FALL_HEIGHT = 90
  const COLORS = [
    new THREE.Color('#009C3B'),
    new THREE.Color('#FFDF00'),
    new THREE.Color('#002776'),
  ]

  const geometry = new THREE.PlaneGeometry(0.55, 2.6)
  // Lit, so a strip catches the sun as it turns and goes dark edge-on.
  const material = new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.renderOrder = 7
  mesh.visible = false

  const pieces = []
  for (let i = 0; i < COUNT; i++) {
    pieces.push({
      x: (Math.random() * 2 - 1) * SPREAD,
      y: Math.random() * FALL_HEIGHT,
      z: (Math.random() * 2 - 1) * SPREAD * 0.8,
      speed: 6 + Math.random() * 5,
      // Tumble (end over end) and spin (round the long axis) rates.
      tumble: (1.2 + Math.random() * 2.2) * (Math.random() < 0.5 ? -1 : 1),
      spin: (3 + Math.random() * 5) * (Math.random() < 0.5 ? -1 : 1),
      yaw: Math.random() * Math.PI * 2,
      seed: Math.random() * 100,
      scale: 0.8 + Math.random() * 0.6,
    })
    mesh.setColorAt(i, COLORS[i % COLORS.length])
  }
  mesh.instanceColor.needsUpdate = true

  const forward = new THREE.Vector3()
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  const scale = new THREE.Vector3()

  function update(amount, time, projScale, camera) {
    mesh.visible = amount > 0.002
    if (!mesh.visible) return
    // Keep the shower just in front of the lens so the strips read as big
    // foreground paper rather than as dust on the horizon.
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    mesh.position.set(
      camera.position.x + forward.x * 38,
      0,
      camera.position.z + forward.z * 38
    )
    material.opacity = amount

    for (let i = 0; i < COUNT; i++) {
      const p = pieces[i]
      const y = (((p.y - time * p.speed) % FALL_HEIGHT) + FALL_HEIGHT) % FALL_HEIGHT
      position.set(
        p.x + Math.sin(time * 1.3 + p.seed) * 2.6,
        y,
        p.z + Math.cos(time * 1.1 + p.seed * 1.7) * 2.6
      )
      euler.set(time * p.tumble + p.seed, p.yaw + time * 0.4, time * p.spin)
      rotation.setFromEuler(euler)
      scale.setScalar(p.scale)
      matrix.compose(position, rotation, scale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  return { group: mesh, update }
}

/**
 * Red flag: the whole scene goes red, sky, fog, light, ground and the track
 * ribbon, and comes back exactly as it was once `amount` returns to 0.
 * Safety car / VSC: only the track surface turns yellow.
 */
export function createRedFlag({ scene, sun, hemi, ground, grid, ribbonMaterial }) {
  const mix = (base, red) => ({ base: new THREE.Color(base), red: new THREE.Color(red) })
  const skyTop = mix('#fdfaf4', '#f6c9bf')
  const skyBottom = mix('#f5f1ea', '#e0877b')
  const fog = { base: scene.fog.color.clone(), red: new THREE.Color('#e0877b') }
  const fogNear = scene.fog.near
  const fogFar = scene.fog.far
  const sunColor = { base: sun.color.clone(), red: new THREE.Color('#ff6a55') }
  const hemiSky = { base: hemi.color.clone(), red: new THREE.Color('#ffb2a4') }
  const hemiGround = { base: hemi.groundColor.clone(), red: new THREE.Color('#b4554c') }
  const groundColor = { base: ground.material.color.clone(), red: new THREE.Color('#efc0b4') }
  const gridColor = { base: grid.material.color.clone(), red: new THREE.Color('#a8342f') }
  const sunIntensity = sun.intensity
  const hemiIntensity = hemi.intensity
  const ribbonBase = ribbonMaterial.color.clone()
  const ribbonRed = new THREE.Color('#9e0d14')
  const ribbonYellow = new THREE.Color(race.colors.yellow).multiplyScalar(0.92)

  const top = new THREE.Color()
  const bottom = new THREE.Color()
  let painted = 0

  /**
   * @param {number} amount 0-1 red flag (the whole scene).
   * @param {number} [yellow] 0-1 safety car (the track surface only).
   */
  function update(amount, yellow = 0) {
    // The sky is a canvas, so only repaint it when the tint has moved.
    if (Math.abs(amount - painted) > 0.004 || (amount === 0 && painted !== 0)) {
      top.lerpColors(skyTop.base, skyTop.red, amount)
      bottom.lerpColors(skyBottom.base, skyBottom.red, amount)
      scene.background.paint('#' + top.getHexString(), '#' + bottom.getHexString())
      painted = amount
    }
    scene.fog.color.lerpColors(fog.base, fog.red, amount)
    // The fog also closes in, so the far side of the circuit sinks into red.
    scene.fog.near = fogNear * (1 - amount * 0.25)
    scene.fog.far = fogFar * (1 - amount * 0.15)
    sun.color.lerpColors(sunColor.base, sunColor.red, amount)
    sun.intensity = sunIntensity * (1 - amount * 0.35)
    hemi.color.lerpColors(hemiSky.base, hemiSky.red, amount)
    hemi.groundColor.lerpColors(hemiGround.base, hemiGround.red, amount)
    hemi.intensity = hemiIntensity * (1 - amount * 0.3)
    ground.material.color.lerpColors(groundColor.base, groundColor.red, amount)
    grid.material.color.lerpColors(gridColor.base, gridColor.red, amount)
    ribbonMaterial.color
      .lerpColors(ribbonBase, ribbonYellow, yellow)
      .lerp(ribbonRed, amount)
  }

  return { update }
}
