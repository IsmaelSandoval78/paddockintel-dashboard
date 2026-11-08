import * as THREE from 'three'
import { session, colorOf, positionOf, COLORS } from './data.js'
import { BASE_Y } from './track.js'

/** Spacing of the three columns and of the rows inside them, world units. */
const COLUMN_GAP = 15
const ROW_GAP = 1.95
const PILL = [4.3, 1.62]

/** A rounded tag in the team colour with the driver code on it. */
function pillTexture(code, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 264
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  const draw = () => {
    ctx.clearRect(0, 0, 264, 100)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(6, 8, 252, 84, 42)
    ctx.fill()
    const c = new THREE.Color(color)
    const luma = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
    ctx.fillStyle = luma > 0.62 ? COLORS.navy : '#ffffff'
    ctx.font = '700 70px "JetBrains Mono", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(code, 132, 54)
  }
  draw()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.redraw = () => {
    draw()
    texture.needsUpdate = true
  }
  return texture
}

/** Column heading: "Q1" in the title face plus a small driver count. */
function headingTexture(label, count) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  const draw = () => {
    ctx.clearRect(0, 0, 320, 200)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '400 120px Anton, "Arial Narrow", sans-serif'
    ctx.fillStyle = COLORS.red
    ctx.fillText(label, 166, 86)
    ctx.fillStyle = COLORS.blue
    ctx.fillText(label, 160, 80)
    ctx.font = '700 46px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillStyle = COLORS.navy
    ctx.fillText(`${count} CARS`, 160, 172)
  }
  draw()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.redraw = () => {
    draw()
    texture.needsUpdate = true
  }
  return texture
}

/** Yellow marker tag for a driver whose story the columns alone can't tell. */
function noteTexture(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  const draw = () => {
    ctx.clearRect(0, 0, 640, 100)
    ctx.font = '700 46px "JetBrains Mono", ui-monospace, monospace'
    // shrink to fit if the note is long
    const tw = ctx.measureText(text).width
    if (tw > 570) ctx.font = `700 ${Math.floor((46 * 570) / tw)}px "JetBrains Mono", ui-monospace, monospace`
    const w = Math.min(ctx.measureText(text).width + 50, 628)
    ctx.fillStyle = COLORS.yellow
    ctx.beginPath()
    ctx.roundRect(6, 14, w, 72, 10)
    ctx.fill()
    // little pointer back towards the pill
    ctx.beginPath()
    ctx.moveTo(6, 38)
    ctx.lineTo(-10, 50)
    ctx.lineTo(6, 62)
    ctx.fill()
    ctx.fillStyle = COLORS.navy
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 30, 52)
  }
  draw()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.redraw = () => {
    draw()
    texture.needsUpdate = true
  }
  return texture
}

const ease = (x) => {
  const c = Math.min(Math.max(x, 0), 1)
  return c * c * (3 - 2 * c)
}

/**
 * Three columns of driver tags floating above the circuit. `progress` runs
 * 0 -> 2: in the first half the Q2 survivors slide from the Q1 column into
 * the Q2 column while the Q1 casualties drop and fade; in the second half
 * the same happens from Q2 to Q3. A faint copy stays behind in each column
 * a driver passed through, so the end state reads as the whole funnel.
 */
export function createKnockout() {
  const group = new THREE.Group()
  group.name = 'knockout'

  const { out_q1 = [], out_q2 = [], q3 = [], notes = {} } = session.knockout ?? {}
  const outQ1 = new Set(out_q1)
  const outQ2 = new Set(out_q2)
  const field = [...new Set([...q3, ...out_q2, ...out_q1])].sort(
    (a, b) => positionOf(a) - positionOf(b)
  )
  const reachedQ2 = field.filter((c) => !outQ1.has(c))
  const reachedQ3 = reachedQ2.filter((c) => !outQ2.has(c))

  const rows = Math.max(field.length, 1)
  const topY = BASE_Y + 6 + (rows - 1) * ROW_GAP
  const colX = [-COLUMN_GAP, 0, COLUMN_GAP]
  const rowY = (r) => topY - r * ROW_GAP

  const textures = []
  const makeSprite = (texture, scale) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      fog: false,
    })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(scale[0], scale[1], 1)
    sprite.renderOrder = 10
    group.add(sprite)
    return sprite
  }

  const headings = [
    ['Q1', field.length],
    ['Q2', reachedQ2.length],
    ['Q3', reachedQ3.length],
  ].map(([label, count], i) => {
    const texture = headingTexture(label, count)
    textures.push(texture)
    const sprite = makeSprite(texture, [6.4, 4])
    sprite.position.set(colX[i], topY + 3.9, 0)
    return sprite
  })

  const drivers = field.map((code, r1) => {
    const texture = pillTexture(code, colorOf(code))
    textures.push(texture)
    const r2 = reachedQ2.indexOf(code)
    const r3 = reachedQ3.indexOf(code)
    return {
      code,
      r1,
      r2,
      r3,
      // a: the tag in the Q1 column, b: the one that travels to Q2, c: to Q3
      a: makeSprite(texture, PILL),
      b: r2 >= 0 ? makeSprite(texture, PILL) : null,
      c: r3 >= 0 ? makeSprite(texture, PILL) : null,
      note: null,
    }
  })

  // Notes ride beside the tag in the column where the driver set no time,
  // and that tag stays put (faint) instead of dropping out with the rest.
  const NOTE = [11.5, 1.8]
  for (const d of drivers) {
    const n = notes[d.code]
    if (!n) continue
    const texture = noteTexture(n.text)
    textures.push(texture)
    d.note = makeSprite(texture, NOTE)
    d.notePart = n.part
  }

  if (document.fonts) {
    document.fonts.ready.then(() => textures.forEach((t) => t.redraw()))
  }

  const GHOST = 0.42

  /**
   * @param {number} show 0-1 overall visibility
   * @param {number} progress 0-2, see above
   */
  function update(show, progress) {
    group.visible = show > 0.002
    if (!group.visible) return
    const p1 = Math.min(Math.max(progress, 0), 1)
    const p2 = Math.min(Math.max(progress - 1, 0), 1)
    // Each row starts a touch after the one above it.
    const stagger = (p, row, n) => ease((p - (row / Math.max(n, 1)) * 0.35) / 0.65)

    headings[0].material.opacity = show
    headings[1].material.opacity = show * ease(p1 * 3)
    headings[2].material.opacity = show * ease(p2 * 3)

    for (const d of drivers) {
      const k1 = stagger(p1, d.r1, field.length)
      // Column Q1
      if (outQ1.has(d.code)) {
        d.a.position.set(colX[0], rowY(d.r1) - k1 * 5, 0)
        d.a.material.opacity = show * (1 - k1)
      } else {
        d.a.position.set(colX[0], rowY(d.r1), 0)
        d.a.material.opacity = show * (1 - (1 - GHOST) * k1)
      }
      // Travelling to Q2
      if (d.b) {
        const k2 = stagger(p2, d.r2, reachedQ2.length)
        const x = THREE.MathUtils.lerp(colX[0], colX[1], k1)
        const y = THREE.MathUtils.lerp(rowY(d.r1), rowY(d.r2), k1)
        if (outQ2.has(d.code) && d.notePart === 'Q2') {
          d.b.position.set(x, y, 0)
          d.b.material.opacity = show * (k1 > 0.001 ? 1 : 0)
          d.note.position.set(x + PILL[0] / 2 + 0.5 + NOTE[0] / 2, y, 0)
          d.note.material.opacity = show * ease((k1 - 0.6) / 0.4)
          d.note.visible = d.note.material.opacity > 0.002
        } else if (outQ2.has(d.code)) {
          d.b.position.set(x, y - k2 * 5, 0)
          d.b.material.opacity = show * (k1 > 0.001 ? 1 : 0) * (1 - k2)
        } else {
          d.b.position.set(x, y, 0)
          d.b.material.opacity = show * (k1 > 0.001 ? 1 - (1 - GHOST) * k2 : 0)
        }
        d.b.visible = d.b.material.opacity > 0.002
        // Travelling to Q3
        if (d.c) {
          d.c.position.set(
            THREE.MathUtils.lerp(colX[1], colX[2], k2),
            THREE.MathUtils.lerp(rowY(d.r2), rowY(d.r3), k2),
            0.01
          )
          d.c.material.opacity = show * (k2 > 0.001 ? 1 : 0)
          d.c.visible = d.c.material.opacity > 0.002
        }
      }
    }
  }

  /** Middle of the whole board, for framing the camera. */
  const center = new THREE.Vector3(0, (topY + 5.9 + rowY(rows - 1) - 1) / 2, 0)
  const height = topY + 5.9 - rowY(rows - 1) + 1

  update(0, 0)
  return { group, update, center, height, width: COLUMN_GAP * 2 + PILL[0] }
}
