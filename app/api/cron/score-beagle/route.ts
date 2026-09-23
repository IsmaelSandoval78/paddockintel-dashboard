import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { judgeItems, loadWindowItems, RUBRIC_VERSION, upsertScoreRows } from '@/lib/beagleScoreV0.mjs';

// Off by default. Not registered in wrangler.jsonc, vercel.json, or custom-worker.ts,
// so nothing calls it on a schedule. A request still needs the same Bearer CRON_SECRET
// as refresh-beagle, and then BEAGLE_SCORE_CRON=1, before it upserts beagle_item_scores.
// It never inserts into digest_items or articles.

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.BEAGLE_SCORE_CRON !== '1') {
    return NextResponse.json({
      wrote: false,
      rubric_version: RUBRIC_VERSION,
      reason: 'BEAGLE_SCORE_CRON is not 1. The scorer does not run on a schedule.',
    });
  }

  try {
    const supabase = createClient();
    const pool = await loadWindowItems(supabase);
    const judged = judgeItems(pool);
    const upserted = await upsertScoreRows(supabase, judged);
    return NextResponse.json({
      wrote: true,
      rubric_version: RUBRIC_VERSION,
      window: pool.length,
      upserted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'score failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
