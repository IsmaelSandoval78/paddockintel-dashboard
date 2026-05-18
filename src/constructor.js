/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — constructor.js
   Constructor profile page

   ARCHITECTURE:
   ─ f1-constructors.js  →  F1_CONSTRUCTORS (source of truth)
   ─ f1-drivers.js       →  F1_DRIVERS (for driver lineup data)
   ─ constructor.js      →  renders everything

   Usage: constructor.html?id=mclaren
   ═══════════════════════════════════════════════════════════ */

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const SEASON  = '2026';

// ── 2026 race codes in order ─────────────────────────────────
const RACE_CODES_2026 = ['AUS','CHN','JPN','MIA','CAN','MON','BCN','AUT','GBR','BEL','HUN','NED','ITA','ESP','AZE','SIN','USA','MXC','SAP','LVG','QAT','ABU'];

// ── Livery palettes (verified 2026) ──────────────────────────
const LIVERY = {
  mclaren:      { primary: '#FF8000', secondary: '#2D2D2D', accent: '#47C7FC',
                  labels: ['Papaya Orange', 'Anthracite', 'Gulf Blue'] },
  mercedes:     { primary: '#00D2BE', secondary: '#000000', accent: '#C0C0C0',
                  labels: ['Petronas Teal', 'Black', 'Silver'] },
  ferrari:      { primary: '#DC0000', secondary: '#111111', accent: '#F7D117',
                  labels: ['Rosso Corsa', 'Nero', 'Giallo Modena'] },
  red_bull:     { primary: '#1E5BC6', secondary: '#DC052D', accent: '#F7C300',
                  labels: ['Royal Blue', 'Racing Red', 'Championship Gold'] },
  rb:           { primary: '#2647D8', secondary: '#FFFFFF', accent: '#E10600',
                  labels: ['Bull Blue', 'White', 'Racing Red'] },
  alpine:       { primary: '#0090FF', secondary: '#111111', accent: '#FF87BC',
                  labels: ['Alpine Blue', 'Black', 'Rose Pink'] },
  aston_martin: { primary: '#006F62', secondary: '#111111', accent: '#CEDC00',
                  labels: ['British Racing Green', 'Black', 'Lime'] },
  audi:         { primary: '#C00000', secondary: '#000000', accent: '#FFFFFF',
                  labels: ['Audi Red', 'Black', 'White'] },
  cadillac:     { primary: '#111111', secondary: '#FFFFFF', accent: '#C8102E',
                  labels: ['Noir', 'White', 'Cadillac Red'] },
  williams:     { primary: '#005AFF', secondary: '#041E42', accent: '#FFFFFF',
                  labels: ['Williams Blue', 'Navy', 'White'] },
  haas:         { primary: '#FFFFFF', secondary: '#000000', accent: '#E10600',
                  labels: ['White', 'Black', 'Scuderia Red'] },
};

// ── Helpers ──────────────────────────────────────────────────
function getConstructorId() {
  const p = new URLSearchParams(window.location.search);
  return p.get('id') || 'mercedes';
}

function setTitle(name) {
  document.title = `${name} — PaddockIntel`;
}

function formatMoney(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.55 ? '#111111' : '#ffffff';
}

// ── API ───────────────────────────────────────────────────────
async function fetchConstructorStanding(constructorRef) {
  try {
    const res  = await fetch(`${JOLPICA}/${SEASON}/constructors/${constructorRef}/constructorStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists;
    return list?.[list.length - 1]?.ConstructorStandings?.[0] || null;
  } catch { return null; }
}

async function fetchDriversForConstructor(constructorRef) {
  try {
    const res  = await fetch(`${JOLPICA}/${SEASON}/constructors/${constructorRef}/drivers.json`);
    const json = await res.json();
    return json?.MRData?.DriverTable?.Drivers || [];
  } catch { return []; }
}

async function fetchDriverStanding(driverRef) {
  try {
    const res  = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverRef}/driverStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists;
    return list?.[list.length - 1]?.DriverStandings?.[0] || null;
  } catch { return null; }
}

// ── Render Hero ───────────────────────────────────────────────
function renderHero(standing, constructorData) {
  const el = document.getElementById('hero-card');
  if (!constructorData) {
    el.innerHTML = `<div class="error-msg">Constructor not found.</div>`;
    return;
  }

  const name      = constructorData.name;
  const color     = constructorData.color;
  const base      = constructorData.base;
  const principal = constructorData.principal;
  const chassis   = constructorData.chassis;
  const engine    = constructorData.engine;
  const pts       = standing ? parseInt(standing.points) : 0;
  const pos       = standing ? parseInt(standing.position) : '—';
  const wins      = standing ? parseInt(standing.wins) : 0;
  const titles    = constructorData.totalWccTitles || 0;

  setTitle(name);

  // Abbreviation for badge (first 3 chars or custom)
  const abbrev = name.replace('Racing Bulls','RB').replace('Aston Martin','AM').substring(0,3).toUpperCase();

  el.innerHTML = `
    <div class="constructor-hero-layout">
      <div class="constructor-badge" style="background:${color};box-shadow:0 6px 28px ${color}55">
        ${abbrev}
      </div>
      <div>
        <div class="constructor-name" style="color:${color}">${name}</div>
        <div class="constructor-meta">
          <span>📍 ${base}</span>
          <span>👤 ${principal}</span>
        </div>
        <div class="hero-stats" style="margin-top:14px">
          <div class="hero-stat-item">
            <div class="hero-stat-val ${pos===1?'gold':''}">${pts}</div>
            <div class="hero-stat-label">Points</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-val">${wins}</div>
            <div class="hero-stat-label">Wins</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-val gold">${titles}</div>
            <div class="hero-stat-label">WCC Titles</div>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="pos-display">P<span class="pos-num">${pos}</span> WCC</div>
      </div>
    </div>

    <div class="chassis-card">
      <div class="chassis-item">
        <div class="chassis-item-label">Chassis</div>
        <div class="chassis-item-value">${chassis}</div>
      </div>
      <div class="chassis-item">
        <div class="chassis-item-label">Power Unit</div>
        <div class="chassis-item-value">${engine}</div>
      </div>
      <div class="chassis-item">
        <div class="chassis-item-label">Season</div>
        <div class="chassis-item-value">${SEASON}</div>
      </div>
      <div class="chassis-item">
        <div class="chassis-item-label">Position</div>
        <div class="chassis-item-value" style="color:${color}">P${pos} WCC</div>
      </div>
    </div>
  `;
}

// ── Render Livery ─────────────────────────────────────────────
function renderLivery(constructorRef, constructorData) {
  const section = document.getElementById('module-livery');
  const livery  = LIVERY[constructorRef];
  const color   = constructorData?.color || '#8e8e93';

  if (!livery) {
    section.innerHTML = `
      <div class="card-header">
        <div class="section-header">
          <h2 class="section-title">Livery Colors</h2>
          <span class="section-tag">2026</span>
        </div>
      </div>
      <div class="no-data">Livery data coming soon.</div>
    `;
    return;
  }

  const bars = [
    { hex: livery.primary,   label: livery.labels[0], tag: 'Primary'   },
    { hex: livery.secondary, label: livery.labels[1], tag: 'Secondary' },
    { hex: livery.accent,    label: livery.labels[2], tag: 'Accent'    },
  ].map((b, i) => {
    const text = contrastColor(b.hex);
    return `
      <div class="livery-bar" style="animation-delay:${i*0.1}s">
        <div class="livery-bar-label">${b.tag}</div>
        <div class="livery-bar-fill" style="background:${b.hex};color:${text}">
          ${b.hex.toUpperCase()}
          <span style="opacity:0.7;margin-left:10px;font-size:10px;font-weight:400">${b.label}</span>
        </div>
      </div>
    `;
  }).join('');

  section.innerHTML = `
    <div class="card-header">
      <div class="section-header">
        <h2 class="section-title">Livery Colors</h2>
        <span class="section-tag" style="color:${color};background:${color}18;border-color:${color}33">2026 Season</span>
      </div>
    </div>
    <div class="livery-section">
      <div class="livery-bars">${bars}</div>
    </div>
  `;
}

// ── Render Driver Lineup ──────────────────────────────────────
async function renderDrivers(constructorData) {
  const el = document.getElementById('drivers-body');

  const driverIds = constructorData?.drivers || [];
  if (!driverIds.length) {
    el.innerHTML = '<div class="no-data">No driver data available.</div>';
    return;
  }

  // Fetch standings for each driver in parallel
  const standings = await Promise.all(driverIds.map(id => fetchDriverStanding(id)));

  const chips = driverIds.map((id, i) => {
    const meta      = (typeof F1_DRIVERS !== 'undefined') ? F1_DRIVERS[id] : null;
    const standing  = standings[i];
    const pts       = standing ? parseInt(standing.points) : 0;
    const pos       = standing ? parseInt(standing.position) : '—';
    const num       = meta?.number || '?';
    const flag      = meta?.flag   || '🏁';
    const fullName  = meta?.fullName || id;
    const color     = constructorData.color;
    const firstName = fullName.split(' ')[0];
    const lastName  = fullName.split(' ').slice(1).join(' ');

    return `
      <a class="driver-chip" href="driver.html?id=${id}">
        <div class="driver-chip-num" style="color:${color}">${num}</div>
        <div class="driver-chip-info">
          <div class="driver-chip-name">${firstName} ${lastName}</div>
          <div class="driver-chip-pts">P${pos} · ${pts} pts</div>
        </div>
        <div class="driver-chip-flag">${flag}</div>
      </a>
    `;
  }).join('');

  el.innerHTML = `<div class="drivers-grid">${chips}</div>`;
}

// ── Render Sparkline ──────────────────────────────────────────
function renderSparkline(constructorData) {
  const el    = document.getElementById('sparkline-body');
  const pts   = constructorData?.ptsByRace || [];
  const color = constructorData?.color || '#8e8e93';

  if (!pts.length) {
    el.innerHTML = '<div class="no-data">No race data yet.</div>';
    return;
  }

  const max    = Math.max(...pts, 1);
  const codes  = RACE_CODES_2026.slice(0, pts.length);
  const total  = pts.reduce((a, b) => a + b, 0);
  const best   = Math.max(...pts);
  const bestRace = codes[pts.indexOf(best)];

  const bars = pts.map((p, i) => {
    const pct   = Math.round((p / max) * 100);
    const label = codes[i] || `R${i+1}`;
    return `
      <div class="spark-bar"
           style="height:${Math.max(pct,3)}%;background:${p===best?color:color+'88'}"
           data-pts="${p}pts · ${label}"
           title="${label}: ${p}pts">
      </div>
    `;
  }).join('');

  const labels = codes.map(c => `<div class="spark-label">${c}</div>`).join('');

  el.innerHTML = `
    <div class="sparkline-wrap">
      <div class="sparkline-bars">${bars}</div>
      <div class="spark-labels">${labels}</div>
      <div style="display:flex;gap:20px;margin-top:14px;padding-top:12px;border-top:1px solid var(--glass-border)">
        <div class="hero-stat-item">
          <div class="hero-stat-val" style="color:${color}">${total}</div>
          <div class="hero-stat-label">Total Points</div>
        </div>
        <div class="hero-stat-item">
          <div class="hero-stat-val">${best}</div>
          <div class="hero-stat-label">Best Race (${bestRace})</div>
        </div>
        <div class="hero-stat-item">
          <div class="hero-stat-val">${(total/pts.length).toFixed(1)}</div>
          <div class="hero-stat-label">Avg per Race</div>
        </div>
      </div>
    </div>
  `;
}

// ── Render WCC Titles ─────────────────────────────────────────
function renderWCC(constructorData) {
  const el     = document.getElementById('wcc-body');
  const titles = constructorData?.wccTitles || [];
  const color  = constructorData?.color || '#8e8e93';

  if (!titles.length) {
    el.innerHTML = `
      <div class="wcc-badges" style="padding-bottom:20px">
        <div class="wcc-badge wcc-zero">No WCC titles yet</div>
      </div>
    `;
    return;
  }

  const badges = titles.map(yr => `
    <div class="wcc-badge">👑 ${yr}</div>
  `).join('');

  el.innerHTML = `
    <div class="wcc-badges">
      ${badges}
    </div>
    <div style="padding:0 20px 16px;font-family:var(--font-mono);font-size:10px;color:var(--text-3)">
      ${titles.length} Constructor Championship${titles.length>1?'s':''} · Most recent: <strong style="color:${color}">${titles[titles.length-1]}</strong>
    </div>
  `;
}

// ── Render Season History ─────────────────────────────────────
function renderHistory(constructorData) {
  const el      = document.getElementById('history-body');
  const history = constructorData?.seasonHistory || {};
  const color   = constructorData?.color || '#8e8e93';

  if (!Object.keys(history).length) {
    el.innerHTML = '<div class="no-data">No historical data available.</div>';
    return;
  }

  const rows = Object.entries(history)
    .sort(([a],[b]) => parseInt(b) - parseInt(a))
    .map(([year, data]) => {
      const isChamp   = data.position === 1;
      const isPodium  = data.position <= 3;
      const isCurrent = parseInt(year) === parseInt(SEASON);
      const posClass  = isChamp ? 'pos-champion' : isPodium ? 'pos-podium' : '';
      const posLabel  = isChamp ? `🏆 P${data.position}` : `P${data.position}`;

      return `
        <tr class="${isCurrent?'current-season':''}">
          <td style="color:${isCurrent?color:'var(--text-2)'}">
            ${year}${isCurrent?' ★':''}
          </td>
          <td class="${posClass}">${posLabel}</td>
          <td style="color:${isChamp?'var(--gold)':'var(--text-2)'}">${data.points}</td>
          <td>${data.wins}</td>
        </tr>
      `;
    }).join('');

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table class="season-history-table">
        <thead>
          <tr>
            <th>Season</th>
            <th>Position</th>
            <th>Points</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ── MAIN ──────────────────────────────────────────────────────
async function init() {
  const constructorRef = getConstructorId();

  if (typeof F1_CONSTRUCTORS === 'undefined') {
    console.error('F1_CONSTRUCTORS not loaded — check script order in constructor.html');
    return;
  }

  const constructorData = F1_CONSTRUCTORS[constructorRef];

  // Render static sections immediately — no API needed
  renderLivery(constructorRef, constructorData);
  renderSparkline(constructorData);
  renderWCC(constructorData);
  renderHistory(constructorData);

  // Fetch live standing from Jolpica
  const ergastRef = constructorData?.ref || constructorRef;
  const standing  = await fetchConstructorStanding(ergastRef);

  renderHero(standing, constructorData);

  // Driver lineup — needs F1_DRIVERS + Jolpica
  await renderDrivers(constructorData);
}

document.addEventListener('DOMContentLoaded', init);
