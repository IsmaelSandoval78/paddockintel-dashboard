import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// paddockintel.com (apex) is the magazine home; hub.paddockintel.com is the
// Hub dashboard. Both point to this same deployment, so the bare root paths
// need to resolve to different pages depending on which domain asked.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);
const ROOT_PATHS = new Set(['/', '/es/', '/pt/']);

export default function proxy(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0];

  // Let next-intl's middleware run first — it sets the request-header signal
  // that `lib/i18n/request.ts` reads to pick the right locale/messages, and
  // (for the default "en" locale) does its own internal rewrite of "/" -> "/en"
  // so the `[locale]` file segment resolves. We only redirect *where within
  // that already-resolved locale* the response points.
  const response = intlMiddleware(request);

  if (MAGAZINE_HOSTS.has(host) && ROOT_PATHS.has(request.nextUrl.pathname)) {
    const rewriteHeader = response.headers.get('x-middleware-rewrite');
    const target = rewriteHeader ? new URL(rewriteHeader) : request.nextUrl.clone();
    target.pathname = `${target.pathname}${target.pathname.endsWith('/') ? '' : '/'}magazine-home`;
    response.headers.set('x-middleware-rewrite', target.toString());
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
