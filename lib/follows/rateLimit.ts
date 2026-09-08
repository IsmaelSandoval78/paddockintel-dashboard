// Real requirement from docs/advisors/CYBERSECURITY-EXPERT.md ("this matters more
// once personalization/follow features create authenticated write paths that could
// be abused"): the UNIQUE(user_id, driver_id) constraint on driver_follows/
// constructor_follows stops duplicate rows, but not a scripted client hammering the
// toggle endpoint — that's a write-amplification/cost concern, not a data-integrity
// one, so a lightweight in-memory limiter is proportionate here (no new dependency,
// no new migration).
//
// Known limitation, stated plainly: this Map is per Vercel Function instance, not
// global. Fluid Compute reuses instances across concurrent requests, so this catches
// real abuse from a single client in practice, but a distributed attacker spreading
// requests across many cold-started instances could still exceed the limit in
// aggregate. Given the real domain here is ~20 drivers + ~10 constructors (a hard
// ceiling on how many distinct rows even exist to spam), the worst case is bounded
// request volume, not unbounded data growth. Revisit with a real distributed limiter
// (e.g. a Postgres-backed counter) only if abuse is actually observed.
const WINDOW_MS = 60_000;
const MAX_TOGGLES_PER_WINDOW = 20;

const hits = new Map<string, { count: number; windowStart: number }>();

export function checkFollowRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = hits.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_TOGGLES_PER_WINDOW) return false;

  entry.count += 1;
  return true;
}
