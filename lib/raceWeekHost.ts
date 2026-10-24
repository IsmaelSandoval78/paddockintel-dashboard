// Race-week facts the database doesn't carry: each circuit's local timezone (so the strip can
// show the race start in local time from the UTC `races.time`), and which host countries have a
// flag palette in dusk.css (`.theme-dusk[data-host="..."]`). A circuit missing from TIMEZONES
// hides the local start time; a country missing from HOSTS keeps the plain dusk colours.

const TIMEZONES: Record<string, string> = {
  albert_park: 'Australia/Melbourne',
  americas: 'America/Chicago',
  bahrain: 'Asia/Bahrain',
  baku: 'Asia/Baku',
  catalunya: 'Europe/Madrid',
  hungaroring: 'Europe/Budapest',
  imola: 'Europe/Rome',
  interlagos: 'America/Sao_Paulo',
  jeddah: 'Asia/Riyadh',
  losail: 'Asia/Qatar',
  madring: 'Europe/Madrid',
  marina_bay: 'Asia/Singapore',
  miami: 'America/New_York',
  monaco: 'Europe/Monaco',
  monza: 'Europe/Rome',
  red_bull_ring: 'Europe/Vienna',
  rodriguez: 'America/Mexico_City',
  sepang: 'Asia/Kuala_Lumpur',
  shanghai: 'Asia/Shanghai',
  silverstone: 'Europe/London',
  spa: 'Europe/Brussels',
  suzuka: 'Asia/Tokyo',
  vegas: 'America/Los_Angeles',
  villeneuve: 'America/Toronto',
  yas_marina: 'Asia/Dubai',
  zandvoort: 'Europe/Amsterdam',
};

// Keyed by `circuits.country` as stored (Las Vegas is "United States", Austin and Miami "USA").
const HOSTS: Record<string, string> = {
  USA: 'usa',
  'United States': 'usa',
  Mexico: 'mexico',
  Brazil: 'brazil',
  Qatar: 'qatar',
  UAE: 'uae',
};

export function circuitTimeZone(circuitRef: string): string | null {
  return TIMEZONES[circuitRef] ?? null;
}

export function hostPalette(country: string): string | null {
  return HOSTS[country] ?? null;
}
