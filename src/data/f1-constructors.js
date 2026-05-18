/**
 * PaddockIntel — F1 Constructors Data
 * src/data/f1-constructors.js
 *
 * Generated from Ergast CSVs (constructors + constructor_standings + constructor_results)
 * SOURCE OF TRUTH — do not edit manually. Regenerate from CSVs after each race.
 *
 * SCHEMA:
 *   constructorId  — Ergast numeric ID
 *   ref            — Ergast slug (used as key)
 *   name           — Display name
 *   color          — Team hex color
 *   base           — Factory location
 *   principal      — Team Principal 2026
 *   chassis        — 2026 chassis name
 *   engine         — 2026 power unit supplier
 *   wccTitles      — Array of WCC championship years
 *   totalWccTitles — Count
 *   seasonHistory  — {year: {position, points, wins}} from 2014
 *   pts2026ByRace  — Points per race 2026 [AUS, CHN, JPN, MIA, ...]
 */

const F1_CONSTRUCTORS = {
  "mclaren": {
    "constructorId": "1",
    "ref": "mclaren",
    "name": "McLaren",
    "color": "#FF8000",
    "base": "Woking, UK",
    "principal": "Andrea Stella",
    "chassis": "MCL40",
    "engine": "Mercedes",
    "wccTitles": [
      2025
    ],
    "totalWccTitles": 1,
    "seasonHistory": {
      "2014": {
        "position": 2,
        "points": 353.0,
        "wins": 4
      },
      "2015": {
        "position": 3,
        "points": 378.0,
        "wins": 7
      },
      "2016": {
        "position": 6,
        "points": 43.0,
        "wins": 0
      },
      "2017": {
        "position": 9,
        "points": 0.0,
        "wins": 0
      },
      "2018": {
        "position": 8,
        "points": 12.0,
        "wins": 0
      },
      "2019": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      },
      "2020": {
        "position": 7,
        "points": 48.0,
        "wins": 0
      },
      "2021": {
        "position": 4,
        "points": 83.0,
        "wins": 0
      },
      "2022": {
        "position": 3,
        "points": 171.0,
        "wins": 0
      },
      "2023": {
        "position": 3,
        "points": 240.0,
        "wins": 1
      },
      "2024": {
        "position": 5,
        "points": 130.0,
        "wins": 0
      },
      "2025": {
        "position": 1,
        "points": 566.0,
        "wins": 5
      },
      "2026": {
        "position": 3,
        "points": 94.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      27.0,
      15.0,
      32.0,
      26.0
    ]
  },
  "williams": {
    "constructorId": "3",
    "ref": "williams",
    "name": "Williams",
    "color": "#64C4FF",
    "base": "Grove, UK",
    "principal": "James Vowles",
    "chassis": "FW47",
    "engine": "Mercedes",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2014": {
        "position": 9,
        "points": 5.0,
        "wins": 0
      },
      "2015": {
        "position": 8,
        "points": 76.0,
        "wins": 1
      },
      "2016": {
        "position": 5,
        "points": 46.0,
        "wins": 0
      },
      "2017": {
        "position": 3,
        "points": 81.0,
        "wins": 0
      },
      "2018": {
        "position": 4,
        "points": 65.0,
        "wins": 0
      },
      "2019": {
        "position": 6,
        "points": 20.0,
        "wins": 0
      },
      "2020": {
        "position": 10,
        "points": 4.0,
        "wins": 0
      },
      "2021": {
        "position": 10,
        "points": 1.0,
        "wins": 0
      },
      "2022": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      },
      "2023": {
        "position": 8,
        "points": 23.0,
        "wins": 0
      },
      "2024": {
        "position": 10,
        "points": 8.0,
        "wins": 0
      },
      "2025": {
        "position": 8,
        "points": 17.0,
        "wins": 0
      },
      "2026": {
        "position": 8,
        "points": 5.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      0.0,
      0.0,
      0.0,
      0.0
    ]
  },
  "ferrari": {
    "constructorId": "6",
    "ref": "ferrari",
    "name": "Ferrari",
    "color": "#E8002D",
    "base": "Maranello, Italy",
    "principal": "Fr\u00e9d\u00e9ric Vasseur",
    "chassis": "SF-26",
    "engine": "Ferrari",
    "wccTitles": [
      2019
    ],
    "totalWccTitles": 1,
    "seasonHistory": {
      "2014": {
        "position": 3,
        "points": 268.0,
        "wins": 1
      },
      "2015": {
        "position": 2,
        "points": 400.0,
        "wins": 3
      },
      "2016": {
        "position": 3,
        "points": 66.0,
        "wins": 0
      },
      "2017": {
        "position": 2,
        "points": 132.0,
        "wins": 1
      },
      "2018": {
        "position": 2,
        "points": 109.0,
        "wins": 0
      },
      "2019": {
        "position": 1,
        "points": 196.0,
        "wins": 3
      },
      "2020": {
        "position": 2,
        "points": 302.0,
        "wins": 4
      },
      "2021": {
        "position": 2,
        "points": 351.0,
        "wins": 2
      },
      "2022": {
        "position": 6,
        "points": 131.0,
        "wins": 0
      },
      "2023": {
        "position": 4,
        "points": 232.5,
        "wins": 0
      },
      "2024": {
        "position": 2,
        "points": 454.0,
        "wins": 4
      },
      "2025": {
        "position": 2,
        "points": 537.0,
        "wins": 5
      },
      "2026": {
        "position": 2,
        "points": 112.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      20.0,
      27.0,
      35.0,
      33.0
    ]
  },
  "red_bull": {
    "constructorId": "9",
    "ref": "red_bull",
    "name": "Red Bull",
    "color": "#3671C6",
    "base": "Milton Keynes, UK",
    "principal": "Christian Horner",
    "chassis": "RB22",
    "engine": "Ford",
    "wccTitles": [
      2014,
      2015,
      2024
    ],
    "totalWccTitles": 3,
    "seasonHistory": {
      "2014": {
        "position": 1,
        "points": 491.0,
        "wins": 9
      },
      "2015": {
        "position": 1,
        "points": 460.0,
        "wins": 7
      },
      "2016": {
        "position": 2,
        "points": 84.0,
        "wins": 0
      },
      "2017": {
        "position": 4,
        "points": 30.0,
        "wins": 0
      },
      "2018": {
        "position": 3,
        "points": 94.0,
        "wins": 1
      },
      "2019": {
        "position": 3,
        "points": 97.0,
        "wins": 0
      },
      "2020": {
        "position": 3,
        "points": 211.0,
        "wins": 3
      },
      "2021": {
        "position": 3,
        "points": 266.0,
        "wins": 2
      },
      "2022": {
        "position": 2,
        "points": 274.0,
        "wins": 1
      },
      "2023": {
        "position": 2,
        "points": 397.5,
        "wins": 8
      },
      "2024": {
        "position": 1,
        "points": 619.0,
        "wins": 14
      },
      "2025": {
        "position": 3,
        "points": 512.0,
        "wins": 7
      },
      "2026": {
        "position": 4,
        "points": 30.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      32.0,
      11.0,
      26.0,
      8.0
    ]
  },
  "aston_martin": {
    "constructorId": "117",
    "ref": "aston_martin",
    "name": "Aston Martin",
    "color": "#229971",
    "base": "Silverstone, UK",
    "principal": "Andy Cowell",
    "chassis": "AMR26",
    "engine": "Honda",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2023": {
        "position": 7,
        "points": 61.0,
        "wins": 0
      },
      "2024": {
        "position": 7,
        "points": 45.0,
        "wins": 0
      },
      "2025": {
        "position": 5,
        "points": 86.0,
        "wins": 0
      },
      "2026": {
        "position": 11,
        "points": 0.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      0.0,
      0.0,
      6.0,
      2.0
    ]
  },
  "mercedes": {
    "constructorId": "131",
    "ref": "mercedes",
    "name": "Mercedes",
    "color": "#27F4D2",
    "base": "Brackley, UK",
    "principal": "Toto Wolff",
    "chassis": "W16",
    "engine": "Mercedes",
    "wccTitles": [
      2016,
      2017,
      2018,
      2020,
      2021,
      2022,
      2023,
      2026
    ],
    "totalWccTitles": 8,
    "seasonHistory": {
      "2014": {
        "position": 4,
        "points": 114.0,
        "wins": 0
      },
      "2015": {
        "position": 5,
        "points": 142.0,
        "wins": 1
      },
      "2016": {
        "position": 1,
        "points": 197.0,
        "wins": 5
      },
      "2017": {
        "position": 1,
        "points": 202.0,
        "wins": 4
      },
      "2018": {
        "position": 1,
        "points": 157.0,
        "wins": 4
      },
      "2019": {
        "position": 2,
        "points": 179.0,
        "wins": 3
      },
      "2020": {
        "position": 1,
        "points": 310.0,
        "wins": 4
      },
      "2021": {
        "position": 1,
        "points": 505.0,
        "wins": 10
      },
      "2022": {
        "position": 1,
        "points": 533.0,
        "wins": 13
      },
      "2023": {
        "position": 1,
        "points": 433.5,
        "wins": 6
      },
      "2024": {
        "position": 3,
        "points": 387.0,
        "wins": 0
      },
      "2025": {
        "position": 4,
        "points": 366.0,
        "wins": 3
      },
      "2026": {
        "position": 1,
        "points": 180.0,
        "wins": 4
      }
    },
    "pts2026ByRace": [
      16.0,
      43.0,
      21.0,
      22.0
    ]
  },
  "haas": {
    "constructorId": "210",
    "ref": "haas",
    "name": "Haas",
    "color": "#B6BABD",
    "base": "Kannapolis, USA",
    "principal": "Ayao Komatsu",
    "chassis": "VF-26",
    "engine": "Ferrari",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2018": {
        "position": 6,
        "points": 22.0,
        "wins": 0
      },
      "2019": {
        "position": 8,
        "points": 14.0,
        "wins": 0
      },
      "2020": {
        "position": 6,
        "points": 59.0,
        "wins": 0
      },
      "2021": {
        "position": 9,
        "points": 26.0,
        "wins": 0
      },
      "2022": {
        "position": 9,
        "points": 3.0,
        "wins": 0
      },
      "2023": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      },
      "2024": {
        "position": 8,
        "points": 34.0,
        "wins": 0
      },
      "2025": {
        "position": 6,
        "points": 46.0,
        "wins": 0
      },
      "2026": {
        "position": 6,
        "points": 18.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      0.0,
      4.0,
      4.0,
      4.0
    ]
  },
  "alpine": {
    "constructorId": "214",
    "ref": "alpine",
    "name": "Alpine",
    "color": "#FF87BC",
    "base": "Enstone, UK",
    "principal": "Oliver Oakes",
    "chassis": "A526",
    "engine": "Renault",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2023": {
        "position": 5,
        "points": 104.0,
        "wins": 1
      },
      "2024": {
        "position": 4,
        "points": 143.0,
        "wins": 0
      },
      "2025": {
        "position": 9,
        "points": 14.0,
        "wins": 0
      },
      "2026": {
        "position": 5,
        "points": 21.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      35.0,
      0.0,
      10.0,
      6.0
    ]
  },
  "rb": {
    "constructorId": "215",
    "ref": "rb",
    "name": "Racing Bulls",
    "color": "#6692FF",
    "base": "Faenza, Italy",
    "principal": "Laurent Mekies",
    "chassis": "VCARB 02",
    "engine": "Honda",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2025": {
        "position": 7,
        "points": 36.0,
        "wins": 0
      },
      "2026": {
        "position": 7,
        "points": 14.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      8.0,
      2.0,
      0.0,
      0.0
    ]
  },
  "cadillac": {
    "constructorId": "216",
    "ref": "cadillac",
    "name": "Cadillac",
    "color": "#C8102E",
    "base": "Speedway, USA",
    "principal": "Graeme Lowdon",
    "chassis": "CADS1",
    "engine": "Ferrari",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2026": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      0.0,
      0.0,
      0.0,
      0.0
    ]
  },
  "audi": {
    "constructorId": "15",
    "ref": "audi",
    "name": "Audi",
    "color": "#52E252",
    "base": "Hinwil, Switzerland",
    "principal": "Mattia Binotto",
    "chassis": "C46",
    "engine": "Ferrari",
    "wccTitles": [],
    "totalWccTitles": 0,
    "seasonHistory": {
      "2014": {
        "position": 7,
        "points": 36.0,
        "wins": 0
      },
      "2015": {
        "position": 6,
        "points": 126.0,
        "wins": 0
      },
      "2016": {
        "position": 9,
        "points": 0.0,
        "wins": 0
      },
      "2017": {
        "position": 5,
        "points": 19.0,
        "wins": 0
      },
      "2018": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      },
      "2019": {
        "position": 9,
        "points": 4.0,
        "wins": 0
      },
      "2020": {
        "position": 9,
        "points": 18.0,
        "wins": 0
      },
      "2021": {
        "position": 8,
        "points": 48.0,
        "wins": 0
      },
      "2025": {
        "position": 10,
        "points": 0.0,
        "wins": 0
      },
      "2026": {
        "position": 9,
        "points": 70.0,
        "wins": 0
      }
    },
    "pts2026ByRace": [
      0.0,
      0.0,
      4.0,
      0.0
    ]
  }
};

if (typeof module !== 'undefined') {
  module.exports = { F1_CONSTRUCTORS };
}
