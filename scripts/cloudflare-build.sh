#!/bin/bash
# Builds for Cloudflare without baking server-only secrets into the deployed
# Worker bundle.
#
# @opennextjs/cloudflare unconditionally writes EVERY var from .env/.env.local/
# etc. (no NEXT_PUBLIC_ filter — see node_modules/@opennextjs/cloudflare/dist/
# cli/build/open-next/compile-env-files.js) into .open-next/cloudflare/
# next-env.mjs, which then gets bundled straight into the deployed Worker
# script. That's how SUPABASE_SERVICE_ROLE_KEY ended up shipped in plaintext
# on 2026-08-25 (see docs/CLOUDFLARE-MIGRATION.md). There is no config flag to
# turn this off — it's unconditional (build.js calls compileEnvFiles()
# directly, no gate) and only runs as part of `opennextjs-cloudflare build`'s
# own pipeline, never as part of plain `next build`.
#
# Design, verified against the actual source (not guessed) — two things had
# to be tested for real, both failed on first try:
#   1. A plain `npx next build` for phase 1 (first version of this script)
#      failed: `ENOENT .next/standalone/.next/server/pages-manifest.json`.
#      OpenNext's phase 2 needs Next's standalone output mode, which this
#      project's next.config.ts doesn't set (`output: "standalone"`), and
#      plain `next build` doesn't produce on its own.
#   2. OpenNext enables standalone mode via setStandaloneBuildMode()
#      (node_modules/@opennextjs/aws/dist/build/buildNextApp.js) — just two
#      env vars, NEXT_PRIVATE_STANDALONE and NEXT_PRIVATE_OUTPUT_TRACE_ROOT.
#      Setting those ourselves before a plain `next build` was tested and
#      confirmed to produce the standalone output correctly — WITHOUT ever
#      invoking `opennextjs-cloudflare`'s own pipeline, so `compileEnvFiles()`
#      never runs in phase 1 and the real secret never touches
#      .open-next/cloudflare/next-env.mjs at all, not even transiently.
#      Tradeoff: these are private/undocumented Next.js env vars, so a future
#      Next.js upgrade could change their behavior without warning — but the
#      failure mode is loud (phase 2 errors with the same ENOENT as above),
#      not a silent leak.
#   - Real runtime values come from `wrangler secret put` instead.
#
# Defense in depth: even though phase 1 should never write the secret to
# .open-next/ now, an EXIT trap force-wipes .open-next/ unless the script
# reached a verified-clean finish — covers any future OpenNext-internal
# change that writes something here we haven't accounted for, and covers the
# script being interrupted mid-run.
#
# NEXT_PUBLIC_* vars are NOT stripped from .env.local before phase 2 —
# they're meant to be public (already shipped in the client bundle), so
# baking them into next-env.mjs is fine and expected.

set -euo pipefail
cd "$(dirname "$0")/.."

CLEAN_FINISH=false
cleanup() {
  if [ -f .env.local.cloudflare-build-bak ]; then
    mv .env.local.cloudflare-build-bak .env.local
  fi
  if [ "$CLEAN_FINISH" != "true" ] && [ -d .open-next ]; then
    rm -rf .open-next
    echo "Interrupted before a verified-clean finish — wiped .open-next/ so nothing can linger on disk." >&2
  fi
}
trap cleanup EXIT

echo "== Phase 1: next build in standalone mode, real .env.local (build-time Supabase fetches need the real key; never touches .open-next/) =="
NEXT_PRIVATE_STANDALONE=true NEXT_PRIVATE_OUTPUT_TRACE_ROOT="$(pwd)" npx next build

if [ ! -f .env.local ]; then
  echo "No .env.local found — nothing to strip for phase 2." >&2
else
  cp .env.local .env.local.cloudflare-build-bak
  grep -vE '^(SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|RESEND_FROM_EMAIL|CRON_SECRET|DRAFT_SECRET)=' \
    .env.local.cloudflare-build-bak > .env.local
fi

echo "== Phase 2: package for Cloudflare, secrets stripped from .env.local =="
npx opennextjs-cloudflare build --skipNextBuild

echo "== Verifying next-env.mjs doesn't contain the real secret =="
if [ -f .env.local.cloudflare-build-bak ]; then
  SVC_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local.cloudflare-build-bak | cut -d'=' -f2- || true)
  if [ -n "$SVC_KEY" ] && grep -qF "$SVC_KEY" .open-next/cloudflare/next-env.mjs 2>/dev/null; then
    echo "FAIL: the real secret is still in next-env.mjs — do not deploy this build." >&2
    exit 1
  fi
  echo "OK: SUPABASE_SERVICE_ROLE_KEY not found in next-env.mjs."
fi

CLEAN_FINISH=true
echo "== Done. Use: CLOUDFLARE_API_TOKEN=\"\$(cat .wrangler-token.local)\" npx wrangler deploy =="
