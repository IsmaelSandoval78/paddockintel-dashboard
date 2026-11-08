import * as THREE from 'three'

const UP = new THREE.Vector3(0, 1, 0)

/**
 * Sweeps a closed 2D cross-section along a curve and returns the geometry.
 *
 * The cross-section lives in (u, v): u runs sideways (left/right of the
 * racing line), v runs vertically. Each profile edge becomes its own strip of
 * vertices so corners stay crisp after computeVertexNormals().
 *
 * @param {THREE.Curve} curve
 * @param {Array<[number, number]>} profile counter-clockwise in (u, v)
 * @param {number} segments rings along the curve
 * @param {object} [opts]
 * @param {boolean} [opts.closed] wrap the last ring back onto the first
 * @param {(i: number, t: number) => THREE.Color} [opts.colorFn] per-ring colour
 * @param {number} [opts.uvRepeat] how many times the texture U wraps
 */
export function sweepProfile(curve, profile, segments, opts = {}) {
  const { closed = true, colorFn = null, uvRepeat = 1 } = opts

  const rings = closed ? segments : segments + 1
  const points = []
  const sides = []
  const ups = []

  for (let i = 0; i < rings; i++) {
    const t = closed ? (i / segments) % 1 : i / segments
    const tangent = curve.getTangentAt(t).normalize()
    const side = new THREE.Vector3().crossVectors(tangent, UP).normalize()
    points.push(curve.getPointAt(t))
    sides.push(side)
    ups.push(new THREE.Vector3().crossVectors(side, tangent).normalize())
  }

  const position = []
  const uv = []
  const color = colorFn ? [] : null
  const index = []
  const nProfile = profile.length
  const v = new THREE.Vector3()

  for (let e = 0; e < nProfile; e++) {
    const p0 = profile[e]
    const p1 = profile[(e + 1) % nProfile]
    const base = position.length / 3

    for (let i = 0; i < rings; i++) {
      const P = points[i]
      const S = sides[i]
      const U = ups[i]
      const t = i / segments

      v.copy(P).addScaledVector(S, p0[0]).addScaledVector(U, p0[1])
      position.push(v.x, v.y, v.z)
      v.copy(P).addScaledVector(S, p1[0]).addScaledVector(U, p1[1])
      position.push(v.x, v.y, v.z)

      uv.push(t * uvRepeat, 0, t * uvRepeat, 1)

      if (colorFn) {
        const c = colorFn(i, t)
        color.push(c.r, c.g, c.b, c.r, c.g, c.b)
      }
    }

    const lastRing = closed ? rings : rings - 1
    for (let i = 0; i < lastRing; i++) {
      const j = (i + 1) % rings
      const a = base + i * 2
      const b = a + 1
      const c = base + j * 2
      const d = c + 1
      index.push(a, d, b, a, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  if (color) geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
