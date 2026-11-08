import * as THREE from 'three'
import { session } from './data.js'
import { trackPoint, trackTangent, LAP_UNITS, HALF_WIDTH } from './track.js'

/** Distance between consecutive grid slots along the track, world units. */
const SLOT_GAP = 1.7
/** How far the pole slot sits behind the start/finish line. */
const FIRST_SLOT = 0.9

/**
 * Real grids sit on the main straight, usually just behind the line, but
 * some circuits put the timing line right after the last corner and the
 * grid further down the straight. So try a range of spots around the line
 * and keep the one where the grid bends the least (with a small nudge
 * towards "just behind the line").
 */
function straightestFront(count) {
  const span = FIRST_SLOT + (count - 1) * SLOT_GAP
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  let best = 0
  let bestScore = Infinity
  for (let front = -20; front <= 45; front += 1) {
    let turn = 0
    const steps = 12
    for (let k = 0; k < steps; k++) {
      const t0 = (front - (span * k) / steps) / LAP_UNITS
      const t1 = (front - (span * (k + 1)) / steps) / LAP_UNITS
      turn += trackTangent(t0, a).angleTo(trackTangent(t1, b))
    }
    const score = turn + Math.abs(front) * 0.004
    if (score < bestScore) {
      bestScore = score
      best = front
    }
  }
  return best
}
/** Slots alternate sides of the ribbon. */
const LANE = 0.5

/**
 * The starting grid on the main straight, near the line (lap fraction 0): an outline per slot and a car marker per driver that drops
 * into place, pole first.
 */
export function createGrid() {
  const group = new THREE.Group()
  group.name = 'grid'

  const entries = (session.grid ?? []).slice().sort((a, b) => a.pos - b.pos)
  const slotMaterial = new THREE.LineBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
  })
  // A bracket open towards the front, like painted grid boxes.
  const bracket = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.42, 0, 0.55),
    new THREE.Vector3(-0.42, 0, -0.55),
    new THREE.Vector3(0.42, 0, -0.55),
    new THREE.Vector3(0.42, 0, 0.55),
  ])
  const carGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.95)

  const front = straightestFront(entries.length)
  const slots = entries.map((entry, i) => {
    const t = (front - FIRST_SLOT - i * SLOT_GAP) / LAP_UNITS
    const lane = i % 2 === 0 ? -LANE : LANE
    const tan = trackTangent(t)
    const yaw = Math.atan2(tan.x, tan.z)

    const outline = new THREE.Line(bracket, slotMaterial)
    trackPoint(t, lane, 0.04, outline.position)
    outline.rotation.y = yaw
    group.add(outline)

    const color = new THREE.Color(entry.color)
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.45,
      transparent: true,
      opacity: 0,
    })
    const car = new THREE.Mesh(carGeometry, material)
    car.castShadow = true
    car.rotation.y = yaw
    group.add(car)

    const rest = trackPoint(t, lane, 0.2)
    // Where the HTML label anchors: beside the slot, on the slot's side.
    const labelAnchor = trackPoint(t, Math.sign(lane) * (HALF_WIDTH + 0.6), 0.2)
    return { entry, t, lane, car, material, rest, labelAnchor }
  })

  /** Centre of the grid and the travel direction there, for the camera. */
  const midT = slots.length ? (slots[0].t + slots.at(-1).t) / 2 : 0
  const center = trackPoint(midT)
  const forward = trackTangent(midT)
  const span = slots.length * SLOT_GAP

  /**
   * @param {number} show 0-1
   * @param {number} build 0-1, cars land one after the other, pole first
   * @returns {number[]} how settled each car is (0-1), for the labels
   */
  const settled = slots.map(() => 0)
  function update(show, build) {
    group.visible = show > 0.002
    slotMaterial.opacity = show * 0.85
    const n = Math.max(slots.length, 1)
    slots.forEach((slot, i) => {
      const k = THREE.MathUtils.clamp((build * (n + 3) - i) / 4, 0, 1)
      const drop = 1 - k * k * (3 - 2 * k)
      slot.car.position.copy(slot.rest)
      slot.car.position.y += drop * 7
      slot.material.opacity = show * Math.min(k * 2.5, 1)
      slot.car.visible = slot.material.opacity > 0.002
      settled[i] = show * k
    })
    return settled
  }

  update(0, 0)
  return { group, slots, update, center, forward, span }
}
