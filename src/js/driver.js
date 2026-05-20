/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — driver.js  (UNIFIED v2)
   Driver profile: Jolpica results + OpenF1 pit/lap data

   ARCHITECTURE:
   ─ f1-drivers.js  →  single source of truth (F1_DRIVERS)
   ─ driver.js      →  reads F1_DRIVERS, renders everything
   ─ DRIVER_META / DRIVER_CAREER / DRIVER_RECORDS are now
     derived from F1_DRIVERS — no more duplicated data.

   Usage: driver.html?id=norris
   ═══════════════════════════════════════════════════════════ */

/* ----------------------------------------------------------
   0. DEPENDENCY — f1-drivers.js must be loaded first
      In driver.html add:
        <script src="src/data/f1-drivers.js"></script>
        <script src="src/driver.js"></script>
   ---------------------------------------------------------- */

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const OPENF1  = 'https://api.openf1.org/v1';
const SEASON  = '2026';

// ── Team colours (canonical) ─────────────────────────────────
const TEAM_COLORS = {
  'Mercedes':     '#27F4D2',
  'Ferrari':      '#E8002D',
  'McLaren':      '#FF8000',
  'Red Bull':     '#3671C6',
  'Alpine':       '#FF87BC',
  'Haas':         '#B6BABD',
  'Racing Bulls': '#6692FF',
  'RB':           '#6692FF',
  'Williams':     '#64C4FF',
  'Aston Martin': '#229971',
  'Audi':         '#52E252',
  'Cadillac':     '#C8102E',
};

// ── Helpers ──────────────────────────────────────────────────
function getTeamColor(name) {
  if (!name) return '#8e8e93';
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (name.includes(k)) return v;
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

// ── Derive DRIVER_META from F1_DRIVERS ───────────────────────
// F1_DRIVERS is loaded from src/data/f1-drivers.js
function getDriverMeta(driverId) {
  if (typeof F1_DRIVERS === 'undefined') {
    console.warn('F1_DRIVERS not loaded — check script order in driver.html');
    return {};
  }
  const d = F1_DRIVERS[driverId];
  if (!d) return {};
  return {
    salary:   d.salary,
    number:   d.number,
    flag:     d.flag,
    fullName: d.fullName,
    bio:      d.bio,
  };
}

// ── API calls ────────────────────────────────────────────────
async function fetchDriverStanding(driverId) {
  try {
    const res  = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/driverStandings.json`);
    const json = await res.json();
    const list = json?.MRData?.StandingsTable?.StandingsLists;
    return list?.[list.length - 1]?.DriverStandings?.[0] || null;
  } catch { return null; }
}

async function fetchDriverResults(driverId) {
  try {
    const res  = await fetch(`${JOLPICA}/${SEASON}/drivers/${driverId}/results.json?limit=30`);
    const json = await res.json();
    return json?.MRData?.RaceTable?.Races || [];
  } catch { return []; }
}

async function fetchOpenF1Session(year, country, locality) {
  try {
    let res  = await fetch(`${OPENF1}/sessions?year=${year}&country_name=${encodeURIComponent(country)}&session_type=Race`);
    let data = await res.json();
    if (data?.length) return data[0];
    res  = await fetch(`${OPENF1}/sessions?year=${year - 1}&country_name=${encodeURIComponent(country)}&session_type=Race`);
    data = await res.json();
    if (data?.length) return data[0];
    if (locality) {
      res  = await fetch(`${OPENF1}/sessions?year=${year}&location=${encodeURIComponent(locality)}&session_type=Race`);
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
    el.innerHTML = `<div class="error-msg">Driver not found for ${SEASON} season.</div>`;
    return;
  }

  const firstName = standing.Driver.givenName;
  const lastName  = standing.Driver.familyName;
  const team      = standing.Constructors?.[0]?.name || 'Unknown';
  const pts       = parseInt(standing.points);
  const pos       = parseInt(standing.position);
  const wins      = parseInt(standing.wins);
  const color     = getTeamColor(team);
  const salary    = meta?.salary || 2000000;
  const number    = meta?.number || '?';
  const flag      = meta?.flag   || '🏁';

  const valueIdx = salary > 0 ? (pts / (salary / 1000000)).toFixed(1) : '—';

  setTitle(`${firstName} ${lastName}`);

  el.innerHTML = `
    <div class="hero-layout">
      <div class="driver-number-badge" style="background:${color};box-shadow:0 4px 20px ${color}44">
        ${number}
      </div>
      <div>
        <div class="hero-name">${firstName.toUpperCase()} ${lastName.toUpperCase()}</div>
        <div class="hero-team">
          <span class="team-dot" style="background:${color}"></span>
          ${team} · ${SEASON}
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

  const callout   = document.getElementById('value-callout');
  const valueText = document.getElementById('value-text');
  if (pts > 0 && callout && valueText) {
    callout.style.display = 'block';
    const cpp = salary > 0 ? Math.round(salary / pts) : 0;
    valueText.innerHTML = `
      <strong>${firstName} ${lastName}</strong> earns ${formatMoney(salary)}/yr and has scored
      <strong>${pts} points</strong> —
      that's <strong>${formatMoney(cpp)} per point</strong> and a Value Index of
      <strong>${valueIdx} pts/$1M</strong>.
      ${valueIdx > 20 ? '🔥 One of the best value contracts on the grid.'
        : valueIdx > 10 ? '✅ Solid value for the team.'
        : '⚠️ High cost relative to points scored so far.'}
    `;
  }
}

// ── Render Results ───────────────────────────────────────────
function renderResults(races) {
  const el = document.getElementById('results-body');
  if (!races.length) {
    el.innerHTML = `<div class="no-data">No race results yet for ${SEASON}.</div>`;
    return;
  }

  const rows = [...races].reverse().map((race, i) => {
    const result  = race.Results?.[0];
    const pos     = result?.position || '—';
    const pts     = parseFloat(result?.points || 0);
    const status  = result?.status || '';
    const isDNF   = status !== 'Finished' && !status.includes('Lap');
    const date    = new Date(race.date).toLocaleDateString('en-US', { month:'short', day:'numeric' });
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
        <tr><th>Grand Prix</th><th>Pos</th><th style="text-align:right">PTS</th></tr>
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

  const pitRows = pits.map((pit) => {
    const dur    = pit.pit_duration || 0;
    const stop   = pit.stop_duration || dur;
    const barPct = maxDur > 0 ? Math.round((dur / maxDur) * 100) : 0;
    const isFast = dur < avgDur;

    const stintAfter = stints.find(s => s.lap_start > pit.lap_number);
    const compound   = stintAfter?.compound || '—';
    const compClass  = compound === 'SOFT'         ? 'compound-soft'
                     : compound === 'MEDIUM'       ? 'compound-medium'
                     : compound === 'HARD'         ? 'compound-hard'
                     : compound === 'INTERMEDIATE' ? 'compound-inter'
                     : compound === 'WET'          ? 'compound-wet' : '';

    return `
      <div class="pit-item">
        <div class="pit-lap">LAP ${pit.lap_number}</div>
        <div class="pit-compound ${compClass}">${compound.charAt(0)}${compound.slice(1).toLowerCase()}</div>
        <div class="pit-bar-wrap"><div class="pit-bar-fill" style="width:${barPct}%"></div></div>
        <div>
          <div class="pit-duration ${isFast?'fast':''}">${dur.toFixed(1)}s</div>
          <div class="pit-label">Stop: ${stop.toFixed(1)}s</div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div style="padding:8px 20px 0;font-family:var(--font-mono);font-size:9px;color:var(--text-3);letter-spacing:0.08em;text-transform:uppercase;">
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

  const minTime    = Math.min(...durations);
  const maxTime    = Math.max(...durations);
  const pitLaps    = new Set(pits.map(p => p.lap_number));
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
          <div class="lap-bar-fill" style="width:${barPct}%;background:${barColor};opacity:${isFastest?1:0.6}"></div>
        </div>
        <div class="lap-time-val ${timeClass}">${formatLapTime(ms)}${isPit?' 🔧':''}</div>
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
    <div style="padding:0 20px 16px;font-family:var(--font-mono);font-size:10px;color:var(--text-3);">
      Fastest: <strong style="color:var(--green)">${formatLapTime(minTime)}</strong>
      · Lap ${fastestLap?.lap_number || '—'} · ${laps.length} laps total
    </div>
  `;
}

// ── Render Career Timeline (from F1_DRIVERS) ─────────────────
function renderCareer(driverId) {
  let section = document.getElementById('module-career');
  if (!section) {
    const footer = document.querySelector('.site-footer');
    section = document.createElement('section');
    section.id        = 'module-career';
    section.className = 'glass-card';
    section.style.marginBottom = '16px';
    footer.parentNode.insertBefore(section, footer);
  }

  const d = (typeof F1_DRIVERS !== 'undefined') ? F1_DRIVERS[driverId] : null;
  if (!d) {
    section.innerHTML = `
      <div class="card-header"><div class="section-header"><h2 class="section-title">Career Path</h2></div></div>
      <div class="no-data">Career data coming soon.</div>
    `;
    return;
  }

  const rows = d.career.map((c, i) => {
    const isF1    = c.series === 'F1';
    const isChamp = c.result.includes('🏆');
    return `
      <div class="career-row" style="animation-delay:${i*0.05}s">
        <div class="career-year">${c.year}</div>
        <div class="career-line-wrap">
          <div class="career-dot ${isF1?'f1':''} ${isChamp?'champ':''}"></div>
          ${i < d.career.length - 1 ? '<div class="career-line"></div>' : ''}
        </div>
        <div class="career-content">
          <div class="career-series ${isF1?'f1-series':''}">${c.series}</div>
          <div class="career-team">${c.team}</div>
          <div class="career-result ${isChamp?'champ-result':''}">${c.result}</div>
        </div>
      </div>
    `;
  }).join('');

  section.innerHTML = `
    <div class="card-header">
      <div class="section-header">
        <h2 class="section-title">Career Path</h2>
        <span class="section-tag">Road to F1</span>
      </div>
      <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);margin-top:6px;line-height:1.6">${d.bio}</p>
    </div>
    <div class="career-timeline">${rows}</div>
  `;
}

// ── Render Records (from F1_DRIVERS) ─────────────────────────
function renderRecords(driverId, teamColor) {
  const section = document.getElementById('module-records');
  if (!section) return;

  const d = (typeof F1_DRIVERS !== 'undefined') ? F1_DRIVERS[driverId] : null;
  if (!d || !d.records?.length) {
    section.innerHTML = '<div class="no-data">No records data for this driver yet.</div>';
    return;
  }

  const badges = d.records.map((r, i) => `
    <div class="record-badge" style="animation-delay:${i*0.08}s">
      <div class="record-icon">${r.icon}</div>
      <div class="record-label">${r.label}</div>
      <div class="record-value">${r.value}</div>
      <div class="record-race">${r.race}</div>
    </div>
  `).join('');

  section.innerHTML = `
    <div class="card-header">
      <div class="section-header">
        <h2 class="section-title">Records & Achievements</h2>
        <span class="section-tag gold">Verified</span>
      </div>
    </div>
    <div class="records-grid">${badges}</div>
  `;
}

// ── Render F1 Results Heatmap (from F1_DRIVERS) ───────────────
function renderHeatmap(driverId, teamColor) {
  const section = document.getElementById('module-heatmap');
  if (!section) return;

  const d = (typeof F1_DRIVERS !== 'undefined') ? F1_DRIVERS[driverId] : null;
  if (!d || !d.f1Results) {
    section.innerHTML = '<div class="no-data">No heatmap data for this driver yet.</div>';
    return;
  }

  function getColor(pos) {
    if (pos === 1)                                   return '#e8aa00';
    if (pos === 2)                                   return '#8e8e93';
    if (pos === 3)                                   return '#bf7f3c';
    if (pos === 'R' || pos === 'DNF' || pos === 'DSQ') return '#e10600';
    if (pos === 'DNS' || pos === 'WD' || pos === 'NC') return '#555';
    if (typeof pos === 'number' && pos <= 6)         return teamColor;
    if (typeof pos === 'number' && pos <= 10)        return `${teamColor}88`;
    return 'rgba(0,0,0,0.06)';
  }

  function getTextColor(pos) {
    if (pos === 1)                                   return '#1c1c1e';
    if (pos === 'R' || pos === 'DNF' || pos === 'DSQ') return 'white';
    if (typeof pos === 'number' && pos <= 3)         return 'white';
    return '#8e8e93';
  }

  const seasons = Object.keys(d.f1Results).sort();
  const rows = seasons.map(year => {
    const races = d.f1Results[year];
    const cells = Object.entries(races).map(([gp, pos]) => `
      <div class="heat-cell" title="${gp} ${year}: ${pos}" style="background:${getColor(pos)};color:${getTextColor(pos)}">
        ${pos === 'R' ? 'R' : pos === 'DSQ' ? 'D' : pos === 'DNS' ? '–' : pos === 'WD' ? 'W' : pos === 'NC' ? 'N' : pos}
      </div>
    `).join('');

    const vals    = Object.values(races);
    const wins    = vals.filter(p => p === 1).length;
    const dnfs    = vals.filter(p => p === 'R' || p === 'DSQ').length;
    // Read points directly from careerStats — avoids recalculating from positions
    // (sprint pts, fastest lap pts, etc. would be missed otherwise)
    const statRow = d.careerStats?.find(s => s.year === parseInt(year) && s.series === 'F1');
    const pts     = statRow ? statRow.points : vals.reduce((s, p) => {
      const PTS_MAP = [25,18,15,12,10,8,6,4,2,1];
      return s + (typeof p === 'number' ? (PTS_MAP[p-1] || 0) : 0);
    }, 0);

    return `
      <div class="heat-row">
        <div class="heat-year">${year}</div>
        <div class="heat-cells">${cells}</div>
        <div class="heat-summary">
          <span class="heat-wins">${wins}W</span>
          ${dnfs ? `<span class="heat-dnf">${dnfs}R</span>` : ''}
          <span class="heat-pts">${pts}p</span>
        </div>
      </div>
    `;
  }).join('');

  section.innerHTML = `
    <div class="card-header">
      <div class="section-header">
        <h2 class="section-title">F1 Results Heatmap</h2>
        <span class="section-tag" style="color:var(--gold);background:rgba(232,170,0,0.08);border-color:rgba(232,170,0,0.2)">
          🟡 P1 &nbsp; ⬛ Points &nbsp; 🔴 DNF
        </span>
      </div>
    </div>
    <div class="heatmap-wrap">${rows}</div>
  `;
}

// ── Render Career Stats Table (from F1_DRIVERS) ───────────────
function renderCareerStats(driverId) {
  const section = document.getElementById('module-careerstats');
  if (!section) return;

  const d = (typeof F1_DRIVERS !== 'undefined') ? F1_DRIVERS[driverId] : null;
  if (!d || !d.careerStats?.length) {
    section.innerHTML = '<div class="no-data">No career stats for this driver yet.</div>';
    return;
  }

  const rows = d.careerStats.map((s, i) => {
    const isChamp = String(s.pos).includes('🏆');
    const isF1    = s.series === 'F1';
    return `
      <tr style="animation-delay:${i*0.04}s" class="${isChamp?'champ-row':''}">
        <td class="stat-year">${s.year}</td>
        <td class="stat-series ${isF1?'f1-series':''}">${s.series}</td>
        <td class="stat-num">${s.races}</td>
        <td class="stat-num wins">${s.wins}</td>
        <td class="stat-num">${s.poles}</td>
        <td class="stat-num">${s.podiums}</td>
        <td class="stat-num pts">${s.points}</td>
        <td class="stat-pos ${isChamp?'champ-pos':''}">${s.pos}</td>
      </tr>
    `;
  }).join('');

  section.innerHTML = `
    <div class="card-header">
      <div class="section-header">
        <h2 class="section-title">Career Statistics</h2>
        <span class="section-tag">All Series</span>
      </div>
    </div>
    <div class="stats-table-wrap">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Year</th><th>Series</th><th>Races</th>
            <th>Wins</th><th>Poles</th><th>Pods</th>
            <th>Points</th><th>Result</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ── MAIN ─────────────────────────────────────────────────────
async function init() {
  const driverId = getDriverId();
  const meta     = getDriverMeta(driverId);   // ← from F1_DRIVERS

  const [standing, races] = await Promise.all([
    fetchDriverStanding(driverId),
    fetchDriverResults(driverId),
  ]);

  const teamColor = getTeamColor(standing?.Constructors?.[0]?.name || '');
  window._teamColor = teamColor;

  renderHero(standing, driverId, meta);
  renderRecords(driverId, teamColor);
  renderResults(races);
  renderHeatmap(driverId, teamColor);
  renderCareerStats(driverId);
  renderCareer(driverId);

  // OpenF1 — non-blocking
  const lastRace = races[races.length - 1];
  if (!lastRace) {
    document.getElementById('pits-body').innerHTML = '<div class="no-data">No race data yet.</div>';
    document.getElementById('laps-body').innerHTML = '<div class="no-data">No race data yet.</div>';
    return;
  }

  const COUNTRY_MAP = { 'USA':'United States', 'UK':'United Kingdom', 'UAE':'United Arab Emirates' };
  const rawCountry  = lastRace.Circuit?.Location?.country || '';
  const locality    = lastRace.Circuit?.Location?.locality || '';
  const country     = COUNTRY_MAP[rawCountry] || rawCountry;
  const raceName    = lastRace.raceName;
  const driverNum   = meta.number;

  const session = await fetchOpenF1Session(parseInt(SEASON), country, locality);
  if (!session) {
    document.getElementById('pits-body').innerHTML = `<div class="no-data">OpenF1 session not found for ${raceName}.</div>`;
    document.getElementById('laps-body').innerHTML = `<div class="no-data">OpenF1 session not found for ${raceName}.</div>`;
    return;
  }

  const sessionKey = session.session_key;
  const [pits, stints, laps] = await Promise.all([
    fetchPitStops(sessionKey, driverNum),
    fetchStints(sessionKey, driverNum),
    fetchLaps(sessionKey, driverNum),
  ]);

  renderPits(pits, stints, raceName);
  renderLaps(laps, pits, teamColor);
}

document.addEventListener('DOMContentLoaded', init);
