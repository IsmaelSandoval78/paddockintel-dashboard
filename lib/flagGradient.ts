// ─── Canonical flag colours per ISO-3166-1 alpha-2 code ──────────────────────
//
// Each entry is a 3-stripe horizontal simplification: [left, centre, right].
// Use #E8E6E0 for white stripes so they remain visible on the #F4F4F0 substrate.

const ISO2_COLORS: Record<string, readonly [string, string, string]> = {
  AR: ['#74ACDF', '#E8E6E0', '#74ACDF'], // Argentina — light-blue / white / light-blue
  AT: ['#ED2939', '#E8E6E0', '#ED2939'], // Austria   — red / white / red
  AU: ['#00008B', '#E8E6E0', '#FF0000'], // Australia — navy / white / red
  BE: ['#000000', '#FAE042', '#EF3340'], // Belgium   — black / yellow / red
  BR: ['#009C3B', '#FEDF00', '#002776'], // Brazil    — green / yellow / blue
  CA: ['#FF0000', '#E8E6E0', '#FF0000'], // Canada    — red / white / red
  CH: ['#FF0000', '#E8E6E0', '#FF0000'], // Switzerland — red / white / red
  CL: ['#D52B1E', '#E8E6E0', '#0039A6'], // Chile     — red / white / blue
  CO: ['#FCD116', '#003087', '#CE1126'], // Colombia  — yellow / blue / red
  CZ: ['#D7141A', '#E8E6E0', '#11457E'], // Czech Rep — red / white / blue
  DE: ['#000000', '#DD0000', '#FFCE00'], // Germany   — black / red / gold
  DK: ['#C60C30', '#E8E6E0', '#C60C30'], // Denmark   — red / white / red
  ES: ['#AA151B', '#F1BF00', '#AA151B'], // Spain     — red / yellow / red
  FI: ['#E8E6E0', '#003580', '#E8E6E0'], // Finland   — white / blue / white
  FR: ['#002395', '#E8E6E0', '#ED2939'], // France    — blue / white / red
  GB: ['#012169', '#E8E6E0', '#C8102E'], // UK        — navy / white / red
  HU: ['#CE2939', '#E8E6E0', '#436F4D'], // Hungary   — red / white / green
  ID: ['#CE1126', '#E8E6E0', '#CE1126'], // Indonesia — red / white / red
  IE: ['#169B62', '#E8E6E0', '#FF883E'], // Ireland   — green / white / orange
  IN: ['#FF9933', '#E8E6E0', '#138808'], // India     — saffron / white / green
  IT: ['#009246', '#E8E6E0', '#CE2B37'], // Italy     — green / white / red
  JP: ['#E8E6E0', '#BC002D', '#E8E6E0'], // Japan     — white / red / white
  KR: ['#E8E6E0', '#CD2E3A', '#0047A0'], // Korea     — white / red / blue
  LI: ['#002B7F', '#CE1126', '#002B7F'], // Liechtenstein — blue / red / blue
  MC: ['#CE1126', '#E8E6E0', '#CE1126'], // Monaco    — red / white / red
  MX: ['#006847', '#E8E6E0', '#CE1126'], // Mexico    — green / white / red
  MY: ['#CC0001', '#E8E6E0', '#CC0001'], // Malaysia  — red / white / red
  NG: ['#008751', '#E8E6E0', '#008751'], // Nigeria   — green / white / green
  NL: ['#AE1C28', '#E8E6E0', '#21468B'], // Netherlands — red / white / blue
  NO: ['#EF2B2D', '#E8E6E0', '#EF2B2D'], // Norway    — red / white / red
  NZ: ['#00247D', '#E8E6E0', '#CC142B'], // New Zealand — blue / white / red
  PL: ['#E8E6E0', '#DC143C', '#E8E6E0'], // Poland    — white / red / white
  PT: ['#006600', '#FF0000', '#006600'], // Portugal  — green / red / green
  RO: ['#002B7F', '#FCD116', '#CE1126'], // Romania   — blue / yellow / red
  RU: ['#E8E6E0', '#0039A6', '#D52B1E'], // Russia    — white / blue / red
  SE: ['#006AA7', '#FECC00', '#006AA7'], // Sweden    — blue / yellow / blue
  TH: ['#A51931', '#F4F5F8', '#2D2A4A'], // Thailand  — red / white / blue
  UA: ['#005BBB', '#FFD500', '#005BBB'], // Ukraine   — blue / yellow / blue
  US: ['#B22234', '#E8E6E0', '#3C3B6E'], // USA       — red / white / blue
  VE: ['#CF142B', '#E8E6E0', '#003893'], // Venezuela — red / white / blue
  ZA: ['#007A4D', '#FFB81C', '#001489'], // S. Africa — green / yellow / blue
  ZW: ['#006400', '#FEDF00', '#D40000'], // Zimbabwe  — green / yellow / red
};

// ─── Nationality string (from Ergast/Supabase) → ISO-3166-1 alpha-2 ─────────
//
// Covers all known nationality values in the drivers table, including
// historical variants ("East German"), alternate spellings, and
// dual-nationality strings (e.g. "British-Finnish" → GB).

const NATIONALITY_ISO2: Record<string, string> = {
  // A
  'American':            'US',
  'Argentine':           'AR',
  'Australian':          'AU',
  'Austrian':            'AT',
  // B
  'Belgian':             'BE',
  'Brazilian':           'BR',
  'British':             'GB',
  'British-Finnish':     'GB',  // dual-nationality → primary country
  'British-American':    'GB',
  // C
  'Canadian':            'CA',
  'Chilean':             'CL',
  'Colombian':           'CO',
  'Czech':               'CZ',
  // D
  'Danish':              'DK',
  'Dutch':               'NL',
  // E
  'East German':         'DE',  // historical → Germany
  // F
  'Finnish':             'FI',
  'French':              'FR',
  // G
  'German':              'DE',
  // H
  'Hungarian':           'HU',
  // I
  'Indian':              'IN',
  'Indonesian':          'ID',
  'Irish':               'IE',
  'Italian':             'IT',
  // J
  'Japanese':            'JP',
  // K
  'Korean':              'KR',
  // L
  'Liechtensteiner':     'LI',
  // M
  'Malaysian':           'MY',
  'Mexican':             'MX',
  'Monégasque':          'MC',
  // N
  'New Zealander':       'NZ',
  'New Zealand':         'NZ',  // alternate form
  'Nigerian':            'NG',
  'Norwegian':           'NO',
  // P
  'Polish':              'PL',
  'Portuguese':          'PT',
  // R
  'Rhodesian':           'ZW',  // historical → Zimbabwe
  'Romanian':            'RO',
  'Russian':             'RU',
  // S
  'South African':       'ZA',
  'Spanish':             'ES',
  'Swedish':             'SE',
  'Swiss':               'CH',
  // T
  'Thai':                'TH',
  // U
  'Ukrainian':           'UA',
  // V
  'Venezuelan':          'VE',
  // Z
  'Zimbabwean':          'ZW',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a CSS linear-gradient string for a 3-stripe flag.
 * @param nationality  Ergast nationality string, e.g. "British", "Dutch"
 */
export function flagGradient(nationality: string): string {
  const iso2 = NATIONALITY_ISO2[nationality];
  const c    = iso2 ? ISO2_COLORS[iso2] : undefined;
  if (!c) return 'linear-gradient(to right,#B0AFA8 0%,#6B6B6B 50%,#B0AFA8 100%)';
  return `linear-gradient(to right,${c[0]} 0%,${c[0]} 33.33%,${c[1]} 33.33%,${c[1]} 66.66%,${c[2]} 66.66%,${c[2]} 100%)`;
}
