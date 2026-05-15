/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — driver.js
   Driver profile: Jolpica results + OpenF1 pit/lap data
   Usage: driver.html?id=antonelli  (driverId from Jolpica)
   ═══════════════════════════════════════════════════════════ */

const JOLPICA   = 'https://api.jolpi.ca/ergast/f1';
const OPENF1    = 'https://api.openf1.org/v1';
const SEASON    = '2026';

// ── Static driver data ───────────────────────────────────────
const DRIVER_META = {
  'antonelli':  { salary: 2000000,  number: 12,  flag: '🇮🇹', fullName: 'Andrea Kimi Antonelli' },
  'russell':    { salary: 15000000, number: 63,  flag: '🇬🇧', fullName: 'George Russell' },
  'leclerc':    { salary: 30000000, number: 16,  flag: '🇲🇨', fullName: 'Charles Leclerc' },
  'hamilton':   { salary: 40000000, number: 44,  flag: '🇬🇧', fullName: 'Lewis Hamilton' },
  'norris':     { salary: 25000000, number: 4,   flag: '🇬🇧', fullName: 'Lando Norris' },
  'piastri':    { salary: 8000000,  number: 81,  flag: '🇦🇺', fullName: 'Oscar Piastri' },
  'verstappen': { salary: 55000000, number: 1,   flag: '🇳🇱', fullName: 'Max Verstappen' },
  'bearman':    { salary: 1500000,  number: 87,  flag: '🇬🇧', fullName: 'Oliver Bearman' },
  'gasly':      { salary: 6000000,  number: 10,  flag: '🇫🇷', fullName: 'Pierre Gasly' },
  'lawson':     { salary: 3000000,  number: 30,  flag: '🇳🇿', fullName: 'Liam Lawson' },
  'colapinto':  { salary: 2500000,  number: 43,  flag: '🇦🇷', fullName: 'Franco Colapinto' },
  'hadjar':     { salary: 1500000,  number: 22,  flag: '🇫🇷', fullName: 'Isack Hadjar' },
  'sainz':      { salary: 10000000, number: 55,  flag: '🇪🇸', fullName: 'Carlos Sainz' },
  'albon':      { salary: 4000000,  number: 23,  flag: '🇹🇭', fullName: 'Alexander Albon' },
  'bortoleto':  { salary: 1500000,  number: 5,   flag: '🇧🇷', fullName: 'Gabriel Bortoleto' },
  'hulkenberg': { salary: 5000000,  number: 27,  flag: '🇩🇪', fullName: 'Nico Hülkenberg' },
  'ocon':       { salary: 6000000,  number: 31,  flag: '🇫🇷', fullName: 'Esteban Ocon' },
  'alonso':     { salary: 15000000, number: 14,  flag: '🇪🇸', fullName: 'Fernando Alonso' },
  'stroll':     { salary: 7000000,  number: 18,  flag: '🇨🇦', fullName: 'Lance Stroll' },
  'bottas':     { salary: 2500000,  number: 77,  flag: '🇫🇮', fullName: 'Valtteri Bottas' },
  'perez':      { salary: 15000000, number: 11,  flag: '🇲🇽', fullName: 'Sergio Pérez' },
  'lindblad':   { salary: 1500000,  number: 6,   flag: '🇬🇧', fullName: 'Arvid Lindblad' },
  'doohan':     { salary: 1500000,  number: 7,   flag: '🇦🇺', fullName: 'Jack Doohan' },
};

const TEAM_COLORS = {
  'Mercedes':     '#27F4D2',
  'Ferrari':      '#E8002D',
  'McLaren':      '#FF8000',
  'Red Bull':     '#3671C6',
  'Alpine':       '#FF87BC',
  'Haas':         '#B6BABD',
  'RB':           '#6692FF',
  'Williams':     '#64C4FF',
  'Aston Martin': '#229971',
  'Audi':         '#52E252',
  'Cadillac':     '#C8102E',
};

// ── Helpers ──────────────────────────────────────────────────
function getTeamColor(name) {
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name && name.includes(k)) return v;
  }
  return '#8e8e93';
}

function formatMoney(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function formatLapTime(ms) {
  if (!ms || ms <= 0) return '—';
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const mil  = Math.floor((ms % 1000) / 10);
  return `${mins}:${String(secs).padStart(2,'0')}.${String(mil).padStart(2,'0')}`;
}

function parseLapDuration(d) {
  if (!d) return null;
  if (typeof d === 'number') return d * 1000;
  const parts = String(d).split(':');
  if (parts.length === 2) return (parseFloat(parts[0]) * 60 + parseFloat(parts[1])) * 1000;
  return parseFloat(d) * 1000;
}

function getDriverId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || 'antonelli';
}

function setTitle(name) {
  document.title = `${name} — PaddockIntel`;
}

// ── API calls ────────────────────────────────────────────────
async function fetchDriverStanding(driverId) {
  try {
    const res = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/driverStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists;
    return list?.[list.length - 1]?.DriverStandings?.[0] || null;
  } catch { return null; }
}

async function fetchDriverResults(driverId) {
  try {
    const res = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/results.json?limit=30`);
    const json = await res.json();
    return json?.MRData?.RaceTable?.Races || [];
  } catch { return []; }
}

async function fetchLastRaceSession(driverId) {
  // Get the last race meeting key from Jolpica, then find it in OpenF1
  try {
    const res = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/results.json?limit=1&offset=0`);
    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races || [];
    // Get the most recent race by fetching all and taking last
    const res2 = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/results.json?limit=30`);
    const json2 = await res2.json();
    const all = json2?.MRData?.RaceTable?.Races || [];
    return all[all.length - 1] || null;
  } catch { return null; }
}

async function fetchOpenF1Session(year, country, locality) {
  try {
    // Try country first
    let res = await fetch(`${OPENF1}/sessions?year=${year}&country_name=${encodeURIComponent(country)}&session_type=Race`);
    let data = await res.json();
    if (data?.length) return data[0];
    // Fallback: try previous year (OpenF1 may lag)
    res = await fetch(`${OPENF1}/sessions?year=${year - 1}&country_name=${encodeURIComponent(country)}&session_type=Race`);
    data = await res.json();
    if (data?.length) return data[0];
    // Fallback: try location name
    if (locality) {
      res = await fetch(`${OPENF1}/sessions?year=${year}&location=${encodeURIComponent(locality)}&session_type=Race`);
      data = await res.json();
      if (data?.length) return data[0];
    }
    return null;
  } catch { return null; }
}

async function fetchPitStops(sessionKey, driverNumber) {
  try {
    const res = await fetch(`${OPENF1}/pit?session_key=${sessionKey}&driver_number=${driverNumber}`);
    return await res.json();
  } catch { return []; }
}

async function fetchStints(sessionKey, driverNumber) {
  try {
    const res = await fetch(`${OPENF1}/stints?session_key=${sessionKey}&driver_number=${driverNumber}`);
    return await res.json();
  } catch { return []; }
}

async function fetchLaps(sessionKey, driverNumber) {
  try {
    const res = await fetch(`${OPENF1}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`);
    return await res.json();
  } catch { return []; }
}

// ── Render Hero ──────────────────────────────────────────────
function renderHero(standing, driverId, meta) {
  const el = document.getElementById('hero-card');
  if (!standing) {
    el.innerHTML = `<div class="error-msg">Driver not found for 2026 season.</div>`;
    return;
  }

  const firstName = standing.Driver.givenName;
  const lastName  = standing.Driver.familyName;
  const fullName  = `${firstName} ${lastName}`;
  const team      = standing.Constructors?.[0]?.name || 'Unknown';
  const pts       = parseInt(standing.points);
  const pos       = parseInt(standing.position);
  const wins      = parseInt(standing.wins);
  const color     = getTeamColor(team);
  const salary    = meta?.salary || 2000000;
  const number    = meta?.number || '?';
  const flag      = meta?.flag || '🏁';

  // Value index: points per $1M salary
  const valueIdx = salary > 0 ? (pts / (salary / 1000000)).toFixed(1) : '—';

  setTitle(fullName);

  const posClass = pos === 1 ? 'gold' : pos <= 3 ? 'gold' : '';

  el.innerHTML = `
    <div class="hero-layout">
      <div class="driver-number-badge" style="background: ${color}; box-shadow: 0 4px 20px ${color}44">
        ${number}
      </div>
      <div>
        <div class="hero-name">${firstName.toUpperCase()} ${lastName.toUpperCase()}</div>
        <div class="hero-team">
          <span class="team-dot" style="background:${color}"></span>
          ${team} · 2026
        </div>
        <div class="hero-stats">
          <div class="hero-stat-item">
            <div class="hero-stat-val ${pos===1?'gold':''}">${pts}</div>
            <div class="hero-stat-label">Points</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-val">${wins}</div>
            <div class="hero-stat-label">Wins</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-val green">${formatMoney(salary)}</div>
            <div class="hero-stat-label">Salary Est.</div>
          </div>
          <div class="hero-stat-item">
            <div class="hero-stat-val gold">${valueIdx}</div>
            <div class="hero-stat-label">Pts per $1M</div>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="nationality-display">${flag}</div>
        <div class="pos-display">P<span class="pos-num">${pos}</span> WDC</div>
      </div>
    </div>
  `;

  // Value callout
  const callout = document.getElementById('value-callout');
  const valueText = document.getElementById('value-text');
  if (pts > 0) {
    callout.style.display = 'block';
    const costPerPoint = salary > 0 ? Math.round(salary / pts) : 0;
    valueText.innerHTML = `
      <strong>${firstName} ${lastName}</strong> is earning ${formatMoney(salary)}/yr and has scored <strong>${pts} points</strong> — 
      that's <strong>${formatMoney(costPerPoint)} per point</strong> and a Value Index of <strong>${valueIdx} pts/$1M</strong>. 
      ${valueIdx > 20 ? '🔥 One of the best value contracts on the grid.' : valueIdx > 10 ? '✅ Solid value for the team.' : '⚠️ High cost relative to points scored so far.'}
    `;
  }
}

// ── Render Results ───────────────────────────────────────────
function renderResults(races) {
  const el = document.getElementById('results-body');
  if (!races.length) {
    el.innerHTML = `<div class="no-data">No race results yet for 2026.</div>`;
    return;
  }

  const rows = [...races].reverse().map((race, i) => {
    const result  = race.Results?.[0];
    const pos     = result?.position || '—';
    const pts     = parseFloat(result?.points || 0);
    const status  = result?.status || '';
    const isDNF   = status !== 'Finished' && !status.includes('Lap');
    const date    = new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const posNum  = parseInt(pos);
    const posClass = posNum === 1 ? 'p1' : posNum === 2 ? 'p2' : posNum === 3 ? 'p3' : '';
    const posBadge = isDNF
      ? `<span class="pos-badge dnf">DNF</span>`
      : `<span class="pos-badge ${posClass}">${pos}</span>`;

    return `
      <tr style="animation-delay:${i*0.04}s">
        <td>
          <div class="gp-name">${race.raceName.replace(' Grand Prix','').replace(' GP','')}</div>
          <div class="gp-date">${date}</div>
        </td>
        <td>${posBadge}</td>
        <td class="pts-col ${pts===0?'zero':''}">${pts > 0 ? `+${pts}` : '0'}</td>
      </tr>
    `;
  }).join('');

  el.innerHTML = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Grand Prix</th>
          <th>Pos</th>
          <th style="text-align:right">PTS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── Render Pit Stops ─────────────────────────────────────────
function renderPits(pits, stints, raceName) {
  const el = document.getElementById('pits-body');

  if (!pits.length) {
    el.innerHTML = `<div class="no-data">No pit stop data available for last race via OpenF1.</div>`;
    return;
  }

  const maxDur = Math.max(...pits.map(p => p.pit_duration || 0));
  const avgDur = pits.reduce((s, p) => s + (p.pit_duration || 0), 0) / pits.length;

  // Build compound map from stints
  const compoundMap = {};
  stints.forEach(s => { compoundMap[s.lap_start] = s.compound; });

  const pitRows = pits.map((pit, i) => {
    const dur     = pit.pit_duration || 0;
    const stop    = pit.stop_duration || dur;
    const barPct  = maxDur > 0 ? Math.round((dur / maxDur) * 100) : 0;
    const isFast  = dur < avgDur;

    // Find compound for this stint
    const stintAfter = stints.find(s => s.lap_start > pit.lap_number);
    const compound   = stintAfter?.compound || '—';
    const compClass  = compound === 'SOFT' ? 'compound-soft'
                     : compound === 'MEDIUM' ? 'compound-medium'
                     : compound === 'HARD' ? 'compound-hard'
                     : compound === 'INTERMEDIATE' ? 'compound-inter'
                     : compound === 'WET' ? 'compound-wet' : '';

    const fastClass = isFast ? 'fast' : '';
    return `
      <div class="pit-item">
        <div class="pit-lap">LAP ${pit.lap_number}</div>
        <div class="pit-compound ${compClass}">${compound.charAt(0)}${compound.slice(1).toLowerCase()}</div>
        <div class="pit-bar-wrap"><div class="pit-bar-fill" style="width:${barPct}%"></div></div>
        <div>
          <div class="pit-duration ${fastClass}">${dur.toFixed(1)}s</div>
          <div class="pit-label">Stop: ${stop.toFixed(1)}s</div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div style="padding: 8px 20px 0; font-family: var(--font-mono); font-size: 9px; color: var(--text-3); letter-spacing: 0.08em; text-transform: uppercase;">
      ${raceName || 'Last Race'} · Via OpenF1
    </div>
    <div class="pit-list">${pitRows}</div>
    <div class="pit-summary">
      <div class="pit-sum-item">
        <div class="pit-sum-val">${pits.length}</div>
        <div class="pit-sum-label">Pit Stops</div>
      </div>
      <div class="pit-sum-item">
        <div class="pit-sum-val">${avgDur.toFixed(1)}s</div>
        <div class="pit-sum-label">Avg Duration</div>
      </div>
      <div class="pit-sum-item">
        <div class="pit-sum-val">${Math.min(...pits.map(p=>p.pit_duration||99)).toFixed(1)}s</div>
        <div class="pit-sum-label">Best Stop</div>
      </div>
    </div>
  `;
}

// ── Render Lap Times ─────────────────────────────────────────
function renderLaps(laps, pits, teamColor) {
  const el = document.getElementById('laps-body');
  if (!laps.length) {
    el.innerHTML = `<div class="no-data">No lap time data available via OpenF1.</div>`;
    return;
  }

  const durations = laps
    .map(l => parseLapDuration(l.lap_duration))
    .filter(d => d && d > 60000 && d < 200000);

  if (!durations.length) {
    el.innerHTML = `<div class="no-data">Lap time data unavailable.</div>`;
    return;
  }

  const minTime  = Math.min(...durations);
  const maxTime  = Math.max(...durations);
  const pitLaps  = new Set(pits.map(p => p.lap_number));
  const fastestLap = laps.find(l => parseLapDuration(l.lap_duration) === minTime);

  const rows = laps.map(l => {
    const ms = parseLapDuration(l.lap_duration);
    if (!ms || ms < 60000 || ms > 200000) return '';

    const isPit     = pitLaps.has(l.lap_number);
    const isFastest = ms === minTime;
    const barPct    = maxTime > minTime
      ? Math.round(100 - ((ms - minTime) / (maxTime - minTime)) * 80)
      : 80;
    const barColor  = isFastest ? '#34c759' : isPit ? '#e10600' : teamColor;
    const timeClass = isFastest ? 'fastest' : isPit ? 'pit-lap' : '';

    return `
      <div class="lap-row">
        <div class="lap-num">${l.lap_number}</div>
        <div class="lap-bar-wrap">
          <div class="lap-bar-fill" style="width:${barPct}%; background:${barColor}; opacity:${isFastest?1:0.6}"></div>
        </div>
        <div class="lap-time-val ${timeClass}">${formatLapTime(ms)}${isPit ? ' 🔧' : ''}</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="lap-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#34c759"></div>Fastest lap</div>
      <div class="legend-item"><div class="legend-dot" style="background:${teamColor};opacity:0.6"></div>Normal lap</div>
      <div class="legend-item"><div class="legend-dot" style="background:#e10600"></div>Pit lap</div>
    </div>
    <div class="lap-chart-wrap">${rows}</div>
    <div style="padding: 0 20px 16px; font-family: var(--font-mono); font-size: 10px; color: var(--text-3);">
      Fastest: <strong style="color: var(--green)">${formatLapTime(minTime)}</strong> · Lap ${fastestLap?.lap_number || '—'} · ${laps.length} laps total
    </div>
  `;
}

// ── Update clickable rows in standings ──────────────────────
// (This runs on index.html via postMessage — not needed here)

// ── MAIN ─────────────────────────────────────────────────────
async function init() {
  const driverId = getDriverId();
  const meta     = DRIVER_META[driverId] || {};

  // Fetch standing + results in parallel
  const [standing, races] = await Promise.all([
    fetchDriverStanding(driverId),
    fetchDriverResults(driverId),
  ]);

  // Render hero + results
  renderHero(standing, driverId, meta);
  renderResults(races);

  // Get last race for OpenF1 data
  const lastRace = races[races.length - 1];
  if (!lastRace) {
    document.getElementById('pits-body').innerHTML = `<div class="no-data">No race data yet.</div>`;
    document.getElementById('laps-body').innerHTML = `<div class="no-data">No race data yet.</div>`;
    return;
  }

  const rawCountry = lastRace.Circuit?.Location?.country || '';
  const locality   = lastRace.Circuit?.Location?.locality || '';
  const raceName   = lastRace.raceName;
  // OpenF1 uses country_name — map special cases
  const COUNTRY_MAP = {
    'USA': 'United States',
    'UK':  'United Kingdom',
    'UAE': 'United Arab Emirates',
  };
  const country = COUNTRY_MAP[rawCountry] || rawCountry;
  const driverNum = meta.number;
  const teamColor = getTeamColor(standing?.Constructors?.[0]?.name || '');

  // Find OpenF1 session
  const session = await fetchOpenF1Session(parseInt(SEASON), country, locality);
  if (!session) {
    document.getElementById('pits-body').innerHTML = `<div class="no-data">OpenF1 session not found for ${raceName}.</div>`;
    document.getElementById('laps-body').innerHTML = `<div class="no-data">OpenF1 session not found for ${raceName}.</div>`;
    return;
  }

  const sessionKey = session.session_key;

  // Fetch pit + stints + laps in parallel
  const [pits, stints, laps] = await Promise.all([
    fetchPitStops(sessionKey, driverNum),
    fetchStints(sessionKey, driverNum),
    fetchLaps(sessionKey, driverNum),
  ]);

  renderPits(pits, stints, raceName);
  renderLaps(laps, pits, teamColor);
}

document.addEventListener('DOMContentLoaded', init);
