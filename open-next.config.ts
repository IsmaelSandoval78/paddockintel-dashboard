import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// TEMPORARY (2026-08-25): R2 incremental cache disabled for the first
// *.workers.dev smoke-test deploy only. `opennextjs-cloudflare deploy`'s R2
// population step hangs indefinitely on this project (3760 pages) — see
// docs/CLOUDFLARE-MIGRATION.md for the full evidence trail (bucket-existence
// and network-connectivity both ruled out; points to the known upstream
// scale bug). Re-enable r2IncrementalCache once that's solved — this is not
// meant to stay committed like this.
//
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  queue: doQueue,
});
