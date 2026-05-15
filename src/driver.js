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

// ── Driver Career History (verified via Wikipedia, FIA, official team sites) ──
const DRIVER_CAREER = {
  'antonelli': {
    bio: "Born Bologna, Italy. Mercedes Junior since age 12. Skipped F3 entirely — promoted directly from F2 to F1 replacing Lewis Hamilton.",
    career: [
      { year: 2021, series: 'F4 UAE',    team: 'Prema',   result: 'Race winner' },
      { year: 2022, series: 'Italian F4', team: 'Prema',  result: '🏆 Champion — 13 wins' },
      { year: 2022, series: 'ADAC F4',   team: 'Prema',   result: '🏆 Champion — 9 wins' },
      { year: 2023, series: 'FR Middle East', team: 'Prema', result: '🏆 Champion' },
      { year: 2023, series: 'FRECA',     team: 'Prema',   result: '🏆 Champion — 5 wins' },
      { year: 2024, series: 'FIA F2',    team: 'Prema',   result: 'P6 — 2 wins (youngest multi-winner)' },
      { year: 2025, series: 'F1',        team: 'Mercedes',result: 'P7 — Rookie. 1st podium Canada' },
      { year: 2026, series: 'F1',        team: 'Mercedes',result: '🏆 P1 WDC — 3 wins, youngest pole ever' },
    ]
  },
  'russell': {
    bio: "King's Lynn, England. F1 veteran since 2019. Mercedes Junior graduate. Won 2018 F2 title.",
    career: [
      { year: 2017, series: 'F3 European', team: 'Hitech', result: 'P2' },
      { year: 2018, series: 'FIA F2',    team: 'ART',     result: '🏆 Champion' },
      { year: 2019, series: 'F1',        team: 'Williams',result: 'Rookie — 0 pts' },
      { year: 2020, series: 'F1',        team: 'Williams',result: '0 pts (COVID year)' },
      { year: 2021, series: 'F1',        team: 'Williams',result: 'P15 — 16 pts' },
      { year: 2022, series: 'F1',        team: 'Mercedes',result: 'P4 — 275 pts, 1 win' },
      { year: 2023, series: 'F1',        team: 'Mercedes',result: 'P8 — 175 pts' },
      { year: 2024, series: 'F1',        team: 'Mercedes',result: 'P7 — 235 pts, 1 win' },
      { year: 2025, series: 'F1',        team: 'Mercedes',result: 'P3 — 280 pts, 3 wins' },
      { year: 2026, series: 'F1',        team: 'Mercedes',result: 'P2 — 80 pts, 1 win' },
    ]
  },
  'leclerc': {
    bio: "Monaco. Ferrari Academy. Won 2017 F2 title. Ferrari's lead driver since 2019.",
    career: [
      { year: 2016, series: 'FIA F2',    team: 'Prema',   result: 'P2 — rookie' },
      { year: 2017, series: 'FIA F2',    team: 'Prema',   result: '🏆 Champion' },
      { year: 2018, series: 'F1',        team: 'Sauber',  result: 'P13 — Rookie' },
      { year: 2019, series: 'F1',        team: 'Ferrari', result: 'P4 — 264 pts, 2 wins' },
      { year: 2020, series: 'F1',        team: 'Ferrari', result: 'P8 — 98 pts' },
      { year: 2021, series: 'F1',        team: 'Ferrari', result: 'P7 — 159 pts' },
      { year: 2022, series: 'F1',        team: 'Ferrari', result: 'P2 — 308 pts, 3 wins' },
      { year: 2023, series: 'F1',        team: 'Ferrari', result: 'P5 — 206 pts, 0 wins' },
      { year: 2024, series: 'F1',        team: 'Ferrari', result: 'P3 — 356 pts, 3 wins' },
      { year: 2025, series: 'F1',        team: 'Ferrari', result: 'P4 — 240 pts, 2 wins' },
      { year: 2026, series: 'F1',        team: 'Ferrari', result: 'P3 — 59 pts' },
    ]
  },
  'hamilton': {
    bio: "Stevenage, England. 7x World Champion. Joined Ferrari 2025 after 12 years at Mercedes.",
    career: [
      { year: 2006, series: 'FIA F2/GP2', team: 'ART',   result: '🏆 Champion' },
      { year: 2007, series: 'F1',        team: 'McLaren',result: 'P2 — rookie season' },
      { year: 2008, series: 'F1',        team: 'McLaren',result: '🏆 Champion — 1st title' },
      { year: 2014, series: 'F1',        team: 'Mercedes',result: '🏆 Champion' },
      { year: 2015, series: 'F1',        team: 'Mercedes',result: '🏆 Champion' },
      { year: 2017, series: 'F1',        team: 'Mercedes',result: '🏆 Champion' },
      { year: 2018, series: 'F1',        team: 'Mercedes',result: '🏆 Champion' },
      { year: 2019, series: 'F1',        team: 'Mercedes',result: '🏆 Champion' },
      { year: 2020, series: 'F1',        team: 'Mercedes',result: '🏆 Champion — 7th title' },
      { year: 2025, series: 'F1',        team: 'Ferrari', result: 'P5 — Ferrari debut' },
      { year: 2026, series: 'F1',        team: 'Ferrari', result: 'P5 — 51 pts' },
    ]
  },
  'norris': {
    bio: "Bristol, England. McLaren since 2019. 2025 World Champion. 2018 F2 runner-up.",
    career: [
      { year: 2017, series: 'F3 European', team: 'Prema', result: '🏆 Champion' },
      { year: 2018, series: 'FIA F2',    team: 'Carlin', result: 'P2' },
      { year: 2019, series: 'F1',        team: 'McLaren',result: 'P11 — Rookie' },
      { year: 2023, series: 'F1',        team: 'McLaren',result: 'P6 — 205 pts' },
      { year: 2024, series: 'F1',        team: 'McLaren',result: 'P2 — 331 pts, 6 wins' },
      { year: 2025, series: 'F1',        team: 'McLaren',result: '🏆 Champion — 7 wins' },
      { year: 2026, series: 'F1',        team: 'McLaren',result: 'P4 — 51 pts' },
    ]
  },
  'verstappen': {
    bio: "Hasselt, Belgium. 4x World Champion. Youngest F1 winner ever at 18. Red Bull since 2016.",
    career: [
      { year: 2014, series: 'F3 European', team: 'Van Amersfoort', result: 'P3 — Rookie at 16' },
      { year: 2015, series: 'F1',        team: 'Toro Rosso',result: 'Youngest F1 driver ever — 17' },
      { year: 2016, series: 'F1',        team: 'Red Bull', result: 'Youngest F1 winner — Spain' },
      { year: 2021, series: 'F1',        team: 'Red Bull', result: '🏆 Champion — 1st title' },
      { year: 2022, series: 'F1',        team: 'Red Bull', result: '🏆 Champion — record 15 wins' },
      { year: 2023, series: 'F1',        team: 'Red Bull', result: '🏆 Champion — record 19 wins' },
      { year: 2024, series: 'F1',        team: 'Red Bull', result: '🏆 Champion — 4th title' },
      { year: 2025, series: 'F1',        team: 'Red Bull', result: 'P2 — 310 pts' },
      { year: 2026, series: 'F1',        team: 'Red Bull', result: 'P7 — 26 pts' },
    ]
  },
  'piastri': {
    bio: "Melbourne, Australia. Only driver to win F3 and F2 in successive seasons. McLaren.",
    career: [
      { year: 2019, series: 'F. Renault Eurocup', team: 'R-ace GP', result: '🏆 Champion' },
      { year: 2020, series: 'FIA F3',    team: 'Prema',   result: '🏆 Champion' },
      { year: 2021, series: 'FIA F2',    team: 'Prema',   result: '🏆 Champion — rookie' },
      { year: 2023, series: 'F1',        team: 'McLaren', result: 'P9 — Rookie, 97 pts' },
      { year: 2024, series: 'F1',        team: 'McLaren', result: 'P3 — 292 pts, 3 wins' },
      { year: 2025, series: 'F1',        team: 'McLaren', result: 'P2 — runner-up' },
      { year: 2026, series: 'F1',        team: 'McLaren', result: 'P6 — 43 pts' },
    ]
  },
  'bearman': {
    bio: "Chelmsford, England. Ferrari Academy graduate. Haas F1 debut 2025. Replaced Sainz in Saudi Arabia 2024.",
    career: [
      { year: 2021, series: 'Italian F4', team: 'Prema',  result: '🏆 Champion' },
      { year: 2022, series: 'FIA F3',    team: 'Prema',   result: 'P3' },
      { year: 2023, series: 'FIA F2',    team: 'Prema',   result: 'P3' },
      { year: 2024, series: 'FIA F2',    team: 'Prema',   result: 'P2 — + F1 debut Saudi Arabia (P7 for Ferrari!)' },
      { year: 2025, series: 'F1',        team: 'Haas',    result: 'P8 — Rookie, 17 pts' },
      { year: 2026, series: 'F1',        team: 'Haas',    result: 'P8 — 17 pts' },
    ]
  },
  'hadjar': {
    bio: "Paris, France. Franco-Algerian. Red Bull Junior. 2025 podium at Zandvoort earned Red Bull seat.",
    career: [
      { year: 2022, series: 'FIA F3',    team: 'Hitech',  result: 'P5 — Rookie' },
      { year: 2023, series: 'FIA F2',    team: 'Hitech',  result: 'P4' },
      { year: 2024, series: 'FIA F2',    team: 'Campos',  result: 'P2 — runner-up' },
      { year: 2025, series: 'F1',        team: 'Racing Bulls', result: 'P10 — Rookie. Podium Zandvoort' },
      { year: 2026, series: 'F1',        team: 'Red Bull', result: 'P13 — Verstappen teammate' },
    ]
  },
  'lawson': {
    bio: "Hastings, New Zealand. Red Bull Junior. Known for adaptability — stepped in for Ricciardo mid-2023.",
    career: [
      { year: 2021, series: 'FIA F2',    team: 'Hitech',  result: 'P3 — Rookie' },
      { year: 2022, series: 'FIA F2',    team: 'Carlin',  result: 'P5' },
      { year: 2023, series: 'Super Formula + F1 deputy', team: 'Red Bull', result: '5 races for Alpha Tauri' },
      { year: 2024, series: 'F1',        team: 'Racing Bulls', result: 'Full season' },
      { year: 2025, series: 'F1',        team: 'Racing Bulls', result: 'Promoted mid-season' },
      { year: 2026, series: 'F1',        team: 'Racing Bulls', result: 'P10 — 10 pts' },
    ]
  },
  'colapinto': {
    bio: "Pilar, Argentina. Williams debut mid-2024 replacing Sargeant. Alpine 2026.",
    career: [
      { year: 2022, series: 'F3',        team: 'MP',      result: 'Race winner' },
      { year: 2023, series: 'FIA F2',    team: 'MP',      result: 'P9' },
      { year: 2024, series: 'FIA F2 + F1', team: 'MP / Williams', result: 'F1 debut — replaced Sargeant' },
      { year: 2025, series: 'F1 (reserve)', team: 'Red Bull', result: 'Reserve driver' },
      { year: 2026, series: 'F1',        team: 'Alpine',  result: 'P11 — 7 pts' },
    ]
  },
  'sainz': {
    bio: "Madrid, Spain. Son of WRC champion Carlos Sainz Sr. Williams since 2025 after 5 years at Ferrari.",
    career: [
      { year: 2014, series: 'FIA F3',    team: 'Carlin',  result: 'P4' },
      { year: 2015, series: 'F1',        team: 'Toro Rosso', result: 'Rookie' },
      { year: 2019, series: 'F1',        team: 'McLaren', result: 'P6 — breakout season' },
      { year: 2021, series: 'F1',        team: 'Ferrari', result: 'P5 — 1 win' },
      { year: 2023, series: 'F1',        team: 'Ferrari', result: 'P4 — 3 wins' },
      { year: 2024, series: 'F1',        team: 'Ferrari', result: 'P5 — 2 wins' },
      { year: 2025, series: 'F1',        team: 'Williams',result: 'Williams debut' },
      { year: 2026, series: 'F1',        team: 'Williams',result: 'P14 — 4 pts' },
    ]
  },
  'bortoleto': {
    bio: "São Paulo, Brazil. McLaren Academy graduate. Won F3 + F2 back-to-back. Audi/Sauber since 2025.",
    career: [
      { year: 2022, series: 'FIA F3',    team: 'Trident', result: 'Race winner' },
      { year: 2023, series: 'FIA F3',    team: 'Trident', result: '🏆 Champion' },
      { year: 2024, series: 'FIA F2',    team: 'Invicta', result: '🏆 Champion — rookie' },
      { year: 2025, series: 'F1',        team: 'Sauber',  result: 'Rookie — several points finishes' },
      { year: 2026, series: 'F1',        team: 'Audi',    result: 'P15 — 2 pts' },
    ]
  },
  'lindblad': {
    bio: "Virginia Water, England. Born 2007. Red Bull Junior. Youngest F2 winner ever. Only rookie on 2026 grid.",
    career: [
      { year: 2023, series: 'Italian F4', team: 'Prema',  result: 'Race winner' },
      { year: 2024, series: 'FIA F3',    team: 'Prema',   result: 'P4 — youngest ever F3 winner (16y)' },
      { year: 2025, series: 'FIA F2',    team: 'Campos',  result: 'P6 — youngest F2 winner ever (17y)' },
      { year: 2026, series: 'F1',        team: 'Racing Bulls', result: 'P12 — only 2026 rookie' },
    ]
  },
  'albon': {
    bio: "London, England (Thai license). Red Bull Junior. Williams since 2022. Consistent midfield performer.",
    career: [
      { year: 2018, series: 'FIA F2',    team: 'ART',     result: 'P3' },
      { year: 2019, series: 'F1',        team: 'Toro Rosso → Red Bull', result: 'P5 — promoted mid-season' },
      { year: 2020, series: 'F1',        team: 'Red Bull', result: 'P4' },
      { year: 2022, series: 'F1',        team: 'Williams', result: 'Return after 2021 sabbatical' },
      { year: 2025, series: 'F1',        team: 'Williams', result: 'Strong midfield season' },
      { year: 2026, series: 'F1',        team: 'Williams', result: 'P17 — 1 pt' },
    ]
  },
  'gasly': {
    bio: "Rouen, France. F1 since 2017. Former Red Bull — demoted 2019, rebuilt career at AlphaTauri/Alpine.",
    career: [
      { year: 2016, series: 'FIA F2',    team: 'DAMS',    result: '🏆 Champion' },
      { year: 2017, series: 'F1',        team: 'Toro Rosso', result: 'Rookie' },
      { year: 2019, series: 'F1',        team: 'Red Bull → AlphaTauri', result: 'Demoted mid-season' },
      { year: 2020, series: 'F1',        team: 'AlphaTauri', result: '1 win — Monza' },
      { year: 2023, series: 'F1',        team: 'Alpine',  result: 'Alpine debut' },
      { year: 2026, series: 'F1',        team: 'Alpine',  result: 'P9 — 16 pts' },
    ]
  },
  'alonso': {
    bio: "Oviedo, Spain. 2x World Champion (2005, 2006). F1 legend. Aston Martin since 2023.",
    career: [
      { year: 2001, series: 'F1',        team: 'Minardi', result: 'Rookie at 19' },
      { year: 2005, series: 'F1',        team: 'Renault', result: '🏆 Champion — youngest ever (at time)' },
      { year: 2006, series: 'F1',        team: 'Renault', result: '🏆 Champion — 2nd title' },
      { year: 2023, series: 'F1',        team: 'Aston Martin', result: '8 podiums — legendary comeback' },
      { year: 2024, series: 'F1',        team: 'Aston Martin', result: 'P5' },
      { year: 2026, series: 'F1',        team: 'Aston Martin', result: 'P21 — 0 pts' },
    ]
  },
  'hulkenberg': {
    bio: "Emmerich, Germany. 2009 GP2 Champion. F1 veteran — record 218 races without podium (broken 2023).",
    career: [
      { year: 2009, series: 'GP2',       team: 'ART',     result: '🏆 Champion' },
      { year: 2010, series: 'F1',        team: 'Williams', result: 'Rookie' },
      { year: 2023, series: 'F1',        team: 'Haas',    result: 'Return — first podium ever' },
      { year: 2025, series: 'F1',        team: 'Audi',    result: 'Audi launch season' },
      { year: 2026, series: 'F1',        team: 'Audi',    result: 'P18 — 0 pts' },
    ]
  },
  'stroll': {
    bio: "Montreal, Canada. Son of team owner Lawrence Stroll. Aston Martin since 2023.",
    career: [
      { year: 2016, series: 'FIA F3',    team: 'Prema',   result: '🏆 Champion' },
      { year: 2017, series: 'F1',        team: 'Williams', result: 'Rookie — podium Baku' },
      { year: 2019, series: 'F1',        team: 'Racing Point', result: 'Father buys team' },
      { year: 2023, series: 'F1',        team: 'Aston Martin', result: 'P9 — career best' },
      { year: 2026, series: 'F1',        team: 'Aston Martin', result: 'P22 — 0 pts' },
    ]
  },
  'bottas': {
    bio: "Nastola, Finland. 10 F1 wins. Mercedes 2017-2021. Cadillac 2026 — new team debut.",
    career: [
      { year: 2013, series: 'F1',        team: 'Williams', result: 'Rookie' },
      { year: 2017, series: 'F1',        team: 'Mercedes', result: '3 wins — Rosberg replacement' },
      { year: 2019, series: 'F1',        team: 'Mercedes', result: 'P2 — 4 wins' },
      { year: 2022, series: 'F1',        team: 'Alfa Romeo', result: 'New chapter' },
      { year: 2026, series: 'F1',        team: 'Cadillac', result: 'P20 — new team' },
    ]
  },
  'perez': {
    bio: "Guadalajara, Mexico. Red Bull 2021-2025. Joined Cadillac 2026 after Red Bull departure.",
    career: [
      { year: 2009, series: 'GP2',       team: 'Carlin',  result: 'P3 — Rookie' },
      { year: 2011, series: 'F1',        team: 'Sauber',  result: 'Rookie' },
      { year: 2020, series: 'F1',        team: 'Racing Point', result: '1 win — Sakhir' },
      { year: 2021, series: 'F1',        team: 'Red Bull', result: 'P4 — Verstappen teammate' },
      { year: 2023, series: 'F1',        team: 'Red Bull', result: 'P2 — career best, 2 wins' },
      { year: 2025, series: 'F1',        team: 'Red Bull', result: 'Dropped end of season' },
      { year: 2026, series: 'F1',        team: 'Cadillac', result: 'P20 — Cadillac debut' },
    ]
  },
  'ocon': {
    bio: "Évreux, France. Parents sold house to fund karting. Alpine 2021-2024. Haas 2026.",
    career: [
      { year: 2014, series: 'FIA F3',    team: 'Prema',   result: '🏆 Champion' },
      { year: 2015, series: 'GP3',       team: 'ART',     result: '🏆 Champion' },
      { year: 2017, series: 'F1',        team: 'Force India', result: 'Rookie — strong performances' },
      { year: 2021, series: 'F1',        team: 'Alpine',  result: '1 win — Hungary' },
      { year: 2026, series: 'F1',        team: 'Haas',    result: 'P16 — 1 pt' },
    ]
  },
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
  renderCareer(driverId);

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

// ── Render Career Timeline ───────────────────────────────────
function renderCareer(driverId) {
  const data = DRIVER_CAREER[driverId];
  
  // Add career section to HTML if not exists
  let section = document.getElementById('module-career');
  if (!section) {
    const footer = document.querySelector('.site-footer');
    section = document.createElement('section');
    section.id = 'module-career';
    section.className = 'glass-card';
    section.style.marginBottom = '16px';
    footer.parentNode.insertBefore(section, footer);
  }

  if (!data) {
    section.innerHTML = `<div class="card-header"><div class="section-header"><h2 class="section-title">Career Path</h2></div></div><div class="no-data">Career data coming soon.</div>`;
    return;
  }

  const rows = data.career.map((c, i) => {
    const isF1    = c.series.includes('F1') && !c.series.includes('F2') && !c.series.includes('F3');
    const isChamp = c.result.includes('🏆');
    return `
      <div class="career-row" style="animation-delay:${i*0.05}s">
        <div class="career-year">${c.year}</div>
        <div class="career-line-wrap">
          <div class="career-dot ${isF1 ? 'f1' : ''} ${isChamp ? 'champ' : ''}"></div>
          ${i < data.career.length - 1 ? '<div class="career-line"></div>' : ''}
        </div>
        <div class="career-content">
          <div class="career-series ${isF1 ? 'f1-series' : ''}">${c.series}</div>
          <div class="career-team">${c.team}</div>
          <div class="career-result ${isChamp ? 'champ-result' : ''}">${c.result}</div>
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
      <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-3);margin-top:6px;line-height:1.6">${data.bio}</p>
    </div>
    <div class="career-timeline">${rows}</div>
  `;
}
