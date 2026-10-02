// PaddockIntel's editorial day is US Eastern (see lib/i18n/request.ts) -- any
// "today" comparison against a race/article calendar date must use this, not
// the server runtime's local clock (UTC on Cloudflare). Using the raw clock
// means a ~4-5h window every evening (UTC has rolled to tomorrow, Eastern
// hasn't) shows the wrong "next race"/"latest race", or groups a same-day
// item under the wrong day header on the Feed page.
const EDITORIAL_TZ = 'America/New_York';

/** A given instant's calendar date in the editorial timezone, as YYYY-MM-DD. */
export function easternDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: EDITORIAL_TZ }).format(date);
}

/** Today's calendar date in the editorial timezone, as YYYY-MM-DD. */
export function editorialToday(): string {
  return easternDateKey(new Date());
}
