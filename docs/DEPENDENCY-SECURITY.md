# Dependency Security — audit log

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
