import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Editorial "today" is US Eastern -- without this, next-intl's dateTime
    // formatters default to the server runtime's UTC, so anything published
    // in the last ~4-5h of the US day (UTC is ahead of ET) shows tomorrow's
    // date to every reader, regardless of their own timezone (RSC renders
    // dates once, server-side).
    timeZone: 'America/New_York',
    messages: (await import(`../../locales/${locale}.json`)).default
  };
});
