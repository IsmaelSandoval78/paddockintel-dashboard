// Session clocks on circuit pages.
// `races.*_time` is UTC (Ergast/jolpica). Baku 2026 was checked against the
// F1.com timetable: FP1 Thu 12:30 local = 08:30Z, race Sat 15:00 local = 11:00Z.

export const US_EASTERN_TZ = 'America/New_York';

export type SessionKey = 'fp1' | 'fp2' | 'fp3' | 'sprint' | 'qualifying' | 'race';

export type ScheduleNoteKey = 'bakuSaturday';

export type ScheduleSession = {
  key: SessionKey;
  /** UTC instant, ISO-8601 with Z. */
  startUtc: string;
};

export type WeekendSchedule = {
  sessions: ScheduleSession[];
  /** IANA zone for the circuit. Null when we have no zone — show ET and UTC only. */
  timeZone: string | null;
  noteKey: ScheduleNoteKey | null;
  feedSlug: string | null;
};

// 2026 calendar circuits. IANA zones, so DST is applied per instant rather than
// a fixed offset. Circuits missing from this map still render ET + UTC.
const CIRCUIT_TIME_ZONES: Record<string, string> = {
  albert_park: 'Australia/Melbourne',
  americas: 'America/Chicago',
  baku: 'Asia/Baku',
  catalunya: 'Europe/Madrid',
  hungaroring: 'Europe/Budapest',
  interlagos: 'America/Sao_Paulo',
  losail: 'Asia/Qatar',
  madring: 'Europe/Madrid',
  marina_bay: 'Asia/Singapore',
  miami: 'America/New_York',
  monaco: 'Europe/Monaco',
  monza: 'Europe/Rome',
  red_bull_ring: 'Europe/Vienna',
  rodriguez: 'America/Mexico_City',
  shanghai: 'Asia/Shanghai',
  silverstone: 'Europe/London',
  spa: 'Europe/Brussels',
  suzuka: 'Asia/Tokyo',
  vegas: 'America/Los_Angeles',
  villeneuve: 'America/Toronto',
  yas_marina: 'Asia/Dubai',
  zandvoort: 'Europe/Amsterdam',
};

const NOTE_KEYS: Record<string, ScheduleNoteKey> = {
  'baku:2026': 'bakuSaturday',
};

const SESSION_FIELDS: { key: SessionKey; dateKey: string; timeKey: string }[] = [
  { key: 'fp1', dateKey: 'fp1_date', timeKey: 'fp1_time' },
  { key: 'fp2', dateKey: 'fp2_date', timeKey: 'fp2_time' },
  { key: 'fp3', dateKey: 'fp3_date', timeKey: 'fp3_time' },
  { key: 'sprint', dateKey: 'sprint_date', timeKey: 'sprint_time' },
  { key: 'qualifying', dateKey: 'quali_date', timeKey: 'quali_time' },
  { key: 'race', dateKey: 'date', timeKey: 'time' },
];

export function circuitTimeZone(circuitRef: string): string | null {
  return CIRCUIT_TIME_ZONES[circuitRef] ?? null;
}

function rowString(row: object, key: string): string | null {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Date + UTC clock from the races table → ISO instant. */
export function utcInstant(date: string, time: string): string | null {
  const day = date.slice(0, 10);
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(time.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !match) return null;
  const iso = `${day}T${match[1]}:${match[2]}:${match[3] ?? '00'}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function buildWeekendSchedule(input: {
  circuitRef: string;
  year: number;
  race: object;
}): WeekendSchedule | null {
  const sessions: ScheduleSession[] = [];
  for (const field of SESSION_FIELDS) {
    const date = rowString(input.race, field.dateKey);
    const time = rowString(input.race, field.timeKey);
    if (!date || !time) continue;
    const startUtc = utcInstant(date, time);
    if (!startUtc) continue;
    sessions.push({ key: field.key, startUtc });
  }
  if (!sessions.length) return null;
  sessions.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return {
    sessions,
    timeZone: circuitTimeZone(input.circuitRef),
    noteKey: NOTE_KEYS[`${input.circuitRef}:${input.year}`] ?? null,
    feedSlug: null,
  };
}

/** True when a digest slug names this circuit, e.g. baku-…-weekend-light. */
export function digestSlugMentionsCircuit(slug: string, circuitRef: string): boolean {
  const slugParts = slug.toLowerCase().split('-').filter(Boolean);
  const tokenParts = circuitRef.toLowerCase().replace(/_/g, '-').split('-').filter(Boolean);
  if (!tokenParts.length || slugParts.length < tokenParts.length) return false;
  for (let i = 0; i <= slugParts.length - tokenParts.length; i += 1) {
    if (tokenParts.every((part, offset) => slugParts[i + offset] === part)) return true;
  }
  return false;
}

export function formatSessionClock(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(isoUtc));
}

/** "GMT+4" from Intl → "UTC+4". */
export function utcOffsetLabel(timeZone: string, isoUtc: string): string {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  })
    .formatToParts(new Date(isoUtc))
    .find((part) => part.type === 'timeZoneName')?.value;
  if (!name || name === 'GMT') return 'UTC';
  return name.replace('GMT', 'UTC');
}

/** YYYY-MM-DD in the given zone, for grouping sessions onto a local day. */
export function zonedDayKey(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoUtc));
}
