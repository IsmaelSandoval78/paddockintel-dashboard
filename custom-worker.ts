// Wraps the OpenNext-generated Worker to add a `scheduled` handler — the
// generated `.open-next/worker.js` only exports `fetch`, so Cron Triggers
// (the replacement for Vercel's `vercel.json` "crons" block) need this
// wrapper. See docs/CLOUDFLARE-MIGRATION.md for the cron migration plan.
//
// Deliberately NOT using a `/// <reference types="@cloudflare/workers-types" />`
// — that package's global ambient declarations override lib.dom's fetch/Response
// types for the whole TS program (not just this file), which broke unrelated
// `.then()`/`.json()` inference in components/ elsewhere in the app. Minimal
// local types for just what this file touches instead.

// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from './.open-next/worker.js';
// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from './.open-next/worker.js';

interface Env {
  CRON_SECRET: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

interface MinimalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface MinimalScheduledController {
  cron: string;
}

export default {
  fetch: handler.fetch,

  // Two Cron Triggers share this one handler (see wrangler.jsonc) -- `controller.cron`
  // says which schedule fired, same idea as the digest route's Bearer auth: reuse the
  // existing route handler instead of duplicating its logic here.
  async scheduled(controller: MinimalScheduledController, env: Env, ctx: MinimalExecutionContext) {
    const path = controller.cron === '0 */4 * * *' ? '/api/cron/refresh-beagle' : '/api/digest/send';
    const response = await handler.fetch(
      new Request(`https://internal${path}`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }),
      env,
      ctx
    );
    if (!response.ok) {
      console.error(`${path} cron failed: ${response.status} ${await response.text()}`);
    }
  },
};
