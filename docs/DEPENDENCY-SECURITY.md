# Dependency Security — audit log

## 2026-09-04 — 5 new findings since the 25 ago fix: RISK ACCEPTED, not fixed

**Context:** surfaced during a full docs/roadmap audit, not a dedicated security pass.
The 25 ago entry below ended at "0 vulnerabilities" — these 5 are new, introduced by
dependencies added since then (Cloudflare/OpenNext tooling, most likely).

| Package | Severity | Where it came from | Exposure |
|---|---|---|---|
| `adm-zip` <0.6.0 | high | `@opennextjs/cloudflare`→`rclone.js` (the `--rclone` deploy flag from `docs/CLOUDFLARE-MIGRATION.md`) | Deploy-time only (R2 population during `opennextjs-cloudflare deploy --rclone`) — never in the request path. ZIP input comes from the deploy tooling itself, not attacker-supplied |
| `browserslist` ≤4.28.6 | high (×2 advisories) | Remotion (local video-render pipeline) + `eslint-config-next` (lint/build) | Build-time only — runs in `next build`/webpack, never ships into the client bundle, never executes per-request |
| `qs` 2.2.5–6.15.3 | moderate (×2 advisories) | `@opennextjs/cloudflare`→`@opennextjs/aws`→`express`→`body-parser` | Local-dev-only — part of OpenNext's local `wrangler dev`/preview server, not the deployed Cloudflare Worker runtime |

**Decision: risk accepted, evaluated and dismissed for now — not a "pending" item, a
closed triage.** All 5 advisories (1 package each for adm-zip and qs-adjacent chains,
2 advisories each for browserslist and qs) were traced and none has a real attack
surface reachable by a third party: `adm-zip` only ever parses a ZIP the deploy tooling
generates itself during a manual `--rclone` deploy; `browserslist` never leaves
build-time tooling or reaches the client bundle; `qs` only runs inside the local
`wrangler dev` server, never the deployed Worker.

**Why the fix isn't applied:** `npm audit fix --force` resolves `adm-zip` by
downgrading `@opennextjs/cloudflare` to `1.19.11` — which reintroduces the R2
population hang fixed last week (`docs/CLOUDFLARE-MIGRATION.md`, 2026-08-27 entry).
That fix specifically requires `1.20.0+` for the merged `--rclone` support (PR #1290).
Trading a real, already-solved production blocker (R2 population hanging indefinitely)
for 3 packages with no real exploit path is the wrong trade. The plain `npm audit fix`
(no `--force`) also isn't a clean escape hatch here — it fails with `ERESOLVE`, since
the non-force resolution path still wants `@opennextjs/cloudflare` bumped to a version
requiring `next >=16.3.3`, one minor ahead of this repo's exact-pinned `16.3.2`.

**Revisit when:** `@opennextjs/cloudflare` ships a version that keeps the R2 `--rclone`
fix without depending on a vulnerable `adm-zip`, or if new evidence shows any of these
three becoming reachable from the real production request path (not just present in
the dependency tree). Until then, no action needed — this is not a to-do.


Not an editorial/content advisor (see `docs/advisors/` for those). This is where
`npm audit` findings get triaged and recorded, so nobody re-does this investigation
from scratch or panics at a bare vulnerability count without context.

---

## 2026-08-25 — 7 high-severity findings, triaged and resolved

**Context:** surfaced while prepping the Cloudflare migration (installing
`@opennextjs/cloudflare`), unrelated to that migration itself — this would have
shown up in `npm audit` on the `main`/`v2-relanzamiento` branch regardless.

### The 7 findings and their real exposure

`npm audit` groups by package; severity alone doesn't tell you whether something
ever runs in production or only ever runs on a dev/CI machine. Traced each one with
`npm ls <pkg> --all` before deciding what mattered:

| Package | Where it came from | Exposure |
|---|---|---|
| `brace-expansion` | `@opennextjs/cloudflare`→glob/minimatch (CLI), `eslint-config-next`→typescript-eslint | Build/lint tooling only — never in the request path |
| `fast-uri` | `@remotion/cli`→webpack→ajv (config-schema validation) | Remotion's local video-render pipeline (`remotion:studio`/`remotion:render`) — not part of the deployed Next.js app at all |
| `js-yaml` | Remotion (dev), eslint (dev), **and `gray-matter`** (a real `dependencies` entry, not dev) | The `gray-matter` path looked concerning until traced: its only caller is `scripts/ingest-article.ts`, a standalone content-ingestion script that never runs as part of the deployed server |
| `nanoid` | `@tailwindcss/postcss` + `next`'s bundled `postcss` | CSS compiled at `next build` time — doesn't run per-request |
| `postcss` | Tailwind v4 pipeline + `next`'s bundled copy | Same — build-time only, and it only ever processes our own source CSS, never attacker-supplied CSS |
| `next` | Direct dependency — the framework serving production on Vercel today | The one real production-runtime package in this list (see below) |
| `sharp` | Two sources: `next`→sharp (image optimization, request-time) **and** `@opennextjs/cloudflare`→wrangler→miniflare→sharp (local `wrangler dev` simulator only) | The `next` path is live in prod; the miniflare path never runs outside local dev |

**`next`'s 9 bundled CVEs, checked against actual usage** (not just "next has
CVEs, patch it"):
- 4 are Server Actions bugs (DoS / SSRF / unbounded payload / endpoint disclosure)
  → don't apply, zero `'use server'` anywhere in the codebase.
- SSRF via `rewrites()` with attacker-controlled hostname → doesn't apply,
  `next.config.ts` has no `rewrites()`/`redirects()`.
- Turbopack/proxy-related middleware bypass → Next 16 uses Turbopack by default
  (no flag needed) and this project's `proxy.ts` does real host-based routing —
  plausibly relevant, couldn't fully rule in/out from the advisory title alone.
- Cache confusion of response bodies → core framework bug, applies regardless of
  how the app is built.
- Image Optimization DoS via SVG → no component imports `next/image` today (0
  hits), but `next.config.ts` still configures `images.remotePatterns`, so the
  internal `/_next/image` route's reachability wasn't fully ruled out either.

None of the 7 ship anything into the browser bundle — worst case for any of them
is a server-side (Node) issue, not a client-side one.

### Fix applied

```
npm audit fix --force
```

Bumped `next` 16.2.6 → **16.3.2** (re-pinned to an exact version afterward —
`audit fix` defaults to a caret range, which doesn't match this repo's convention
of exact-pinning `next`/`react`/`react-dom`).

**Compatibility check done *before* applying the fix** (this repo also has
`@opennextjs/cloudflare@1.20.0` installed for the Cloudflare migration prep, and
that work was explicitly kept separate from this fix):
`npm view @opennextjs/cloudflare@1.20.0 peerDependencies.next` → `>=15.5.18 <16 ||
>=16.2.6`, no upper bound on the 16.x line, so 16.3.2 is within its declared
range. (Note: a real `opennextjs-cloudflare build` run separately surfaced an
unrelated, pre-existing blocker — `proxy.ts` requires the Node.js middleware
runtime, which OpenNext's Cloudflare adapter doesn't yet support. That's a
Cloudflare-migration issue, not a `next`-version issue — it reproduces on 16.2.6
too — and is being tracked separately from this dependency-security fix.)

**Actual outcome, which was a surprise:** `audit fix --force` didn't just fix
`next` and leave the other 6 alone — npm's resolver rebuilt enough of the tree
around the `next` bump that `js-yaml`, `nanoid`, `brace-expansion`, and `fast-uri`
all got pulled to patched versions too, incidentally. Final state: **0
vulnerabilities**, not 1-of-7. The triage above stays useful as a record of the
reasoning — if a future `npm audit` shows a partial fix (some resolved, some not),
this is the toolchain-vs-runtime lens to apply again.

### Verification

- `npx tsc --noEmit` — clean
- `npm run build` — clean, identical route table to before the bump
- `npm audit` — 0 vulnerabilities

package.json diff was a one-line change: `"next": "16.2.6"` → `"next": "16.3.2"`.
No other direct dependency versions changed.
