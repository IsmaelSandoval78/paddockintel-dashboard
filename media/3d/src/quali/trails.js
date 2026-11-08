import * as THREE from 'three'
import { trackPointFast, LAP_UNITS } from './track.js'
import {
  vertexShader,
  fragmentShader,
  headVertexShader,
  headFragmentShader,
} from '../trailShaders.js'

/** Tail length in world units (~12, like the race), as a share of the lap. */
const TRAIL_LENGTH = 12 / LAP_UNITS

/**
 * One car on its fastest lap: a glowing head plus a fading tail, on its own
 * lane of the ribbon so three laps run side by side like ghost cars.
 */
export class Trail {
  constructor({ color, lane }) {
    this.lane = lane
    this.count = 320
    this.t = 0
    this.tail = 0

    const positions = new Float32Array(this.count * 3)
    const ages = new Float32Array(this.count)
    for (let i = 0; i < this.count; i++) ages[i] = i / (this.count - 1)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aAge', new THREE.BufferAttribute(ages, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)

    const c = new THREE.Color(color)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: c },
        uRadius: { value: 1.0 },
        uProjScale: { value: 900 },
        uMaxPx: { value: 80 },
        uOpacity: { value: 1 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    })
    this.points = new THREE.Points(geometry, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = 6
    this.positions = positions
    this.head = new THREE.Vector3()

    const headGeometry = new THREE.BufferGeometry()
    headGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
    headGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400)
    this.headMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: c },
        uRadius: { value: 1.7 },
        uProjScale: { value: 900 },
        uMaxPx: { value: 120 },
        uOpacity: { value: 1 },
      },
      vertexShader: headVertexShader,
      fragmentShader: headFragmentShader,
      transparent: true,
      depthWrite: false,
    })
    this.headPoint = new THREE.Points(headGeometry, this.headMaterial)
    this.headPoint.frustumCulled = false
    this.headPoint.renderOrder = 8
  }

  /**
   * Head at lap fraction t. The tail never reaches back past the start of
   * the lap, so a car waiting on the line is a dot that stretches out as
   * it gets going.
   */
  setT(t) {
    this.t = t
    const n = this.count
    const length = Math.min(TRAIL_LENGTH, Math.max(t, 0.0015))
    for (let i = 0; i < n; i++) {
      trackPointFast(t - (i / (n - 1)) * length, this.lane, 0.45, this.positions, i * 3)
    }
    this.head.fromArray(this.positions, 0)
    this.points.geometry.attributes.position.needsUpdate = true
    const hp = this.headPoint.geometry.attributes.position
    hp.setXYZ(0, this.head.x, this.head.y, this.head.z)
    hp.needsUpdate = true
  }

  setOpacity(opacity) {
    this.material.uniforms.uOpacity.value = opacity
    this.headMaterial.uniforms.uOpacity.value = opacity
    this.points.visible = opacity > 0.002
    this.headPoint.visible = this.points.visible
  }

  set projScale(value) {
    this.material.uniforms.uProjScale.value = value
    this.headMaterial.uniforms.uProjScale.value = value
  }
}
