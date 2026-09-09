# Cloudflare Migration — decisions & known workarounds

Running log for the Vercel → Cloudflare Workers migration (OpenNext adapter). Not
a how-to guide — a record of decisions made, why, and what to revisit later, so
nobody re-investigates something already settled.

---

## 🚨 2026-09-09 — cutover rolled back ~64 min in: Workers Free plan CPU limit (error 1102)

**Directly follows the entry right below this one** ("real cutover done (step 4)") — read
that one first for what was actually cut over; this entry is what happened next, same
incident window.

**Active monitoring (the second half of step 4, explicitly planned) caught this — it did not
go unnoticed.** Checks at ~0, ~21, and ~42 min post-cutover were all clean (200/308, `server:
cloudflare`, real Supabase-backed content). The 4th scheduled check, at ~64 min, found:

```
HTTP/2 503
content-type: text/plain; charset=UTF-8
...
error code: 1102
```

on `hub`/`www` home, `/drivers/`, `/constructors/`, `/weekly/`, `/es/`, `/pt/` — every route
that does real work. `/api/health` (near-zero compute) kept returning `200` the whole time,
and the apex `308` redirect (which never reaches app code) also kept working — both
consistent with a **CPU-time** failure specifically, not a general Worker/network outage.

**Root cause, confirmed against the real dashboard, not guessed:** `Workers & Pages →
Workers plans` showed **Free — "Current plan"**. Free tier: **10ms CPU time per request**.
Paid ($5/mo): up to 5 minutes. A Next.js SSR route doing real Supabase queries + React
rendering can exceed 10ms of actual CPU depending on isolate/JIT/GC state — which explains
why it passed for the first ~42 minutes (a freshly warmed isolate can do more inside the
same CPU budget) and then started failing consistently, not why it was flaky from the start.
This is not a one-off bug to patch; it's a real plan-tier mismatch for a data-heavy SSR app,
independent of any code in this repo.

**Rolled back immediately, mitigate-first** (matching the whole reason
`docs/DNS-ROLLBACK-CLOUDFLARE-CUTOVER.md` was written in step 3 — this is exactly the
scenario it was written for): removed all 3 Custom Domains from
`paddockintel-dashboard` in Workers & Pages (which auto-removes the proxied A records
Cloudflare created for them), then recreated the original 3 DNS records exactly per the
rollback doc: `hub`/`www` → CNAME `d878f4083bbdeec6.vercel-dns-017.com`, DNS only; apex → A,
DNS only. Did **not** touch the Worker itself, its secrets, or the cron — per the rollback
doc's own "what NOT to touch" section.

**One step required Ismael's manual input, not by choice:** the apex A record's IP value
(re-verified live per the rollback doc's own warning — still `216.150.1.1` at the time)
could not be typed into the Cloudflare form by this session — the permission classifier
blocked writing that specific IP-shaped string into a browser form field. Stopped and asked
rather than attempting a workaround, per the classifier's own instruction. Ismael entered it
manually; verified immediately after.

**Verified post-rollback, not assumed:** `dig` directly against Cloudflare's authoritative
nameservers and against public resolvers (8.8.8.8, 1.1.1.1 — this machine's own local DNS
cache still had a stale negative answer from the brief window the records didn't exist, a
local-machine artifact, not a real propagation issue) all show the original values restored.
`curl --resolve` (bypassing the stale local cache) confirms `server: Vercel`,
`strict-transport-security` present, the apex `308`→`www` redirect intact, and real
Supabase-backed content on `hub`/`www`/`/drivers/`/`/constructors/`/`/weekly/`/`/es/`/`/pt/`.

**Incidental finding while verifying, unrelated to the incident itself:** `/api/health`
(and presumably other API routes) 308-redirects `/api/health` → `/api/health/` on Vercel
(`trailingSlash: true` applying to route handlers, not just pages) — something the earlier
monitoring checks never surfaced because they checked the status code without following
redirects. Not a bug, just an unfollowed-redirect blind spot in this session's own curl
checks; the final JSON (`hasSupabaseUrl`/`hasAnonKey`/`hasServiceRoleKey`: all `true`) is
correct once followed. Worth remembering if a future check reports a "failure" on an API
route that's actually just an unfollowed 308.

**Real decision now pending with Ismael, not made here:** upgrade the Cloudflare account to
Workers Paid ($5/mo) and retry the cutover, or drop the Cloudflare migration entirely, or
first reduce real per-request CPU cost (e.g. more aggressive caching so fewer requests ever
hit a cold Supabase-querying path) before attempting cutover again on Free. Upgrading is a
billing action on Ismael's account — not something this session did or will do without his
explicit go-ahead.

---

## ✅ 2026-09-08/09 — real cutover done (step 4): all 3 domains live on the Worker

**Executed with Ismael's explicit go-ahead ("dale no tengo trafico ahora"), all 3 domains
at once** (his choice over a `hub`-only canary, which was offered first). Real production
DNS change, done in the real Cloudflare dashboard (browser session confirmed as
`sandoval.ismael@g...` against account `551a6aba58a779d10acae0c5f0cde1e8` — two earlier
attempts this session hit `/login` with no session; a third attempt worked, so the
dashboard access itself was real, not assumed).

**What was actually done, in order:**
1. `wrangler.jsonc`/the Worker had **no Custom Domain or Route configured at all**
   before this — confirmed via `Workers & Pages → paddockintel-dashboard → Domains`
   showing "No custom domains". The Worker only existed at its `*.workers.dev` URL.
2. Cloudflare refuses to attach a Custom Domain while a hostname already has an
   "externally managed" DNS record — confirmed via the exact error: `Hostname
   'hub.paddockintel.com' already has externally managed DNS records (A, CNAME, etc).
   Delete them first or try a different hostname.` So the 3 records documented in
   `docs/DNS-ROLLBACK-CLOUDFLARE-CUTOVER.md` (the CNAME/A pointing at Vercel) were
   deleted first, one at a time, each confirmed against the exact name/type/content
   shown in the delete dialog before confirming — no bulk action, no guessing.
3. Added all 3 as Custom Domains (`Workers & Pages → paddockintel-dashboard → Domains →
   Add Domain`): `hub.paddockintel.com`, `paddockintel.com` (root, empty subdomain
   field), `www.paddockintel.com`. Cloudflare auto-created new proxied A records for
   each, confirmed via `dig` immediately after — all 3 now resolve to Cloudflare
   anycast IPs (`104.21.x.x`/`172.67.x.x`), not Vercel's.

**🚨 Real finding, caught immediately by checking rather than assuming success:** right
after the cutover, `curl` showed `paddockintel.com` returning a plain `200` instead of
the expected `308` to `www`, and **no `strict-transport-security` header at all** on any
of the 3 domains — i.e. today's `middleware.ts` fix (the one from the audit entry above)
appeared to not exist. Root cause: **the deployed Worker was still the 2026-09-04 build.**
Vercel redeploys automatically on every push to `main`; Cloudflare Workers does not —
nothing in this project auto-deploys to Cloudflare, so every commit merged to `main`
since 4 sep (the entire Mi Box/accounts reconciliation work, the constructors grant fix,
and this session's own middleware fix) was live on Vercel but **absent from the Worker
that had just been made responsible for real traffic.**

**Fixed immediately, same session, before declaring the cutover done:**
- `bash scripts/cloudflare-build.sh` — clean build from the current `main` tree
  (confirmed `git log -1` matched `origin/main` before building), secret-leak check
  passed.
- No local Cloudflare deploy credentials existed in this environment (no
  `.wrangler-token.local`, no `SUPABASE_ACCESS_TOKEN`/`CLOUDFLARE_API_TOKEN` env var,
  `wrangler login` needs an interactive TTY this environment doesn't have). Since a
  real Cloudflare dashboard session was available, created a short-lived **scoped** API
  token instead (My Profile → API Tokens → "Edit Cloudflare Workers" template, resource
  restricted to this one account + the `paddockintel.com` zone specifically, no broader
  scope) — copied via the dashboard's own copy button and `pbpaste` (never hand-typed,
  never printed in full in any tool output), used once for `CLOUDFLARE_API_TOKEN=... npx
  wrangler deploy`, then **deleted the token from the Cloudflare dashboard immediately
  after** the deploy succeeded. Nothing long-lived was left behind.
- Deploy succeeded: `Deployed paddockintel-dashboard triggers`, cron confirmed
  (`schedule: 0 9 * * *`), R2 incremental cache repopulated (6 entries, no hang).

**Verified for real after the redeploy, not assumed fixed:**
- `paddockintel.com` → `308` → `https://www.paddockintel.com/`, `strict-transport-
  security: max-age=63072000` present on the redirect itself.
- `hub.paddockintel.com` and `www.paddockintel.com` → `200`, HSTS present, `x-opennext:
  1` (confirms it's actually the Worker responding, not a stale cache), `server:
  cloudflare`.
- Trailing slash (`/drivers` → `308` → `/drivers/`) and i18n (`/es/` → correct
  `NEXT_LOCALE` cookie) both still correct post-redeploy.
- **Real data, not just headers:** home page contains real standings text (`P1`–`P4`),
  `/api/health` reports all 3 Supabase credentials present
  (`hasSupabaseUrl`/`hasAnonKey`/`hasServiceRoleKey`: all `true`), a real driver page
  (`/drivers/antonelli/`) returns `200`, the magazine home (`www`) returns `200` with
  145KB of real content.

**Lesson for next time, not yet automated:** any future change to shared code
(`middleware.ts`, anything under `lib/`, `components/`, `app/`) needs an **explicit,
manual** `bash scripts/cloudflare-build.sh && npx wrangler deploy` after merging to
`main` — a Vercel deploy alone does not touch the Cloudflare Worker. Worth a real CI/CD
fix later (a GitHub Action on push to `main`), not done here — flagged, not actioned,
same as the apex static-IP finding above.

**Not yet done, genuinely pending:** active monitoring for the first hour post-cutover
(the second half of step 4) — this entry was written immediately after the fix and
verification above, not after an hour of watching real traffic.

---

## ✅ 2026-09-08 — TTL confirmed already low; edge audit found + fixed 2 real gaps

**Step 1 of the cutover plan (lower DNS TTL, wait for propagation) — already satisfied,
no change needed.** Queried live, directly against Cloudflare's own authoritative
nameservers (`dig @lisa.ns.cloudflare.com`, not a cached resolver): `hub.paddockintel.com`
(CNAME), `paddockintel.com` (apex A record), and `www.paddockintel.com` (CNAME) all
already show TTL 300s. Also corrected a framing error in the plan: DNS for this domain is
hosted at Cloudflare (`lisa.ns.cloudflare.com` / `algin.ns.cloudflare.com`), not Vercel —
Vercel is only the current origin the records point at.

**Step 2 — audited everything the Vercel edge does today against the deployed Cloudflare
Worker, 1:1, including edge cases (not just happy paths).** Full inventory of what runs
at the edge: `middleware.ts` (next-intl locale routing + host-based rewrite to
`magazine-home`) and the cron (already migrated — see the ISR/Cron sections below). No
`redirects()`/`headers()`/`rewrites()` in `next.config.ts`, no geolocation usage anywhere
in the codebase.

**Confirmed identical on both, with real curl against the real deployed Worker
(`paddockintel-dashboard.sandoval-ismael.workers.dev`) and real production Vercel:**
trailing slash enforcement (`/drivers` → 308 → `/drivers/`), i18n locale routing (`/es/`,
`/pt/drivers/` → correct `NEXT_LOCALE` cookie + `hreflang` alternates).

**2 real gaps found — neither is app code, both are Vercel platform/dashboard defaults
that don't exist on Cloudflare:**
1. `paddockintel.com` (bare apex) → 308 to `https://www.paddockintel.com/` on Vercel —
   a dashboard-level domain redirect, not `next.config.ts`. Non-breaking on its own (the
   apex is already in every `MAGAZINE_HOSTS` set, so it already serves the magazine
   correctly without the redirect) — a canonicalization/SEO difference, not a functional
   one.
2. `strict-transport-security: max-age=63072000` present on 100% of Vercel responses
   tested, absent on 100% of Worker responses tested. A real security-header gap, not
   cosmetic.

**Fix applied in `middleware.ts` rather than per-platform dashboard config** (a
Cloudflare zone-level Redirect Rule + HSTS toggle would need to be hand-kept in sync with
this file forever — one code path that behaves identically everywhere is simpler): bare
`paddockintel.com` now redirects to `www` before anything else runs (308, path + query
preserved), and every response (including that redirect) gets
`strict-transport-security: max-age=63072000` set explicitly. Harmless on Vercel — its
own platform-level apex redirect fires before Next.js middleware ever runs there, so this
is dead code specifically on Vercel's copy of the app; it's what actually does the work on
Cloudflare, which has no such platform default.

**Verified locally with real curl against `next dev` (not just read the code), 4 cases:**
bare apex root → 308 to `www` root with HSTS; bare apex with a path (`/es/weekly/`) → 308
to the same path under `www`, path preserved; `www` root → 200, HSTS present,
`x-middleware-rewrite: /en/magazine-home` (confirms the host-rewrite logic still fires
correctly alongside the new redirect/header code); `hub.paddockintel.com/drivers/` → 200,
HSTS present, normal Hub routing untouched. This also closes the one piece of the audit
that couldn't be confirmed live before (the host→`magazine-home` rewrite — Cloudflare's
own edge blocks a spoofed `Host` header against a `*.workers.dev` hostname as
anti-domain-fronting protection, and local `wrangler dev` has no Supabase credentials in
`.dev.vars` to render a real page — `next dev` with a spoofed `Host` header sidesteps
both).

`tsc --noEmit` and `eslint middleware.ts` both clean.

**Where this leaves the cutover plan:** steps 1-2 done. Still pending: step 3 (write the
rollback plan — exact DNS record values to revert to, kept somewhere other than memory)
and step 4 (pick a low-traffic window and actually cut over, with active monitoring for
the first hour).

---

## ✅ 2026-09-08, same day — rollback plan written (step 3)

**`docs/DNS-ROLLBACK-CLOUDFLARE-CUTOVER.md`** — the exact 3 DNS records (type, name,
value, TTL, proxy status) to restore if the cutover needs to be undone, plus the
copy-paste dashboard steps and the `dig`/`curl` commands to confirm the rollback actually
took. Written to be executable under pressure without re-deriving anything.

**Real finding while gathering the values, not previously documented:** the apex
(`paddockintel.com`) A record is a **static** IP (`216.150.1.1`), not a CNAME that
tracks Vercel's edge automatically like `hub`/`www` do. Confirmed it can go stale fast —
in this same session, `d878f4083bbdeec6.vercel-dns-017.com` (the actual Vercel CNAME
target used by `hub`/`www`) resolved to `216.150.1.1`/`216.150.16.1` earlier, then to
`216.150.1.193`/`216.150.16.193` minutes later. Vercel's edge IPs rotate; the apex's
static snapshot doesn't follow. Not fixed here (out of scope for "write the rollback
plan") — the rollback doc tells whoever executes it to re-verify that IP live before
pasting it, rather than trusting a value that might be dated by then. Worth a real fix
later (switch the apex to CNAME flattening/ALIAS at the same Vercel target `hub`/`www`
already use, so it never needs a hardcoded IP at all) — flagged, not actioned.

---

## 🚨 2026-09-04 — the 27 ago "successful deploy" does not exist in the real account

**Discovered during a pre-flight check before a planned DNS cutover, before any DNS was
touched.** Logged into the real Cloudflare account (`551a6aba58a779d10acae0c5f0cde1e8`,
`sandoval.ismael@gmail.com`) via dashboard and checked Workers & Pages directly:
**"No projects found — you have not created any projects yet."** Zero Workers,
anywhere, in this account. `dash.cloudflare.com` home also showed 0 requests / 0 worker
invocations for the last 24h and for the current billing period (Sep 1–5).

This directly contradicts the 2026-08-27 entry below, which documents a verified real
deploy — `https://paddockintel-dashboard.paddockintel.workers.dev`, 9 R2 objects
populated in 0.5s, exit code 0. That deploy **is not present in the real account
today**, full stop. There is no "it must have expired" explanation — Workers don't
expire on their own.

**Probable cause, not confirmed:** the 27 ago deploy most likely ran inside a sandboxed
session/Codespace whose `wrangler login` state never persisted to (or was never
actually pointed at) this real Cloudflare account — the same class of gap already
flagged elsewhere in this doc ("`wrangler login` is done on the user's side," still
listed as pending under Cron Triggers below). It's also possible it ran against a
different Cloudflare account that was never reconciled with this one. Either way, the
practical conclusion is identical: **nothing from that session's work reached this
account's real infrastructure.**

**What's actually real vs. what only exists in this repo:**
- ✅ Real, verified in code: `open-next.config.ts` has `r2IncrementalCache` active,
  `wrangler.jsonc` has the R2/DO Queue/cron bindings configured, `custom-worker.ts`
  exists with the `scheduled` handler, `package.json` has `rclone.js` as a dependency.
- ❌ Not real, despite being documented as done below: any Worker deployed to this
  Cloudflare account, any of the 4 secrets (`SUPABASE_SERVICE_ROLE_KEY`,
  `CRON_SECRET`, `RESEND_API_KEY`, `DRAFT_SECRET`) actually set via `wrangler secret
  put` against this account (there's no Worker to attach them to), any R2 bucket
  population that persisted, any evidence this account's `wrangler.jsonc` config was
  ever actually deployed.

**Production was never at risk.** Checked `hub.paddockintel.com`'s real DNS record in
the Cloudflare dashboard: CNAME to `d878f4083bbdeec6.vercel-dns-017.com`, proxy status
**DNS only** (grey cloud, unproxied), TTL **Auto** (≈300s for unproxied records — already
low enough for a fast rollback later, no need to lower it further in advance). Vercel
has been serving 100% of real traffic this whole time, untouched by any of this.

**Real next step before any DNS cutover is even on the table:** run
`opennextjs-cloudflare deploy --rclone` for real against this account, confirm the
Worker actually appears under Workers & Pages in the dashboard (not just a clean exit
code in a terminal), re-set all 4 secrets against that real Worker, and re-walk the
entire checklist below from the deploy step forward. Do not assume anything dated
2026-08-25/27 below is still true without re-verifying it against the dashboard first —
that's exactly what this entry exists to prevent happening again.

---

## ✅ 2026-09-04, same day — root cause found, fixed, real deploy verified

**Root cause of the entry above:** `wrangler.jsonc` had a hardcoded
`account_id: "dbf60dad00f30c6d52b094b3ec552f73"` — not Ismael's real account
(`551a6aba58a779d10acae0c5f0cde1e8`, `sandoval.ismael@gmail.com`). The 27 ago "verified"
deploy ran against that other account the whole time. It never disappeared or expired —
it was never in the real account to begin with, which is exactly why checking the real
dashboard that day found nothing. Fixed: `wrangler.jsonc`'s `account_id` corrected to
the real one, confirmed via `wrangler whoami` against the same value before applying.

**Independently verified in this session, with my own tool calls (not just terminal
output — the same discipline the entry above exists to enforce):**
- `npx wrangler login` — real OAuth session confirmed via `whoami` against
  `551a6aba58a779d10acae0c5f0cde1e8` / `sandoval.ismael@gmail.com`.
- `bash scripts/cloudflare-build.sh` — clean build, secret-leak check passed
  (`SUPABASE_SERVICE_ROLE_KEY` confirmed absent from `next-env.mjs`).
- `npx opennextjs-cloudflare deploy --rclone` — exit code 0. R2 populated cleanly (15
  entries, no hang). 75 assets uploaded. Cron trigger deployed (`0 9 * * *`).
- Confirmed in the **real dashboard**, not just the CLI: `paddockintel-dashboard` now
  appears under Workers & Pages, "38s ago" at the time of checking.
- `npx wrangler secret list` on the real Worker → all 4 present by name:
  `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `DRAFT_SECRET`.
  (Names only — `wrangler secret list` never exposes values, by design.)
- `curl` to `https://paddockintel-dashboard.sandoval-ismael.workers.dev/` → HTTP 200 on
  `/`, `/es/`, and `/pt/`. Real content confirmed rendering (e.g. `/es/weekly/` returns
  a real `<title>Weekly Digest — PaddockIntel</title>`, not an error page).

**Reported by Ismael, done in his own terminal/dashboards outside this session's tool
calls — not independently re-verified here, recorded as his report:**
- `CRON_SECRET` and `DRAFT_SECRET` regenerated (`openssl rand -hex 32`) because this
  Codespace/Mac never had the originals saved; set on both Cloudflare and Vercel.
- `RESEND_API_KEY` regenerated in the Resend dashboard, old key revoked; synced to
  Cloudflare and Vercel, with a Vercel redeploy confirmed.
- A `curl POST` to Vercel's `/api/digest/send` with the new `CRON_SECRET` returned 200 —
  reported as confirmation that the secret rotation didn't break the still-live Vercel
  cron. (Not repeated in this session on purpose — that endpoint has real side effects
  if an unsent digest exists, and re-triggering it wasn't necessary given Ismael already
  ran it.)

**Real gap found while cross-checking, confirmed by Ismael as a simple miss (not a
disagreement):** `CRON_SECRET` was never added to local `.env.local` — only
`DRAFT_SECRET` is there. Doesn't block anything (the local dev server doesn't call the
cron-authenticated path), but worth closing before it causes a "works everywhere except
locally" confusion later.

**Where this leaves the migration:** the Cloudflare Worker is now real, deployed to the
correct account, and serving real content with all 4 secrets attached. **DNS was not
touched today, on purpose.** `hub.paddockintel.com` still points 100% at Vercel. Before
evaluating a real cutover, a future session should: (1) exercise more real-data routes
against the Cloudflare Worker directly (not just `/`, `/es/`, `/pt/`, `/weekly/`), (2)
let the Cloudflare cron fire on its own schedule at least once and confirm it actually
sent/attempted correctly, rather than only ever triggering it manually, (3) only then
revisit the DNS cutover, using the rollback plan already on record (Auto TTL on the
unproxied `hub` CNAME is already ≈300s — low enough, no pre-emptive TTL drop needed).

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
