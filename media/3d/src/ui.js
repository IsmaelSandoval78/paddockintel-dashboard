import gsap from 'gsap'
import { scrambleTo } from './scramble.js'
import race from '../data/race.json'
import {
  CAR_INFO,
  TOTAL_LAPS,
  STEWARDS,
  WEATHER,
  raceTimeAt,
  weatherAt,
} from './field.js'

/** The three story drivers, in the order the tyre panel lists them. */
const TYRE_DRIVERS = ['VER', 'NOR', 'ANT']
const COMPOUND = {
  SOFT: { letter: 'S', name: 'soft' },
  MEDIUM: { letter: 'M', name: 'medium' },
  HARD: { letter: 'H', name: 'hard' },
  INTERMEDIATE: { letter: 'I', name: 'inter' },
  WET: { letter: 'W', name: 'wet' },
}

/** Rows of the tyre panel: one bar per driver, a segment per stint. */
function tyrePanelHTML() {
  const rows = TYRE_DRIVERS.map((code) => {
    const segments = CAR_INFO[code].tyres
      .map(([compound, first, last]) => {
        const left = ((first - 1) / TOTAL_LAPS) * 100
        const width = ((last - first + 1) / TOTAL_LAPS) * 100
        return `<i class="stint" data-compound="${compound}" style="left:${left}%;width:${width}%"></i>`
      })
      .join('')
    return `
      <div class="tyre-row" data-code="${code}">
        <span class="tyre-name" style="color:${race.colors[code]}">${code}</span>
        <span class="tyre-bar">${segments}</span>
        <span class="tyre-now"><b class="tyre-chip"></b><span class="tyre-age"></span></span>
      </div>`
  }).join('')
  return `
    <div class="hud hud-tyres">
      <div class="tyre-head"><span>Tyres</span><span class="tyre-key"><b class="tyre-chip" data-compound="SOFT">S</b>soft <b class="tyre-chip" data-compound="MEDIUM">M</b>medium</span></div>
      ${rows}
      <span class="tyre-cursor"></span>
    </div>`
}

/**
 * Stewards' log: every time penalty, plus incidents involving the story
 * drivers that were cleared. Long FIA wording is shortened for the panel.
 */
const STEWARD_ENTRIES = STEWARDS.filter(
  (e) => e.kind === 'penalty' || e.cars.some((c) => TYRE_DRIVERS.includes(c))
)
const REASONS = {
  'LEAVING THE TRACK AND GAINING AN ADVANTAGE': 'off track, gained time',
  'CAUSING A COLLISION': 'caused a collision',
  'SPEEDING IN THE PIT LANE': 'pit-lane speeding',
  'FALSE START - OUT OF POSITION': 'false start',
  'FALSE START - MOVING BEFORE SIGNAL': 'false start',
  'FORCING ANOTHER DRIVER OFF THE TRACK': 'forced off track',
  'TURN 1 INCIDENT': 'turn 1 clash',
}
/** How many decisions the panel lists at once (newest on top). */
const STEWARD_ROWS = 4

function stewardHTML(e) {
  const reason = REASONS[e.reason] ?? e.reason.toLowerCase()
  const names = e.cars
    .map((c) => `<b style="color:${race.colors[c] ?? 'inherit'}">${c}</b>`)
    .join(' / ')
  const tag =
    e.kind === 'penalty'
      ? `<span class="stew-tag">+${e.seconds}s</span>`
      : `<span class="stew-tag">no action</span>`
  return `<li class="stew" data-kind="${e.kind}"><span class="stew-lap">L${e.lap}</span><span class="stew-who">${names}</span><span class="stew-why">${reason}</span>${tag}</li>`
}

/** Whose speedometer is shown. Needs telemetry (TELEMETRY in the extractor). */
export const SPEEDO_DRIVER = 'NOR'
/** Top speed the dial reads up to, in km/h. */
const SPEED_MAX = 360
/** The dial: a 240° arc, open at the bottom. */
const ARC = 'M 21.7 78.3 A 40 40 0 1 1 78.3 78.3'

function speedoHTML(code) {
  return `
    <div class="hud hud-speed">
      <svg class="spd-dial" viewBox="0 0 100 100" aria-hidden="true">
        <path class="spd-track" d="${ARC}" pathLength="1"/>
        <path class="spd-fill" d="${ARC}" pathLength="1" style="stroke:${race.colors[code]}"/>
      </svg>
      <div class="spd-read">
        <span class="spd-who" style="color:${race.colors[code]}">${code}</span>
        <span class="spd-num">0</span>
        <span class="spd-unit">km/h</span>
      </div>
      <div class="spd-row">
        <span class="spd-gear"><small>gear</small><b>N</b></span>
        <span class="spd-pedal" data-pedal="throttle"><small>thr</small><span><i></i></span></span>
        <span class="spd-pedal" data-pedal="brake"><small>brk</small><span><i></i></span></span>
      </div>
    </div>`
}

/** Track temperature over the race, as a sparkline path in a 100x20 box. */
const RACE_START = raceTimeAt(0)
const RACE_END = raceTimeAt(TOTAL_LAPS)
const SPARK_ROWS = WEATHER.filter(([t]) => t >= RACE_START - 60 && t <= RACE_END + 60)
const TEMP_RANGE = [
  Math.min(...SPARK_ROWS.map((r) => r[2])),
  Math.max(...SPARK_ROWS.map((r) => r[2])),
]
const sparkX = (t) =>
  Math.min(Math.max((t - RACE_START) / (RACE_END - RACE_START), 0), 1) * 100
const sparkY = (temp) =>
  18 - ((temp - TEMP_RANGE[0]) / (TEMP_RANGE[1] - TEMP_RANGE[0] || 1)) * 16

function trackTempPath() {
  return SPARK_ROWS.map(
    ([t, , track], i) => `${i ? 'L' : 'M'}${sparkX(t).toFixed(1)} ${sparkY(track).toFixed(1)}`
  ).join(' ')
}

function weatherHTML() {
  return `
    <div class="hud hud-weather">
      <span class="wx">Air <b data-wx="air">–</b></span>
      <span class="wx">Track <b data-wx="track">–</b>
        <span class="wx-spark">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
            <path d="${trackTempPath()}" vector-effect="non-scaling-stroke"/>
          </svg>
          <i class="wx-dot"></i>
        </span>
      </span>
      <span class="wx">Hum <b data-wx="humidity">–</b></span>
      <span class="wx">Wind <b data-wx="wind">–</b><i class="wx-arrow">&darr;</i></span>
      <span class="wx wx-pressure"><b data-wx="pressure">–</b></span>
      <span class="wx wx-rain" hidden>Rain</span>
    </div>`
}

/** Where each chapter's text block sits, so the layout keeps breathing. */
const PLACEMENT = ['top-center', 'low-left', 'low-left', 'top-left', 'top-left', 'top-center', 'center']

export function createUI(overlay) {
  overlay.innerHTML = `
    <div class="hud hud-brand">PADDOCK&middot;INTEL</div>
    ${weatherHTML()}
    <div class="hud hud-counter"><span id="counter">01</span> / 07</div>
    <div class="hud hud-circuit">${race.circuit}</div>
    ${speedoHTML(SPEEDO_DRIVER)}
    <div class="hud hud-stewards"><div class="stew-head">Stewards</div><ol class="stew-list"></ol></div>
    ${tyrePanelHTML()}
    <div class="hud hud-race">
      <span class="race-flag" data-status="1"></span>
      <span class="race-lap"></span>
    </div>
    ${race.chapters
      .map(
        (chapter, i) => `
      <article class="chapter ${PLACEMENT[i]}${chapter.id === 6 ? ' huge' : ''}${chapter.id === 1 ? ' hook' : ''}" data-index="${i}">
        <div class="inner">
          <h2 class="title"><span class="back" aria-hidden="true"></span><span class="front"></span></h2>
          <p class="body"></p>
        </div>
      </article>`
      )
      .join('')}
    <div class="outro-card">
      <h2 class="title"><span class="back" aria-hidden="true">EVERY F1 SESSION,
IN DATA.</span><span class="front">EVERY F1 SESSION,
IN DATA.</span></h2>
      <p class="o-sub">SUBSCRIBE · PADDOCKINTEL.COM</p>
    </div>
  `

  const counter = overlay.querySelector('#counter')
  // The circuit name lives on the infield during chapter 1 and only moves
  // to the corner once the race is under way.
  const credit = overlay.querySelector('.hud-circuit')
  gsap.set(credit, { autoAlpha: 0 })
  const blocks = [...overlay.querySelectorAll('.chapter')].map((root, i) => ({
    root: root.querySelector('.inner'),
    article: root,
    chapter: race.chapters[i],
    titleParts: [root.querySelector('.back'), root.querySelector('.front')],
    body: root.querySelector('.body'),
    tweens: [],
  }))

  let current = -1

  // Live race readout, bottom right: lap counter plus the track status.
  const raceBox = overlay.querySelector('.hud-race')
  const flagEl = overlay.querySelector('.race-flag')
  const lapEl = overlay.querySelector('.race-lap')
  const FLAGS = {
    1: '',
    2: 'Yellow',
    4: 'Safety car',
    5: 'Red flag',
    6: 'VSC',
    7: 'VSC ending',
  }
  // Tyre panel: a cursor sweeps the bars, each row says what is fitted now.
  const tyreBox = overlay.querySelector('.hud-tyres')
  const tyreCursor = overlay.querySelector('.tyre-cursor')
  const tyreRows = TYRE_DRIVERS.map((code) => {
    const row = overlay.querySelector(`.tyre-row[data-code="${code}"]`)
    return {
      stints: CAR_INFO[code].tyres,
      chip: row.querySelector('.tyre-now .tyre-chip'),
      age: row.querySelector('.tyre-age'),
      shown: '',
    }
  })
  gsap.set(tyreBox, { autoAlpha: 0 })

  function setTyres(raceLap) {
    const done = Math.min(Math.max(raceLap, 0), TOTAL_LAPS)
    tyreBox.style.setProperty('--progress', String(done / TOTAL_LAPS))
    const lap = Math.min(Math.max(Math.ceil(raceLap - 1e-4), 1), TOTAL_LAPS)
    for (const row of tyreRows) {
      const stint = row.stints.find(([, first, last]) => lap >= first && lap <= last)
      // A retired car (or a gap in the data) shows nothing.
      const key = stint ? `${stint[0]}|${lap - stint[1] + 1}` : ''
      if (key === row.shown) continue
      row.shown = key
      row.chip.dataset.compound = stint ? stint[0] : ''
      row.chip.textContent = stint ? (COMPOUND[stint[0]]?.letter ?? '?') : ''
      row.age.textContent = stint ? `${lap - stint[1] + 1}L` : ''
    }
  }

  // Stewards' log: decisions appear as the race reaches them, newest first;
  // a served penalty is marked as such.
  const stewBox = overlay.querySelector('.hud-stewards')
  const stewList = overlay.querySelector('.stew-list')
  let stewKey = ''
  gsap.set(stewBox, { autoAlpha: 0 })

  function setStewards(raceLap) {
    const time = raceTimeAt(raceLap)
    const issued = STEWARD_ENTRIES.filter((e) => e.t <= time)
    const visible = issued.slice(-STEWARD_ROWS).reverse()
    const key = visible.map((e) => `${e.t}${e.served != null && e.served <= time ? 's' : ''}`).join('|')
    if (key === stewKey) return
    const before = new Set(stewKey.split('|').map(parseFloat))
    stewKey = key
    stewList.innerHTML = visible.map(stewardHTML).join('')
    stewBox.classList.toggle('empty', visible.length === 0)
    visible.forEach((e, i) => {
      const li = stewList.children[i]
      if (e.served != null && e.served <= time) li.dataset.served = ''
      if (!before.has(e.t)) li.classList.add('fresh')
    })
  }

  // Speedometer: eased toward the live values so the needle sweeps.
  const speedBox = overlay.querySelector('.hud-speed')
  const speedFill = overlay.querySelector('.spd-fill')
  const speedNum = overlay.querySelector('.spd-num')
  const gearEl = overlay.querySelector('.spd-gear b')
  const throttleBar = overlay.querySelector('[data-pedal="throttle"] i')
  const brakeBar = overlay.querySelector('[data-pedal="brake"] i')
  const shownTel = { speed: 0, throttle: 0, brake: 0, text: '', gear: '' }
  gsap.set(speedBox, { autoAlpha: 0 })

  function setSpeedo(tel, dt) {
    const k = 1 - Math.exp(-dt * 10)
    shownTel.speed += (tel.speed - shownTel.speed) * k
    shownTel.throttle += (tel.throttle - shownTel.throttle) * k
    shownTel.brake += (tel.brake - shownTel.brake) * (1 - Math.exp(-dt * 18))
    const fill = Math.min(shownTel.speed / SPEED_MAX, 1)
    speedFill.style.strokeDasharray = `${fill.toFixed(4)} 1`
    const text = String(Math.round(shownTel.speed))
    if (text !== shownTel.text) speedNum.textContent = shownTel.text = text
    const gear = tel.gear > 0 ? String(tel.gear) : 'N'
    if (gear !== shownTel.gear) gearEl.textContent = shownTel.gear = gear
    throttleBar.style.transform = `scaleX(${(shownTel.throttle / 100).toFixed(3)})`
    brakeBar.style.transform = `scaleX(${shownTel.brake.toFixed(3)})`
  }

  // Weather strip, top left: rounded readings plus a dot riding the
  // track-temperature curve.
  const wxBox = overlay.querySelector('.hud-weather')
  const wxEls = Object.fromEntries(
    [...overlay.querySelectorAll('[data-wx]')].map((el) => [el.dataset.wx, el])
  )
  const wxDot = overlay.querySelector('.wx-dot')
  const wxArrow = overlay.querySelector('.wx-arrow')
  const wxRain = overlay.querySelector('.wx-rain')
  const wx = {}
  let wxKey = ''
  gsap.set(wxBox, { autoAlpha: 0 })

  function setWeather(raceLap) {
    const time = raceTimeAt(raceLap)
    if (!weatherAt(time, wx)) return
    const values = {
      air: `${wx.air.toFixed(1)}°`,
      track: `${wx.track.toFixed(1)}°`,
      humidity: `${Math.round(wx.humidity)}%`,
      wind: `${wx.wind.toFixed(1)} m/s`,
      pressure: `${Math.round(wx.pressure)} hPa`,
    }
    const key = Object.values(values).join('|') + wx.windDir + wx.rain
    if (key === wxKey) return
    wxKey = key
    for (const [name, text] of Object.entries(values)) wxEls[name].textContent = text
    // The arrow points where the wind blows to (it is reported as "from").
    wxArrow.style.transform = `rotate(${wx.windDir}deg)`
    wxRain.hidden = !wx.rain
    wxDot.style.left = `${sparkX(time).toFixed(1)}%`
    wxDot.style.top = `${(sparkY(wx.track) * 5).toFixed(1)}%`
  }

  let shownLap = ''
  let shownStatus = -1
  gsap.set(raceBox, { autoAlpha: 0 })

  function setRace(raceLap, status) {
    setTyres(raceLap)
    setStewards(raceLap)
    setWeather(raceLap)
    // The grid has no lap number yet; after the flag it is the final lap.
    const total = race.positions_by_lap.VER.length
    const finished = raceLap >= total - 0.001
    // Lap N runs from N-1 (exclusive) to N laps completed, so the readout
    // agrees with chapter titles like "LAP 28." held at exactly 28.
    const lap = raceLap <= 0 ? 'Grid' : `Lap ${Math.min(Math.ceil(raceLap - 1e-4), total)} / ${total}`
    if (lap !== shownLap) lapEl.textContent = shownLap = lap
    const code = finished ? 'chequered' : status
    if (code !== shownStatus) {
      shownStatus = code
      flagEl.dataset.status = String(code)
      flagEl.textContent = finished ? 'Chequered' : FLAGS[status] ?? ''
    }
  }

  function show(index) {
    if (index === current) return
    const previous = blocks[current]
    current = index
    const block = blocks[index]

    if (previous) {
      for (const tween of previous.tweens) tween.kill()
      previous.tweens = []
      gsap.to(previous.root, {
        autoAlpha: 0,
        y: -18,
        duration: 0.35,
        ease: 'power2.in',
        overwrite: true,
      })
    }

    counter.textContent = String(index + 1).padStart(2, '0')
    // The race readout only means something once the race is on screen.
    gsap.to([raceBox, tyreBox, stewBox, speedBox, wxBox], {
      autoAlpha: index === 0 ? 0 : 1,
      duration: 0.5,
      delay: index === 0 ? 0 : 0.6,
      overwrite: true,
    })
    gsap.to(credit, {
      autoAlpha: index === 0 ? 0 : 1,
      duration: 0.5,
      delay: index === 0 ? 0 : 0.5,
      overwrite: true,
    })

    gsap.set(block.root, { y: 0 })
    gsap.to(block.root, { autoAlpha: 1, duration: 0.3, overwrite: true })
    if (index === 0) {
      // The hook must read complete on the very first frame: no scramble.
      for (const el of block.titleParts) el.textContent = block.chapter.title
      block.tweens = [
        gsap.fromTo(block.body, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }),
      ]
    } else {
      block.tweens = [
        scrambleTo(block.titleParts, block.chapter.title, { duration: 1.0, delay: 0.1 }),
        gsap.fromTo(
          block.body,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.45, ease: 'power2.out' }
        ),
      ]
    }
    block.body.textContent = block.chapter.text
  }

  gsap.set(
    blocks.map((b) => b.root),
    { autoAlpha: 0 }
  )

  /**
   * Chapters 5 and 6 keep their text in a safe zone that only holds while
   * the camera is parked. Once it starts travelling to the next shot the
   * track sweeps through that corner, so the text steps aside first.
   * @param {number} travel 0 = camera parked on this chapter's shot, 1 = arrived at the next.
   */
  const SAFE_ZONE_CHAPTERS = [4, 5]
  function setTravel(travel) {
    blocks.forEach((block, i) => {
      const fade =
        i === current && SAFE_ZONE_CHAPTERS.includes(i)
          ? 1 - Math.min(Math.max((travel - 0.02) / 0.12, 0), 1)
          : 1
      block.article.style.opacity = fade === 1 ? '' : String(fade)
    })
  }

  return { show, setRace, setSpeedo, setTravel }
}
