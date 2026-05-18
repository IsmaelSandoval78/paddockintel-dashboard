/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL DASHBOARD — app.js v3
   World Map · Driver Standings · Constructor Standings · Circuit Intel
   ═══════════════════════════════════════════════════════════ */

const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1';
const SEASON = '2026';

// ── Team Colors ─────────────────────────────────────────────
const TEAM_COLORS = {
  'Red Bull':     '#3671C6',
  'Ferrari':      '#E8002D',
  'Mercedes':     '#27F4D2',
  'McLaren':      '#FF8000',
  'Aston Martin': '#229971',
  'Alpine':       '#FF87BC',
  'Williams':     '#64C4FF',
  'RB':           '#6692FF',
  'Kick Sauber':  '#52E252',
  'Haas':         '#B6BABD',
};

// ── Driver Salary Estimates ──────────────────────────────────
const DRIVER_SALARIES = {
  'Max Verstappen': 55000000, 'Lewis Hamilton': 40000000,
  'Charles Leclerc': 30000000, 'Lando Norris': 25000000,
  'George Russell': 15000000, 'Carlos Sainz': 10000000,
  'Fernando Alonso': 15000000, 'Lance Stroll': 7000000,
  'Oscar Piastri': 8000000, 'Pierre Gasly': 6000000,
  'Esteban Ocon': 6000000, 'Yuki Tsunoda': 3000000,
  'Valtteri Bottas': 2500000, 'Zhou Guanyu': 2000000,
  'Nico Hulkenberg': 5000000, 'Kevin Magnussen': 3000000,
  'Alexander Albon': 4000000, 'Logan Sargeant': 1000000,
  'Daniel Ricciardo': 5000000, 'Sergio Perez': 15000000,
  'Kimi Antonelli': 2000000, 'Andrea Kimi Antonelli': 2000000,
  'Oliver Bearman': 1500000, 'Isack Hadjar': 1500000,
  'Jack Doohan': 1500000, 'Gabriel Bortoleto': 1500000,
  'Liam Lawson': 3000000, 'Franco Colapinto': 2500000,
  'Doohan': 1500000,
};

// ── Circuit Attendance Estimates (3-day weekend) ─────────────
const CIRCUIT_ATTENDANCE = {
  bahrain:       '~80,000',  jeddah:        '~60,000',
  albert_park:   '~280,000', suzuka:        '~300,000',
  shanghai:      '~200,000', miami:         '~275,000',
  imola:         '~180,000', monaco:        '~200,000',
  villeneuve:    '~300,000', catalunya:     '~300,000',
  red_bull_ring: '~300,000', silverstone:   '~480,000',
  hungaroring:   '~200,000', spa:           '~350,000',
  zandvoort:     '~105,000', monza:         '~160,000',
  baku:          '~80,000',  marina_bay:    '~250,000',
  americas:      '~440,000', rodriguez:     '~400,000',
  interlagos:    '~280,000', vegas:         '~315,000',
  losail:        '~80,000',  yas_marina:    '~95,000',
};

// ── Helpers ──────────────────────────────────────────────────
function formatMoney(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function flag(nat) {
  const FLAGS = {
    'British':'🇬🇧','Dutch':'🇳🇱','German':'🇩🇪','Spanish':'🇪🇸',
    'Finnish':'🇫🇮','French':'🇫🇷','Australian':'🇦🇺','Canadian':'🇨🇦',
    'Mexican':'🇲🇽','Monegasque':'🇲🇨','Japanese':'🇯🇵','Chinese':'🇨🇳',
    'Danish':'🇩🇰','Thai':'🇹🇭','American':'🇺🇸','Italian':'🇮🇹',
    'New Zealander':'🇳🇿','Argentine':'🇦🇷','Brazilian':'🇧🇷',
    'Swiss':'🇨🇭','Russian':'🇷🇺','Polish':'🇵🇱','Austrian':'🇦🇹','Belgian':'🇧🇪',
  };
  return FLAGS[nat] || '🏁';
}

function getTeamColor(name) {
  for (const [k, c] of Object.entries(TEAM_COLORS)) {
    if (name && (name.includes(k) || k.includes(name))) return c;
  }
  return '#8a9bb0';
}

function getSalary(first, last) {
  const full = `${first} ${last}`;
  if (DRIVER_SALARIES[full] !== undefined) return DRIVER_SALARIES[full];
  for (const [n, v] of Object.entries(DRIVER_SALARIES)) {
    if (n.includes(last)) return v;
  }
  return 2000000;
}

function raceIsPast(race) {
  const t = race.time ? race.time.replace(/Z$/i, '') : '14:00:00';
  return new Date(`${race.date}T${t}Z`) < new Date();
}

function formatRaceDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── API Fetches ───────────────────────────────────────────────
async function fetchAllRaces() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}.json?limit=30`);
    const json = await res.json();
    return json?.MRData?.RaceTable?.Races || [];
  } catch { return []; }
}

async function fetchDriverStandings() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/driverStandings.json`);
    const json = await res.json();
    return json?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  } catch { return []; }
}

async function fetchConstructorStandings() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/constructorStandings.json`);
    const json = await res.json();
    return json?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
  } catch { return []; }
}

async function fetchNextRace() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/next.json`);
    const json = await res.json();
    return json?.MRData?.RaceTable?.Races?.[0] || null;
  } catch { return null; }
}

async function fetchCircuitHistory(circuitId) {
  try {
    // Get race winners at this circuit (position 1) across all seasons
    const res = await fetch(`${ERGAST_BASE}/circuits/${circuitId}/results/1.json?limit=50`);
    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races || [];
    return races.slice(-5).reverse(); // last 5, most recent first
  } catch { return []; }
}

async function fetchWeather(lat, lon) {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    try {
      const KEY = 'c354b5d6b364acf3e035bc28a8366d11';
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric`
      );
      const d = await res.json();
      if (!res.ok) return null;
      return {
        temp:        Math.round(d.main.temp),
        feels_like:  Math.round(d.main.feels_like),
        humidity:    d.main.humidity,
        condition:   d.weather[0].main,
        description: d.weather[0].description,
        wind_speed:  Math.round(d.wind.speed * 3.6),
      };
    } catch { return null; }
  }
}

// ── Map ───────────────────────────────────────────────────────
let map;

function initMap() {
  map = L.map('world-map', {
    center: [25, 15],
    zoom: 2,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    minZoom: 1,
    maxZoom: 8,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);
}

function addCircuitMarkers(races, nextRound) {
  races.forEach(race => {
    const lat = parseFloat(race.Circuit.Location.lat);
    const lon = parseFloat(race.Circuit.Location.long);
    const isPast = raceIsPast(race);
    const isNext = nextRound && race.round === nextRound;
    const status = isNext ? 'next' : isPast ? 'done' : 'upcoming';

    const icon = L.divIcon({
      className: '',
      html: `<div class="circ-pin circ-${status}" title="Round ${race.round}: ${race.raceName}"><span>${race.round}</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      tooltipAnchor: [13, -14],
    });

    const dotColor = isNext ? '#e8aa00' : isPast ? '#8e8e93' : '#e10600';

    L.marker([lat, lon], { icon })
      .addTo(map)
      .bindTooltip(
        `<div style="font-weight:700">Round ${race.round} — ${race.raceName}</div>` +
        `<div style="opacity:.75">${race.Circuit.circuitName}</div>` +
        `<div style="opacity:.65">${race.Circuit.Location.locality}, ${race.Circuit.Location.country}</div>` +
        `<div style="color:${dotColor};margin-top:2px">${formatRaceDate(race.date)}${isNext ? ' · Next Race 🔴' : isPast ? ' · Completed' : ''}</div>`,
        { direction: 'top', offset: [0, -4], className: 'circuit-tooltip' }
      )
      .on('click', () => openCircuitPanel(race));
  });
}

// ── Circuit Panel ─────────────────────────────────────────────
function openCircuitPanel(race) {
  document.getElementById('standings-panel').style.display = 'none';
  const panel = document.getElementById('circuit-panel');
  panel.style.display = 'block';

  const isPast = raceIsPast(race);
  const statusLabel = isPast ? '✓ Completed' : '⏳ Upcoming';
  const statusClass = isPast ? 'done' : 'upcoming';
  const attendance = CIRCUIT_ATTENDANCE[race.Circuit.circuitId] || 'N/A';

  document.getElementById('circuit-panel-inner').innerHTML = `
    <div class="cp-header">
      <button class="cp-back" onclick="closeCircuitPanel()">← Standings</button>
      <span class="section-tag">Round ${race.round}</span>
    </div>
    <div class="cp-race-name">${race.raceName}</div>
    <div class="cp-circuit-name">${race.Circuit.circuitName}</div>
    <div class="cp-location">${race.Circuit.Location.locality}, ${race.Circuit.Location.country}</div>
    <div class="cp-meta-row">
      <span class="cp-chip">📅 ${formatRaceDate(race.date)}</span>
      <span class="cp-chip cp-chip-${statusClass}">${statusLabel}</span>
    </div>
    <div class="cp-meta-row">
      <span class="cp-chip">🏟️ Attendance: ${attendance}</span>
    </div>

    <div class="cp-divider"></div>
    <div class="cp-section-label">Last 5 Champions at this circuit</div>
    <div id="cp-champions">
      <div class="loading-state" style="padding:16px 14px"><div class="spinner"></div>Loading history…</div>
    </div>

    <div class="cp-divider"></div>
    <div class="cp-section-label">Circuit Weather — Live</div>
    <div id="cp-weather">
      <div class="loading-state" style="padding:14px"><div class="spinner"></div>Loading weather…</div>
    </div>
  `;

  const lat = race.Circuit.Location.lat;
  const lon = race.Circuit.Location.long;

  Promise.all([
    fetchCircuitHistory(race.Circuit.circuitId),
    fetchWeather(lat, lon),
  ]).then(([history, weather]) => {
    renderChampions(history);
    renderCircuitWeather(weather, race.Circuit.Location.locality);
  });
}

function closeCircuitPanel() {
  document.getElementById('circuit-panel').style.display = 'none';
  document.getElementById('standings-panel').style.display = '';
}

function renderChampions(history) {
  const el = document.getElementById('cp-champions');
  if (!el) return;

  if (!history.length) {
    el.innerHTML = `<div class="cp-empty">No historical data available</div>`;
    return;
  }

  let fastestLap = null;

  const rows = history.map(race => {
    const winner = race.Results?.[0];
    if (!winner) return '';

    if (!fastestLap) {
      const fl = race.Results?.find(r => r.FastestLap?.rank === '1');
      if (fl?.FastestLap?.Time?.time) {
        fastestLap = {
          season:      race.season,
          driver:      `${fl.Driver.givenName.charAt(0)}. ${fl.Driver.familyName}`,
          time:        fl.FastestLap.Time.time,
          constructor: fl.Constructor?.name || '—',
        };
      }
    }

    const color = getTeamColor(winner.Constructor?.name || '');
    return `
      <div class="cp-champion-row">
        <span class="cp-champ-year">${race.season}</span>
        <span class="cp-champ-bar" style="background:${color}"></span>
        <span class="cp-champ-name">${winner.Driver.givenName.charAt(0)}. ${winner.Driver.familyName.toUpperCase()}</span>
        <span class="cp-champ-team">${winner.Constructor?.name || '—'}</span>
      </div>
    `;
  }).join('');

  let flHtml = '';
  if (fastestLap) {
    flHtml = `
      <div class="cp-divider"></div>
      <div class="cp-section-label">Fastest Lap (${fastestLap.season})</div>
      <div class="cp-fl-row">
        <span class="cp-fl-driver">${fastestLap.driver}</span>
        <span class="cp-fl-time">${fastestLap.time}</span>
      </div>
      <div class="cp-fl-team">${fastestLap.constructor}</div>
    `;
  }

  el.innerHTML = (rows || `<div class="cp-empty">No winner data found</div>`) + flHtml;
}

function renderCircuitWeather(weather, locality) {
  const el = document.getElementById('cp-weather');
  if (!el) return;
  if (!weather) {
    el.innerHTML = `<div class="cp-empty" style="padding:8px 14px 14px">Weather unavailable — check API key</div>`;
    return;
  }
  el.innerHTML = `
    <div class="cp-weather">
      <div class="cp-weather-main">
        <span class="cp-weather-temp">${weather.temp}°C</span>
        <span class="cp-weather-cond">${weather.condition}</span>
      </div>
      <div class="cp-weather-detail">
        💧 ${weather.humidity}% · 💨 ${weather.wind_speed} km/h · Feels ${weather.feels_like}°C
      </div>
      <div class="cp-weather-loc">${locality} · Now</div>
    </div>
  `;
}

// ── Sidebar: Top 10 Drivers ───────────────────────────────────
function renderSidebarDrivers(drivers) {
  const el = document.getElementById('sidebar-drivers');
  if (!el || !drivers.length) return;

  el.innerHTML = drivers.map(d => {
    const team  = d.Constructors?.[0]?.name || '—';
    const color = getTeamColor(team);
    const pos   = parseInt(d.position);
    const posClass = pos <= 3 ? `pos-${pos}` : '';

    return `
      <div class="sb-driver-row" onclick="window.location.href='driver.html?id=${d.Driver.driverId}'" title="View ${d.Driver.givenName} ${d.Driver.familyName} profile">
        <span class="sb-pos ${posClass}">${pos}</span>
        <span class="sb-color-bar" style="background:${color};box-shadow:0 0 4px ${color}55"></span>
        <div class="sb-info">
          <span class="sb-name">${d.Driver.givenName.charAt(0)}. ${d.Driver.familyName.toUpperCase()}</span>
          <span class="sb-sub">${team}</span>
        </div>
        <span class="sb-pts">${d.points}</span>
      </div>
    `;
  }).join('');
}

// ── Sidebar: Top 5 Constructors ───────────────────────────────
function renderSidebarConstructors(constructors) {
  const el = document.getElementById('sidebar-constructors');
  if (!el || !constructors.length) return;

  const maxPts = parseInt(constructors[0]?.points || 1);

  el.innerHTML = constructors.map(c => {
    const name   = c.Constructor.name;
    const pts    = parseInt(c.points);
    const pos    = parseInt(c.position);
    const color  = getTeamColor(name);
    const barW   = Math.round((pts / maxPts) * 100);
    const posClass = pos <= 3 ? `pos-${pos}` : '';

    return `
      <div class="sb-constructor-row">
        <span class="sb-pos ${posClass}">${pos}</span>
        <span class="sb-color-dot" style="background:${color};box-shadow:0 0 6px ${color}66"></span>
        <div class="sb-info">
          <span class="sb-name">${name.toUpperCase()}</span>
          <div class="sb-bar-wrap"><div class="sb-bar" style="width:${barW}%;background:${color}99"></div></div>
        </div>
        <span class="sb-pts">${pts}</span>
      </div>
    `;
  }).join('');
}

// ── Ticker ────────────────────────────────────────────────────
function buildTicker(drivers) {
  if (!drivers.length) return;
  const content = drivers.slice(0, 10).map(d =>
    `<span class="ticker-item"><span class="pos-label">P${d.position}</span> <span class="highlight">${d.Driver.givenName} ${d.Driver.familyName}</span> · ${d.points} PTS · ${d.Constructors?.[0]?.name || ''}</span>`
  ).join('');
  document.getElementById('ticker-inner').innerHTML = content + content;
}

function setTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC`;
}

// ── Main Init ─────────────────────────────────────────────────
async function init() {
  initMap();
  setTimestamp();

  const [allRaces, drivers, constructors, nextRace] = await Promise.all([
    fetchAllRaces(),
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchNextRace(),
  ]);

  if (allRaces.length) {
    addCircuitMarkers(allRaces, nextRace?.round);
    const done  = allRaces.filter(r => raceIsPast(r)).length;
    const total = allRaces.length;
    const roundsTag  = document.getElementById('map-rounds-tag');
    const statusTag  = document.getElementById('map-status-tag');
    if (roundsTag) roundsTag.textContent = `${total} Rounds`;
    if (statusTag) {
      if (nextRace) {
        statusTag.textContent = `Next: ${nextRace.raceName}`;
        statusTag.className   = 'section-tag gold';
      } else {
        statusTag.textContent = `${done}/${total} Complete`;
        statusTag.className   = 'section-tag green';
      }
    }
  }

  renderSidebarDrivers(drivers.slice(0, 10));
  renderSidebarConstructors(constructors.slice(0, 5));
  buildTicker(drivers);
}

document.addEventListener('DOMContentLoaded', init);
