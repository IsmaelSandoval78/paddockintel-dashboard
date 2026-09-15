// Public, unauthenticated route (docs/advisors/CYBERSECURITY-EXPERT.md:
// "Public-facing API routes ... have basic rate limiting") — keyed by IP
// since there's no session to key on. Same per-instance limitation as
// lib/follows/rateLimit.ts: this Map doesn't share state across Function
// instances, so it stops casual abuse from one client, not a distributed
// attacker. The query itself is one indexed Postgres lookup, so the bounded
// worst case is cheap regardless.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const hits = new Map<string, { count: number; windowStart: number }>();

export function checkSearchRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;

  entry.count += 1;
  return true;
}
