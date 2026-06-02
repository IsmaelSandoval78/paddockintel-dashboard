export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    ok: true,
    env: {
      hasSupabaseUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey:        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    timestamp: new Date().toISOString(),
    node: process.version,
  });
}
