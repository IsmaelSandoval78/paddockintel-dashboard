/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL DASHBOARD — app.js
   F1 Standings + Prize Money + Race Countdown + Weather
   ═══════════════════════════════════════════════════════════ */

// ── Team Colors ─────────────────────────────────────────────
const TEAM_COLORS = {
  'Red Bull':       '#3671C6',
  'Ferrari':        '#E8002D',
  'Mercedes':       '#27F4D2',
  'McLaren':        '#FF8000',
  'Aston Martin':   '#229971',
  'Alpine':         '#FF87BC',
  'Williams':       '#64C4FF',
  'RB':             '#6692FF',
  'Kick Sauber':    '#52E252',
  'Haas':           '#B6BABD',
};

// ── Driver Salary Estimates (USD, 2025 season) ───────────────
// Based on public reporting — Autosport, RaceFans, Forbes
const DRIVER_SALARIES = {
  'Max Verstappen':           55000000,
  'Lewis Hamilton':           40000000,
  'Charles Leclerc':          30000000,
  'Lando Norris':             25000000,
  'George Russell':           15000000,
  'Carlos Sainz':             10000000,
  'Fernando Alonso':          15000000,
  'Lance Stroll':              7000000,
  'Oscar Piastri':             8000000,
  'Pierre Gasly':              6000000,
  'Esteban Ocon':              6000000,
  'Yuki Tsunoda':              3000000,
  'Valtteri Bottas':           2500000,
  'Zhou Guanyu':               2000000,
  'Nico Hulkenberg':           5000000,
  'Kevin Magnussen':           3000000,
  'Alexander Albon':           4000000,
  'Logan Sargeant':            1000000,
  'Daniel Ricciardo':          5000000,
  'Sergio Perez':             15000000,
  // 2026 drivers
  'Kimi Antonelli':            2000000,
  'Andrea Kimi Antonelli':     2000000,
  'Oliver Bearman':            1500000,
  'Isack Hadjar':              1500000,
  'Jack Doohan':               1500000,
  'Gabriel Bortoleto':         1500000,
  'Liam Lawson':               3000000,
  'Nyck de Vries':             2000000,
  'Franco Colapinto':          2500000,
  'Doohan':                    1500000,
};

// ── Prize Money Model ────────────────────────────────────────
// 2024 prize fund: ~$1.13B distributed to constructors.
// Simplified: Column 1 (equal split ~$60M each), Column 2 (finishing bonus by pts)
// Total pot modeled at ~$1.1B for estimation purposes
const TOTAL_PRIZE_FUND = 1100000000;

function estimateConstructorPrize(points, totalPoints, position) {
  // Position bonus (Columns 2 & 3 — approximate FOM formula)
  const positionBonuses = [
    68000000, 60000000, 54000000, 45000000, 38000000,
    30000000, 22000000, 15000000, 10000000,  8000000
  ];
  const baseEqual = 38000000; // Column 1 equal share
  const posBonus = positionBonuses[Math.min(position - 1, 9)] || 8000000;
  // Points proportion of the "performance" pool
  const performancePool = 200000000;
  const pointsShare = totalPoints > 0 ? (points / totalPoints) * performancePool : 0;
  return Math.round(baseEqual + posBonus + pointsShare);
}

// ── Ergast API ───────────────────────────────────────────────
const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1';
const SEASON = '2026';

async function fetchDriverStandings() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/driverStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
    return list || [];
  } catch (e) {
    console.error('Driver standings fetch failed:', e);
    return [];
  }
}

async function fetchConstructorStandings() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/constructorStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
    return list || [];
  } catch (e) {
    console.error('Constructor standings fetch failed:', e);
    return [];
  }
}

async function fetchNextRace() {
  try {
    const res = await fetch(`${ERGAST_BASE}/${SEASON}/next.json`);
    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races;
    return races?.[0] || null;
  } catch (e) {
    console.error('Next race fetch failed:', e);
    return null;
  }
}

// ── Weather ──────────────────────────────────────────────────
const OW_KEY = 'c354b5d6b364acf3e035bc28a8366d11';
async function fetchWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OW_KEY}&units=metric`);
    const data = await res.json();
    if (!res.ok) return null;
    return {
      temp:        Math.round(data.main.temp),
      feels_like:  Math.round(data.main.feels_like),
      humidity:    data.main.humidity,
      condition:   data.weather[0].main,
      description: data.weather[0].description,
      wind_speed:  Math.round(data.wind.speed * 3.6),
    };
  } catch (e) {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────
function formatMoney(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function flag(nat) {
  const FLAGS = {
    'British': '🇬🇧', 'Dutch': '🇳🇱', 'German': '🇩🇪', 'Spanish': '🇪🇸',
    'Finnish': '🇫🇮', 'French': '🇫🇷', 'Australian': '🇦🇺', 'Canadian': '🇨🇦',
    'Mexican': '🇲🇽', 'Monegasque': '🇲🇨', 'Japanese': '🇯🇵', 'Chinese': '🇨🇳',
    'Danish': '🇩🇰', 'Thai': '🇹🇭', 'American': '🇺🇸', 'Italian': '🇮🇹',
    'New Zealander': '🇳🇿', 'Argentine': '🇦🇷', 'Brazilian': '🇧🇷', 'Swiss': '🇨🇭',
    'Russian': '🇷🇺', 'Polish': '🇵🇱', 'Austrian': '🇦🇹', 'Belgian': '🇧🇪',
  };
  return FLAGS[nat] || '🏁';
}

function getTeamColor(constructorName) {
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (constructorName.includes(key) || key.includes(constructorName)) return color;
  }
  return '#8a9bb0';
}

function getSalary(firstName, lastName) {
  const full = `${firstName} ${lastName}`;
  // Direct match
  if (DRIVER_SALARIES[full] !== undefined) return DRIVER_SALARIES[full];
  // Partial match
  for (const [name, val] of Object.entries(DRIVER_SALARIES)) {
    if (name.includes(lastName) || full.includes(name.split(' ')[1])) return val;
  }
  return 2000000; // fallback
}

// Estimate prize share per driver: team prize * rough % based on #1/#2 status
function driverPrizeShare(driverIndex, teamPrize) {
  // P1 driver gets ~55%, P2 ~45% — very rough heuristic
  return Math.round(teamPrize * (driverIndex === 0 ? 0.55 : 0.45));
}

// ── Build Ticker ─────────────────────────────────────────────
function buildTicker(drivers) {
  if (!drivers.length) return;
  const content = drivers.slice(0, 8).map(d => {
    const name = `${d.Driver.givenName} ${d.Driver.familyName}`;
    return `<span class="ticker-item"><span class="pos-label">P${d.position}</span> <span class="highlight">${name}</span> · ${d.points} PTS</span>`;
  }).join('');
  // Duplicate for seamless loop
  document.getElementById('ticker-inner').innerHTML = content + content;
}

// ── Render Standings ─────────────────────────────────────────
function renderStandings(drivers, constructors) {
  const el = document.getElementById('standings-body');
  if (!el) return;

  // Build a map: driverID -> team color + constructor
  const teamMap = {};
  constructors.forEach(c => {
    // Ergast doesn't directly link drivers per constructor in standings,
    // so we map by constructor name matching
    teamMap[c.Constructor.name] = {
      color: getTeamColor(c.Constructor.name),
      prize: estimateConstructorPrize(
        parseInt(c.points),
        constructors.reduce((s, x) => s + parseInt(x.points), 0),
        parseInt(c.position)
      )
    };
  });

  el.innerHTML = drivers.map((d, i) => {
    const firstName = d.Driver.givenName;
    const lastName  = d.Driver.familyName;
    const nat       = d.Driver.nationality;
    const team      = d.Constructors?.[0]?.name || 'Unknown';
    const pts       = parseInt(d.points);
    const wins      = parseInt(d.wins);
    const pos       = parseInt(d.position);
    const color     = getTeamColor(team);
    const teamData  = teamMap[team] || { prize: 0 };
    const salary    = getSalary(firstName, lastName);
    const prize     = driverPrizeShare(i % 2, teamData.prize);

    const posClass = pos <= 3 ? `pos-${pos}` : '';

    return `
      <tr style="animation-delay: ${i * 0.04}s">
        <td class="pos-cell ${posClass}">${pos}</td>
        <td>
          <div class="driver-cell">
            <div class="team-color-bar" style="background:${color}; box-shadow: 0 0 6px ${color}44"></div>
            <div>
              <div class="driver-name">${firstName.charAt(0)}. ${lastName.toUpperCase()}</div>
              <span class="driver-team">${team}</span>
            </div>
          </div>
        </td>
        <td class="mono" style="text-align:center">${flag(nat)}</td>
        <td class="pts-cell">${pts}</td>
        <td class="wins-cell">${wins}</td>
        <td class="salary-cell">${formatMoney(salary)}/yr</td>
        <td class="prize-cell">~${formatMoney(prize)}</td>
      </tr>
    `;
  }).join('');

  buildTicker(drivers);
}

// ── Render Prize Money ───────────────────────────────────────
function renderPrizeMoney(constructors) {
  const el = document.getElementById('prize-grid');
  if (!el) return;

  const totalPts = constructors.reduce((s, c) => s + parseInt(c.points), 0);
  const maxPrize = estimateConstructorPrize(
    parseInt(constructors[0]?.points || 0), totalPts, 1
  );

  el.innerHTML = constructors.map((c, i) => {
    const name   = c.Constructor.name;
    const pts    = parseInt(c.points);
    const pos    = parseInt(c.position);
    const color  = getTeamColor(name);
    const prize  = estimateConstructorPrize(pts, totalPts, pos);
    const barPct = Math.round((prize / maxPrize) * 100);

    return `
      <div class="prize-card" style="animation-delay: ${i * 0.06}s">
        <div class="prize-pos">P${pos} Constructor</div>
        <div class="prize-team-name">
          <span class="prize-team-dot" style="background:${color}; box-shadow: 0 0 6px ${color}66"></span>
          ${name.toUpperCase()}
        </div>
        <div class="prize-pts mono">${pts} PTS</div>
        <div class="prize-bar-wrap">
          <div class="prize-bar" style="width: ${barPct}%; background: linear-gradient(90deg, ${color}, ${color}88)"></div>
        </div>
        <span class="prize-amount">~${formatMoney(prize)}</span>
        <span class="prize-label">Est. 2025 Prize Money</span>
      </div>
    `;
  }).join('');
}

// ── Countdown Logic ──────────────────────────────────────────
function updateCountdown(raceDate) {
  const now  = new Date();
  const diff = raceDate - now;

  if (diff <= 0) {
    document.getElementById('cdown-days').textContent  = '00';
    document.getElementById('cdown-hours').textContent = '00';
    document.getElementById('cdown-mins').textContent  = '00';
    document.getElementById('cdown-secs').textContent  = '00';
    return;
  }

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);

  document.getElementById('cdown-days').textContent  = String(days).padStart(2, '0');
  document.getElementById('cdown-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cdown-mins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('cdown-secs').textContent  = String(secs).padStart(2, '0');
}

// ── Render Race + Weather ────────────────────────────────────
async function renderRaceCountdown(race) {
  if (!race) {
    document.getElementById('race-name').textContent    = 'No upcoming race data';
    document.getElementById('race-circuit').textContent = '';
    return;
  }

  const raceName    = race.raceName;
  const circuit     = race.Circuit.circuitName;
  const locality    = race.Circuit.Location.locality;
  const country     = race.Circuit.Location.country;
  const lat         = race.Circuit.Location.lat;
  const lon         = race.Circuit.Location.long;
  const raceTime    = race.time ? race.time.replace(/Z$/i, '') : '14:00:00';
  const raceDate    = new Date(`${race.date}T${raceTime}Z`);

  document.getElementById('race-name').textContent    = raceName;
  document.getElementById('race-circuit').textContent = `${circuit} · ${locality}, ${country}`;
  document.getElementById('race-date-str').textContent = raceDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Start countdown
  updateCountdown(raceDate);
  setInterval(() => updateCountdown(raceDate), 1000);

  // Fetch weather
  const weather = await fetchWeather(lat, lon);
  const wPanel  = document.getElementById('weather-panel');

  if (weather && !weather.error) {
    wPanel.innerHTML = `
      <div class="weather-condition">${weather.condition}</div>
      <div class="weather-temp">${weather.temp}<span>°C</span></div>
      <div class="weather-details">
        <span>Feels like ${weather.feels_like}°C</span>
        <span>💧 ${weather.humidity}% humidity</span>
        <span>💨 ${weather.wind_speed} km/h</span>
      </div>
      <div class="weather-location">${locality} · Now</div>
    `;
  } else {
    wPanel.innerHTML = `
      <div class="weather-condition">Weather</div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--grey-2); margin-top: 8px;">
        Add OPENWEATHER_API_KEY<br>to Vercel env vars
      </div>
      <div class="weather-location">${locality}</div>
    `;
  }
}

// ── Update timestamp ─────────────────────────────────────────
function setTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) {
    el.textContent = `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC`;
  }
}

// ── Loading helpers ──────────────────────────────────────────
function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="loading-state"><div class="spinner"></div>Loading data…</div>`;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="error-state">⚠ ${msg}</div>`;
}

// ── Main Init ────────────────────────────────────────────────
async function init() {
  setTimestamp();
  showLoading('standings-wrap');
  showLoading('prize-grid');

  const [drivers, constructors, nextRace] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchNextRace(),
  ]);

  // Standings
  if (drivers.length) {
    document.getElementById('standings-wrap').innerHTML = `
      <div class="standings-table-wrap">
        <table class="standings-table">
          <thead>
            <tr>
              <th>POS</th>
              <th>Driver</th>
              <th style="text-align:center">NAT</th>
              <th>PTS</th>
              <th>WINS</th>
              <th>SALARY EST.</th>
              <th>PRIZE EST.</th>
            </tr>
          </thead>
          <tbody id="standings-body"></tbody>
        </table>
      </div>
    `;
    renderStandings(drivers, constructors);
  } else {
    showError('standings-wrap', 'Could not load driver standings. Ergast API may be unavailable.');
  }

  // Prize Money
  if (constructors.length) {
    renderPrizeMoney(constructors);
  } else {
    showError('prize-grid', 'Could not load constructor data.');
  }

  // Race Countdown + Weather
  await renderRaceCountdown(nextRace);
}

document.addEventListener('DOMContentLoaded', init);
