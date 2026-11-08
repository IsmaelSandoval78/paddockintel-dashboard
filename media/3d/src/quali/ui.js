import * as THREE from 'three'
import gsap from 'gsap'
import { scrambleTo } from '../scramble.js'
import { session, TOP3, colorOf, formatClock, sectorOf, timeAt } from './data.js'
import { PLAN } from './story.js'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Weather strip from session.weather (any of the usual keys, all optional). */
function weatherHTML() {
  const w = session.weather ?? {}
  const items = [
    ['Air', w.AirTemp, (v) => `${v.toFixed(1)}°`],
    ['Track', w.TrackTemp, (v) => `${v.toFixed(1)}°`],
    ['Hum', w.Humidity, (v) => `${Math.round(v)}%`],
    ['Wind', w.WindSpeed, (v) => `${v.toFixed(1)} m/s`],
  ].filter(([, v]) => typeof v === 'number')
  if (!items.length) return ''
  return `<div class="hud hud-weather">${items
    .map(([label, v, fmt]) => `<span class="wx">${label} <b>${fmt(v)}</b></span>`)
    .join('')}</div>`
}

/** The live delta readout for the three fastest laps. */
function gapHTML() {
  return `
    <div class="q-gap">
      <div class="q-gap-head"><span class="q-gap-sector">S1</span><span class="q-gap-clock">0.000</span></div>
      ${TOP3.map(
        (d, i) => `
        <div class="q-gap-row" data-i="${i}">
          <i class="q-chip" style="background:${d.display}"></i>
          <b class="q-code">${esc(d.code)}</b>
          <span class="q-delta">–</span>
        </div>`
      ).join('')}
    </div>`
}

/** The big number for the margin chapter comes straight from gap_p1_p2. */
function marginNumber() {
  const g = session.gap_p1_p2
  return typeof g === 'number' ? `${g.toFixed(3)}s` : ''
}
/** Second line of a grid tag: gap to pole, or why the car sits where it does. */
function gridNote(g) {
  const pole = (session.top3 ?? [])[0]?.code === g.code
  const gap = pole ? 'POLE' : g.gap != null ? `+${Number(g.gap).toFixed(3)}` : g.quali ? `Q P${g.quali}` : ''
  return g.penalty ? `${gap} ▼${esc(g.penalty)}` : gap
}
const normalise = (s) => String(s).toUpperCase().replace(/[^0-9A-Z.]/g, '').replace(/\.$/, '')

export function createUI(overlay, { tallFrame }) {
  const total = String(PLAN.filter((c) => c.number).length).padStart(2, '0')
  overlay.innerHTML = `
    <div class="hud hud-brand">PADDOCK&middot;INTEL</div>
    ${weatherHTML()}
    <div class="hud hud-counter"><span id="counter">01</span> / ${total}</div>
    <div class="hud hud-circuit q-credit">Qualifying &middot; ${esc(session.circuit)} &middot; ${esc(session.date)}</div>
    ${gapHTML()}
    <div class="q-labels"></div>
    ${PLAN.map((c) => {
      const huge = c.huge
      // In the margin chapter the big number is gap_p1_p2; the chapter's own
      // title only shows as a kicker if it says something different.
      const number = c.kind === 'margin' || c.kind === 'hook' ? marginNumber() : ''
      const kicker = number && normalise(c.chapter.title) !== normalise(number) ? c.chapter.title : ''
      return `
      <article class="chapter q-chapter ${tallFrame ? c.placeTall : c.place}${huge ? ' huge' : ''}" data-index="${c.index}">
        <div class="inner">
          ${kicker ? `<div class="q-kicker">${esc(kicker)}</div>` : ''}
          <h2 class="title"><span class="back" aria-hidden="true"></span><span class="front"></span></h2>
          <p class="body"></p>
        </div>
      </article>`
    }).join('')}
  `

  const counter = overlay.querySelector('#counter')
  const credit = overlay.querySelector('.q-credit')
  const blocks = [...overlay.querySelectorAll('.chapter')].map((root, i) => ({
    root: root.querySelector('.inner'),
    article: root,
    plan: PLAN[i],
    title: (PLAN[i].kind === 'margin' || PLAN[i].kind === 'hook') && marginNumber() ? marginNumber() : PLAN[i].chapter.title,
    titleParts: [root.querySelector('.back'), root.querySelector('.front')],
    body: root.querySelector('.body'),
    tweens: [],
  }))
  gsap.set(
    blocks.map((b) => b.root),
    { autoAlpha: 0 }
  )

  /** Where the current chapter's text sits, relative to the overlay. */
  let keepOut = null
  function measureText() {
    const block = blocks[current]
    if (!block) return
    const o = overlay.getBoundingClientRect()
    const parts = [...block.root.children].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0)
    if (!parts.length) return
    keepOut = {
      left: Math.min(...parts.map((r) => r.left)) - o.left,
      right: Math.max(...parts.map((r) => r.right)) - o.left,
      top: Math.min(...parts.map((r) => r.top)) - o.top,
      bottom: Math.max(...parts.map((r) => r.bottom)) - o.top,
    }
  }
  new ResizeObserver(measureText).observe(overlay)

  let current = -1
  /** How long the outgoing headline takes to leave; the next one waits for it. */
  const OUT = 0.3
  function show(index) {
    if (index === current) return
    const previous = blocks[current]
    current = index
    const block = blocks[index]
    // Only one headline at a time: anything other than the outgoing block
    // is cleared at once, the outgoing one leaves, then the new one enters.
    blocks.forEach((b) => {
      if (b === block || b === previous) return
      for (const t of b.tweens) t.kill()
      b.tweens = []
      gsap.killTweensOf(b.root)
      gsap.set(b.root, { autoAlpha: 0 })
    })
    let wait = 0
    if (previous && previous !== block) {
      for (const t of previous.tweens) t.kill()
      previous.tweens = []
      const visible = Number(gsap.getProperty(previous.root, 'opacity')) > 0.01
      gsap.to(previous.root, { autoAlpha: 0, y: -18, duration: OUT, ease: 'power2.in', overwrite: true })
      wait = visible ? OUT + 0.04 : 0
    }
    const number = block.plan.number
    counter.textContent = String(number || 1).padStart(2, '0')
    // The circuit credit belongs to the establishing shot; later shots fill
    // the bottom of the frame with track.
    gsap.to(credit, { autoAlpha: block.plan.kind === 'pole' && number === 1 ? 1 : 0, duration: 0.4, overwrite: true })
    gsap.killTweensOf(block.root)
    gsap.set(block.root, { y: 0, autoAlpha: 0 })
    const chapter = block.plan.chapter
    block.body.textContent = (tallFrame && chapter.short != null ? chapter.short : chapter.text) ?? ''
    block.body.style.display = block.body.textContent ? '' : 'none'
    // The title is still scrambling, but its box is already final.
    block.titleParts[0].textContent = block.titleParts[1].textContent = block.title
    measureText()
    block.tweens = [
      gsap.to(block.root, { autoAlpha: 1, duration: 0.25, delay: wait }),
      scrambleTo(block.titleParts, block.title, { duration: block.plan.huge ? 1.1 : 0.9, delay: wait + 0.05 }),
      gsap.fromTo(
        block.body,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: wait + 0.3, ease: 'power2.out' }
      ),
    ]
  }

  /** Text that sits where the camera will sweep steps aside as it leaves. */
  function setTravel(travel) {
    blocks.forEach((block, i) => {
      const fade =
        i === current && block.plan.fade
          ? 1 - Math.min(Math.max((travel - 0.02) / 0.12, 0), 1)
          : 1
      block.article.style.opacity = fade === 1 ? '' : String(fade)
    })
  }

  // --- live gap readout -------------------------------------------------------
  const gapBox = overlay.querySelector('.q-gap')
  const gapSector = overlay.querySelector('.q-gap-sector')
  const gapClock = overlay.querySelector('.q-gap-clock')
  const gapDeltas = [...overlay.querySelectorAll('.q-delta')]
  const gapRows = [...overlay.querySelectorAll('.q-gap-row')]
  const shown = { clock: '', sector: '', deltas: ['', '', ''], order: '' }

  /**
   * Delta to P1 at the point of the lap P1 has reached: how much later
   * (or earlier) each car got there. Exact at the sector lines.
   */
  function setGap(opacity, clock, fractions) {
    gapBox.style.opacity = opacity.toFixed(3)
    gapBox.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
    if (opacity <= 0.01) return
    const fP1 = fractions[0]
    const clockText = formatClock(clock)
    if (clockText !== shown.clock) gapClock.textContent = shown.clock = clockText
    const sector = fP1 >= 0.9999 ? 'LAP' : `S${sectorOf(fP1)}`
    if (sector !== shown.sector) gapSector.textContent = shown.sector = sector
    const ref = timeAt(TOP3[0], fP1)
    TOP3.forEach((d, i) => {
      let text
      if (i === 0) text = fP1 >= 0.9999 ? d.lap_text : 'P1'
      else {
        const delta = timeAt(d, fP1) - ref
        text = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(3)}`
      }
      if (text !== shown.deltas[i]) gapDeltas[i].textContent = shown.deltas[i] = text
    })
    // Whoever is physically ahead right now is highlighted.
    const lead = fractions.indexOf(Math.max(...fractions))
    const order = String(lead)
    if (order !== shown.order) {
      shown.order = order
      gapRows.forEach((row, i) => row.classList.toggle('lead', i === lead))
    }
  }

  // --- labels that follow things in the 3D scene ------------------------------
  const layer = overlay.querySelector('.q-labels')
  const _v = new THREE.Vector3()
  function makeLabel(html, className, color) {
    const el = document.createElement('div')
    el.className = `q-label ${className}`
    if (color) el.style.setProperty('--c', color)
    el.innerHTML = `<span class="q-in">${html}</span>`
    layer.appendChild(el)
    return { el, visible: false }
  }

  /** Puts a label on a world point; hides it if off screen or behind. */
  function place(label, world, camera, opacity, width, height) {
    if (opacity <= 0.01) {
      if (label.visible) {
        label.el.style.visibility = 'hidden'
        label.visible = false
      }
      return
    }
    _v.copy(world).project(camera)
    const on = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1
    if (!on) {
      label.el.style.visibility = 'hidden'
      label.visible = false
      return
    }
    let x = (_v.x * 0.5 + 0.5) * width
    let y = (-_v.y * 0.5 + 0.5) * height
    // Labels never cover the chapter text: one that would lands just to
    // the right of the text block instead.
    if (keepOut && label.keepOut !== false) {
      const w2 = label.el.firstChild.offsetWidth
      const h2 = label.el.firstChild.offsetHeight
      const left = x - w2 / 2
      if (
        left < keepOut.right + 12 &&
        left + w2 > keepOut.left &&
        y - h2 < keepOut.bottom &&
        y > keepOut.top
      ) {
        x = keepOut.right + 12 + w2 / 2
      }
    }
    label.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    label.el.style.opacity = opacity.toFixed(3)
    if (!label.visible) {
      label.el.style.visibility = 'visible'
      label.visible = true
    }
  }

  const carLabels = TOP3.map((d, i) => {
    const label = makeLabel(esc(d.code), 'q-car', d.display)
    label.keepOut = false
    // Side by side the three heads are a few pixels apart, so the tags
    // stack at three heights instead of sitting on top of each other.
    label.el.style.setProperty('--lift', `${1.1 + i * 1.75}em`)
    return label
  })
  const sectorLabels = (session.sector_best ?? []).map((s) =>
    makeLabel(
      `<small>S${s.sector}</small> <b>${esc(s.code)}</b> ${Number(s.time).toFixed(3)}`,
      'q-sector',
      colorOf(s.code)
    )
  )
  const gridLabels = (session.grid ?? [])
    .slice()
    .sort((a, b) => a.pos - b.pos)
    .map((g, i) =>
      makeLabel(
        `<small>P${g.pos}</small> <b>${esc(g.code)}</b> <span>${gridNote(g)}</span>`,
        `q-grid ${i % 2 === 0 ? 'left' : 'right'}`,
        g.color
      )
    )

  /** The chapter text's box and how visible it is right now, for the safe zone. */
  function safeZone() {
    const block = blocks[current]
    if (!keepOut || !block) return null
    const fade = block.article.style.opacity === '' ? 1 : Number(block.article.style.opacity)
    return { ...keepOut, alpha: Number(gsap.getProperty(block.root, 'opacity')) * fade }
  }

  return {
    show,
    safeZone,
    setTravel,
    setGap,
    place,
    carLabels,
    sectorLabels,
    gridLabels,
    gapBox,
  }
}
