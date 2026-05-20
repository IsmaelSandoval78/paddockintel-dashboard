/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL DASHBOARD — src/js/app.js v4 (i18n & Modular)
   World Map · Driver Standings · Constructor Standings · Circuit Intel
   ═══════════════════════════════════════════════════════════ */

const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1';
const SEASON = '2026';

// Cache global en memoria para cambios de idioma en tiempo real sin recargas de red
let cachedData = {
    allRaces: [],
    drivers: [],
    constructors: [],
    nextRace: null,
    activeRacePanel: null // Almacena la carrera abierta actualmente para traducirla en vivo
};

// ── Ampliación del Diccionario i18n para componentes dinámicos de JS ───────
if (typeof translations !== 'undefined') {
    translations.es = {
        ...translations.es,
        updated: "Actualizado",
        next_race_tag: "Próxima Carrera 🔴",
        completed_tag: "Completado",
        round_prefix: "Ronda",
        attendance_label: "Asistencia",
        champions_label: "Últimos 5 campeones en este circuito",
        weather_label: "Clima del Circuito — En Vivo",
        loading_history: "Cargando historial…",
        loading_weather: "Cargando clima…",
        no_history: "No hay datos históricos disponibles",
        no_winner: "No se encontraron datos del ganador",
        weather_error: "Clima no disponible",
        now_label: "Ahora",
        view_profile: "Ver perfil de",
        back_btn: "← Clasificaciones"
    };
    translations.en = {
        ...translations.en,
        updated: "Updated",
        next_race_tag: "Next Race 🔴",
        completed_tag: "Completed",
        round_prefix: "Round",
        attendance_label: "Attendance",
        champions_label: "Last 5 Champions at this circuit",
        weather_label: "Circuit Weather — Live",
        loading_history: "Loading history…",
        loading_weather: "Loading weather…",
        no_history: "No historical data available",
        no_winner: "No winner data found",
        weather_error: "Weather unavailable",
        now_label: "Now",
        view_profile: "View profile of",
        back_btn: "← Standings"
    };
}

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
  'Cadillac':     '#C8102E',
  'Audi':         '#52E252',
  'Racing Bulls': '#6692FF',
};

// ── Constructor name → profile ref mapping ───────────────────
const CONSTRUCTOR_REF_MAP = {
  'Mercedes':        'mercedes',
  'Ferrari':         'ferrari',
  'McLaren':         'mclaren',
  'Red Bull':        'red_bull',
  'Aston Martin':    'aston_martin',
  'Alpine':          'alpine',
  'Alpine F1 Team':  'alpine',
  'Williams':        'williams',
  'RB':              'rb',
  'Racing Bulls':    'rb',
  'Haas':            'haas',
  'Haas F1 Team':    'haas',
  'Kick Sauber':     'audi',
  'Sauber':          'audi',
  'Audi':            'audi',
  'Cadillac':        'cadillac',
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

function raceIsPast(race) {
  const t = race.time ? race.time.replace(/Z$/i, '') : '14:00:00';
  return new Date(`${race.date}T${t}Z`) < new Date();
}

function formatRaceDate(dateStr) {
  const langCode = typeof currentLang !== 'undefined' ? (currentLang === 'es' ? 'es-ES' : 'en-US') : 'en-US';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString(langCode, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Helper rápido para obtener traducciones de interfaz en JS
function _t(key) {
    if (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') {
        return translations[currentLang][key] || key;
    }
    return key;
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
    const res = await fetch(`${ERGAST_BASE}/circuits/${circuitId}/results/1.json?limit=50`);
    const json = await res.json();
    const races = json?.MRData?.RaceTable?.Races || [];
    return races.slice(-5).reverse();
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
let markerLayerGroup; // Grupo para limpiar marcadores al cambiar idioma si es necesario

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

  markerLayerGroup = L.layerGroup().addTo(map);
}

function addCircuitMarkers(races, nextRound) {
  if (!markerLayerGroup) return;
  markerLayerGroup.clearLayers(); // Limpiar marcadores viejos

  races.forEach(race => {
    const lat = parseFloat(race.Circuit.Location.lat);
    const lon = parseFloat(race.Circuit.Location.long);
    const isPast = raceIsPast(race);
    const isNext = nextRound && race.round === nextRound;
    const status = isNext ? 'next' : isPast ? 'done' : 'upcoming';

    const labelStatus = isNext ? ` · ${_t('next_race_tag')}` : isPast ? ` · ${_t('completed_tag')}` : '';

    const icon = L.divIcon({
      className: '',
      html: `<div class="circ-pin circ-${status}" title="${_t('round_prefix')} ${race.round}: ${race.raceName}"><span>${race.round}</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      tooltipAnchor: [13, -14],
    });

    const dotColor = isNext ? '#e8aa00' : isPast ? '#8e8e93' : '#e10600';

    L.marker([lat, lon], { icon })
      .addTo(markerLayerGroup)
      .bindTooltip(
        `<div style="font-weight:700">${_t('round_prefix')} ${race.round} — ${race.raceName}</div>` +
        `<div style="opacity:.75">${race.Circuit.circuitName}</div>` +
        `<div style="opacity:.65">${race.Circuit.Location.locality}, ${race.Circuit.Location.country}</div>` +
        `<div style="color:${dotColor};margin-top:2px">${formatRaceDate(race.date)}${labelStatus}</div>`,
        { direction: 'top', offset: [0, -4], className: 'circuit-tooltip' }
      )
      .on('click', () => openCircuitPanel(race));
  });
}

// ── Circuit Panel ─────────────────────────────────────────────
function openCircuitPanel(race) {
  cachedData.activeRacePanel = race; // Guardar estado para renderizar dinámicamente si cambian de idioma
  document.getElementById('standings-panel').style.display = 'none';
  const panel = document.getElementById('circuit-panel');
  panel.style.display = 'block';

  const isPast = raceIsPast(race);
  const statusLabel = isPast ? `✓ ${_t('completed_tag')}` : `⏳ ${_t('legend_upcoming')}`;
  const statusClass = isPast ? 'done' : 'upcoming';
  
  // Mapeo dinámico de datos del circuito para asistencia estimado
  const CIRCUIT_ATTENDANCE = {
    bahrain: '~80,000', jeddah: '~60,000', albert_park: '~280,000', suzuka: '~300,000',
    shanghai: '~200,000', miami: '~275,000', imola: '~180,000', monaco: '~200,000',
    villeneuve: '~300,000', catalunya: '~300,000', red_bull_ring: '~300,000', silverstone: '~480,000',
    hungaroring: '~200,000', spa: '~350,000', zandvoort: '~105,000', monza: '~160,000',
    baku: '~80,000', marina_bay: '~250,000', americas: '~440,000', rodriguez: '~400,000',
    interlagos: '~280,000', vegas: '~315,000', losail: '~80,000', yas_marina: '~95,000',
  };
  const attendance = CIRCUIT_ATTENDANCE[race.Circuit.circuitId] || 'N/A';

  document.getElementById('circuit-panel-inner').innerHTML = `
    <div class="cp-header">
      <button class="cp-back" onclick="closeCircuitPanel()">${_t('back_btn')}</button>
      <span class="section-tag">${_t('round_prefix')} ${race.round}</span>
    </div>
    <div class="cp-race-name">${race.raceName}</div>
    <div class="cp-circuit-name">${race.Circuit.circuitName}</div>
    <div class="cp-location">${race.Circuit.Location.locality}, ${race.Circuit.Location.country}</div>
    <div class="cp-meta-row">
      <span class="cp-chip">📅 ${formatRaceDate(race.date)}</span>
      <span class="cp-chip cp-chip-${statusClass}">${statusLabel}</span>
    </div>
    <div class="cp-meta-row">
      <span class="cp-chip">🏟️ ${_t('attendance_label')}: ${attendance}</span>
    </div>

    <div class="cp-divider"></div>
    <div class="cp-section-label">${_t('champions_label')}</div>
    <div id="cp-champions">
      <div class="loading-state" style="padding:16px 14px"><div class="spinner"></div>${_t('loading_history')}</div>
    </div>

    <div class="cp-divider"></div>
    <div class="cp-section-label">${_t('weather_label')}</div>
    <div id="cp-weather">
      <div class="loading-state" style="padding:14px"><div class="spinner"></div>${_t('loading_weather')}</div>
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
  cachedData.activeRacePanel = null;
  document.getElementById('circuit-panel').style.display = 'none';
  document.getElementById('standings-panel').style.display = '';
}

function renderChampions(history) {
  const el = document.getElementById('cp-champions');
  if (!el) return;

  if (!history.length) {
    el.innerHTML = `<div class="cp-empty">${_t('no_history')}</div>`;
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

  el.innerHTML = (rows || `<div class="cp-empty">${_t('no_winner')}</div>`) + flHtml;
}

function renderCircuitWeather(weather, locality) {
  const el = document.getElementById('cp-weather');
  if (!el) return;
  if (!weather) {
    el.innerHTML = `<div class="cp-empty" style="padding:8px 14px 14px">${_t('weather_error')}</div>`;
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
      <div class="cp-weather-loc">${locality} · ${_t('now_label')}</div>
    </div>
  `;
}

// ── Sidebar: Top 10 Drivers ───────────────────────────────────
function renderSidebarDrivers(drivers) {
  const el = document.getElementById('sidebar-drivers');
  if (!el || !drivers.length) return;

  el.innerHTML = drivers.map(d => {
    const team     = d.Constructors?.[0]?.name || '—';
    const color    = getTeamColor(team);
    const pos      = parseInt(d.position);
    const posClass = pos <= 3 ? `pos-${pos}` : '';
    const tooltipText = `${_t('view_profile')} ${d.Driver.givenName} ${d.Driver.familyName}`;

    return `
      <div class="sb-driver-row" onclick="window.location.href='driver.html?id=${d.Driver.driverId}'" title="${tooltipText}">
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
    const name         = c.Constructor.name;
    const pts          = parseInt(c.points);
    const pos          = parseInt(c.position);
    const color        = getTeamColor(name);
    const barW         = Math.round((pts / maxPts) * 100);
    const posClass     = pos <= 3 ? `pos-${pos}` : '';
    const constructorRef = CONSTRUCTOR_REF_MAP[name] || name.toLowerCase().replace(/\s+/g, '_');
    const tooltipText = `${_t('view_profile')} ${name}`;

    return `
      <div class="sb-constructor-row"
           onclick="window.location.href='constructor.html?id=${constructorRef}'"
           style="cursor:pointer"
           title="${tooltipText}">
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
  if (el) el.textContent = `${_t('updated')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC`;
}

// Función encargada puramente de renderizar la UI a partir de los datos cacheados
function renderUI() {
    setTimestamp();
    
    if (cachedData.allRaces.length) {
        addCircuitMarkers(cachedData.allRaces, cachedData.nextRace?.round);
        const done  = cachedData.allRaces.filter(r => raceIsPast(r)).length;
        const total = cachedData.allRaces.length;
        const roundsTag = document.getElementById('map-rounds-tag');
        const statusTag = document.getElementById('map-status-tag');
        if (roundsTag) roundsTag.textContent = `${total} ${_t('map_rounds')}`;
        if (statusTag) {
          if (cachedData.nextRace) {
            statusTag.textContent = `${_t('legend_next')}: ${cachedData.nextRace.raceName}`;
            statusTag.className   = 'section-tag gold';
          } else {
            statusTag.textContent = `${done}/${total} ${_t('completed_tag')}`;
            statusTag.className   = 'section-tag green';
          }
        }
    }

    renderSidebarDrivers(cachedData.drivers.slice(0, 10));
    renderSidebarConstructors(cachedData.constructors.slice(0, 5));
    buildTicker(cachedData.drivers);
    
    // Si el usuario tenía el panel de un circuito abierto al cambiar idioma, lo vuelve a dibujar traducido
    if (cachedData.activeRacePanel) {
        openCircuitPanel(cachedData.activeRacePanel);
    }
}

// ── Main Init ─────────────────────────────────────────────────
async function init() {
  initMap();

  // Hacer fetches iniciales a la API externa
  const [allRaces, drivers, constructors, nextRace] = await Promise.all([
    fetchAllRaces(),
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchNextRace(),
  ]);

  // Almacenar en caché global para i18n reactiva
  cachedData.allRaces = allRaces;
  cachedData.drivers = drivers;
  cachedData.constructors = constructors;
  cachedData.nextRace = nextRace;

  // Renderizar la interfaz por primera vez
  renderUI();
}

// Escuchar el evento de cambio de idioma disparado por i18n.js
window.addEventListener('languageChanged', () => {
    console.log("Idioma cambiado detectado en app.js. Volviendo a renderizar UI...");
    renderUI();
});

document.addEventListener('DOMContentLoaded', init);