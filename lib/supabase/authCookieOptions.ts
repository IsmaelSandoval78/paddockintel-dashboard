import type { CookieOptions } from '@supabase/ssr';

// Shared base between authServerClient.ts and authBrowserClient.ts so the
// two can never drift on domain/secure/sameSite (a mismatch there between
// the client that writes a cookie and the client that reads it is exactly
// how PKCE/session handshakes break in hard-to-debug ways). httpOnly is
// deliberately NOT in this shared base — see below.
//
// domain: '.paddockintel.com' — one login works across both
// paddockintel.com and hub.paddockintel.com (product decision: follows span
// drivers/constructors on the Hub and experts on the magazine, so it has to
// be one shared session, not two).
const sharedAuthCookieOptions: CookieOptions = {
  domain: '.paddockintel.com',
  secure: true,
  sameSite: 'lax',
};

// httpOnly DIFFERS ON PURPOSE between the server and browser client. Do not
// "fix" this into one shared value without reading why first:
//
// The final session cookie is written server-side via a real HTTP
// Set-Cookie response (the OAuth callback route, via authServerClient.ts) —
// that can genuinely be httpOnly, and is (authServerHttpOnly = true).
// Confirmed with a real Set-Cookie header from that exact code path,
// 2026-09-06: `Domain=.paddockintel.com; Secure; HttpOnly; SameSite=lax`.
//
// The PKCE code verifier is written by the BROWSER, before the redirect to
// the OAuth provider or magic-link request even happens, via
// `document.cookie = ...` (authBrowserClient.ts, through @supabase/ssr's
// document.cookie fallback). Confirmed in a real Chrome instance, same
// date: a document.cookie write whose string contains `HttpOnly` is not
// merely "set without the flag applying" — Chrome silently REFUSES to
// store the cookie at all. It never reaches the cookie jar and is never
// sent back to the server. This is a hard restriction of the Cookie Store
// API when writing from script, not a config knob — no value passed here
// changes it. Setting authBrowserHttpOnly = true previously broke sign-in
// completely: the verifier was never stored, so the callback's
// exchangeCodeForSession() had nothing to validate the returned code
// against.
//
// domain, secure, and sameSite stay identical between both clients — only
// httpOnly is allowed to differ, and only for this specific, verified
// reason.
const authServerHttpOnly = true;
const authBrowserHttpOnly = false;

export const authServerCookieOptions: CookieOptions = {
  ...sharedAuthCookieOptions,
  httpOnly: authServerHttpOnly,
};

export const authBrowserCookieOptions: CookieOptions = {
  ...sharedAuthCookieOptions,
  httpOnly: authBrowserHttpOnly,
};
