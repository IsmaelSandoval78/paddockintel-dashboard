import * as THREE from 'three'
import race from '../data/race.json'
import { trackPointFast } from './track.js'
import { CODES, CAR_INFO } from './field.js'
import {
  vertexShader,
  fragmentShader,
  headVertexShader,
  headFragmentShader,
} from './trailShaders.js'

/** How much of a lap the tail covers (~12 world units). */
const TRAIL_LENGTH = 0.04

/** The three drivers the story is about; everyone else is background. */
export const HEROES = ['VER', 'NOR', 'ANT']

/** Cars alternate sides of the ribbon by running position, like the grid. */
const LANE = 0.38
/** Shortest tail, as a share of the full one, so a parked car still reads. */
const MIN_TAIL = 0.12
const PAPER = new THREE.Color(race.colors.cream)

/**
 * One driver: a bright head point plus a fading tail of points that hug
 * the racing line.
 */
class Trail {
  constructor(code, { hero }) {
    this.code = code
    this.hero = hero
    this.lane = 0
    this.laneReady = false
    this.t = 0
    this.count = hero ? 340 : 220
    this.presence = 1
    this.tail = 1

    const positions = new Float32Array(this.count * 3)
    const ages = new Float32Array(this.count)
    for (let i = 0; i < this.count; i++) ages[i] = i / (this.count - 1)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aAge', new THREE.BufferAttribute(ages, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)

    // Heroes keep the story's brand colours. The rest wear their own team
    // colour, only a touch softer so the three that matter still lead.
    const color = hero
      ? new THREE.Color(race.colors[code])
      : new THREE.Color(CAR_INFO[code].colour).lerp(PAPER, 0.1)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color },
        uRadius: { value: hero ? 1.0 : 0.7 },
        uProjScale: { value: 900 },
        uMaxPx: { value: hero ? 80 : 56 },
        uOpacity: { value: 1 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })

    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = hero ? 6 : 5
    this.positions = positions
    this.head = new THREE.Vector3()

    // The head: one bright sprite drawn on top of the tail. It is the only
    // part of the car that goes into the glow buffer, so the bloom sits on
    // the nose of the streak instead of hazing the whole trail.
    const headGeometry = new THREE.BufferGeometry()
    headGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
    headGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)
    this.headMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color },
        uRadius: { value: hero ? 1.7 : 1.2 },
        uProjScale: { value: 900 },
        uMaxPx: { value: hero ? 120 : 84 },
        uOpacity: { value: 1 },
      },
      vertexShader: headVertexShader,
      fragmentShader: headFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    this.headPoint = new THREE.Points(headGeometry, this.headMaterial)
    this.headPoint.frustumCulled = false
    this.headPoint.renderOrder = this.points.renderOrder + 2

    this.setT(0)
  }

  /** Eases towards the side of the ribbon its running position puts it on. */
  steer(rank, dt) {
    const target = rank < 0 ? this.lane : rank % 2 === 0 ? -LANE : LANE
    if (!this.laneReady) {
      this.lane = target
      this.laneReady = true
    } else {
      this.lane += (target - this.lane) * (1 - Math.exp(-dt * 5))
    }
  }

  /**
   * The tail is as long as the car is fast: a dot on the grid or under the
   * red flag, the full streak at racing speed.
   */
  setPace(pace, dt) {
    const target = Math.min(Math.max(pace, MIN_TAIL), 1.15)
    this.tail += (target - this.tail) * (1 - Math.exp(-dt * 6))
  }

  /** Places the head at lap fraction t and redraws the whole tail behind it. */
  setT(t) {
    this.t = t
    const n = this.count
    const length = TRAIL_LENGTH * this.tail
    for (let i = 0; i < n; i++) {
      const age = i / (n - 1)
      trackPointFast(t - age * length, this.lane, 0.45, this.positions, i * 3)
    }
    this.head.fromArray(this.positions, 0)
    this.points.geometry.attributes.position.needsUpdate = true
    const headPos = this.headPoint.geometry.attributes.position
    headPos.setXYZ(0, this.head.x, this.head.y, this.head.z)
    headPos.needsUpdate = true
  }

  /** Global brightness times this car's own presence (0 once retired). */
  setOpacity(global, presence) {
    const opacity = global * presence * (this.hero ? 1 : 0.9)
    this.material.uniforms.uOpacity.value = opacity
    this.headMaterial.uniforms.uOpacity.value = opacity
    this.points.visible = presence > 0.001
    this.headPoint.visible = this.points.visible
  }

  set projScale(value) {
    this.material.uniforms.uProjScale.value = value
    this.headMaterial.uniforms.uProjScale.value = value
  }
}

export function createTrails() {
  const group = new THREE.Group()
  group.name = 'trails'

  const drivers = {}
  for (const code of CODES) {
    drivers[code] = new Trail(code, { hero: HEROES.includes(code) })
    group.add(drivers[code].points)
    group.add(drivers[code].headPoint)
  }

  return { group, drivers }
}
