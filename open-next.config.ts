import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// No tagCache — the codebase has zero calls to revalidateTag/revalidatePath
// today, and OpenNext's docs say the D1 tag cache is only needed for
// on-demand revalidation. Add it (D1NextModeTagCache) if that changes.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
