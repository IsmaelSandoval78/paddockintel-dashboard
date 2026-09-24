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

import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// paddockintel.com (apex) is the magazine home; hub.paddockintel.com is the
// Hub dashboard. Both point to this same deployment, so the bare root paths
// need to resolve to different pages depending on which domain asked.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);
const HUB_HOST = 'hub.paddockintel.com';
const ROOT_PATHS = new Set(['/', '/es/', '/pt/']);

// Hub entity trees. On a magazine host these must not stay indexable — 301 to
// the same path on the hub (locale prefix included: en has none, es/pt do;
// /en/ is matched too so it doesn't render on the magazine before next-intl
// collapses it). Checked before the apex → www 308 so an apex entity URL goes
// straight to the hub instead of bouncing through www. Apex → www itself is
// unchanged for every other path.
const HUB_ENTITY_PATH =
  /^\/(?:(?:en|es|pt)\/)?(?:circuits|drivers|constructors|compare|records)(?:\/|$)/;

// robots.txt / sitemap.xml contain a dot, so the page matcher below skips
// them. They are matched explicitly so apex → www covers them; otherwise the
// apex returns 200 and advertises https://paddockintel.com/sitemap.xml.
// next-intl must not see these — it would locale-prefix a metadata file.
const HOST_METADATA_PATHS = new Set(['/robots.txt', '/sitemap.xml']);

// HSTS + the apex -> www redirect were never app code — Vercel adds both
// automatically at the platform/domain level (confirmed via curl: every
// vercel.com-served response carries this header, and the bare apex 308s to
// www with no app logic involved). Neither exists on a Cloudflare Worker by
// default, so both are made explicit here — one source of truth that
// produces identical behavior on both platforms, instead of a Cloudflare
// zone-level Redirect Rule + HSTS toggle that would need to be kept in sync
// with this file by hand. See docs/CLOUDFLARE-MIGRATION.md.
const HSTS_VALUE = 'max-age=63072000';

function redirectToHost(request: NextRequest, hostname: string, status: 301 | 308) {
  const target = request.nextUrl.clone();
  target.protocol = 'https:';
  target.host = hostname;
  target.port = '';
  const redirect = NextResponse.redirect(target, status);
  redirect.headers.set('strict-transport-security', HSTS_VALUE);
  return redirect;
}

export default function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0];
  const { pathname } = request.nextUrl;

  if (MAGAZINE_HOSTS.has(host) && HUB_ENTITY_PATH.test(pathname)) {
    return redirectToHost(request, HUB_HOST, 301);
  }

  if (host === 'paddockintel.com') {
    return redirectToHost(request, 'www.paddockintel.com', 308);
  }

  if (HOST_METADATA_PATHS.has(pathname)) {
    const response = NextResponse.next();
    response.headers.set('strict-transport-security', HSTS_VALUE);
    return response;
  }

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

  response.headers.set('strict-transport-security', HSTS_VALUE);
  return response;
}

export const config = {
  runtime: 'experimental-edge',
  // icon/apple-icon/opengraph-image/twitter-image are Next.js's special
  // metadata-route files (app/icon.tsx etc.) — they resolve to URLs with no
  // file extension, same as any real page, so without this exclusion the
  // catch-all below sends them through next-intl's locale routing and it
  // 404s them (confirmed: /icon redirected to /icon/ and 404'd until this
  // was added).
  matcher: [
    '/((?!api|_next|_vercel|icon|apple-icon|opengraph-image|twitter-image|.*\\..*).*)',
    '/robots.txt',
    '/sitemap.xml',
  ]
};
