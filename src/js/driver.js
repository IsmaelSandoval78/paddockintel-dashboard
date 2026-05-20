/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/driver.js (v4 - Producción Limpia)
   Driver Profile: Jolpica Results + OpenF1 Telemetry Integration
   ═══════════════════════════════════════════════════════════ */

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const OPENF1  = 'https://api.openf1.org/v1';
const SEASON  = '2026';

// Caché de datos para traducción instantánea sin recargas de red
let driverCachedData = {
    standing: null,
    races: [],
    meta: null,
    pits: [],
    stints: [],
    laps: [],
    raceName: ''
};

// ── Helpers de Formato, Idioma y Estilos ──────────────────────────────
const TEAM_COLORS = {
  'Mercedes': '#27F4D2', 'Ferrari': '#E8002D', 'McLaren': '#FF8000', 'Red Bull': '#3671C6',
  'Alpine': '#FF87BC', 'Haas': '#B6BABD', 'Racing Bulls': '#6692FF', 'RB': '#6692FF',
  'Williams': '#64C4FF', 'Aston Martin': '#229971', 'Audi': '#52E252', 'Cadillac': '#C8102E'
};

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

// Función traductora ultra-segura conectada al diccionario maestro global
function _t(key) {
    const lang = localStorage.getItem("paddock_lang") || document.documentElement.lang || 'en';
    if (window.translations && window.translations[lang]) {
        return window.translations[lang][key] || key;
    }
    return key;
}

function getDriverMeta(driverId) {
  if (typeof F1_DRIVERS === 'undefined') return {};
  return F1_DRIVERS[driverId] || {};
}

// ── API Fetches ───────────────────────────────────────────────
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
    if (locality) {
      res  = await fetch(`${OPENF1}/sessions?year=${year}&location=${encodeURIComponent(locality)}&session_type=Race`);
      data = await res.json();
      if (data?.length) return data[0];
    }
    return null;
  } catch { return null; }
}

async function fetchPitStops(sessionKey, driverNumber) {
  try { const res = await fetch(`${OPENF1}/pit?session_key=${sessionKey}&driver_number=${driverNumber}`); return await res.json(); } catch { return []; }
}
async function fetchStints(sessionKey, driverNumber) {
  try { const res = await fetch(`${OPENF1}/stints?session_key=${sessionKey}&driver_number=${driverNumber}`); return await res.json(); } catch { return []; }
}
async function fetchLaps(sessionKey, driverNumber) {
  try { const res = await fetch(`${OPENF1}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`); return await res.json(); } catch { return []; }
}

// ── Render Componentes Premium ─────────────────────────────────

function renderHero() {
  const contentEl = document.getElementById('driver-profile-content');
  const loadingEl = document.getElementById('driver-loading-state');
  const standing = driverCachedData.standing;
  const meta = driverCachedData.meta;

  if (!standing) {
    if (loadingEl) loadingEl.innerHTML = `<div class="error-msg">Driver not found for ${SEASON} season.</div>`;
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
  document.title = `${firstName} ${lastName} — PaddockIntel Hub`;

  if (loadingEl) loadingEl.style.display = 'none';
  if (contentEl) {
    contentEl.style.display = 'block';
    contentEl.innerHTML = `
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
              <div class="hero-stat-label">${_t('pts_label')}</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-val">${wins}</div>
              <div class="hero-stat-label">${_t('wins_label')}</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-val green">${formatMoney(salary)}</div>
              <div class="hero-stat-label">${_t('salary_label')}</div>
            </div>
            <div class="hero-stat-item">
              <div class="hero-stat-val gold">${valueIdx}</div>
              <div class="hero-stat-label">${_t('value_idx_label')}</div>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <div class="nationality-display">${flag}</div>
          <div class="pos-display">P<span class="pos-num">${pos}</span> ${_t('wdc_pos')}</div>
        </div>
      </div>
    `;
  }

  renderEconomics(pts, salary, valueIdx, firstName, lastName);
}

function renderEconomics(pts, salary, valueIdx, firstName, lastName) {
  const el = document.getElementById('driver-economics-content');
  if (!el) return;

  if (pts === 0) {
    el.innerHTML = `<div class="no-data">${_t('loading_economics')}</div>`;
    return;
  }

  const cpp = salary > 0 ? Math.round(salary / pts) : 0;
  const statusCrit = valueIdx > 20 ? _t('best_contract') : valueIdx > 10 ? _t('solid_value') : _t('high_cost');

  el.innerHTML = `
    <div class="economics-summary-grid">
        <div class="econ-metric-card">
            <div class="econ-label">${_t('cpp_calc')}</div>
            <div class="econ-val green">${formatMoney(cpp)} <span class="econ-sub-label">/ pt</span></div>
        </div>
        <div class="econ-metric-card">
            <div class="econ-label">${_t('value_index')}</div>
            <div class="econ-val gold">${valueIdx} <span class="econ-sub-label">pts/$1M</span></div>
        </div>
    </div>
    <div class="econ-callout-box">
        <p><strong>${firstName} ${lastName}</strong> devenga un estimado de ${formatMoney(salary)} anuales aportando un rendimiento de <strong>${pts} puntos</strong> en la tabla general.</p>
        <p class="econ-insight-status">${statusCrit}</p>
    </div>
  `;
}

function renderResults() {
  const el = document.getElementById('driver-results-table');
  if (!el) return;

  if (!driverCachedData.races.length) {
    el.innerHTML = `<div class="no-data">${_t('no_race_data')}</div>`;
    return;
  }

  const currentLangCode = localStorage.getItem("paddock_lang") || 'en';
  const rows = [...driverCachedData.races].reverse().map((race, i) => {
    const result  = race.Results?.[0];
    const pos     = result?.position || '—';
    const pts     = parseFloat(result?.points || 0);
    const status  = result?.status || '';
    const isDNF   = status !== 'Finished' && !status.includes('Lap');
    const date    = new Date(race.date).toLocaleDateString(currentLangCode === 'es' ? 'es-ES' : 'en-US', { month:'short', day:'numeric' });
    const posNum  = parseInt(pos);
    const posClass = posNum === 1 ? 'p1' : posNum === 2 ? 'p2' : posNum === 3 ? 'p3' : '';
    const posBadge = isDNF ? `<span class="pos-badge dnf">DNF</span>` : `<span class="pos-badge ${posClass}">${pos}</span>`;

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
        <tr><th>${_t('table_gp')}</th><th>${_t('table_pos')}</th><th style="text-align:right">${_t('table_pts')}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function createOrGetModuleCard(id, titleKey, tagKey) {
    let card = document.getElementById(id);
    if (!card) {
        const grid = document.querySelector('.driver-details-grid');
        if (!grid) return null;
        card = document.createElement('div');
        card.id = id;
        card.className = 'glass-card structural-module-card';
        grid.parentNode.insertBefore(card, grid.nextSibling);
    }
    card.innerHTML = `
        <div class="sidebar-card-header">
          <span class="sidebar-card-title">${_t(titleKey)}</span>
          <span class="section-tag gold">${_t(tagKey)}</span>
        </div>
        <div id="${id}-body" class="module-body-content"></div>
    `;
    return document.getElementById(`${id}-body`);
}

function renderPits() {
  const pits = driverCachedData.pits;
  const stints = driverCachedData.stints;
  const raceName = driverCachedData.raceName;
  
  const body = createOrGetModuleCard('openf1-pits-card', 'pit_stops_title', 'live_data');
  if (!body) return;
  if (!pits || !pits.length) {
    body.innerHTML = `<div class="no-data">${_t('no_openf1_pit')}</div>`;
    return;
  }

  const maxDur = Math.max(...pits.map(p => p.pit_duration || 0));
  const avgDur = pits.reduce((s, p) => s + (p.pit_duration || 0), 0) / pits.length;

  const pitRows = pits.map((pit) => {
    const dur    = pit.pit_duration || 0;
    const stop   = pit.stop_duration || dur;
    const barPct = maxDur > 0 ? Math.round((dur / maxDur) * 100) : 0;
    const stintAfter = stints.find(s => s.lap_start > pit.lap_number);
    const compound   = stintAfter?.compound || '—';

    return `
      <div class="pit-item">
        <div class="pit-lap">LAP ${pit.lap_number}</div>
        <div class="pit-compound">${compound}</div>
        <div class="pit-bar-wrap"><div class="pit-bar-fill" style="width:${barPct}%"></div></div>
        <div>
          <div class="pit-duration">${dur.toFixed(2)}s</div>
          <div class="pit-label">Stop: ${stop.toFixed(1)}s</div>
        </div>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="openf1-tag-header">${raceName} · Powered by OpenF1 API</div>
    <div class="pit-list">${pitRows}</div>
    <div class="pit-summary-row">
        <span><strong>${pits.length}</strong> Pit Stops</span> | 
        <span><strong>${_t('avg_duration')}:</strong> ${avgDur.toFixed(2)}s</span> | 
        <span><strong>${_t('best_stop')}:</strong> ${Math.min(...pits.map(p=>p.pit_duration||99)).toFixed(2)}s</span>
    </div>
  `;
}

function renderLaps(teamColor) {
  const laps = driverCachedData.laps;
  const pits = driverCachedData.pits;
  
  const body = createOrGetModuleCard('openf1-laps-card', 'lap_times_title', 'live_data');
  if (!body) return;
  if (!laps || !laps.length) {
    body.innerHTML = `<div class="no-data">${_t('no_openf1_lap')}</div>`;
    return;
  }

  const durations = laps.map(l => parseLapDuration(l.lap_duration)).filter(d => d && d > 60000 && d < 200000);
  if (!durations.length) {
    body.innerHTML = `<div class="no-data">${_t('no_openf1_lap')}</div>`;
    return;
  }

  const minTime    = Math.min(...durations);
  const maxTime    = Math.max(...durations);
  const pitLaps    = new Set(pits.map(p => p.lap_number));

  const rows = laps.slice(0, 30).map(l => {
    const ms = parseLapDuration(l.lap_duration);
    if (!ms || ms < 60000 || ms > 200000) return '';
    const isPit     = pitLaps.has(l.lap_number);
    const isFastest = ms === minTime;
    const barPct    = maxTime > minTime ? Math.round(100 - ((ms - minTime) / (maxTime - minTime)) * 70) : 80;
    const barColor  = isFastest ? '#34c759' : isPit ? '#e10600' : teamColor;

    return `
      <div class="lap-row">
        <div class="lap-num">L${l.lap_number}</div>
        <div class="lap-bar-wrap">
          <div class="lap-bar-fill" style="width:${barPct}%;background:${barColor}"></div>
        </div>
        <div class="lap-time-val ${isFastest?'fastest':''}">${formatLapTime(ms)}</div>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="lap-legend">
      <div class="legend-item"><span class="legend-dot" style="background:#34c759"></span>${_t('fastest_lap_label')}</div>
      <div class="legend-item"><span class="legend-dot" style="background:${teamColor}"></span>${_t('normal_lap_label')}</div>
      <div class="legend-item"><span class="legend-dot" style="background:#e10600"></span>${_t('pit_lap_label')}</div>
    </div>
    <div class="lap-chart-wrap">${rows}</div>
  `;
}

function renderCareerTimeline() {
  const body = createOrGetModuleCard('history-career-card', 'career_path_title', 'road_to_f1');
  if (!body) return;
  const d = driverCachedData.meta;

  if (!d || !d.career) {
    body.innerHTML = `<div class="no-data">${_t('loading_records')}</div>`;
    return;
  }

  const rows = d.career.map((c, i) => {
    return `
      <div class="career-row">
        <div class="career-year">${c.year}</div>
        <div class="career-content">
          <span class="career-series">${c.series}</span> — <strong>${c.team}</strong> (${c.result})
        </div>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <p class="driver-bio-text">${d.bio || ''}</p>
    <div class="career-timeline-vertical">${rows}</div>
  `;
}

function renderRecordsGrid() {
  const body = createOrGetModuleCard('history-records-card', 'records_title', 'verified_tag');
  if (!body) return;
  const d = driverCachedData.meta;

  if (!d || !d.records?.length) {
    body.innerHTML = `<div class="no-data">No records items available.</div>`;
    return;
  }

  const badges = d.records.map(r => `
    <div class="record-badge-premium">
      <span class="record-icon">${r.icon}</span>
      <div class="record-info-block">
         <div class="record-label">${r.label}</div>
         <div class="record-value">${r.value}</div>
         <div class="record-race-sub">${r.race}</div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `<div class="records-flex-grid">${badges}</div>`;
}

// ── Render Dinámico Global ────────────────────────────────────
function renderAllComponents() {
    const teamColor = getTeamColor(driverCachedData.standing?.Constructors?.[0]?.name || '');
    renderHero();
    renderResults();
    renderPits();
    renderLaps(teamColor);
    renderCareerTimeline();
    renderRecordsGrid();
}

// ── Inicialización ───────────────────────────────────────────
async function init() {
  const driverId = getDriverId();
  const meta = getDriverMeta(driverId);
  driverCachedData.meta = meta;

  const [standing, races] = await Promise.all([
    fetchDriverStanding(driverId),
    fetchDriverResults(driverId),
  ]);

  driverCachedData.standing = standing;
  driverCachedData.races = races;

  renderAllComponents();

  const lastRace = races[races.length - 1];
  if (!lastRace) return;

  const COUNTRY_MAP = { 'USA':'United States', 'UK':'United Kingdom', 'UAE':'United Arab Emirates' };
  const rawCountry  = lastRace.Circuit?.Location?.country || '';
  const locality    = lastRace.Circuit?.Location?.locality || '';
  const country     = COUNTRY_MAP[rawCountry] || rawCountry;
  
  driverCachedData.raceName = lastRace.raceName;
  const driverNum = meta.number;

  if (!driverNum) return;

  const session = await fetchOpenF1Session(parseInt(SEASON), country, locality);
  if (!session) return;

  const sessionKey = session.session_key;
  const [pits, stints, laps] = await Promise.all([
    fetchPitStops(sessionKey, driverNum),
    fetchStints(sessionKey, driverNum),
    fetchLaps(sessionKey, driverNum),
  ]);

  driverCachedData.pits = pits;
  driverCachedData.stints = stints;
  driverCachedData.laps = laps;

  renderAllComponents();
}

// Escuchar el cambio de idioma dinámico sin recargar la página
window.addEventListener('languageChanged', () => {
    console.log("Idioma cambiado detectado en driver.js. Traduciendo en vivo...");
    renderAllComponents();
});

document.addEventListener('DOMContentLoaded', init);