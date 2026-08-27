# Cloudflare Migration — decisions & known workarounds

Running log for the Vercel → Cloudflare Workers migration (OpenNext adapter). Not
a how-to guide — a record of decisions made, why, and what to revisit later, so
nobody re-investigates something already settled.

---

## ⚠️ R2 population hang — RESOLVED 2026-08-27, see below

**Status as of 2026-08-25 (kept for the record — see the resolution section
below for the current, correct state):** the `*.workers.dev` deploy had **R2
incremental cache population deliberately disabled** in `open-next.config.ts`
(`incrementalCache` commented out, only `queue: doQueue` active). This was
done ONLY to get a one-off smoke test deployed after `opennextjs-cloudflare
deploy`'s R2 population step hung indefinitely with zero progress output —
reproduced across 3 separate deploy attempts.

**Two more specific causes were investigated and ruled out** (2026-08-25),
narrowing this down rather than just "reproduced it a few times":
- **Bucket didn't exist yet** — real, and fixed (`wrangler r2 bucket create
  paddockintel-isr-cache`), but not the whole story: after creating the
  bucket, a 3rd deploy attempt still hung with `object_count: 0` (checked via
  `wrangler r2 bucket info paddockintel-isr-cache` — that command surfaces
  `object_count`/`bucket_size` directly, unlike `wrangler r2 object` which has
  no `list` subcommand) for 4.5+ minutes straight, polled every 90s.
- **Network egress to R2 blocked** — real for this session's sandboxed
  environment specifically (confirmed:
  `https://<account-id>.r2.cloudflarestorage.com` → `SSL routines::sslv3
  alert handshake failure` at 56ms, while `example.com` and
  `api.cloudflare.com` both responded normally and fast from the same
  sandbox) — but **ruled out for the user's own terminal**: same curl test
  from there returned `HTTP 400` in 62ms, a real server response (missing
  request signature for that bare unsigned request, not a network-layer
  failure) — confirmed clean connectivity, same as the `example.com` (200)
  and `api.cloudflare.com` (401) controls.

So: bucket exists, network is clean end-to-end from the machine actually
running the deploy, and it still hangs at zero objects. That combination
points more strongly at the known upstream OpenNext/R2 population issue
(links below) than at anything specific to this project's setup or
environment.

**With this config, there is no persistent cache at all — not "fills in after
the first visit," genuinely none.** Every request, from every visitor,
forever, re-renders from scratch (fresh Supabase queries, fresh React render).
`revalidate: 3600` on the 13 ISR routes has no effect with this config. This
is fine for confirming the Worker responds to requests; it is not fine for
real traffic.

**Before any real production cutover (steps 1-2 below: DONE as of 2026-08-27,
see the resolution section right after this one):**
1. ~~Restore `open-next.config.ts` to re-enable `r2IncrementalCache`~~ — done,
   re-enabled and deploy-verified.
2. ~~Actually solve the R2 population hang first~~ — done, via `--rclone`.
   Known related upstream issues (closed,
   but resolution unconfirmed against our exact symptom — see the note
   below on what didn't match):
   - https://github.com/opennextjs/opennextjs-cloudflare/issues/1110
   - https://github.com/cloudflare/workers-sdk/issues/12413
   - Both describe R2 bulk-upload trouble on large-ISR-page-count projects
     (matches this project's 3760 generated pages), closed after a
     contested back-and-forth between competing fix PRs (#1099, #925,
     #1116) — never confirmed which (if any) shipped in the
     `@opennextjs/cloudflare` version this project pins. **Not a confirmed
     match**: those issues describe visible progress before a 503
     (`Uploaded 0% (10 out of 16,974)` then fails); our hang produced zero
     progress output at all, in either attempt. Worth trying `wrangler
     deploy`'s `--rclone` flag (seen in `opennextjs-cloudflare deploy
     --help`, not yet tried) before assuming it's the same root cause.

---

## 2026-08-27 — R2 population hang RESOLVED via `--rclone`

**Root cause confirmed, fix applied and verified with a real deploy.**

PR #1290 (`--rclone` opt-in, referenced above) was **already merged** as of
`@opennextjs/cloudflare` 1.20.0 — the version already installed in this
project. No package upgrade was needed; the fix was purely a matter of using
the right deploy command and having R2 credentials available for it.

**Hypothesis ruled out first:** `cloudflared` (the Cloudflare Tunnel daemon)
was suspected and installed, then tested — no effect on the hang. Makes
sense in hindsight: R2 population uploads directly via the S3-compatible API,
it never goes through a Cloudflare Tunnel, so `cloudflared` was never going to
be relevant here.

**The actual fix:**
1. Created a new R2 Account API Token scoped to Object Read & Write on the
   `paddockintel-isr-cache` bucket specifically (not a broad account token).
2. Installed `rclone.js` as a project dependency (`package.json` — `--rclone`
   shells out to a real `rclone` binary, which this npm package provides).
3. Added three variables to `.dev.vars` (confirmed present in `.gitignore` —
   never commit this file): `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `CF_ACCOUNT_ID`.
4. Deploy command changed from a direct `wrangler deploy` to
   `opennextjs-cloudflare deploy --rclone` — the flag belongs to the OpenNext
   CLI wrapper, not to `wrangler` itself.
5. `r2IncrementalCache` re-enabled in `open-next.config.ts` (import +
   `incrementalCache: r2IncrementalCache` in the config — matches the version
   committed before the 2026-08-25 temporary disable).

**Verified with a real deploy, not just a dry run:** R2 population went from
an indefinite hang at 0 objects to **9 objects uploaded in 0.5 seconds**, with
visible per-file progress the whole way (`Checks:`, `Transferred: N / 9`), and
a clean `Successfully populated cache with 9 entries` close. The rest of the
deploy (assets, worker upload, triggers) completed normally afterward —
`https://paddockintel-dashboard.paddockintel.workers.dev`, exit code 0.

**Pending if the deploy is ever automated (e.g. GitHub Actions):**
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `CF_ACCOUNT_ID` currently only
exist in the local `.dev.vars` (this Codespace). A CI pipeline will need them
as CI secrets — they won't carry over automatically.

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
