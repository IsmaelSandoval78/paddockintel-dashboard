# Cloudflare Migration — decisions & known workarounds

Running log for the Vercel → Cloudflare Workers migration (OpenNext adapter). Not
a how-to guide — a record of decisions made, why, and what to revisit later, so
nobody re-investigates something already settled.

---

## 2026-08-25 — `middleware.ts` instead of `proxy.ts` (temporary, tied to specific PRs)

**Decision:** use the deprecated `middleware.ts` file convention (function name
`middleware`, `export const config = { runtime: 'experimental-edge', ... }`)
instead of Next.js 16's `proxy.ts`.

**Why:** Next.js 16 forces `proxy.ts` onto the Node.js middleware runtime with no
opt-out (`runtime` config is disallowed on `proxy.ts` files). The currently
published `@opennextjs/cloudflare` (1.20.2) doesn't support Node-runtime
middleware yet — verified locally:

```
npx opennextjs-cloudflare build
...
ERROR Node.js middleware is not currently supported. Consider switching to Edge Middleware.
```

Confirmed via `gh api` against the real GitHub threads (not blog posts/secondhand
summaries) that this is a known, tracked gap in the adapter, not a Cloudflare
Workers architectural limit — a project's real `proxy.ts` using only
`NextRequest`/`NextResponse`/cookies (no Node-only APIs) hits the same wall, and
two independent implementation PRs already build+runtime-verify a fix:
- https://github.com/opennextjs/adapters-api/issues/20 (tracking issue)
- https://github.com/opennextjs/adapters-api/pull/38 (open as of 2026-08-25;
  "build+runtime validated on the PR branch" per author)
- https://github.com/opennextjs/opennextjs-cloudflare/pull/1320 (closed
  2026-08-03 *without merging* — verified build+runtime locally by the author
  first; no visible reason given for the close)

**Verified locally in this repo, both build paths, before applying:**
- `next build` (the Vercel/production path) — clean, only a deprecation
  warning ("The middleware file convention is deprecated"), not an error.
- `npx opennextjs-cloudflare build` — clean, generates `.open-next/worker.js`.
- Same routing logic, unchanged — only the function name (`proxy` → `middleware`)
  and the added `runtime: 'experimental-edge'` config key differ from the
  previous `proxy.ts`.

**REVERT CONDITION — be specific, not "when OpenNext adds support":**
Switch back to `proxy.ts` (rename the function back to `proxy`, drop the
`runtime` config key) once **opennextjs/adapters-api#38** or
**opennextjs/opennextjs-cloudflare#1320** — or whatever PR supersedes either of
those two, since #1320 was already closed once without merging — ships in a
published `@opennextjs/cloudflare` version on npm (currently 1.20.2, 2026-07-21,
no newer release as of this writing). Check those PR numbers specifically when
revisiting this, not "has OpenNext added Node middleware support" in general —
that's a broader search than necessary and this note already did the digging.

**Known caveat on `middleware.ts` itself:** it's a deprecated Next.js
convention. Per a community comment on the tracking issue, Next.js "shouldn't
drop support for this until Next 17" — but there's no committed removal date
from Next.js itself, so this isn't an indefinite workaround.

---

## ISR plan (approved 2026-08-25, applied to `wrangler.jsonc`)

- **R2 bucket** (Incremental Cache): `paddockintel-isr-cache`, binding
  `NEXT_INC_CACHE_R2_BUCKET`.
- **Durable Objects Queue** (time-based revalidation): binding
  `NEXT_CACHE_DO_QUEUE`, class `DOQueueHandler` — names fixed by OpenNext's
  `do-queue` override, not configurable.
- **D1 Tag Cache: omitted.** The codebase has zero calls to
  `revalidateTag`/`revalidatePath` today; OpenNext's docs say D1 is only needed
  for on-demand revalidation. Add it later (`D1NextModeTagCache` +
  `d1_databases` block + `tagCache` in `open-next.config.ts`) if that changes.
- Worker name: `paddockintel-dashboard` (matches `package.json`).

## Cron Triggers — replaces the Vercel Cron in `vercel.json` (applied 2026-08-25)

- `wrangler.jsonc`: `triggers.crons: ["0 9 * * *"]` — same schedule, both run
  in UTC so timing is unchanged.
- `.open-next/worker.js` (OpenNext's generated Worker) only exports `fetch`,
  no `scheduled` handler — added `custom-worker.ts` at the repo root
  (OpenNext's documented "custom worker" pattern:
  https://opennext.js.org/cloudflare/howtos/custom-worker) that re-exports the
  generated `fetch` + `DOQueueHandler`, and adds `scheduled`, which calls the
  existing `/api/digest/send` route via an internal `handler.fetch(...)` call
  — same route, same `Authorization: Bearer ${CRON_SECRET}` check, same
  `sent_at IS NULL` idempotency, no logic duplicated. `wrangler.jsonc`'s
  `main` points at `custom-worker.ts` instead of `.open-next/worker.js`
  directly.
- **Avoided `@cloudflare/workers-types`** for the handler's TS types — its
  global ambient declarations override `lib.dom`'s `fetch`/`Response` types
  for the *whole* TypeScript program, not just the file that references it,
  and broke `.then()`/`.json()` inference in 3 unrelated components
  (`TrackDominancePanel.tsx`, `CompareClient.tsx`, `MiBoxStrip.tsx`) when
  tried. `custom-worker.ts` uses small local interfaces instead
  (`MinimalExecutionContext`, etc.) scoped to what it actually touches.
- Verified with `npx wrangler deploy --dry-run` (no auth needed, doesn't
  publish): bindings resolve correctly (R2, DO Queue, self-reference
  service), ~1.98 MB gzipped upload — well under the Workers size limit.

**Duplicate-send risk during the cutover window (still applies):** don't run
both Vercel's cron and Cloudflare's cron long-term — turn one off the moment
the other is confirmed working. Softer than originally thought, though:
`/api/digest/send` already stamps `sent_at` on `digest_issues` right after a
successful send and only selects rows where `sent_at IS NULL`, so two crons
firing the same day mostly self-guards — the risk window is only the few
seconds between one cron's send completing and its `sent_at` UPDATE
committing, not the whole day.

**Still pending before a real deploy:** `wrangler secret put CRON_SECRET`
(and the other non-`NEXT_PUBLIC_*` secrets from the original migration
investigation — `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `DRAFT_SECRET`) once
`wrangler login` is done on the user's side.
