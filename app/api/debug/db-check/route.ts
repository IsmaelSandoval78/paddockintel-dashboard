import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// TEMPORARY, disposable diagnostic route — same pattern as the deleted
// /api/auth/whoami harness from 2026-09-06. Confirms whether
// lib/supabase/server.ts (SUPABASE_SERVICE_ROLE_KEY) can actually reach the
// DB in production, and surfaces the real Postgrest/Supabase error text if
// not — without ever returning the key itself. Delete once the Season Shape
// / getHomeData() investigation is closed.
export async function GET() {
  try {
    const supabase = createClient();
    const { data, error, status, statusText } = await supabase
      .from('races')
      .select('id, round')
      .eq('year', 2026)
      .lte('date', new Date().toISOString().slice(0, 10))
      .order('round', { ascending: true });

    return NextResponse.json({
      urlEnvPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      keyEnvPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      keyEnvLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      status,
      statusText,
      error,
      rowCount: data?.length ?? null,
      sampleRows: data?.slice(0, 2) ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { thrown: true, message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
