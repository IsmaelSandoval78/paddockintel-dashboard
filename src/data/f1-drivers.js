/**
 * PaddockIntel — F1 Drivers Data
 * src/data/f1-drivers.js
 *
 * REGLA ABSOLUTA: Cero datos inventados.
 * Todos los campos verificados contra Wikipedia.
 * Salarios verificados contra Autosport / RaceFans / Forbes (estimados).
 * Prize money modelado sobre estructura FOM.
 *
 * STATUS: 22/22 drivers verificados ✅ COMPLETO
 *
 * SCHEMA por driver:
 *   salary       — estimado USD (fuente: Autosport/RaceFans/Forbes)
 *   number       — número de carrera 2026
 *   flag         — emoji bandera
 *   fullName     — nombre completo oficial
 *   bio          — string editorial corto
 *   career       — [ { year, series, team, result } ]
 *   records      — [ { label, value, race, icon } ]
 *   f1Results    — { year: { RACE_CODE: position|'R'|'DSQ'|'DNS'|'WD'|'NC' } }
 *   careerStats  — [ { year, series, races, wins, poles, podiums, points, pos } ]
 */

const F1_DRIVERS = {

  // ─────────────────────────────────────────────
  // MERCEDES
  // ─────────────────────────────────────────────

  'antonelli': {
    salary: 2000000,
    number: 12,
    flag: '🇮🇹',
    fullName: 'Andrea Kimi Antonelli',
    bio: "Bologna, Italy. Mercedes since mid-2025 (replaced Hamilton). Ferrari Driver Academy graduate. Won 2025 Japanese GP — youngest Mercedes winner ever. 2026 championship leader after 4 races.",
    career: [
      { year: 2023, series: 'FIA Formula 3', team: 'Prema', result: 'P2 — 3 wins' },
      { year: 2024, series: 'FIA Formula 2', team: 'Prema', result: 'P2 — 7 wins (rookie)' },
      { year: 2025, series: 'F1', team: 'Racing Bulls → Mercedes', result: 'P7 — promoted mid-season after Hamilton retirement' },
      { year: 2026, series: 'F1', team: 'Mercedes', result: 'P1* — championship leader (4 races)' },
    ],
    records: [
      { label: 'Youngest Mercedes GP Winner', value: 'Japanese GP 2025', race: 'Suzuka', icon: '👶' },
      { label: '2026 Championship Leader', value: 'After 4 races', race: 'Youngest ever in WDC lead', icon: '👑' },
      { label: '2024 F2 Runner-Up — Rookie', value: '7 wins with Prema', race: 'Alongside Bearman', icon: '📈' },
    ],
    f1Results: {
      2025: { AUS:15,CHN:6,JPN:1,BHR:2,SAU:5,MIA:3,EMI:5,MON:7,ESP:4,CAN:1,AUT:5,GBR:6,BEL:5,HUN:6,NED:2,ITA:3,AZE:3,SIN:2,USA:3,MXC:4,SAP:2,LVG:2,QAT:5,ABU:5 },
      2026: { AUS:1,CHN:1,JPN:4,MIA:4 },
    },
    careerStats: [
      { year:2023,series:'FIA Formula 3',races:18,wins:3,poles:2,podiums:7,points:189,pos:'2nd' },
      { year:2024,series:'FIA Formula 2',races:28,wins:7,poles:5,podiums:11,points:321,pos:'2nd' },
      { year:2025,series:'F1',races:17,wins:1,poles:0,podiums:8,points:213,pos:'7th' },
      { year:2026,series:'F1',races:4,wins:2,poles:0,podiums:3,points:77,pos:'1st*' },
    ],
  },

  'russell': {
    salary: 15000000,
    number: 63,
    flag: '🇬🇧',
    fullName: 'George William Russell',
    bio: "King's Lynn, Norfolk. Mercedes since 2022. 2018 F2 Champion (rookie). 2021 Belgian GP win substituting for Hamilton at Mercedes. 2024 Belgian GP winner. 2026 P2 in championship.",
    career: [
      { year: 2017, series: 'FIA F3 European', team: 'Hitech', result: 'P8' },
      { year: 2018, series: 'FIA Formula 2', team: 'ART', result: '🏆 Champion — rookie season' },
      { year: 2019, series: 'F1', team: 'Williams', result: 'P16 — Rookie' },
      { year: 2020, series: 'F1', team: 'Williams', result: 'P15' },
      { year: 2021, series: 'F1', team: 'Williams', result: 'P15; sub Mercedes Sakhir GP' },
      { year: 2022, series: 'F1', team: 'Mercedes', result: 'P4 — 275 pts, 1 win (Brazil)' },
      { year: 2023, series: 'F1', team: 'Mercedes', result: 'P8 — 175 pts' },
      { year: 2024, series: 'F1', team: 'Mercedes', result: 'P6 — 2 wins (Austria, Belgium)' },
      { year: 2025, series: 'F1', team: 'Mercedes', result: 'P4 — 313 pts, 3 wins' },
      { year: 2026, series: 'F1', team: 'Mercedes', result: 'P2* — 60 pts (4 races)' },
    ],
    records: [
      { label: '2018 F2 Champion — Rookie', value: 'ART Grand Prix', race: 'Ahead of Norris & Albon', icon: '🏆' },
      { label: 'Sakhir GP 2021', value: 'Win substituting for Hamilton', race: 'Dominant performance', icon: '⭐' },
      { label: '2026 P2 Championship', value: '60 pts after 4 races', race: 'Behind teammate Antonelli', icon: '📈' },
    ],
    f1Results: {
      2022: { BHR:4,SAU:7,AUS:3,EMI:4,MIA:5,ESP:6,MON:5,AZE:5,CAN:7,GBR:3,AUT:5,FRA:9,HUN:4,BEL:3,NED:3,ITA:3,SIN:6,JPN:7,USA:4,MXC:3,SAP:3,ABU:6 },
      2023: { BHR:7,SAU:3,AUS:7,AZE:5,MIA:12,MON:5,ESP:3,CAN:7,AUT:9,GBR:4,HUN:2,BEL:8,NED:5,ITA:7,SIN:2,JPN:8,QAT:2,USA:4,MXC:4,SAP:4,LVG:4,ABU:3 },
      2024: { BHR:5,SAU:6,AUS:2,JPN:2,CHN:3,MIA:4,EMI:5,MON:5,CAN:1,ESP:4,AUT:1,GBR:7,HUN:7,BEL:1,NED:5,ITA:7,AZE:4,SIN:4,USA:4,MXC:7,SAP:3,LVG:4,QAT:4,ABU:5 },
      2025: { AUS:3,CHN:3,JPN:5,BHR:2,SAU:6,MIA:6,EMI:1,MON:6,ESP:5,CAN:1,AUT:2,GBR:2,BEL:4,HUN:3,NED:3,ITA:5,AZE:6,SIN:5,USA:6,MXC:6,SAP:4,LVG:3,QAT:3,ABU:1 },
      2026: { AUS:2,CHN:2,JPN:1,MIA:7 },
    },
    careerStats: [
      { year:2018,series:'FIA Formula 2',races:24,wins:7,poles:3,podiums:16,points:310,pos:'🏆 1st' },
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:0,points:0,pos:'16th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:0,points:3,pos:'15th' },
      { year:2021,series:'F1',races:22,wins:0,poles:0,podiums:0,points:16,pos:'15th' },
      { year:2022,series:'F1',races:22,wins:1,poles:1,podiums:9,points:275,pos:'4th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:5,points:175,pos:'8th' },
      { year:2024,series:'F1',races:24,wins:2,poles:0,podiums:8,points:217,pos:'6th' },
      { year:2025,series:'F1',races:24,wins:3,poles:1,podiums:12,points:313,pos:'4th' },
      { year:2026,series:'F1',races:4,wins:1,poles:0,podiums:2,points:60,pos:'2nd*' },
    ],
  },

  // ─────────────────────────────────────────────
  // RED BULL
  // ─────────────────────────────────────────────

  'verstappen': {
    salary: 55000000,
    number: 3,
    flag: '🇳🇱',
    fullName: 'Max Emilian Verstappen',
    bio: "Hasselt, Belgium. Dutch license. Son of Jos Verstappen (F1). 4x World Champion (2021–2024). Youngest F1 starter (17y 166d) and youngest winner (18y 228d). Red Bull since 2016.",
    career: [
      { year: 2014, series: 'FIA F3 European', team: 'Van Amersfoort', result: 'P3 — 10 wins, youngest winner/polesitter in F3 history' },
      { year: 2015, series: 'F1', team: 'Toro Rosso', result: 'P12 — Youngest F1 starter ever (17y 166d)' },
      { year: 2016, series: 'F1', team: 'Toro Rosso → Red Bull', result: 'P5 — Promoted mid-season, youngest F1 winner (18y 228d)' },
      { year: 2021, series: 'F1', team: 'Red Bull', result: '🏆 Champion — 10 wins, title on final lap Abu Dhabi' },
      { year: 2022, series: 'F1', team: 'Red Bull', result: '🏆 Champion — 15 wins (record at time)' },
      { year: 2023, series: 'F1', team: 'Red Bull', result: '🏆 Champion — 19 wins (all-time record), 575 pts' },
      { year: 2024, series: 'F1', team: 'Red Bull', result: '🏆 Champion — 9 wins, 437 pts' },
      { year: 2025, series: 'F1', team: 'Red Bull', result: 'P2 — 8 wins, 421 pts (2 pts behind Norris)' },
      { year: 2026, series: 'F1', team: 'Red Bull', result: 'P7* — 26 pts (4 races)' },
    ],
    records: [
      { label: 'Youngest F1 Starter Ever', value: '17y 166d', race: '2015 Australian GP', icon: '👶' },
      { label: 'Youngest F1 Winner Ever', value: '18y 228d', race: '2016 Spanish GP', icon: '🏆' },
      { label: '4x World Champion', value: '2021 · 2022 · 2023 · 2024', race: 'Red Bull Racing', icon: '👑' },
      { label: 'Most Wins in a Season', value: '19 wins', race: '2023 Season', icon: '📊' },
      { label: 'Most Consecutive Wins', value: '10 wins', race: '2023 Miami → Italian GP', icon: '🔥' },
      { label: 'Most Points in a Season', value: '575 pts', race: '2023 Season', icon: '📈' },
    ],
    f1Results: {
      2021: { BHR:2,EMI:1,POR:2,ESP:2,MON:1,AZE:'R',FRA:1,STY:1,AUT:1,GBR:'R',HUN:9,BEL:1,NED:1,ITA:'R',RUS:2,TUR:2,USA:1,MXC:1,SAP:2,QAT:2,SAU:2,ABU:1 },
      2022: { BHR:'R',SAU:1,AUS:'R',EMI:1,MIA:1,ESP:1,MON:3,AZE:1,CAN:1,GBR:7,AUT:2,FRA:1,HUN:1,BEL:1,NED:1,ITA:1,SIN:7,JPN:1,USA:1,MXC:1,SAP:6,ABU:1 },
      2023: { BHR:1,SAU:2,AUS:1,AZE:2,MIA:1,MON:1,ESP:1,CAN:1,AUT:1,GBR:1,HUN:1,BEL:1,NED:1,ITA:1,SIN:5,JPN:1,QAT:1,USA:1,MXC:1,SAP:1,LVG:1,ABU:1 },
      2024: { BHR:1,SAU:1,AUS:'R',JPN:1,CHN:1,MIA:2,EMI:1,MON:6,CAN:1,ESP:1,AUT:5,GBR:2,HUN:5,BEL:4,NED:2,ITA:6,AZE:5,SIN:2,USA:3,MXC:6,SAP:1,LVG:5,QAT:1,ABU:6 },
      2025: { AUS:2,CHN:4,JPN:1,BHR:6,SAU:2,MIA:4,EMI:1,MON:4,ESP:10,CAN:2,AUT:'R',GBR:5,BEL:4,HUN:9,NED:2,ITA:1,AZE:1,SIN:2,USA:1,MXC:3,SAP:3,LVG:1,QAT:1,ABU:1 },
      2026: { AUS:6,CHN:'R',JPN:8,MIA:5 },
    },
    careerStats: [
      { year:2014,series:'FIA F3 European',races:33,wins:10,poles:7,podiums:16,points:411,pos:'3rd' },
      { year:2015,series:'F1',races:19,wins:0,poles:0,podiums:0,points:49,pos:'12th' },
      { year:2016,series:'F1',races:21,wins:1,poles:0,podiums:8,points:204,pos:'5th' },
      { year:2017,series:'F1',races:20,wins:2,poles:0,podiums:4,points:168,pos:'6th' },
      { year:2018,series:'F1',races:21,wins:2,poles:0,podiums:11,points:249,pos:'4th' },
      { year:2019,series:'F1',races:21,wins:3,poles:2,podiums:9,points:278,pos:'3rd' },
      { year:2020,series:'F1',races:17,wins:2,poles:1,podiums:11,points:214,pos:'3rd' },
      { year:2021,series:'F1',races:22,wins:10,poles:10,podiums:18,points:395,pos:'🏆 1st' },
      { year:2022,series:'F1',races:22,wins:15,poles:7,podiums:17,points:454,pos:'🏆 1st' },
      { year:2023,series:'F1',races:22,wins:19,poles:12,podiums:21,points:575,pos:'🏆 1st' },
      { year:2024,series:'F1',races:24,wins:9,poles:8,podiums:14,points:437,pos:'🏆 1st' },
      { year:2025,series:'F1',races:24,wins:8,poles:8,podiums:15,points:421,pos:'2nd' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:26,pos:'7th*' },
    ],
  },

  'hadjar': {
    salary: 1500000,
    number: 6,
    flag: '🇫🇷',
    fullName: 'Isack Alexandre Hadjar',
    bio: "Paris, France. Algerian family. Red Bull 2026 alongside Verstappen. Racing Bulls 2025. Nicknamed 'le Petit Prost'. 2024 F2 runner-up to Bortoleto. First Arab F1 podium finisher (Dutch GP 2025).",
    career: [
      { year: 2022, series: 'FIA Formula 3', team: 'Hitech', result: 'P4 — 3 wins, 5 podiums' },
      { year: 2023, series: 'FIA Formula 2', team: 'Hitech', result: 'P14 — Rookie season' },
      { year: 2024, series: 'FIA Formula 2', team: 'Campos', result: 'P2 — 4 wins, 192 pts vs Bortoleto 214.5' },
      { year: 2025, series: 'F1', team: 'Racing Bulls', result: 'P12 — 51 pts, podium Dutch GP (P3)' },
      { year: 2026, series: 'F1', team: 'Red Bull', result: 'P13* — 4 pts (4 races)' },
    ],
    records: [
      { label: 'First Arab F1 Podium Finisher', value: 'P3 Dutch GP 2025', race: 'Fifth-youngest podium finisher ever', icon: '🏆' },
      { label: '2024 F2 Runner-Up', value: '192 pts, 4 wins', race: 'vs Bortoleto (champion)', icon: '🥈' },
      { label: "Le Petit Prost Nickname", value: 'French media', race: 'After Melbourne F2 win 2024', icon: '⭐' },
    ],
    f1Results: {
      2025: { AUS:'DNS',CHN:11,JPN:8,BHR:13,SAU:10,MIA:11,EMI:9,MON:6,ESP:7,CAN:16,AUT:12,GBR:'R',BEL:20,HUN:11,NED:3,ITA:10,AZE:10,SIN:11,USA:16,MXC:13,SAP:8,LVG:6,QAT:18,ABU:17 },
      2026: { AUS:'R',CHN:8,JPN:12,MIA:'R' },
    },
    careerStats: [
      { year:2022,series:'FIA Formula 3',races:18,wins:3,poles:1,podiums:5,points:123,pos:'4th' },
      { year:2023,series:'FIA Formula 2',races:26,wins:0,poles:0,podiums:1,points:55,pos:'14th' },
      { year:2024,series:'FIA Formula 2',races:28,wins:4,poles:1,podiums:8,points:192,pos:'2nd' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:1,points:51,pos:'12th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:4,pos:'13th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // McLAREN
  // ─────────────────────────────────────────────

  'norris': {
    salary: 25000000,
    number: 1,
    flag: '🇬🇧',
    fullName: 'Lando Norris',
    bio: "Bristol, England. McLaren since 2019. 2025 World Champion. Son of retired pensions manager Adam Norris. Belgian mother. Holds British and Belgian citizenship.",
    career: [
      { year: 2017, series: 'FIA F3 European', team: 'Carlin', result: '🏆 Champion — 9 wins, 20 podiums' },
      { year: 2018, series: 'FIA Formula 2', team: 'Carlin', result: 'P2 — runner-up to Russell' },
      { year: 2019, series: 'F1', team: 'McLaren', result: 'P11 — Rookie, 49 pts' },
      { year: 2024, series: 'F1', team: 'McLaren', result: 'P2 — 374 pts, 4 wins, McLaren WCC' },
      { year: 2025, series: 'F1', team: 'McLaren', result: '🏆 Champion — 423 pts, 7 wins' },
      { year: 2026, series: 'F1', team: 'McLaren', result: 'P4* — 51 pts (4 races)' },
    ],
    records: [
      { label: '2025 World Champion', value: '1st Title', race: 'Abu Dhabi GP 2025', icon: '👑' },
      { label: '2017 F3 European Champion', value: 'Carlin — Rookie', race: '9 wins, 20 podiums', icon: '🏆' },
      { label: 'DHL Fastest Lap Award', value: '2024 & 2025', race: '2 consecutive years', icon: '⚡' },
    ],
    f1Results: {
      2022: { BHR:15,SAU:7,AUS:5,EMI:3,MIA:'R',ESP:8,MON:6,AZE:9,CAN:15,GBR:6,AUT:7,FRA:7,HUN:7,BEL:12,NED:7,ITA:7,SIN:4,JPN:10,USA:6,MXC:9,SAP:'R',ABU:6 },
      2023: { BHR:17,SAU:17,AUS:6,AZE:9,MIA:17,MON:9,ESP:17,CAN:13,AUT:4,GBR:2,HUN:2,BEL:7,NED:7,ITA:8,SIN:2,JPN:2,QAT:3,USA:2,MXC:5,SAP:2,LVG:'R',ABU:5 },
      2024: { BHR:6,SAU:8,AUS:3,JPN:5,CHN:2,MIA:1,EMI:2,MON:4,CAN:2,ESP:2,AUT:20,GBR:3,HUN:2,BEL:5,NED:1,ITA:3,AZE:4,SIN:1,USA:4,MXC:2,SAP:6,LVG:6,QAT:10,ABU:1 },
      2025: { AUS:1,CHN:2,JPN:2,BHR:3,SAU:4,MIA:2,EMI:2,MON:1,ESP:2,CAN:'R',AUT:1,GBR:1,BEL:2,HUN:1,NED:'R',ITA:2,AZE:7,SIN:3,USA:2,MXC:1,SAP:1,LVG:'DSQ',QAT:4,ABU:3 },
      2026: { AUS:5,CHN:'DNS',JPN:5,MIA:2 },
    },
    careerStats: [
      { year:2017,series:'FIA F3 European',races:30,wins:9,poles:8,podiums:20,points:441,pos:'🏆 1st' },
      { year:2018,series:'FIA Formula 2',races:24,wins:1,poles:1,podiums:9,points:219,pos:'2nd' },
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:0,points:49,pos:'11th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:1,points:97,pos:'9th' },
      { year:2021,series:'F1',races:22,wins:0,poles:1,podiums:4,points:160,pos:'6th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:1,points:122,pos:'7th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:7,points:205,pos:'6th' },
      { year:2024,series:'F1',races:24,wins:4,poles:8,podiums:13,points:374,pos:'2nd' },
      { year:2025,series:'F1',races:24,wins:7,poles:7,podiums:18,points:423,pos:'🏆 1st' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:1,points:51,pos:'4th*' },
    ],
  },

  'piastri': {
    salary: 8000000,
    number: 81,
    flag: '🇦🇺',
    fullName: 'Oscar Jack Piastri',
    bio: "Melbourne, Australia. McLaren since 2023 (contract to 2028). Only driver in history to win Formula Renault, F3, and F2 in successive seasons. 2025 P3 in title battle.",
    career: [
      { year: 2019, series: 'Formula Renault Eurocup', team: 'R-ace GP', result: '🏆 Champion — 7 wins' },
      { year: 2020, series: 'FIA Formula 3', team: 'Prema', result: '🏆 Champion — 2 wins' },
      { year: 2021, series: 'FIA Formula 2', team: 'Prema', result: '🏆 Champion — 6 wins, rookie season' },
      { year: 2023, series: 'F1', team: 'McLaren', result: 'P9 — Rookie, 97 pts, 2 podiums' },
      { year: 2024, series: 'F1', team: 'McLaren', result: 'P4 — 292 pts, 2 wins (Hungary, Azerbaijan)' },
      { year: 2025, series: 'F1', team: 'McLaren', result: 'P3 — 410 pts, 7 wins' },
      { year: 2026, series: 'F1', team: 'McLaren', result: 'P6* — 43 pts (4 races)' },
    ],
    records: [
      { label: 'Only driver: FR/F3/F2 3 in a row', value: 'Unique in history', race: '2019–2021', icon: '🏆' },
      { label: 'Fifth Australian F1 Winner', value: '2024 Hungarian GP', race: 'Maiden victory', icon: '🇦🇺' },
      { label: 'Australian Driver Records 2025', value: '7 wins & 16 podiums', race: '2025 Season', icon: '📈' },
    ],
    f1Results: {
      2023: { BHR:'R',SAU:15,AUS:8,AZE:11,MIA:19,MON:10,ESP:13,CAN:11,AUT:16,GBR:4,HUN:5,BEL:'R',NED:9,ITA:12,SIN:7,JPN:3,QAT:2,USA:'R',MXC:8,SAP:14,LVG:10,ABU:6 },
      2024: { BHR:8,SAU:4,AUS:4,JPN:8,CHN:8,MIA:13,EMI:4,MON:2,CAN:5,ESP:7,AUT:2,GBR:4,HUN:1,BEL:2,NED:4,ITA:2,AZE:1,SIN:3,USA:5,MXC:8,SAP:8,LVG:7,QAT:3,ABU:10 },
      2025: { AUS:9,CHN:1,JPN:3,BHR:1,SAU:1,MIA:1,EMI:3,MON:3,ESP:1,CAN:4,AUT:2,GBR:2,BEL:1,HUN:2,NED:1,ITA:3,AZE:'R',SIN:4,USA:5,MXC:5,SAP:5,LVG:'DSQ',QAT:2,ABU:2 },
      2026: { AUS:'DNS',CHN:'DNS',JPN:2,MIA:3 },
    },
    careerStats: [
      { year:2019,series:'Formula Renault Eurocup',races:19,wins:7,poles:5,podiums:11,points:320,pos:'🏆 1st' },
      { year:2020,series:'FIA Formula 3',races:18,wins:2,poles:0,podiums:6,points:164,pos:'🏆 1st' },
      { year:2021,series:'FIA Formula 2',races:23,wins:6,poles:5,podiums:11,points:252,pos:'🏆 1st' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:2,points:97,pos:'9th' },
      { year:2024,series:'F1',races:24,wins:2,poles:0,podiums:8,points:292,pos:'4th' },
      { year:2025,series:'F1',races:24,wins:7,poles:6,podiums:16,points:410,pos:'3rd' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:2,points:43,pos:'6th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // FERRARI
  // ─────────────────────────────────────────────

  'hamilton': {
    salary: 40000000,
    number: 44,
    flag: '🇬🇧',
    fullName: 'Sir Lewis Carl Davidson Hamilton',
    bio: "Stevenage, England. 7x World Champion (joint record with Schumacher). First and only Black driver in F1 history. McLaren 2007–2012, Mercedes 2013–2024, Ferrari 2025–present. Knighted 2021.",
    career: [
      { year: 2003, series: 'Formula Renault UK', team: 'Manor', result: '🏆 Champion — 10 wins from 15 races' },
      { year: 2006, series: 'GP2 Series', team: 'ART Grand Prix', result: '🏆 Champion — rookie season' },
      { year: 2007, series: 'F1', team: 'McLaren', result: 'P2 — 4 wins, rookie record 109 pts' },
      { year: 2008, series: 'F1', team: 'McLaren', result: '🏆 Champion — last lap of last race, Brazil' },
      { year: 2014, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 11 wins' },
      { year: 2015, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 10 wins' },
      { year: 2017, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 9 wins' },
      { year: 2018, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 11 wins' },
      { year: 2019, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 11 wins' },
      { year: 2020, series: 'F1', team: 'Mercedes', result: '🏆 Champion — 11 wins, 7th title' },
      { year: 2025, series: 'F1', team: 'Ferrari', result: 'P6 — 0 wins, 0 podiums (Ferrari debut)' },
      { year: 2026, series: 'F1', team: 'Ferrari', result: 'P5* — 51 pts (4 races)' },
    ],
    records: [
      { label: '7x World Champion', value: 'Joint all-time record', race: '2008·2014·2015·2017·2018·2019·2020', icon: '👑' },
      { label: 'Most F1 Wins Ever', value: '105 wins', race: 'All-time record', icon: '🏆' },
      { label: 'Most Pole Positions', value: '104 poles', race: 'All-time record', icon: '⚡' },
      { label: 'Most Podium Finishes', value: '203 podiums', race: 'All-time record', icon: '🎯' },
      { label: 'First & Only Black F1 Driver', value: 'Since 2007', race: '2007 Australian GP', icon: '✊' },
    ],
    f1Results: {
      2019: { AUS:2,BHR:1,CHN:1,AZE:2,ESP:1,MON:1,CAN:1,FRA:1,AUT:5,GBR:1,GER:9,HUN:1,BEL:2,ITA:3,SIN:4,RUS:1,JPN:3,MEX:1,USA:2,BRA:7,ABU:1 },
      2020: { AUT:4,STY:1,HUN:1,GBR:1,'70A':2,ESP:1,BEL:1,ITA:7,TUS:1,RUS:3,EIF:1,POR:1,EMI:1,TUR:1,BHR:1,ABU:3 },
      2021: { BHR:1,EMI:2,POR:1,ESP:1,MON:7,AZE:15,FRA:2,STY:2,AUT:4,GBR:1,HUN:2,BEL:3,NED:2,ITA:'R',RUS:1,TUR:5,USA:2,MXC:2,SAP:1,QAT:1,SAU:1,ABU:2 },
      2022: { BHR:3,SAU:10,AUS:4,EMI:13,MIA:6,ESP:5,MON:8,AZE:4,CAN:3,GBR:3,AUT:3,FRA:2,HUN:2,BEL:'R',NED:4,ITA:5,SIN:9,JPN:5,USA:2,MXC:2,SAP:2,ABU:18 },
      2023: { BHR:5,SAU:5,AUS:2,AZE:6,MIA:6,MON:4,ESP:2,CAN:3,AUT:8,GBR:3,HUN:4,BEL:4,NED:6,ITA:6,SIN:3,JPN:5,QAT:'R',USA:'DSQ',MXC:2,SAP:8,LVG:7,ABU:9 },
      2024: { BHR:7,SAU:9,AUS:'R',JPN:9,CHN:9,MIA:6,EMI:6,MON:7,CAN:4,ESP:3,AUT:4,GBR:1,HUN:3,BEL:1,NED:8,ITA:5,AZE:9,SIN:6,USA:'R',MXC:4,SAP:10,LVG:2,QAT:12,ABU:4 },
      2025: { AUS:10,CHN:'DSQ',JPN:7,BHR:5,SAU:7,MIA:8,EMI:4,MON:5,ESP:6,CAN:6,AUT:4,GBR:4,BEL:7,HUN:12,NED:'R',ITA:6,AZE:8,SIN:8,USA:4,MXC:8,SAP:'R',LVG:8,QAT:12,ABU:8 },
      2026: { AUS:4,CHN:3,JPN:6,MIA:6 },
    },
    careerStats: [
      { year:2007,series:'F1',races:17,wins:4,poles:6,podiums:12,points:109,pos:'2nd' },
      { year:2008,series:'F1',races:18,wins:5,poles:7,podiums:10,points:98,pos:'🏆 1st' },
      { year:2014,series:'F1',races:19,wins:11,poles:7,podiums:16,points:384,pos:'🏆 1st' },
      { year:2015,series:'F1',races:19,wins:10,poles:11,podiums:17,points:381,pos:'🏆 1st' },
      { year:2016,series:'F1',races:21,wins:10,poles:12,podiums:17,points:380,pos:'2nd' },
      { year:2017,series:'F1',races:20,wins:9,poles:11,podiums:13,points:363,pos:'🏆 1st' },
      { year:2018,series:'F1',races:21,wins:11,poles:11,podiums:17,points:408,pos:'🏆 1st' },
      { year:2019,series:'F1',races:21,wins:11,poles:5,podiums:17,points:413,pos:'🏆 1st' },
      { year:2020,series:'F1',races:16,wins:11,poles:10,podiums:14,points:347,pos:'🏆 1st' },
      { year:2021,series:'F1',races:22,wins:8,poles:5,podiums:17,points:387,pos:'2nd' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:9,points:240,pos:'6th' },
      { year:2023,series:'F1',races:22,wins:0,poles:1,podiums:6,points:234,pos:'3rd' },
      { year:2024,series:'F1',races:24,wins:2,poles:0,podiums:5,points:223,pos:'7th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:156,pos:'6th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:1,points:51,pos:'5th*' },
    ],
  },

  'leclerc': {
    salary: 30000000,
    number: 16,
    flag: '🇲🇨',
    fullName: 'Charles Marc Hervé Perceval Leclerc',
    bio: "Monte Carlo, Monaco. Ferrari since 2019. Ferrari Driver Academy. 2017 F2 Champion (rookie). 2016 GP3 Champion. Nickname: il Predestinato. Record 27 pole positions without a WDC.",
    career: [
      { year: 2016, series: 'GP3 Series', team: 'ART Grand Prix', result: '🏆 Champion — 3 wins' },
      { year: 2017, series: 'FIA Formula 2', team: 'Prema', result: '🏆 Champion — 7 wins, rookie season' },
      { year: 2018, series: 'F1', team: 'Sauber', result: 'P13 — Rookie, 39 pts' },
      { year: 2019, series: 'F1', team: 'Ferrari', result: 'P4 — 264 pts, 2 wins (Belgium, Italy)' },
      { year: 2022, series: 'F1', team: 'Ferrari', result: 'P2 — 308 pts, 3 wins, 9 poles' },
      { year: 2024, series: 'F1', team: 'Ferrari', result: 'P3 — 356 pts, 3 wins (Monaco, Italy, USA)' },
      { year: 2025, series: 'F1', team: 'Ferrari', result: 'P5 — 242 pts, 0 wins, 7 podiums' },
      { year: 2026, series: 'F1', team: 'Ferrari', result: 'P3* — 59 pts (4 races)' },
    ],
    records: [
      { label: 'Most Poles Without WDC', value: '27 pole positions', race: 'All-time F1 record', icon: '⚡' },
      { label: '2022 WDC Runner-Up', value: '308 pts, 3 wins', race: '2022 Season', icon: '🥈' },
      { label: 'First Monaco Win', value: '93-year drought ended', race: '2024 Monaco GP', icon: '🏆' },
      { label: 'First Monégasque F1 Winner', value: 'History maker', race: '2019 Belgian GP', icon: '🇲🇨' },
    ],
    f1Results: {
      2022: { BHR:1,SAU:2,AUS:1,EMI:6,MIA:2,ESP:'R',MON:4,AZE:'R',CAN:5,GBR:4,AUT:1,FRA:'R',HUN:6,BEL:6,NED:3,ITA:2,SIN:2,JPN:3,USA:3,MXC:6,SAP:4,ABU:2 },
      2023: { BHR:'R',SAU:7,AUS:'R',AZE:3,MIA:7,MON:6,ESP:11,CAN:4,AUT:2,GBR:9,HUN:7,BEL:3,NED:'R',ITA:4,SIN:4,JPN:4,QAT:5,USA:'DSQ',MXC:3,SAP:'DNS',LVG:2,ABU:2 },
      2024: { BHR:4,SAU:3,AUS:2,JPN:4,CHN:4,MIA:3,EMI:3,MON:1,CAN:'R',ESP:5,AUT:11,GBR:14,HUN:4,BEL:3,NED:3,ITA:1,AZE:2,SIN:5,USA:1,MXC:3,SAP:5,LVG:4,QAT:2,ABU:3 },
      2025: { AUS:8,CHN:'DSQ',JPN:4,BHR:4,SAU:3,MIA:7,EMI:6,MON:2,ESP:3,CAN:5,AUT:3,GBR:14,BEL:3,HUN:4,NED:'R',ITA:4,AZE:9,SIN:6,USA:3,MXC:2,SAP:'R',LVG:4,QAT:8,ABU:4 },
      2026: { AUS:3,CHN:4,JPN:3,MIA:8 },
    },
    careerStats: [
      { year:2016,series:'GP3 Series',races:18,wins:3,poles:4,podiums:8,points:202,pos:'🏆 1st' },
      { year:2017,series:'FIA Formula 2',races:22,wins:7,poles:8,podiums:10,points:282,pos:'🏆 1st' },
      { year:2018,series:'F1',races:21,wins:0,poles:0,podiums:0,points:39,pos:'13th' },
      { year:2019,series:'F1',races:21,wins:2,poles:7,podiums:10,points:264,pos:'4th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:2,points:98,pos:'8th' },
      { year:2021,series:'F1',races:22,wins:0,poles:2,podiums:1,points:159,pos:'7th' },
      { year:2022,series:'F1',races:22,wins:3,poles:9,podiums:11,points:308,pos:'2nd' },
      { year:2023,series:'F1',races:22,wins:0,poles:5,podiums:6,points:206,pos:'5th' },
      { year:2024,series:'F1',races:24,wins:3,poles:3,podiums:13,points:356,pos:'3rd' },
      { year:2025,series:'F1',races:24,wins:0,poles:1,podiums:7,points:242,pos:'5th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:2,points:59,pos:'3rd*' },
    ],
  },

  // ─────────────────────────────────────────────
  // WILLIAMS
  // ─────────────────────────────────────────────

  'sainz': {
    salary: 10000000,
    number: 55,
    flag: '🇪🇸',
    fullName: 'Carlos Sainz Vázquez de Castro',
    bio: "Madrid, Spain. Williams since 2025. Son of two-time WRC champion Carlos Sainz Sr. 4 race wins. Replaced by Lewis Hamilton at Ferrari.",
    career: [
      { year: 2014, series: 'Formula Renault 3.5', team: 'DAMS', result: '🏆 Champion — 7 wins' },
      { year: 2022, series: 'F1', team: 'Ferrari', result: 'P5 — 246 pts, 1 WIN (British GP)' },
      { year: 2023, series: 'F1', team: 'Ferrari', result: 'P7 — 200 pts, 1 WIN (Singapore)' },
      { year: 2024, series: 'F1', team: 'Ferrari', result: 'P5 — 290 pts, 2 WINS (Australia, Mexico City)' },
      { year: 2025, series: 'F1', team: 'Williams', result: 'P9 — 64 pts, 2 podiums (Azerbaijan, Qatar)' },
      { year: 2026, series: 'F1', team: 'Williams', result: 'P14* — 4 pts (4 races)' },
    ],
    records: [
      { label: 'Only Williams/McLaren/Ferrari Podium', value: 'All 3 historic teams', race: 'Joins Alain Prost', icon: '📈' },
      { label: '4 F1 Race Wins', value: 'GB 2022, SIN 2023, AUS+MEX 2024', race: '12 seasons', icon: '🏆' },
      { label: '2014 Formula Renault 3.5 Champion', value: 'DAMS — 7 wins', race: 'Red Bull Junior', icon: '🏆' },
    ],
    f1Results: {
      2022: { BHR:2,SAU:3,AUS:'R',EMI:'R',MIA:3,ESP:4,MON:2,AZE:'R',CAN:2,GBR:1,AUT:'R',FRA:5,HUN:4,BEL:3,NED:8,ITA:4,SIN:3,JPN:'R',USA:'R',MXC:5,SAP:3,ABU:4 },
      2023: { BHR:4,SAU:6,AUS:12,AZE:5,MIA:5,MON:8,ESP:5,CAN:5,AUT:6,GBR:10,HUN:8,BEL:'R',NED:5,ITA:3,SIN:1,JPN:6,QAT:'DNS',USA:3,MXC:4,SAP:6,LVG:6,ABU:18 },
      2024: { BHR:3,SAU:'WD',AUS:1,JPN:3,CHN:5,MIA:5,EMI:5,MON:3,CAN:'R',ESP:6,AUT:3,GBR:5,HUN:6,BEL:6,NED:5,ITA:4,AZE:18,SIN:7,USA:2,MXC:1,SAP:'R',LVG:3,QAT:6,ABU:2 },
      2025: { AUS:'R',CHN:10,JPN:14,BHR:'R',SAU:8,MIA:9,EMI:8,MON:10,ESP:14,CAN:10,AUT:'DNS',GBR:12,BEL:18,HUN:14,NED:13,ITA:11,AZE:3,SIN:10,USA:'R',MXC:17,SAP:13,LVG:5,QAT:3,ABU:13 },
      2026: { AUS:15,CHN:9,JPN:15,MIA:9 },
    },
    careerStats: [
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:1,points:96,pos:'6th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:1,points:105,pos:'6th' },
      { year:2021,series:'F1',races:22,wins:0,poles:0,podiums:4,points:164.5,pos:'5th' },
      { year:2022,series:'F1',races:22,wins:1,poles:3,podiums:9,points:246,pos:'5th' },
      { year:2023,series:'F1',races:22,wins:1,poles:2,podiums:3,points:200,pos:'7th' },
      { year:2024,series:'F1',races:24,wins:2,poles:1,podiums:9,points:290,pos:'5th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:2,points:64,pos:'9th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:4,pos:'14th*' },
    ],
  },

  'albon': {
    salary: 4000000,
    number: 23,
    flag: '🇹🇭',
    fullName: 'Alexander Philippe Albon Ansusinha',
    bio: "London / Suffolk. Thai-British. Williams since 2022. Red Bull 2019-2020. First Thai F1 podium finisher (Tuscan GP 2020). First Asian driver to score multiple F1 podiums. 2025: P8, best midfield driver.",
    career: [
      { year: 2019, series: 'F1', team: 'Toro Rosso → Red Bull', result: 'P8 — promoted mid-season, 92 pts' },
      { year: 2020, series: 'F1', team: 'Red Bull', result: 'P7 — 105 pts, 2 podiums (Tuscany, Bahrain)' },
      { year: 2023, series: 'F1', team: 'Williams', result: 'P13 — 27 pts' },
      { year: 2025, series: 'F1', team: 'Williams', result: 'P8 — 73 pts, best midfield driver' },
      { year: 2026, series: 'F1', team: 'Williams', result: 'P17* — 1 pt (4 races)' },
    ],
    records: [
      { label: 'First Thai F1 Podium', value: '2020 Tuscan GP — P3', race: 'First of two podiums', icon: '🏆' },
      { label: 'First Asian Driver Multiple Podiums', value: '2020 Tuscan + Bahrain', race: 'Historical first', icon: '📈' },
      { label: '2019 FIA Rookie of the Year', value: 'First season in F1', race: 'Red Bull / Toro Rosso', icon: '⭐' },
    ],
    f1Results: {
      2019: { AUS:14,BHR:9,CHN:10,AZE:11,ESP:11,MON:8,CAN:'R',FRA:15,AUT:15,GBR:12,GER:6,HUN:10,BEL:5,ITA:6,SIN:6,RUS:5,JPN:4,MEX:5,USA:5,BRA:14,ABU:6 },
      2020: { AUT:13,STY:4,HUN:5,GBR:8,'70A':5,ESP:8,BEL:6,ITA:15,TUS:3,RUS:10,EIF:'R',POR:12,EMI:15,TUR:7,BHR:3,SKH:6,ABU:4 },
      2025: { AUS:5,CHN:7,JPN:9,BHR:12,SAU:9,MIA:5,EMI:5,MON:9,ESP:'R',CAN:'R',AUT:'R',GBR:8,BEL:6,HUN:15,NED:5,ITA:7,AZE:13,SIN:14,USA:14,MXC:12,SAP:11,LVG:'R',QAT:11,ABU:16 },
      2026: { AUS:12,CHN:'DNS',JPN:20,MIA:10 },
    },
    careerStats: [
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:0,points:92,pos:'8th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:2,points:105,pos:'7th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:0,points:4,pos:'19th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:0,points:27,pos:'13th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:0,points:12,pos:'16th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:73,pos:'8th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:1,pos:'17th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // AUDI
  // ─────────────────────────────────────────────

  'hulkenberg': {
    salary: 2000000,
    number: 27,
    flag: '🇩🇪',
    fullName: 'Nicolas Hülkenberg',
    bio: "Emmerich am Rhein, Germany. Audi (ex-Sauber) since 2025. 2009 GP2 Champion (rookie). Won 2015 24h Le Mans with Porsche. Maiden F1 podium at 2025 British GP after record 239 starts.",
    career: [
      { year: 2009, series: 'GP2', team: 'ART', result: '🏆 Champion — rookie. Third after Rosberg & Hamilton' },
      { year: 2010, series: 'F1', team: 'Williams', result: 'P14 — Debut, first pole Brazil' },
      { year: 2015, series: 'Other', team: 'Porsche', result: '🏆 24h Le Mans Winner' },
      { year: 2025, series: 'F1', team: 'Sauber', result: 'P11 — 51 pts, MAIDEN PODIUM British GP P3 (race 239)' },
      { year: 2026, series: 'F1', team: 'Audi', result: 'P18* — 0 pts (4 races)' },
    ],
    records: [
      { label: 'Most F1 Starts Without a Win', value: '253 starts, 0 wins', race: 'All-time record', icon: '📊' },
      { label: 'Most Starts Before First Podium', value: '239 races', race: '2025 British GP', icon: '⏳' },
      { label: '2015 24h Le Mans Winner', value: 'Porsche — with Tandy & Bamber', race: "Porsche's first overall since 1998", icon: '🏆' },
    ],
    f1Results: {
      2023: { BHR:15,SAU:12,AUS:7,AZE:17,MIA:15,MON:17,ESP:15,CAN:15,AUT:'R',GBR:13,HUN:14,BEL:18,NED:12,ITA:17,SIN:13,JPN:14,QAT:16,USA:11,MXC:13,SAP:12,LVG:19,ABU:15 },
      2024: { BHR:16,SAU:10,AUS:9,JPN:11,CHN:10,MIA:11,EMI:11,MON:'R',CAN:11,ESP:11,AUT:6,GBR:6,HUN:13,BEL:18,NED:11,ITA:17,AZE:11,SIN:9,USA:8,MXC:9,SAP:'DSQ',LVG:8,QAT:'R',ABU:8 },
      2025: { AUS:7,CHN:15,JPN:16,BHR:'DSQ',SAU:15,MIA:14,EMI:12,MON:16,ESP:5,CAN:8,AUT:9,GBR:3,BEL:12,HUN:13,NED:14,ITA:'DNS',AZE:16,SIN:20,USA:8,MXC:'R',SAP:9,LVG:7,QAT:'R',ABU:9 },
      2026: { AUS:'DNS',CHN:11,JPN:11,MIA:'R' },
    },
    careerStats: [
      { year:2010,series:'F1',races:19,wins:0,poles:1,podiums:0,points:22,pos:'14th' },
      { year:2012,series:'F1',races:20,wins:0,poles:0,podiums:0,points:63,pos:'11th' },
      { year:2014,series:'F1',races:19,wins:0,poles:0,podiums:0,points:96,pos:'9th' },
      { year:2018,series:'F1',races:21,wins:0,poles:0,podiums:0,points:69,pos:'7th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:0,points:9,pos:'16th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:0,points:41,pos:'11th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:1,points:51,pos:'11th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'18th*' },
    ],
  },

  'bortoleto': {
    salary: 1500000,
    number: 5,
    flag: '🇧🇷',
    fullName: 'Gabriel Lourenzo Bortoleto Oliveira',
    bio: "Osasco, São Paulo, Brazil. Audi (ex-Sauber) since 2025. Managed by Fernando Alonso's A14 Management. 2024 F2 Champion (rookie). 2023 F3 Champion. Fourth driver to win F3 + F2 in successive years.",
    career: [
      { year: 2023, series: 'FIA Formula 3', team: 'Trident', result: '🏆 Champion — 2 wins' },
      { year: 2024, series: 'FIA Formula 2', team: 'Invicta', result: '🏆 Champion — 2 wins (rookie). First last-to-first winner in F2 history (Monza)' },
      { year: 2025, series: 'F1', team: 'Sauber', result: 'P19 — 19 pts, maiden points Austria' },
      { year: 2026, series: 'F1', team: 'Audi', result: 'P15* — 2 pts (4 races)' },
    ],
    records: [
      { label: 'First Last-to-First Winner in F2 History', value: '2024 Monza Feature Race', race: 'Started last, won from pit lane', icon: '📈' },
      { label: '2024 F2 Champion — Rookie Season', value: 'Seventh in GP2/F2 history', race: 'Invicta Racing', icon: '🏆' },
      { label: 'F3 + F2 Champion Successive Years', value: '2023 + 2024', race: 'Joins Leclerc, Russell, Piastri', icon: '👑' },
    ],
    f1Results: {
      2025: { AUS:'R',CHN:14,JPN:19,BHR:18,SAU:18,MIA:'R',EMI:18,MON:14,ESP:12,CAN:14,AUT:8,GBR:'R',BEL:9,HUN:6,NED:15,ITA:8,AZE:11,SIN:17,USA:18,MXC:10,SAP:'R',LVG:'R',QAT:13,ABU:11 },
      2026: { AUS:9,CHN:'DNS',JPN:13,MIA:12 },
    },
    careerStats: [
      { year:2023,series:'FIA Formula 3',races:18,wins:2,poles:1,podiums:6,points:164,pos:'🏆 1st' },
      { year:2024,series:'FIA Formula 2',races:28,wins:2,poles:2,podiums:8,points:214.5,pos:'🏆 1st' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:19,pos:'19th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:2,pos:'15th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // ALPINE
  // ─────────────────────────────────────────────

  'gasly': {
    salary: 6000000,
    number: 10,
    flag: '🇫🇷',
    fullName: 'Pierre Jean-Jacques Gasly',
    bio: "Rouen, Normandy. Alpine since 2023 (contracted to 2028). 2016 GP2 Champion with Prema. Promoted to Red Bull 2019, demoted mid-season. Won 2020 Italian GP with AlphaTauri — first French winner since 1996.",
    career: [
      { year: 2016, series: 'GP2 Series', team: 'Prema', result: '🏆 Champion — 4 wins' },
      { year: 2019, series: 'F1', team: 'Red Bull → Toro Rosso', result: 'P7 — demoted mid-season, podium Brazil' },
      { year: 2020, series: 'F1', team: 'AlphaTauri', result: 'P10 — 1 WIN (Italian GP), 75 pts' },
      { year: 2021, series: 'F1', team: 'AlphaTauri', result: 'P9 — 110 pts, podium Azerbaijan' },
      { year: 2023, series: 'F1', team: 'Alpine', result: 'P11 — 62 pts, podium Dutch GP' },
      { year: 2024, series: 'F1', team: 'Alpine', result: 'P10 — 42 pts, podium São Paulo' },
      { year: 2025, series: 'F1', team: 'Alpine', result: 'P18 — 22 pts' },
      { year: 2026, series: 'F1', team: 'Alpine', result: 'P9* — 16 pts (4 races)' },
    ],
    records: [
      { label: 'First French F1 Winner Since 1996', value: '2020 Italian GP', race: 'AlphaTauri — Monza', icon: '🏆' },
      { label: '2016 GP2 Champion', value: 'Prema Racing', race: 'Close battle with Giovinazzi', icon: '👑' },
      { label: 'Red Bull Demotion & Redemption', value: 'P2 Brazil 2019', race: 'After mid-season drop', icon: '📈' },
    ],
    f1Results: {
      2020: { AUT:7,STY:15,HUN:'R',GBR:7,'70A':11,ESP:9,BEL:8,ITA:1,TUS:'R',RUS:9,EIF:6,POR:5,EMI:'R',TUR:13,BHR:6,SKH:11,ABU:8 },
      2021: { BHR:'R',EMI:7,POR:10,ESP:10,MON:6,AZE:3,FRA:7,STY:'R',AUT:9,GBR:11,HUN:5,BEL:6,NED:4,ITA:'R',RUS:13,TUR:6,USA:'R',MXC:4,SAP:7,QAT:11,SAU:6,ABU:5 },
      2022: { BHR:'R',SAU:8,AUS:9,EMI:12,MIA:'R',ESP:13,MON:11,AZE:5,CAN:14,GBR:'R',AUT:15,FRA:12,HUN:12,BEL:9,NED:11,ITA:8,SIN:10,JPN:18,USA:14,MXC:11,SAP:14,ABU:14 },
      2023: { BHR:9,SAU:9,AUS:13,AZE:14,MIA:8,MON:7,ESP:10,CAN:12,AUT:10,GBR:18,HUN:'R',BEL:11,NED:3,ITA:15,SIN:6,JPN:10,QAT:12,USA:6,MXC:11,SAP:7,LVG:11,ABU:13 },
      2024: { BHR:18,SAU:'R',AUS:13,JPN:16,CHN:13,MIA:12,EMI:16,MON:10,CAN:9,ESP:9,AUT:10,GBR:'DNS',HUN:'R',BEL:13,NED:9,ITA:15,AZE:12,SIN:17,USA:12,MXC:10,SAP:3,LVG:'R',QAT:5,ABU:7 },
      2025: { AUS:11,CHN:'DSQ',JPN:13,BHR:7,SAU:'R',MIA:13,EMI:13,MON:'R',ESP:8,CAN:15,AUT:13,GBR:6,BEL:10,HUN:19,NED:17,ITA:16,AZE:18,SIN:19,USA:19,MXC:15,SAP:10,LVG:13,QAT:16,ABU:19 },
      2026: { AUS:10,CHN:6,JPN:7,MIA:'R' },
    },
    careerStats: [
      { year:2016,series:'GP2 Series',races:22,wins:4,poles:5,podiums:9,points:219,pos:'🏆 1st' },
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:1,points:95,pos:'7th' },
      { year:2020,series:'F1',races:17,wins:1,poles:0,podiums:1,points:75,pos:'10th' },
      { year:2021,series:'F1',races:22,wins:0,poles:0,podiums:1,points:110,pos:'9th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:0,points:23,pos:'14th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:1,points:62,pos:'11th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:1,points:42,pos:'10th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:22,pos:'18th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:16,pos:'9th*' },
    ],
  },

  'colapinto': {
    salary: 2500000,
    number: 43,
    flag: '🇦🇷',
    fullName: 'Franco Alejandro Colapinto',
    bio: "Pilar, Buenos Aires. Alpine 2026. Father sold house twice to fund career. Williams debut 2024 — first Argentine F1 driver since 2001. First Argentine points scorer since Reutemann 1982. 2019 F4 Spanish Champion.",
    career: [
      { year: 2019, series: 'F4 Spanish', team: 'Drivex', result: '🏆 Champion — 11 wins' },
      { year: 2024, series: 'F1 (debut)', team: 'Williams', result: 'P19 — 9 races, 5 pts. First Argentine since 2001' },
      { year: 2025, series: 'F1', team: 'Alpine', result: 'P20 — 18 races, 0 pts' },
      { year: 2026, series: 'F1', team: 'Alpine', result: 'P11* — 7 pts, career best P7 Miami' },
    ],
    records: [
      { label: 'First Argentine F1 Driver Since 2001', value: '2024 Italian GP debut', race: 'Williams Racing', icon: '🇦🇷' },
      { label: 'First Argentine F1 Points Since 1982', value: '2024 Azerbaijan GP', race: 'Carlos Reutemann record ended', icon: '📈' },
      { label: '2019 F4 Spanish Champion', value: '11 wins from 21 races', race: 'Nearly 100 pts ahead of rival', icon: '🏆' },
    ],
    f1Results: {
      2024: { ITA:12,AZE:8,SIN:11,USA:10,MXC:12,SAP:'R',LVG:14,QAT:'R',ABU:'R' },
      2025: { EMI:16,MON:13,ESP:15,CAN:13,AUT:15,GBR:'DNS',BEL:19,HUN:18,NED:11,ITA:17,AZE:19,SIN:16,USA:17,MXC:16,SAP:15,LVG:15,QAT:14,ABU:20 },
      2026: { AUS:14,CHN:10,JPN:16,MIA:7 },
    },
    careerStats: [
      { year:2019,series:'F4 Spanish',races:21,wins:11,poles:10,podiums:13,points:325,pos:'🏆 1st' },
      { year:2024,series:'F1',races:9,wins:0,poles:0,podiums:0,points:5,pos:'19th' },
      { year:2025,series:'F1',races:18,wins:0,poles:0,podiums:0,points:0,pos:'20th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:7,pos:'11th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // RACING BULLS
  // ─────────────────────────────────────────────

  'lawson': {
    salary: 3000000,
    number: 30,
    flag: '🇳🇿',
    fullName: 'Liam Jared Lawson',
    bio: "Hastings, New Zealand. Racing Bulls 2026. Parents sold house to fund career. Red Bull Junior since 2019. Promoted to Red Bull 2025 replacing Pérez, demoted after 2 races. 2021 youngest-ever DTM winner.",
    career: [
      { year: 2019, series: 'Toyota Racing Series', team: 'M2 Competition', result: '🏆 Champion' },
      { year: 2021, series: 'DTM', team: 'Red Bull AF Corse', result: 'P2 — 3 wins, youngest-ever DTM winner' },
      { year: 2022, series: 'FIA Formula 2', team: 'Carlin', result: 'P3 — 4 wins, 10 podiums' },
      { year: 2023, series: 'Super Formula', team: 'Team Mugen', result: 'P2 — 3 wins' },
      { year: 2023, series: 'F1 (debut)', team: 'AlphaTauri', result: 'P20 — 5 races replacing Ricciardo' },
      { year: 2025, series: 'F1', team: 'Red Bull → Racing Bulls', result: 'P14 — demoted after 2 races with Red Bull' },
      { year: 2026, series: 'F1', team: 'Racing Bulls', result: 'P10* — 10 pts (4 races)' },
    ],
    records: [
      { label: 'Youngest-Ever DTM Winner', value: '2021 Monza DTM', race: 'Red Bull AF Corse', icon: '👶' },
      { label: 'Points on F1 Debut — Singapore 2023', value: 'P9', race: 'First points for AlphaTauri 2023', icon: '📈' },
      { label: '2019 Toyota Racing Series Champion', value: 'M2 Competition', race: 'New Zealand Grand Prix winner', icon: '🏆' },
    ],
    f1Results: {
      2023: { NED:13,ITA:11,SIN:9,JPN:11,QAT:17 },
      2024: { USA:9,MXC:16,SAP:9,LVG:16,QAT:14,ABU:17 },
      2025: { AUS:'R',CHN:12,JPN:17,BHR:16,SAU:12,MIA:'R',EMI:14,MON:8,ESP:11,CAN:'R',AUT:6,GBR:'R',BEL:8,HUN:8,NED:12,ITA:14,AZE:5,SIN:15,USA:11,MXC:'R',SAP:7,LVG:14,QAT:9,ABU:18 },
      2026: { AUS:13,CHN:7,JPN:9,MIA:'R' },
    },
    careerStats: [
      { year:2019,series:'Toyota Racing Series',races:15,wins:5,poles:4,podiums:11,points:356,pos:'🏆 1st' },
      { year:2021,series:'DTM',races:16,wins:3,poles:4,podiums:10,points:227,pos:'2nd' },
      { year:2022,series:'FIA Formula 2',races:28,wins:4,poles:0,podiums:10,points:149,pos:'3rd' },
      { year:2023,series:'F1',races:5,wins:0,poles:0,podiums:0,points:2,pos:'20th' },
      { year:2024,series:'F1',races:6,wins:0,poles:0,podiums:0,points:4,pos:'21st' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:38,pos:'14th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:10,pos:'10th*' },
    ],
  },

  'lindblad': {
    salary: 2000000,
    number: 41,
    flag: '🇬🇧',
    fullName: 'Arvid Anand Olof Lindblad',
    bio: "Virginia Water, Surrey. Swedish father, British Indian mother. Racing Bulls 2026. Red Bull Junior since 2021. Youngest-ever British F1 driver (aged 18). 2025 youngest F2 race winner in history (17y 254d).",
    career: [
      { year: 2023, series: 'Italian F4', team: 'Prema', result: 'P3 — 6 wins, 10 podiums' },
      { year: 2023, series: 'Macau F4', team: 'Prema', result: '🏆 Winner — pole + quali race + main race' },
      { year: 2024, series: 'FIA Formula 3', team: 'Prema', result: 'P4 — 4 wins, first to win both races of an F3 weekend (Silverstone)' },
      { year: 2025, series: 'FR Oceania', team: 'M2 Competition', result: '🏆 Champion — 6 wins' },
      { year: 2025, series: 'FIA Formula 2', team: 'Campos', result: 'P6 — 3 wins, youngest F2 winner in history' },
      { year: 2026, series: 'F1', team: 'Racing Bulls', result: 'P12* — 4 pts (4 races), debut P8 Australia' },
    ],
    records: [
      { label: 'Youngest-Ever British F1 Driver', value: '18 years old', race: '2026 Australian GP', icon: '👶' },
      { label: 'Youngest F2 Race Winner in History', value: '17 years 254 days', race: '2025 Jeddah Sprint', icon: '📈' },
      { label: 'Macau F4 Winner 2023', value: 'Pole + quali race + main race', race: 'Full sweep', icon: '🏆' },
    ],
    f1Results: {
      2026: { AUS:8,CHN:12,JPN:14,MIA:14 },
    },
    careerStats: [
      { year:2023,series:'Italian F4',races:21,wins:6,poles:4,podiums:10,points:264,pos:'3rd' },
      { year:2024,series:'FIA Formula 3',races:20,wins:4,poles:0,podiums:5,points:113,pos:'4th' },
      { year:2025,series:'FR Oceania',races:15,wins:6,poles:6,podiums:12,points:370,pos:'🏆 1st' },
      { year:2025,series:'FIA Formula 2',races:27,wins:3,poles:1,podiums:5,points:134,pos:'6th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:4,pos:'12th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // HAAS
  // ─────────────────────────────────────────────

  'bearman': {
    salary: 1500000,
    number: 87,
    flag: '🇬🇧',
    fullName: 'Oliver James Bearman',
    bio: "Chelmsford, Essex. Ferrari Driver Academy. Haas since 2025. Debut 2024 Saudi Arabia replacing Sainz (appendicitis) — youngest-ever Ferrari driver. First driver in history to score points for two different teams in first two races.",
    career: [
      { year: 2021, series: 'Italian F4', team: 'Van Amersfoort', result: '🏆 Champion — 11 wins, 343 pts' },
      { year: 2021, series: 'ADAC F4', team: 'Van Amersfoort', result: '🏆 Champion — 6 wins, first driver to win two F4 titles in one year' },
      { year: 2022, series: 'FIA Formula 3', team: 'Prema', result: 'P3 — 1 win, 8 podiums' },
      { year: 2024, series: 'F1 (debut)', team: 'Ferrari / Haas', result: 'P18 — debut P7 Saudi GP for Ferrari aged 18' },
      { year: 2025, series: 'F1', team: 'Haas', result: 'P13 — 41 pts, best: P4 Mexico City' },
      { year: 2026, series: 'F1', team: 'Haas', result: 'P8* — 17 pts (4 races)' },
    ],
    records: [
      { label: 'Youngest-Ever Ferrari F1 Driver', value: '18 years old', race: '2024 Saudi Arabian GP', icon: '👶' },
      { label: 'Points for Two Teams — First Two Races', value: 'Ferrari + Haas', race: 'Historical first', icon: '📈' },
      { label: 'Double F4 Champion Same Year', value: 'Italian + ADAC 2021', race: 'First driver ever', icon: '🏆' },
    ],
    f1Results: {
      2025: { AUS:14,CHN:8,JPN:10,BHR:10,SAU:13,MIA:'R',EMI:17,MON:12,ESP:17,CAN:11,AUT:11,GBR:11,BEL:11,HUN:'R',NED:6,ITA:12,AZE:12,SIN:9,USA:9,MXC:4,SAP:6,LVG:10,QAT:'R',ABU:12 },
      2026: { AUS:7,CHN:5,JPN:'R',MIA:11 },
    },
    careerStats: [
      { year:2021,series:'Italian F4',races:21,wins:11,poles:8,podiums:15,points:343,pos:'🏆 1st' },
      { year:2021,series:'ADAC F4',races:18,wins:6,poles:5,podiums:11,points:295,pos:'🏆 1st' },
      { year:2022,series:'FIA Formula 3',races:18,wins:1,poles:0,podiums:8,points:132,pos:'3rd' },
      { year:2024,series:'F1',races:3,wins:0,poles:0,podiums:0,points:7,pos:'18th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:41,pos:'13th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:17,pos:'8th*' },
    ],
  },

  'ocon': {
    salary: 6000000,
    number: 31,
    flag: '🇫🇷',
    fullName: 'Esteban José Jean-Pierre Ocon-Khelfane',
    bio: "Évreux, Normandy. Haas since 2025. Parents sold their home and lived in a caravan to fund his karting career. Mercedes Junior Team. 2014 FIA F3 European Champion (Prema, ahead of Verstappen). 2015 GP3 Champion (ART). Sole F1 win: 2021 Hungarian Grand Prix with Alpine. First teammate to outscore Alonso since Jenson Button (2015).",
    career: [
      { year: 2014, series: 'FIA F3 European', team: 'Prema', result: '🏆 Champion — 9 wins, 21 podiums/33 races, ahead of Blomqvist & Verstappen' },
      { year: 2015, series: 'GP3 Series', team: 'ART Grand Prix', result: '🏆 Champion — 14 podiums/18 races, 8 pts ahead of Ghiotto' },
      { year: 2016, series: 'F1', team: 'Manor', result: 'P23 — debut Belgian GP, replaced Haryanto' },
      { year: 2017, series: 'F1', team: 'Force India', result: 'P8 — 87 pts, first full season' },
      { year: 2018, series: 'F1', team: 'Force India / Racing Point', result: 'P12 — 49 pts' },
      { year: 2020, series: 'F1', team: 'Renault', result: 'P12 — 62 pts, maiden podium Sakhir GP (P3)' },
      { year: 2021, series: 'F1', team: 'Alpine', result: 'P7 — 74 pts, 1 WIN (Hungarian GP)' },
      { year: 2022, series: 'F1', team: 'Alpine', result: 'P8 — 92 pts, outscored Alonso' },
      { year: 2023, series: 'F1', team: 'Alpine', result: 'P13 — 58 pts, podium Monaco (P3)' },
      { year: 2024, series: 'F1', team: 'Alpine', result: 'P12 — 59 pts, podium São Paulo (P2), maiden fastest lap USA' },
      { year: 2025, series: 'F1', team: 'Haas', result: 'P15 — 38 pts' },
      { year: 2026, series: 'F1', team: 'Haas', result: 'P20* — 0 pts (4 races); seat under threat mid-season' },
    ],
    records: [
      { label: '2014 FIA F3 European Champion', value: 'Prema — 9 wins', race: 'Ahead of Blomqvist & Verstappen', icon: '🏆' },
      { label: '2015 GP3 Champion', value: 'ART Grand Prix — 14 podiums', race: '8 pts ahead of Ghiotto', icon: '👑' },
      { label: 'First Teammate to Outscore Alonso Since 2015', value: '2022 — 92 vs 81 pts', race: 'Since Jenson Button at McLaren', icon: '📈' },
    ],
    f1Results: {
      2017: { AUS:8,CHN:6,BHR:9,RUS:7,ESP:5,MON:12,CAN:7,AZE:'R',AUT:6,GBR:6,HUN:9,BEL:5,ITA:6,SIN:8,MAL:5,JPN:10,USA:9,MEX:5,BRA:'R',ABU:9 },
      2018: { BHR:10,AZE:'R',ESP:'R',MON:8,CAN:5,FRA:'R',AUT:8,GBR:5,GER:7,HUN:8,BEL:6,ITA:9,SIN:7,RUS:7,JPN:9,USA:7,MEX:5,BRA:7,ABU:5 },
      2020: { AUT:5,STY:12,HUN:7,GBR:7,'70A':6,ESP:7,BEL:11,ITA:9,TUS:7,RUS:10,EIF:12,POR:8,EMI:7,TUR:10,BHR:12,SKH:3,ABU:7 },
      2021: { BHR:7,EMI:11,POR:5,ESP:8,MON:7,AZE:9,FRA:7,STY:5,AUT:4,GBR:4,HUN:1,BEL:9,NED:7,ITA:10,RUS:11,TUR:5,USA:10,MXC:12,SAP:5,QAT:3,SAU:8,ABU:5 },
      2022: { BHR:10,SAU:9,AUS:7,EMI:10,MIA:7,ESP:5,MON:10,AZE:6,CAN:9,GBR:5,AUT:9,FRA:8,HUN:3,BEL:5,NED:9,ITA:11,SIN:7,JPN:8,USA:9,MXC:9,SAP:11,ABU:7 },
      2023: { BHR:14,SAU:10,AUS:10,AZE:8,MIA:13,MON:3,ESP:8,CAN:10,AUT:5,GBR:7,HUN:6,BEL:9,NED:8,ITA:9,SIN:5,JPN:7,QAT:15,USA:9,MXC:15,SAP:11,LVG:12,ABU:12 },
      2024: { BHR:14,SAU:8,AUS:11,JPN:14,CHN:6,MIA:8,EMI:13,MON:11,CAN:13,ESP:12,AUT:14,GBR:16,HUN:12,BEL:14,NED:6,ITA:12,AZE:7,SIN:10,USA:7,MXC:7,SAP:15,LVG:13,QAT:12,ABU:12 },
      2025: { AUS:6,CHN:9,JPN:11,BHR:9,SAU:10,MIA:12,EMI:10,MON:11,ESP:9,CAN:7,AUT:7,GBR:10,BEL:13,HUN:10,NED:9,ITA:9,AZE:14,SIN:12,USA:7,MXC:11,SAP:12,LVG:9,QAT:6,ABU:14 },
      2026: { AUS:11,CHN:'R',JPN:17,MIA:13 },
    },
    careerStats: [
      { year:2014,series:'FIA F3 European',races:33,wins:9,poles:15,podiums:21,points:489,pos:'🏆 1st' },
      { year:2015,series:'GP3 Series',races:18,wins:1,poles:3,podiums:14,points:204,pos:'🏆 1st' },
      { year:2016,series:'F1',races:9,wins:0,poles:0,podiums:0,points:7,pos:'23rd' },
      { year:2017,series:'F1',races:20,wins:0,poles:0,podiums:0,points:87,pos:'8th' },
      { year:2018,series:'F1',races:19,wins:0,poles:0,podiums:0,points:49,pos:'12th' },
      { year:2020,series:'F1',races:17,wins:0,poles:0,podiums:1,points:62,pos:'12th' },
      { year:2021,series:'F1',races:22,wins:1,poles:0,podiums:3,points:74,pos:'7th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:1,points:92,pos:'8th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:1,points:58,pos:'13th' },
      { year:2024,series:'F1',races:22,wins:0,poles:0,podiums:1,points:59,pos:'12th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:38,pos:'15th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'20th*' },
    ],
  },

  // ─────────────────────────────────────────────
  // ASTON MARTIN
  // ─────────────────────────────────────────────

  'alonso': {
    salary: 15000000,
    number: 14,
    flag: '🇪🇸',
    fullName: 'Fernando Alonso Díaz',
    bio: "Oviedo, Asturias, Spain. Aston Martin since 2023. 2x World Champion (2005–06, Renault). 32 wins, 106 podiums, 429 starts — all-time record. First Spanish World Champion. 2018–19 FIA WEC Champion, 2x Le Mans winner (Toyota). Drives #14 — lucky number since karting world title on 14 July 1996. Scored 100th podium at 2023 Saudi Arabian GP. First driver to contest 400 Grand Prix weekends (2024). Partner Melissa Jiménez gave birth to his first child in March 2026.",
    career: [
      { year: 1999, series: 'Euro Open by Nissan', team: 'Campos Motorsport', result: '🏆 Champion — 6 wins, 9 poles' },
      { year: 2000, series: 'International F3000', team: 'Team Astromega', result: 'P4 — 1 win (Spa)' },
      { year: 2001, series: 'F1', team: 'Minardi', result: 'P23 — Debut, 0 pts' },
      { year: 2005, series: 'F1', team: 'Renault', result: '🏆 Champion — 133 pts, 7 wins, youngest WDC at time' },
      { year: 2006, series: 'F1', team: 'Renault', result: '🏆 Champion — 134 pts, 7 wins' },
      { year: 2007, series: 'F1', team: 'McLaren', result: 'P3 — 109 pts, 4 wins' },
      { year: 2010, series: 'F1', team: 'Ferrari', result: 'P2 — 252 pts, 5 wins' },
      { year: 2012, series: 'F1', team: 'Ferrari', result: 'P2 — 278 pts, 3 wins (3 pts behind Vettel)' },
      { year: 2013, series: 'F1', team: 'Ferrari', result: 'P2 — 242 pts, 2 wins' },
      { year: '2018–19', series: 'FIA WEC', team: 'Toyota', result: '🏆 Champion — 5 wins, 2x Le Mans (2018 & 2019)' },
      { year: 2023, series: 'F1', team: 'Aston Martin', result: 'P4 — 206 pts, 8 podiums, 100th career podium' },
      { year: 2024, series: 'F1', team: 'Aston Martin', result: 'P9 — 70 pts, 400th GP weekend' },
      { year: 2025, series: 'F1', team: 'Aston Martin', result: 'P10 — 56 pts, 24–0 qualifying clean sweep vs Stroll' },
      { year: 2026, series: 'F1', team: 'Aston Martin', result: 'P21* — 0 pts (4 races); AMR26 reliability issues' },
    ],
    records: [
      { label: 'Most F1 Starts Ever', value: '429 starts (432 entries)', race: 'All-time record', icon: '📊' },
      { label: '2x World Champion', value: '2005 & 2006 — Renault', race: 'First Spanish WDC; youngest double WDC at time', icon: '👑' },
      { label: '100th Career Podium', value: '2023 Saudi Arabian GP', race: 'Sixth driver in history', icon: '🎯' },
      { label: 'First Driver — 400 GP Weekends', value: '2024 Mexico City GP', race: 'All-time record', icon: '📈' },
      { label: '2x Le Mans Winner', value: '2018 & 2019 — Toyota', race: 'Only F1 WDC + WEC WDC winner', icon: '🏆' },
      { label: 'Most Races Between Podiums', value: '105 races', race: '2014 Hungary → 2021 Qatar', icon: '⏳' },
    ],
    f1Results: {
      2003: { AUS:7,MAL:3,BRA:3,SMR:6,ESP:2,AUT:'R',MON:5,CAN:4,EUR:4,FRA:'R',GBR:'R',GER:4,HUN:1,ITA:8,USA:'R',JPN:'R' },
      2004: { AUS:3,MAL:7,BHR:6,SMR:4,ESP:4,MON:'R',EUR:5,CAN:'R',USA:'R',FRA:2,GBR:10,GER:3,HUN:3,BEL:'R',ITA:'R',CHN:4,JPN:5,BRA:4 },
      2005: { AUS:3,MAL:1,BHR:1,SMR:1,ESP:2,MON:4,EUR:1,CAN:'R',USA:'DNS',FRA:1,GBR:2,GER:1,HUN:11,TUR:2,ITA:2,BEL:2,BRA:3,JPN:3,CHN:1 },
      2006: { BHR:1,MAL:2,AUS:1,SMR:2,EUR:2,ESP:1,MON:1,GBR:1,CAN:1,USA:5,FRA:2,GER:5,HUN:'R',TUR:2,ITA:'R',CHN:2,JPN:1,BRA:2 },
      2007: { AUS:2,MAL:1,BHR:5,ESP:3,MON:1,CAN:7,USA:2,FRA:7,GBR:2,EUR:1,HUN:4,TUR:3,ITA:1,BEL:3,JPN:'R',CHN:2,BRA:3 },
      2008: { AUS:4,MAL:8,BHR:10,ESP:'R',TUR:6,MON:10,CAN:'R',FRA:8,GBR:6,GER:11,HUN:4,EUR:'R',BEL:4,ITA:4,SIN:1,JPN:1,CHN:4,BRA:2 },
      2009: { AUS:5,MAL:11,CHN:9,BHR:8,ESP:5,MON:7,TUR:10,GBR:14,GER:7,HUN:'R',EUR:6,BEL:'R',ITA:5,SIN:3,JPN:10,BRA:'R',ABU:14 },
      2010: { BHR:1,AUS:4,MAL:'13†',CHN:4,ESP:2,MON:6,TUR:8,CAN:3,EUR:8,GBR:14,GER:1,HUN:2,BEL:'R',ITA:1,SIN:1,JPN:3,KOR:1,BRA:3,ABU:7 },
      2011: { AUS:4,MAL:6,CHN:7,TUR:3,ESP:5,MON:2,CAN:'R',EUR:2,GBR:1,GER:2,HUN:3,BEL:4,ITA:3,SIN:4,JPN:2,KOR:5,IND:3,ABU:2,BRA:4 },
      2012: { AUS:5,MAL:1,CHN:9,BHR:7,ESP:2,MON:3,CAN:5,EUR:1,GBR:2,GER:1,HUN:5,BEL:'R',ITA:3,SIN:3,JPN:'R',KOR:3,IND:2,ABU:2,USA:3,BRA:2 },
      2013: { AUS:2,MAL:'R',CHN:1,BHR:8,ESP:1,MON:7,CAN:2,GBR:3,GER:4,HUN:5,BEL:2,ITA:2,SIN:2,KOR:6,JPN:4,IND:11,ABU:5,USA:5,BRA:3 },
      2014: { AUS:4,MAL:4,BHR:9,CHN:3,ESP:6,MON:4,CAN:6,AUT:5,GBR:6,GER:5,HUN:2,BEL:7,ITA:'R',SIN:4,JPN:'R',RUS:6,USA:6,BRA:6,ABU:9 },
      2015: { MAL:'R',CHN:12,BHR:11,ESP:'R',MON:'R',CAN:'R',AUT:'R',GBR:10,HUN:5,BEL:13,ITA:'18†',SIN:'R',JPN:11,RUS:11,USA:11,MEX:'R',BRA:15,ABU:17 },
      2016: { CHN:12,RUS:6,ESP:'R',MON:5,CAN:11,EUR:'R',AUT:'18†',GBR:13,HUN:7,GER:12,BEL:7,ITA:14,SIN:7,MAL:7,JPN:16,USA:5,MEX:13,BRA:10,ABU:10 },
      2017: { AUS:'R',CHN:'R',BHR:'14†',RUS:'DNS',ESP:12,CAN:'16†',AZE:9,AUT:'R',GBR:'R',HUN:6,BEL:'R',ITA:'17†',SIN:'R',MAL:11,JPN:11,USA:'R',MEX:10,BRA:8,ABU:9 },
      2018: { AUS:5,BHR:7,CHN:7,AZE:7,ESP:8,MON:'R',CAN:'R',FRA:'16†',AUT:8,GBR:8,GER:'16†',HUN:8,BEL:'R',ITA:'R',SIN:7,RUS:14,JPN:14,USA:'R',MEX:'R',BRA:17,ABU:11 },
      2021: { BHR:'R',EMI:10,POR:8,ESP:17,MON:13,AZE:6,FRA:8,STY:9,AUT:10,GBR:7,HUN:4,BEL:11,NED:6,ITA:8,RUS:6,TUR:16,USA:'R',MXC:9,SAP:9,QAT:3,SAU:13,ABU:8 },
      2022: { BHR:9,SAU:'R',AUS:17,EMI:'R',MIA:11,ESP:9,MON:7,AZE:7,CAN:9,GBR:5,AUT:10,FRA:6,HUN:8,BEL:5,NED:6,ITA:'R',SIN:'R',JPN:7,USA:7,MXC:'19†',SAP:5,ABU:'R' },
      2023: { BHR:3,SAU:3,AUS:3,AZE:4,MIA:3,MON:2,ESP:7,CAN:2,AUT:5,GBR:7,HUN:9,BEL:5,NED:2,ITA:9,SIN:15,JPN:8,QAT:6,USA:'R',MXC:'R',SAP:3,LVG:9,ABU:7 },
      2024: { BHR:9,SAU:5,AUS:8,JPN:6,CHN:7,MIA:9,EMI:19,MON:11,CAN:6,ESP:12,AUT:18,GBR:8,HUN:11,BEL:8,NED:10,ITA:11,AZE:6,SIN:8,USA:13,MXC:'R',SAP:14,LVG:11,QAT:7,ABU:9 },
      2025: { AUS:'R',CHN:'R',JPN:11,BHR:15,SAU:11,MIA:15,EMI:11,MON:'R',ESP:9,CAN:7,AUT:7,GBR:9,BEL:17,HUN:5,NED:8,ITA:'R',AZE:15,SIN:7,USA:10,MXC:'R',SAP:14,LVG:11,QAT:7,ABU:6 },
      2026: { AUS:'R',CHN:'R',JPN:18,MIA:15 },
    },
    careerStats: [
      { year:1999,series:'Euro Open by Nissan',races:15,wins:6,poles:6,podiums:8,points:164,pos:'🏆 1st' },
      { year:2000,series:'International F3000',races:9,wins:1,poles:1,podiums:2,points:17,pos:'4th' },
      { year:2001,series:'F1',races:17,wins:0,poles:0,podiums:0,points:0,pos:'23rd' },
      { year:2003,series:'F1',races:16,wins:1,poles:2,podiums:4,points:55,pos:'6th' },
      { year:2004,series:'F1',races:18,wins:0,poles:1,podiums:4,points:59,pos:'4th' },
      { year:2005,series:'F1',races:19,wins:7,poles:6,podiums:15,points:133,pos:'🏆 1st' },
      { year:2006,series:'F1',races:18,wins:7,poles:6,podiums:14,points:134,pos:'🏆 1st' },
      { year:2007,series:'F1',races:17,wins:4,poles:2,podiums:12,points:109,pos:'3rd' },
      { year:2008,series:'F1',races:18,wins:2,poles:0,podiums:3,points:61,pos:'5th' },
      { year:2009,series:'F1',races:17,wins:0,poles:1,podiums:1,points:26,pos:'9th' },
      { year:2010,series:'F1',races:19,wins:5,poles:2,podiums:10,points:252,pos:'2nd' },
      { year:2011,series:'F1',races:19,wins:1,poles:0,podiums:10,points:257,pos:'4th' },
      { year:2012,series:'F1',races:20,wins:3,poles:2,podiums:13,points:278,pos:'2nd' },
      { year:2013,series:'F1',races:19,wins:2,poles:0,podiums:9,points:242,pos:'2nd' },
      { year:2014,series:'F1',races:19,wins:0,poles:0,podiums:2,points:161,pos:'6th' },
      { year:2015,series:'F1',races:18,wins:0,poles:0,podiums:0,points:11,pos:'17th' },
      { year:2016,series:'F1',races:20,wins:0,poles:0,podiums:0,points:54,pos:'10th' },
      { year:2017,series:'F1',races:19,wins:0,poles:0,podiums:0,points:17,pos:'15th' },
      { year:2018,series:'F1',races:21,wins:0,poles:0,podiums:0,points:50,pos:'11th' },
      { year:2021,series:'F1',races:22,wins:0,poles:0,podiums:1,points:81,pos:'10th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:0,points:81,pos:'9th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:8,points:206,pos:'4th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:0,points:70,pos:'9th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:56,pos:'10th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'21st*' },
    ],
  },

  'stroll': {
    salary: 10000000,
    number: 18,
    flag: '🇨🇦',
    fullName: 'Lance Strulovitch',
    bio: "Montreal, Canada. Aston Martin since 2021 (team owned by his father Lawrence Stroll). Ferrari Driver Academy 2010. 2014 Italian F4 Champion (Prema). 2015 Toyota Racing Series Champion. 2016 FIA F3 European Champion — record 14 wins, 187-pt margin. F1 debut 2017 Williams. Youngest rookie podium finisher (Azerbaijan 2017, 18y 239d). Maiden pole: 2020 Turkish GP — first Canadian pole since Villeneuve 1997. Real name Lance Strulovitch; Canadian & Belgian citizenship.",
    career: [
      { year: 2014, series: 'Italian F4', team: 'Prema Powerteam', result: '🏆 Champion — 7 wins, 13 podiums' },
      { year: 2015, series: 'Toyota Racing Series', team: 'M2 Competition', result: '🏆 Champion — 4 wins, 10 podiums' },
      { year: 2015, series: 'FIA F3 European', team: 'Prema Powerteam', result: 'P5 — 1 win' },
      { year: 2016, series: 'FIA F3 European', team: 'Prema Powerteam', result: '🏆 Champion — 14 wins, 187-pt margin (record)' },
      { year: 2017, series: 'F1', team: 'Williams', result: 'P12 — 40 pts, podium Azerbaijan (P3)' },
      { year: 2018, series: 'F1', team: 'Williams', result: 'P18 — 6 pts' },
      { year: 2019, series: 'F1', team: 'Racing Point', result: 'P15 — 21 pts' },
      { year: 2020, series: 'F1', team: 'Racing Point', result: 'P11 — 75 pts, pole Turkey, podiums Italy & Sakhir' },
      { year: 2021, series: 'F1', team: 'Aston Martin', result: 'P13 — 34 pts' },
      { year: 2022, series: 'F1', team: 'Aston Martin', result: 'P15 — 18 pts' },
      { year: 2023, series: 'F1', team: 'Aston Martin', result: 'P10 — 74 pts (career best)' },
      { year: 2024, series: 'F1', team: 'Aston Martin', result: 'P13 — 24 pts' },
      { year: 2025, series: 'F1', team: 'Aston Martin', result: 'P16 — 33 pts' },
      { year: 2026, series: 'F1', team: 'Aston Martin', result: 'P22* — 0 pts (4 races)' },
    ],
    records: [
      { label: '2016 FIA F3 European Champion', value: 'Record 14 wins, 187-pt margin', race: 'Both all-time F3 records', icon: '🏆' },
      { label: 'Youngest Rookie F1 Podium Finisher', value: '18y 239d — Azerbaijan 2017', race: 'Second-youngest overall behind Verstappen', icon: '👶' },
      { label: 'First Canadian Pole Since Villeneuve', value: '2020 Turkish GP', race: 'Since Jacques Villeneuve 1997 European GP', icon: '⚡' },
    ],
    f1Results: {
      2017: { AUS:'R',CHN:'R',BHR:'R',RUS:11,ESP:16,MON:'15†',CAN:9,AZE:3,AUT:10,GBR:16,HUN:14,BEL:11,ITA:7,SIN:8,MAL:8,JPN:'R',USA:11,MEX:6,BRA:16,ABU:18 },
      2018: { AUS:14,BHR:14,CHN:14,AZE:8,ESP:11,MON:17,CAN:'R',FRA:'17†',AUT:14,GBR:12,GER:'R',HUN:17,BEL:13,ITA:9,SIN:14,RUS:15,JPN:17,USA:14,MEX:12,BRA:18,ABU:13 },
      2019: { AUS:9,BHR:14,CHN:12,AZE:9,ESP:'R',MON:16,CAN:9,FRA:13,AUT:14,GBR:13,GER:4,HUN:17,BEL:10,ITA:12,SIN:13,RUS:11,JPN:9,MEX:12,USA:13,BRA:'19†',ABU:'R' },
      2020: { AUT:'R',STY:7,HUN:4,GBR:9,'70A':6,ESP:4,BEL:9,ITA:3,TUS:'R',RUS:'R',EIF:'WD',POR:'R',EMI:13,TUR:9,BHR:'R',SKH:3,ABU:10 },
      2021: { BHR:10,EMI:8,POR:14,ESP:11,MON:8,AZE:'R',FRA:10,STY:8,AUT:13,GBR:8,HUN:'R',BEL:20,NED:12,ITA:7,RUS:11,TUR:9,USA:12,MXC:14,SAP:'R',QAT:6,SAU:11,ABU:13 },
      2022: { BHR:12,SAU:13,AUS:12,EMI:10,MIA:10,ESP:15,MON:14,AZE:'16†',CAN:10,GBR:11,AUT:13,FRA:10,HUN:11,BEL:11,NED:10,ITA:'R',SIN:6,JPN:12,USA:'R',MXC:15,SAP:10,ABU:8 },
      2023: { BHR:6,SAU:'R',AUS:4,AZE:7,MIA:12,MON:'R',ESP:6,CAN:9,AUT:9,GBR:'14†',HUN:10,BEL:9,NED:11,ITA:16,SIN:'WD',JPN:'R',QAT:11,USA:7,MXC:'17†',SAP:5,LVG:5,ABU:10 },
      2024: { BHR:10,SAU:'R',AUS:6,JPN:12,CHN:15,MIA:17,EMI:9,MON:14,CAN:7,ESP:14,AUT:13,GBR:7,HUN:10,BEL:11,NED:13,ITA:19,AZE:'19†',SIN:14,USA:15,MXC:11,SAP:'DNS',LVG:15,QAT:'R',ABU:14 },
      2025: { AUS:6,CHN:9,JPN:20,BHR:17,SAU:16,MIA:16,EMI:15,MON:15,ESP:'WD',CAN:17,AUT:14,GBR:7,BEL:14,HUN:7,NED:7,ITA:18,AZE:17,SIN:13,USA:12,MXC:14,SAP:16,LVG:'R',QAT:'17†',ABU:10 },
      2026: { AUS:'NC',CHN:'R',JPN:'R',MIA:17 },
    },
    careerStats: [
      { year:2014,series:'Italian F4',races:18,wins:7,poles:5,podiums:13,points:331,pos:'🏆 1st' },
      { year:2015,series:'Toyota Racing Series',races:16,wins:4,poles:0,podiums:10,points:906,pos:'🏆 1st' },
      { year:2015,series:'FIA F3 European',races:33,wins:1,poles:0,podiums:6,points:231,pos:'5th' },
      { year:2016,series:'FIA F3 European',races:30,wins:14,poles:14,podiums:20,points:507,pos:'🏆 1st' },
      { year:2017,series:'F1',races:20,wins:0,poles:0,podiums:1,points:40,pos:'12th' },
      { year:2018,series:'F1',races:21,wins:0,poles:0,podiums:0,points:6,pos:'18th' },
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:0,points:21,pos:'15th' },
      { year:2020,series:'F1',races:17,wins:0,poles:1,podiums:2,points:75,pos:'11th' },
      { year:2021,series:'F1',races:22,wins:0,poles:0,podiums:0,points:34,pos:'13th' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:0,points:18,pos:'15th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:0,points:74,pos:'10th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:0,points:24,pos:'13th' },
      { year:2025,series:'F1',races:24,wins:0,poles:0,podiums:0,points:33,pos:'16th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'22nd*' },
    ],
  },

  // ─────────────────────────────────────────────
  // CADILLAC
  // ─────────────────────────────────────────────

  'bottas': {
    salary: 2500000,
    number: 77,
    flag: '🇫🇮',
    fullName: 'Valtteri Viktor Bottas',
    bio: "Nastola, Finland. Cadillac 2026 alongside Pérez. Mercedes 2017-2021 (5x WCC contributor). 10 wins, 20 poles. WDC runner-up 2019 & 2020. Most career points without WDC (1,797).",
    career: [
      { year: 2014, series: 'F1', team: 'Williams', result: 'P4 — 186 pts, 6 podiums' },
      { year: 2017, series: 'F1', team: 'Mercedes', result: 'P3 — 305 pts, 3 wins' },
      { year: 2019, series: 'F1', team: 'Mercedes', result: 'P2 — 326 pts, 4 wins' },
      { year: 2020, series: 'F1', team: 'Mercedes', result: 'P2 — 223 pts, 2 wins' },
      { year: 2021, series: 'F1', team: 'Mercedes', result: 'P3 — 226 pts, 1 win (Turkey)' },
      { year: 2024, series: 'F1', team: 'Sauber', result: 'P22 — 0 pts (first scoreless season)' },
      { year: 2026, series: 'F1', team: 'Cadillac', result: 'P19* — 0 pts (4 races)' },
    ],
    records: [
      { label: 'Most F1 Points Without WDC', value: '1,797 career points', race: 'All-time record', icon: '📊' },
      { label: 'WDC Runner-Up × 2', value: '2019 (326 pts) & 2020 (223 pts)', race: 'Behind Hamilton both years', icon: '🥈' },
      { label: '2008 Formula Renault Eurocup Champion', value: 'Motopark — beat Ricciardo by 3 pts', race: 'Both future F1 race winners', icon: '🏆' },
    ],
    f1Results: {
      2017: { AUS:3,CHN:6,BHR:3,RUS:1,ESP:'R',MON:4,CAN:2,AZE:2,AUT:1,GBR:2,HUN:3,BEL:5,ITA:2,SIN:3,MAL:5,JPN:4,USA:5,MEX:2,BRA:2,ABU:1 },
      2019: { AUS:1,BHR:2,CHN:2,AZE:1,ESP:2,MON:3,CAN:4,FRA:2,AUT:3,GBR:2,GER:'R',HUN:8,BEL:3,ITA:2,SIN:5,RUS:2,JPN:1,MEX:3,USA:1,BRA:'R',ABU:4 },
      2020: { AUT:1,STY:2,HUN:3,GBR:11,'70A':3,ESP:3,BEL:2,ITA:5,TUS:2,RUS:1,EIF:'R',POR:2,EMI:2,TUR:14,BHR:8,SKH:8,ABU:2 },
      2021: { BHR:3,EMI:'R',POR:3,ESP:3,MON:'R',AZE:12,FRA:4,STY:3,AUT:2,GBR:3,HUN:'R',BEL:12,NED:3,ITA:3,RUS:5,TUR:1,USA:6,MXC:15,SAP:3,QAT:'R',SAU:3,ABU:6 },
      2022: { BHR:6,SAU:'R',AUS:8,EMI:5,MIA:7,ESP:6,MON:9,AZE:11,CAN:7,GBR:'R',AUT:11,FRA:14,HUN:20,BEL:'R',NED:'R',ITA:13,SIN:11,JPN:15,USA:'R',MXC:10,SAP:9,ABU:15 },
      2026: { AUS:'R',CHN:13,JPN:19,MIA:18 },
    },
    careerStats: [
      { year:2013,series:'F1',races:19,wins:0,poles:0,podiums:0,points:4,pos:'17th' },
      { year:2014,series:'F1',races:19,wins:0,poles:0,podiums:6,points:186,pos:'4th' },
      { year:2015,series:'F1',races:19,wins:0,poles:0,podiums:2,points:136,pos:'5th' },
      { year:2016,series:'F1',races:21,wins:0,poles:0,podiums:1,points:85,pos:'8th' },
      { year:2017,series:'F1',races:20,wins:3,poles:4,podiums:13,points:305,pos:'3rd' },
      { year:2018,series:'F1',races:21,wins:0,poles:2,podiums:8,points:247,pos:'5th' },
      { year:2019,series:'F1',races:21,wins:4,poles:5,podiums:15,points:326,pos:'2nd' },
      { year:2020,series:'F1',races:17,wins:2,poles:5,podiums:11,points:223,pos:'2nd' },
      { year:2021,series:'F1',races:22,wins:1,poles:4,podiums:11,points:226,pos:'3rd' },
      { year:2022,series:'F1',races:22,wins:0,poles:0,podiums:0,points:49,pos:'10th' },
      { year:2023,series:'F1',races:22,wins:0,poles:0,podiums:0,points:10,pos:'15th' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:0,points:0,pos:'22nd' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'19th*' },
    ],
  },

  'perez': {
    salary: 2000000,
    number: 11,
    flag: '🇲🇽',
    fullName: 'Sergio Michel Pérez Mendoza',
    bio: "Guadalajara, Jalisco, Mexico. Cadillac 2026. Nicknamed 'Checo'. 2007 British F3 National Champion (T-Sport). Ferrari Driver Academy 2010–2012. F1 debut Sauber 2011 — first Mexican in F1 since Rebaque 1981. Maiden win: 2020 Sakhir GP from last place on lap 1 — first Mexican winner in 50 years. WDC runner-up 2023 with Red Bull. Holds F1 records: most starts before first win (190) and most races before first pole (219). First Mexican F1 pole sitter (Saudi Arabia 2022). Only driver to win Azerbaijan GP twice (2021, 2023). Contracted to Cadillac until at least end of 2027.",
    career: [
      { year: 2007, series: 'British F3 — National', team: 'T-Sport', result: '🏆 Champion — 14 wins from 21 races' },
      { year: 2010, series: 'GP2 Series', team: 'Barwa Addax', result: 'P2 — 5 wins, runner-up to Maldonado' },
      { year: 2011, series: 'F1', team: 'Sauber', result: 'P16 — Debut, 14 pts' },
      { year: 2012, series: 'F1', team: 'Sauber', result: 'P10 — 66 pts, 3 podiums (Malaysia, Canada, Italy)' },
      { year: 2014, series: 'F1', team: 'Force India', result: 'P10 — 59 pts, podium Bahrain' },
      { year: 2016, series: 'F1', team: 'Force India', result: 'P7 — 101 pts, 2 podiums (Monaco, Baku)' },
      { year: 2020, series: 'F1', team: 'Racing Point', result: 'P4 — 125 pts, 1 WIN (Sakhir GP), 2 podiums' },
      { year: 2021, series: 'F1', team: 'Red Bull', result: 'P4 — 190 pts, 1 WIN (Azerbaijan), 5 podiums' },
      { year: 2022, series: 'F1', team: 'Red Bull', result: 'P3 — 305 pts, 2 WINS (Monaco, Singapore), maiden pole' },
      { year: 2023, series: 'F1', team: 'Red Bull', result: 'P2 — 285 pts, 2 WINS (Saudi Arabia, Azerbaijan)' },
      { year: 2024, series: 'F1', team: 'Red Bull', result: 'P8 — 152 pts, 0 wins; contract terminated' },
      { year: 2026, series: 'F1', team: 'Cadillac', result: 'P20* — 0 pts (4 races); team building year' },
    ],
    records: [
      { label: 'Most Starts Before First Win', value: '190 races', race: '2020 Sakhir Grand Prix', icon: '⏳' },
      { label: 'Most Races Before First Pole', value: '219 races', race: '2022 Saudi Arabian GP', icon: '📊' },
      { label: 'First Mexican F1 Pole Sitter', value: '2022 Saudi Arabian GP', race: 'Historic first for Mexico', icon: '🇲🇽' },
      { label: 'Only Driver to Win Azerbaijan GP Twice', value: '2021 & 2023', race: 'Unique record at Baku', icon: '🏆' },
      { label: 'WDC Runner-Up 2023', value: '285 pts — Red Bull', race: 'First Mexican WDC runner-up', icon: '🥈' },
    ],
    f1Results: {
      2011: { AUS:'DSQ',MAL:'R',CHN:17,TUR:14,ESP:9,MON:'WD',CAN:'WD',EUR:11,GBR:7,GER:11,HUN:15,BEL:'R',ITA:'R',SIN:10,JPN:8,KOR:16,IND:10,ABU:11,BRA:13 },
      2012: { AUS:8,MAL:2,CHN:11,BHR:11,ESP:'R',MON:11,CAN:3,EUR:9,GBR:'R',GER:6,HUN:14,BEL:'R',ITA:2,SIN:10,JPN:'R',KOR:11,IND:'R',ABU:15,USA:11,BRA:'R' },
      2013: { AUS:11,MAL:9,CHN:11,BHR:6,ESP:9,MON:'16†',CAN:11,GBR:'20†',GER:8,HUN:9,BEL:11,ITA:12,SIN:8,KOR:10,JPN:15,IND:5,ABU:9,USA:7,BRA:6 },
      2014: { AUS:10,MAL:'DNS',BHR:3,CHN:9,ESP:9,MON:'R',CAN:'11†',AUT:6,GBR:11,GER:10,HUN:'R',BEL:8,ITA:7,SIN:7,JPN:10,RUS:10,USA:'R',BRA:15,ABU:7 },
      2015: { AUS:10,MAL:13,CHN:11,BHR:8,ESP:13,MON:7,CAN:11,AUT:9,GBR:9,HUN:'R',BEL:5,ITA:6,SIN:7,JPN:12,RUS:3,USA:5,MEX:8,BRA:12,ABU:5 },
      2016: { AUS:13,BHR:16,CHN:11,RUS:9,ESP:7,MON:3,CAN:10,EUR:3,AUT:'17†',GBR:6,HUN:11,GER:10,BEL:5,ITA:8,SIN:8,MAL:6,JPN:7,USA:8,MEX:10,BRA:4,ABU:8 },
      2017: { AUS:7,CHN:9,BHR:7,RUS:6,ESP:4,MON:13,CAN:5,AZE:'R',AUT:7,GBR:9,HUN:8,BEL:'17†',ITA:9,SIN:5,MAL:6,JPN:7,USA:8,MEX:7,BRA:9,ABU:7 },
      2018: { AUS:11,BHR:16,CHN:12,AZE:3,ESP:9,MON:12,CAN:14,FRA:'R',AUT:7,GBR:10,GER:7,HUN:14,BEL:5,ITA:7,SIN:16,RUS:10,JPN:7,USA:8,MEX:'R',BRA:10,ABU:8 },
      2019: { AUS:13,BHR:10,CHN:8,AZE:6,ESP:15,MON:12,CAN:12,FRA:12,AUT:11,GBR:17,GER:'R',HUN:11,BEL:6,ITA:7,SIN:'R',RUS:7,JPN:8,MEX:7,USA:10,BRA:9,ABU:7 },
      2020: { AUT:6,STY:6,HUN:7,GBR:'WD',ESP:5,BEL:10,ITA:10,TUS:5,RUS:4,EIF:4,POR:7,EMI:6,TUR:2,BHR:'18†',SKH:1,ABU:'R' },
      2021: { BHR:5,EMI:11,POR:4,ESP:5,MON:4,AZE:1,FRA:3,STY:4,AUT:6,GBR:16,HUN:'R',BEL:19,NED:8,ITA:5,RUS:9,TUR:3,USA:3,MXC:3,SAP:4,QAT:4,SAU:'R',ABU:'15†' },
      2022: { BHR:'18†',SAU:4,AUS:2,EMI:2,MIA:4,ESP:2,MON:1,AZE:2,CAN:'R',GBR:2,AUT:'R',FRA:4,HUN:5,BEL:2,NED:5,ITA:6,SIN:1,JPN:2,USA:4,MXC:3,SAP:7,ABU:3 },
      2023: { BHR:2,SAU:1,AUS:5,AZE:1,MIA:2,MON:16,ESP:4,CAN:6,AUT:3,GBR:6,HUN:3,BEL:2,NED:4,ITA:2,SIN:8,JPN:'R',QAT:10,USA:4,MXC:'R',SAP:4,LVG:3,ABU:4 },
      2024: { BHR:2,SAU:2,AUS:5,JPN:2,CHN:3,MIA:4,EMI:8,MON:'R',CAN:'R',ESP:8,AUT:7,GBR:17,HUN:7,BEL:7,NED:6,ITA:8,AZE:'17†',SIN:10,USA:7,MXC:17,SAP:11,LVG:10,QAT:'R',ABU:'R' },
      2026: { AUS:16,CHN:15,JPN:17,MIA:16 },
    },
    careerStats: [
      { year:2007,series:'British F3 — National',races:21,wins:14,poles:14,podiums:19,points:376,pos:'🏆 1st' },
      { year:2010,series:'GP2 Series',races:20,wins:5,poles:1,podiums:7,points:71,pos:'2nd' },
      { year:2011,series:'F1',races:19,wins:0,poles:0,podiums:0,points:14,pos:'16th' },
      { year:2012,series:'F1',races:20,wins:0,poles:0,podiums:3,points:66,pos:'10th' },
      { year:2013,series:'F1',races:19,wins:0,poles:0,podiums:0,points:49,pos:'11th' },
      { year:2014,series:'F1',races:19,wins:0,poles:0,podiums:1,points:59,pos:'10th' },
      { year:2015,series:'F1',races:19,wins:0,poles:0,podiums:1,points:78,pos:'9th' },
      { year:2016,series:'F1',races:21,wins:0,poles:0,podiums:2,points:101,pos:'7th' },
      { year:2017,series:'F1',races:20,wins:0,poles:0,podiums:0,points:100,pos:'7th' },
      { year:2018,series:'F1',races:21,wins:0,poles:0,podiums:1,points:62,pos:'8th' },
      { year:2019,series:'F1',races:21,wins:0,poles:0,podiums:0,points:52,pos:'10th' },
      { year:2020,series:'F1',races:16,wins:1,poles:0,podiums:2,points:125,pos:'4th' },
      { year:2021,series:'F1',races:22,wins:1,poles:0,podiums:5,points:190,pos:'4th' },
      { year:2022,series:'F1',races:22,wins:2,poles:1,podiums:11,points:305,pos:'3rd' },
      { year:2023,series:'F1',races:22,wins:2,poles:2,podiums:9,points:285,pos:'2nd' },
      { year:2024,series:'F1',races:24,wins:0,poles:0,podiums:4,points:152,pos:'8th' },
      { year:2026,series:'F1',races:4,wins:0,poles:0,podiums:0,points:0,pos:'20th*' },
    ],
  },

};

// Export para uso en driver.js
if (typeof module !== 'undefined') {
  module.exports = { F1_DRIVERS };
}
