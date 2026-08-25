// WORKAROUND (added 2026-08-25, part of the Cloudflare migration): using the
// deprecated `middleware.ts` convention instead of `proxy.ts` on purpose.
// Next.js 16 forces `proxy.ts` onto the Node.js middleware runtime with no
// opt-out, and @opennextjs/cloudflare (currently 1.20.2) doesn't support that
// yet — verified locally: `npx opennextjs-cloudflare build` fails on a real
// `proxy.ts` with "ERROR Node.js middleware is not currently supported."
// `middleware.ts` + `runtime: 'experimental-edge'` builds clean on both
// `next build` and `opennextjs-cloudflare build` (deprecation warning only,
// no error) — see docs/CLOUDFLARE-MIGRATION.md for the full investigation.
//
// REVERT CONDITION: switch back to `proxy.ts` (function name `proxy`, drop
// the `runtime` key) once opennextjs/adapters-api#38 or
// opennextjs/opennextjs-cloudflare#1320 — or whatever PR supersedes either of
// those — ships in a published @opennextjs/cloudflare release on npm. Check
// those two PR numbers specifically, not "has OpenNext added Node middleware
// support" in general — #1320 was already closed once (2026-08-03) without
// merging, so there may be a successor PR under a different number by the
// time this is revisited.

import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// paddockintel.com (apex) is the magazine home; hub.paddockintel.com is the
// Hub dashboard. Both point to this same deployment, so the bare root paths
// need to resolve to different pages depending on which domain asked.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);
const ROOT_PATHS = new Set(['/', '/es/', '/pt/']);

export default function middleware(request: NextRequest) {
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
  runtime: 'experimental-edge',
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
